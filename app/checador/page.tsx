"use client";

import {
    CheckCircle,
    Copy,
    FileText,
    User,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";

import { openModalReducer } from "@/hooks/reducers/drop-down";
import { useAppDispatch } from "@/hooks/selector";
import {
    useGetWithFiltersMutation,
    usePostGeneralMutation,
} from "@/hooks/api/api";
import { useGetWithFiltersIntelisisMutation } from "@/hooks/api/api_int";

import { LoadingSection } from "@/template/loading-screen";

import Pagination from "@/components/pagination";
import DynamicTable from "@/components/table";
import { Modal } from "@/components/modal";
import MainForm from "@/components/form/main-form";
import { Button } from "@/components/button";
import Segment from "@/components/segment";
import { PreNomina } from "./pre-nomina";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

type EstadoChecador = "Entrada" | "Salida";

type Categoria = "Checador" | "Pre-Nomina";

/** Registro tal como viene de la API */
interface ChecadorApiItem {
    empleado_id: string;
    hora: string;
    estado: string;
    fecha: string;
}

/** Registro ya formateado para la tabla. `ID` lo agrega/gestiona DynamicTable;
 *  se deja tipado como array de number para no romper `row.ID[0]`, pero
 *  conviene confirmar el shape real contra DynamicTable. */
interface ChecadorRow {
    ID?: number[];
    empleado: string;
    hora: string;
    estado: string;
    fecha: string;
}

interface ChecadorResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: ChecadorApiItem[];
}

interface FiltroItem {
    Key: string;
    Value: string | number | boolean;
    Operator: string;
}

interface ActiveFilters {
    Filtros: FiltroItem[];
    Selects: { Key: string }[];
    OrderBy: { Key: string; Direction: "ASC" | "DESC" }[] | null;
    sum: boolean;
    distinct: boolean;
}

interface MainFormHandle {
    reset?: () => void;
}

interface ChecadorFormData {
    empleado_id: string;
    [key: string]: unknown;
}

/** Directorio de empleados, obtenido de la tabla `Personal` en Intelisis
 *  (Selects acotados a lo que necesitamos: identificar, nombrar y validar
 *  que el empleado siga activo). */
interface EmpleadoInfo {
    personal: string;
    nombreCompleto: string;
    departamento?: string;
    puesto?: string;
    estatus?: string;
}

const CATEGORIAS: Categoria[] = ["Checador", "Pre-Nomina"];

const MODAL_DETALLES_CHECADOR = "detalles-checador";
const MODAL_CHAT_GENERAL = "chat-general";

const TABLE_CHECADOR = "Checador";
const TABLE_PERSONAL = "Personal";

const getTodayDateString = () => new Date().toISOString().split("T")[0];
const getCurrentTimeString = () => new Date().toTimeString().split(" ")[0];

export default function Page() {
    const dispatch = useAppDispatch();

    const [selectedCategory, setSelectedCategory] = useState<Categoria>("Checador");
    const [data, setData] = useState<ChecadorRow[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Hooks de API
    const [getWithFilter] = useGetWithFiltersMutation();
    const [postGeneral] = usePostGeneralMutation();
    const [getWithFilterIntelisis] = useGetWithFiltersIntelisisMutation();

    // ─── Directorio de empleados (tabla Personal en Intelisis) ────────────────
    // Se usa para: autocompletar el campo de ID con nombre/depto, validar que
    // el empleado exista y esté "ALTA" antes de registrar, y mostrar nombres
    // en vez de solo el ID en la tabla de checadas.
    const [empleadosMap, setEmpleadosMap] = useState<Record<string, EmpleadoInfo>>({});
    const [empleadosLoading, setEmpleadosLoading] = useState(true);

    const fetchEmpleados = useCallback(async () => {
        setEmpleadosLoading(true);
        try {
            const response = await getWithFilterIntelisis({
                table: TABLE_PERSONAL,
                filtros: {
                    Selects: [
                        { Key: "Personal" },
                        { Key: "Nombre" },
                        { Key: "ApellidoPaterno" },
                        { Key: "ApellidoMaterno" },
                        { Key: "Departamento" },
                        { Key: "Puesto" },
                        { Key: "Estatus" },
                    ],
                    FiltrosAnd: [
                        {
                            Filtros: [
                                { Key: "Tipo", Value: "Empleado", Operator: "=" },
                                { Key: "Estatus", Value: "ALTA", Operator: "=" },
                            ],
                            OperadorLogico: "AND",
                        },
                    ],
                },
                pageSize: 1000,
                page: 1,
            });

            if ("data" in response) {
                const empleadosData = (response.data as any).data as any[];
                const map: Record<string, EmpleadoInfo> = {};
                empleadosData.forEach((emp) => {
                    const nombreCompleto = [emp.Nombre, emp.ApellidoPaterno, emp.ApellidoMaterno]
                        .filter(Boolean)
                        .join(" ");
                    map[emp.Personal] = {
                        personal: emp.Personal,
                        nombreCompleto: nombreCompleto || emp.Personal,
                        departamento: emp.Departamento || undefined,
                        puesto: emp.Puesto || undefined,
                        estatus: emp.Estatus,
                    };
                });
                setEmpleadosMap(map);
            }
        } catch (err) {
            console.error("Error obteniendo directorio de personal:", err);
        } finally {
            setEmpleadosLoading(false);
        }
    }, [getWithFilterIntelisis]);

    useEffect(() => {
        fetchEmpleados();
    }, [fetchEmpleados]);

    // Opciones para el campo SEARCH: "código · Nombre Completo (Departamento)".
    const employeeOptions = useMemo(
        () =>
            Object.values(empleadosMap)
                .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto))
                .map((emp) => ({
                    value: emp.personal,
                    label: `${emp.personal} · ${emp.nombreCompleto}${emp.departamento ? ` (${emp.departamento})` : ""}`,
                })),
        [empleadosMap]
    );

    // Estado para el modal de detalles
    const [selectedChecador, setSelectedChecador] = useState<ChecadorRow | null>(null);

    // Ref del formulario (para poder resetearlo tras un envío exitoso)
    const formRef = useRef<MainFormHandle>(null);

    // Estado para la detección automática de entrada/salida
    const [detectedStatus, setDetectedStatus] = useState<EstadoChecador | null>(null);
    const [detectionMessage, setDetectionMessage] = useState<string>("");
    const [isDetecting, setIsDetecting] = useState(false);

    const activeFilters = useMemo<ActiveFilters>(
        () => ({
            Filtros: [
                {
                    Key: "Fecha",
                    Value: getTodayDateString(),
                    Operator: "=",
                },
            ],
            Selects: [],
            OrderBy: [{ Key: "id", Direction: "DESC" }],
            sum: false,
            distinct: false,
        }),
        []
    );
    const detectarSiguienteEstado = useCallback(
        async (empleadoId: string): Promise<EstadoChecador | null> => {
            const idLimpio = empleadoId?.trim();
            if (!idLimpio) {
                setDetectedStatus(null);
                setDetectionMessage("");
                return null;
            }

            // Validar contra el directorio de Personal (Intelisis) antes de
            // consultar el checador: evita registrar checadas de IDs que no
            // existen o que pertenecen a empleados dados de baja.
            const empleado = empleadosMap[idLimpio];
            if (!empleado) {
                setDetectedStatus(null);
                setDetectionMessage(
                    empleadosLoading
                        ? "⏳ Cargando directorio de empleados, intenta de nuevo en un momento..."
                        : "⚠️ Empleado no encontrado o dado de baja. Verifica el número."
                );
                return null;
            }

            const etiquetaEmpleado = `${empleado.nombreCompleto}${empleado.departamento ? ` (${empleado.departamento})` : ""}`;

            setIsDetecting(true);
            try {
                const response = await getWithFilter({
                    table: TABLE_CHECADOR,
                    filtros: {
                        Selects: [{ Key: "estado" }, { Key: "fecha" }],
                        FiltrosAnd: [
                            {
                                Filtros: [
                                    {
                                        Key: "empleado_id",
                                        Value: idLimpio,
                                        Operator: "=",
                                    },
                                ],
                                OperadorLogico: "AND",
                            },
                        ],
                        Order: [{ Key: "id", Direction: "DESC" }],
                        Take: 1,
                    },
                    pageSize: 1,
                    page: 1,
                });

                let nuevoEstado: any;
                let mensaje: string;

                if ("data" in response && response.data.data.length > 0) {
                    const ultimo = response.data.data[0];
                    const fechaHoy = getTodayDateString() + "T00:00:00";

                    if (ultimo.fecha === fechaHoy) {
                        if (ultimo.estado === "Entrada") {
                            nuevoEstado = "Salida";
                            mensaje = `🟢 ${etiquetaEmpleado}: último registro ENTRADA → Registrar SALIDA`;
                        } else {
                            nuevoEstado = "Entrada";
                            mensaje = `🔵 ${etiquetaEmpleado}: último registro SALIDA → Registrar ENTRADA`;
                        }
                    } else {
                        nuevoEstado = "Entrada";
                        mensaje = `🔵 ${etiquetaEmpleado}: sin registro hoy → Registrar ENTRADA`;
                    }
                } else {
                    nuevoEstado = "Entrada";
                    mensaje = `🔵 ${etiquetaEmpleado}: primer registro → Registrar ENTRADA`;
                }

                setDetectedStatus(nuevoEstado);
                setDetectionMessage(mensaje);
                return nuevoEstado;
            } catch (err) {
                console.error("Error al detectar estado:", err);
                setDetectionMessage("⚠️ No se pudo detectar automáticamente");
                setDetectedStatus(null);
                return null;
            } finally {
                setIsDetecting(false);
            }
        },
        [getWithFilter, empleadosMap, empleadosLoading]
    );

    // Obtener registros de checador (para la tabla)
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getWithFilter({
                table: TABLE_CHECADOR,
                filtros: {
                    Selects: [
                        { Key: "empleado_id" },
                        { Key: "hora" },
                        { Key: "estado" },
                        { Key: "fecha" },
                    ],
                    FiltrosAnd: [
                        {
                            Filtros: activeFilters.Filtros,
                            OperadorLogico: "OR",
                        },
                    ],
                    Order: activeFilters.OrderBy || [],
                },
                pageSize,
                page: currentPage,
            });

            if ("data" in response) {
                const checadorData = response.data as ChecadorResponse;
                const formatted: ChecadorRow[] = checadorData.data.map((item) => {
                    const empleado = empleadosMap[item.empleado_id];
                    return {
                        empleado: empleado
                            ? `${item.empleado_id} · ${empleado.nombreCompleto}`
                            : item.empleado_id,
                        hora: item.hora.slice(0, 5),
                        estado: item.estado,
                        fecha: item.fecha,
                    };
                });
                setData(formatted);
                setTotalPages(checadorData.totalPages);
            } else {
                throw new Error("Error en la respuesta del servidor");
            }
        } catch (err) {
            console.error("Error obteniendo checador:", err);
            setError("No se pudieron cargar los registros. Intente nuevamente.");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activeFilters, pageSize, getWithFilter, empleadosMap]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (modalName: string, registro?: ChecadorRow) => {
        if (modalName === MODAL_DETALLES_CHECADOR && registro) {
            setSelectedChecador(registro);
        }
        dispatch(openModalReducer({ modalName }));
    };

    const handleCopyId = async (id: number) => {
        try {
            await navigator.clipboard.writeText(String(id));
        } catch {
            console.error("No se pudo copiar al portapapeles.");
        }
    };

    // Función para manejar el envío personalizado
    const handleCustomSubmit = async (formData: ChecadorFormData) => {
        const empleadoId = formData.empleado_id?.trim();

        if (!empleadoId) {
            setError("Por favor, ingresa un ID de empleado.");
            return false;
        }

        const estado = await detectarSiguienteEstado(empleadoId);

        if (!estado) {
            setError("No se pudo registrar: verifica que el número de empleado exista y esté activo (ALTA).");
            return false;
        }

        try {
            const payload = {
                empleado_id: empleadoId,
                fecha: getTodayDateString(),
                hora: getCurrentTimeString(),
                estado: estado === "Entrada" ? "Entrada" : "Salida",
            };

            const response = await postGeneral({
                table: TABLE_CHECADOR,
                data: payload,
            });

            if ("data" in response) {
                // Éxito - actualizar tabla
                await fetchData();
                setDetectedStatus(null);
                setDetectionMessage("");

                // Limpiar formulario vía ref
                formRef.current?.reset?.();

                return true;
            }

            throw new Error("Error al registrar");
        } catch (err) {
            console.error("Error al registrar:", err);
            setError("No se pudo registrar el checador. Intente nuevamente.");
            return false;
        }
    };

    return (
        <main className="min-h-screen mx-auto p-4 md:p-6 text-gray-900">
            <header className="mb-8">
                <h1 className="flex items-center text-2xl font-bold md:text-3xl dark:text-white">
                    Checador
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                    <p className="text-gray-600 dark:text-gray-200">
                        Gestión de empleados y sistema de nómina
                    </p>
                    <div className="flex items-center gap-2 dark:text-gray-200">
                        Sección:
                        <Segment
                            items={CATEGORIAS.map((cat) => ({ value: cat, label: cat }))}
                            value={selectedCategory}
                            onValueChange={(value) => setSelectedCategory(value as Categoria)}
                        />
                    </div>
                </div>
            </header>

            {selectedCategory === "Checador" ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
                    <article className="p-4">
                        <ul className="flex gap-5 mx-auto w-fit">
                            <li className="w-2/3 my-auto">
                                <MainForm
                                    ref={formRef}
                                    message_button="Registrar"
                                    iconButton={
                                        isDetecting ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        ) : (
                                            <CheckCircle className="mr-1 size-4" />
                                        )
                                    }
                                    actionType=""
                                    table={TABLE_CHECADOR}
                                    aditionalData={{
                                        fecha: getTodayDateString(),
                                        estado: detectedStatus || "entrada",
                                    }}
                                    onSuccess={handleCustomSubmit}
                                    dataForm={[
                                        {
                                            name: "empleado_id",
                                            type: "SEARCH",
                                            label: "Empleado",
                                            icon: <User className="size-4" />,
                                            placeholder: empleadosLoading
                                                ? "Cargando directorio..."
                                                : "Busca por número o nombre...",
                                            options: employeeOptions,
                                            require: true,
                                        },
                                    ]}
                                />
                                {detectionMessage && (
                                    <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm">
                                        {detectionMessage}
                                    </div>
                                )}
                            </li>

                            {/* Tabla */}
                            <li className="w-full">
                                {isLoading ? (
                                    <LoadingSection message="Cargando registros..." />
                                ) : error ? (
                                    <div className="p-4 text-center">
                                        <p className="text-red-500 mb-2">{error}</p>
                                        <Button onClick={fetchData} color="success">
                                            Reintentar
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <DynamicTable
                                            data={data}
                                            contextMenuItems={(row: ChecadorRow) => [
                                                {
                                                    label: "Copiar ID",
                                                    icon: <Copy size={16} />,
                                                    onClick: () =>
                                                        row.ID?.[0] !== undefined &&
                                                        handleCopyId(row.ID[0]),
                                                },
                                            ]}
                                        />
                                        <Pagination
                                            currentPage={currentPage}
                                            loading={isLoading}
                                            setCurrentPage={setCurrentPage}
                                            currentPageSize={pageSize}
                                            onPageSizeChange={setPageSize}
                                            totalPages={totalPages}
                                        />
                                    </>
                                )}
                            </li>
                        </ul>

                      

                        <Modal modalName={MODAL_CHAT_GENERAL} title="Chat General" maxWidth="xl">
                            <></>
                        </Modal>
                    </article>
                </div>
            ) : (
                <PreNomina />
            )}
        </main>
    );
}