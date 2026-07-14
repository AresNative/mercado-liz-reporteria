"use client"

import {
    Calendar,
    Eye,
    Filter,
    RefreshCw,
    Search,
} from "lucide-react"
import { useEffect, useState, useCallback, useMemo } from "react"

import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersMutation } from "@/hooks/api/api"
import { useGetWithFiltersIntelisisMutation } from "@/hooks/api/api_int"

import { LoadingSection } from "@/template/loading-screen"

import Pagination from "@/components/pagination"
import DynamicTable from "@/components/table"
import { Modal } from "@/components/modal"
import MainForm from "@/components/form/main-form"
import { Button } from "@/components/button"
import { DetallesPreNomina, ResumenEmpleado, DiaAsistencia } from "./components/detalles-nomina"

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

interface EmpleadoNomina {
    personal: string;
    nombreCompleto: string;
    departamento?: string;
    puesto?: string;
    jornada?: string;
    periodoTipo?: string;
    sueldoDiario: number;
}

interface ChecadorEntry {
    empleado_id: string;
    hora: string;
    estado: string;
    fecha: string; // "YYYY-MM-DDT00:00:00"
}

const HORA_ESPERADA_POR_JORNADA: Record<string, string> = {
    MATUTINO: "08:00:00",
    VESPERTINO: "14:00:00",
    NOCTURNO: "20:00:00",
    MIXTO: "08:00:00",
};
const TOLERANCIA_MINUTOS = 10;
const esDiaLaboral = (fecha: Date) => fecha.getDay() !== 0; // asume domingo como descanso

const TABLE_CHECADOR = "Checador";
const TABLE_PERSONAL = "Personal";
const CHECADOR_PAGE_SIZE = 3000;
const EMPLEADOS_PAGE_SIZE = 1000;

const MODAL_DETALLES_PRE_NOMINA = "detalles-pre-nomina";
const MODAL_CHAT_PRE_NOMINA = "chat-pre-nomina";

const pad2 = (n: number) => n.toString().padStart(2, "0");
const toISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// Semana actual (lunes a domingo) como rango por defecto del período de nómina.
const getCurrentWeekRange = (): string => {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = domingo
    const offsetLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + offsetLunes);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    return `${toISODate(lunes)} AND ${toISODate(domingo)}`;
};

const getHoraEsperada = (jornada?: string) =>
    HORA_ESPERADA_POR_JORNADA[(jornada || "").toUpperCase()] || "08:00:00";

// Suma minutos a una hora "HH:MM:SS" (comparación lexicográfica válida entre
// horas con el mismo formato de ancho fijo).
const addMinutes = (hhmmss: string, minutos: number): string => {
    const [h, m, s] = hhmmss.split(":").map(Number);
    const total = h * 60 + m + minutos;
    const hh = Math.floor(total / 60) % 24;
    const mm = total % 60;
    return `${pad2(hh)}:${pad2(mm)}:${pad2(s || 0)}`;
};

const formatMoney = (n: number) =>
    n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export function PreNomina() {
    const dispatch = useAppDispatch();

    const [getWithFilter] = useGetWithFiltersMutation();
    const [getWithFilterIntelisis] = useGetWithFiltersIntelisisMutation();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [periodo, setPeriodo] = useState<string>(getCurrentWeekRange());
    const [searchTerm, setSearchTerm] = useState<string>("");

    const [empleados, setEmpleados] = useState<EmpleadoNomina[]>([]);
    const [checadas, setChecadas] = useState<ChecadorEntry[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<ResumenEmpleado | null>(null);

    // ─── Directorio de empleados activos (Personal, Intelisis) ─────────────────
    const fetchEmpleados = useCallback(async () => {
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
                        { Key: "Jornada" },
                        { Key: "PeriodoTipo" },
                        { Key: "SueldoDiario" },
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
                pageSize: EMPLEADOS_PAGE_SIZE,
                page: 1,
            });

            if ("data" in response) {
                const rows = (response.data as any).data as any[];
                const parsed: EmpleadoNomina[] = rows.map((emp) => ({
                    personal: emp.Personal,
                    nombreCompleto: [emp.Nombre, emp.ApellidoPaterno, emp.ApellidoMaterno]
                        .filter(Boolean)
                        .join(" "),
                    departamento: emp.Departamento || undefined,
                    puesto: emp.Puesto || undefined,
                    jornada: emp.Jornada || undefined,
                    periodoTipo: emp.PeriodoTipo || undefined,
                    // SueldoDiario llega desde Intelisis como { source, parsedValue }.
                    sueldoDiario: emp.SueldoDiario?.parsedValue ?? Number(emp.SueldoDiario) ?? 0,
                }));
                setEmpleados(parsed);
            }
        } catch (err) {
            console.error("Error obteniendo el directorio de empleados:", err);
            setError("No se pudo cargar el directorio de empleados.");
        }
    }, [getWithFilterIntelisis]);

    // ─── Checadas del período (Checador, base propia) ──────────────────────────
    const fetchChecadas = useCallback(async () => {
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
                            Filtros: [{ Key: "fecha", Value: periodo, Operator: "BETWEEN" }],
                            OperadorLogico: "AND",
                        },
                    ],
                    Order: [{ Key: "fecha", Direction: "ASC" }],
                },
                pageSize: CHECADOR_PAGE_SIZE,
                page: 1,
            });

            if ("data" in response) {
                setChecadas((response.data as any).data as ChecadorEntry[]);
            } else {
                throw new Error("Error en la respuesta del servidor");
            }
        } catch (err) {
            console.error("Error obteniendo checadas:", err);
            setError("No se pudieron cargar las checadas del período. Intente nuevamente.");
        } finally {
            setIsLoading(false);
        }
    }, [getWithFilter, periodo]);

    useEffect(() => {
        fetchEmpleados();
    }, [fetchEmpleados]);

    useEffect(() => {
        fetchChecadas();
    }, [fetchChecadas]);

    // ─── Cálculo de asistencia por empleado (sueldo diario, retardos, faltas) ──
    const resumen: ResumenEmpleado[] = useMemo(() => {
        const [inicioStr, finStr] = periodo.split(" AND ").map((s) => s.trim());
        if (!inicioStr || !finStr) return [];
        const inicio = new Date(`${inicioStr}T00:00:00`);
        const fin = new Date(`${finStr}T00:00:00`);

        // Días del período considerados laborales (excluye domingo por defecto).
        const diasDelPeriodo: string[] = [];
        for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
            if (esDiaLaboral(d)) diasDelPeriodo.push(toISODate(new Date(d)));
        }

        // Agrupar checadas por empleado y por día.
        const porEmpleado = new Map<string, Map<string, ChecadorEntry[]>>();
        checadas.forEach((c) => {
            const dia = c.fecha.split("T")[0];
            if (!porEmpleado.has(c.empleado_id)) porEmpleado.set(c.empleado_id, new Map());
            const porDia = porEmpleado.get(c.empleado_id)!;
            if (!porDia.has(dia)) porDia.set(dia, []);
            porDia.get(dia)!.push(c);
        });

        return empleados.map((emp) => {
            const porDia = porEmpleado.get(emp.personal) || new Map<string, ChecadorEntry[]>();
            const horaEsperada = getHoraEsperada(emp.jornada);
            const horaLimite = addMinutes(horaEsperada, TOLERANCIA_MINUTOS);

            let retardos = 0;
            let faltas = 0;
            let diasTrabajados = 0;

            const dias: DiaAsistencia[] = diasDelPeriodo.map((fecha) => {
                const registrosDia = (porDia.get(fecha) || [])
                    .slice()
                    .sort((a, b) => a.hora.localeCompare(b.hora));
                const entradas = registrosDia.filter((r) => r.estado === "Entrada");
                const salidas = registrosDia.filter((r) => r.estado === "Salida");
                const horaEntrada = entradas[0]?.hora ?? null;
                const horaSalida = salidas[salidas.length - 1]?.hora ?? null;

                let estado: DiaAsistencia["estado"];
                if (!horaEntrada) {
                    estado = "Falta";
                    faltas += 1;
                } else {
                    diasTrabajados += 1;
                    estado = horaEntrada > horaLimite ? "Retardo" : "A tiempo";
                    if (estado === "Retardo") retardos += 1;
                }

                return { fecha, horaEntrada, horaSalida, estado };
            });

            const diasEsperados = diasDelPeriodo.length;
            const sueldoEstimado = Math.max(0, diasEsperados - faltas) * emp.sueldoDiario;

            return {
                ...emp,
                diasEsperados,
                diasTrabajados,
                retardos,
                faltas,
                sueldoEstimado,
                dias,
            };
        });
    }, [empleados, checadas, periodo]);

    // ─── Filtro de búsqueda (cliente) + paginación local ───────────────────────
    const resumenFiltrado = useMemo(() => {
        if (!searchTerm) return resumen;
        const término = searchTerm.toLowerCase();
        return resumen.filter(
            (r) =>
                r.nombreCompleto.toLowerCase().includes(término) ||
                r.personal.toLowerCase().includes(término) ||
                (r.departamento || "").toLowerCase().includes(término)
        );
    }, [resumen, searchTerm]);

    const totalPagesLocal = Math.max(1, Math.ceil(resumenFiltrado.length / pageSize));
    const paginaActual = Math.min(currentPage, totalPagesLocal);
    const resumenPagina = resumenFiltrado.slice(
        (paginaActual - 1) * pageSize,
        paginaActual * pageSize
    );

    // Sugerencias del campo de búsqueda: directorio de empleados activos.
    const empleadoOptions = useMemo(
        () =>
            empleados
                .slice()
                .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto))
                .map((emp) => ({
                    value: emp.personal,
                    label: `${emp.personal} · ${emp.nombreCompleto}${emp.departamento ? ` (${emp.departamento})` : ""}`,
                })),
        [empleados]
    );

    // Totales del período, para el resumen general.
    const totales = useMemo(
        () =>
            resumenFiltrado.reduce(
                (acc, r) => ({
                    retardos: acc.retardos + r.retardos,
                    faltas: acc.faltas + r.faltas,
                    nomina: acc.nomina + r.sueldoEstimado,
                }),
                { retardos: 0, faltas: 0, nomina: 0 }
            ),
        [resumenFiltrado]
    );

    const handleOpenModal = (modalName: string, resumenEmp?: ResumenEmpleado) => {
        if (modalName === MODAL_DETALLES_PRE_NOMINA && resumenEmp) {
            setEmpleadoSeleccionado(resumenEmp);
        }
        dispatch(openModalReducer({ modalName }));
    };

    const handleRefetchAll = () => {
        fetchEmpleados();
        fetchChecadas();
    };

    return (
        <>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
                <article className="p-4">
                    <span className="mr-4 flex justify-between">
                        <label>
                            <h2 className="text-lg font-semibold dark:text-white">Pre-Nómina</h2>
                            <p className="text-sm text-gray-500">
                                Sueldo diario, retardos y faltas estimados a partir del checador.
                            </p>
                        </label>
                    </span>

                    <dt className="relative flex flex-col gap-2">
                        <MainForm
                            message_button={"Filtrar"}
                            iconButton={<Filter className="mr-1 size-4" />}
                            actionType={""}
                            flexDirection="flex-row"
                            onSuccess={(rows: any) => {
                                setPeriodo(rows.periodo || getCurrentWeekRange());
                                setSearchTerm(rows.search || "");
                                setCurrentPage(1);
                            }}
                            dataForm={[
                                {
                                    type: "Flex",
                                    require: false,
                                    elements: [
                                        {
                                            name: "periodo",
                                            type: "DATE_RANGE",
                                            label: "Período de nómina",
                                            icon: <Calendar className="size-4" />,
                                            valueDefined: periodo,
                                            require: false,
                                        },
                                        {
                                            name: "search",
                                            type: "SEARCH",
                                            label: "Buscar empleado",
                                            icon: <Search className="size-4" />,
                                            placeholder: "Nombre, número o departamento...",
                                            options: empleadoOptions,
                                            valueDefined: searchTerm,
                                            require: false,
                                        },
                                    ],
                                },
                            ]}
                        />
                        <dl className="flex gap-2 ml-auto">
                            <Button onClick={handleRefetchAll} color="success">
                                Actualizar <RefreshCw className="size-4" />
                            </Button>
                        </dl>
                    </dt>

                    {/* Resumen del período */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                            <span className="text-xs text-gray-500">Empleados</span>
                            <p className="text-lg font-semibold dark:text-white">{resumenFiltrado.length}</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                            <span className="text-xs text-gray-500">Retardos</span>
                            <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                                {totales.retardos}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                            <span className="text-xs text-gray-500">Faltas</span>
                            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                                {totales.faltas}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                            <span className="text-xs text-gray-500">Nómina estimada</span>
                            <p className="text-lg font-semibold dark:text-white">
                                {formatMoney(totales.nomina)}
                            </p>
                        </div>
                    </section>

                    <section className="overflow-x-auto">
                        {isLoading ? (
                            <LoadingSection message="Cargando pre-nómina..." />
                        ) : error ? (
                            <div className="p-4 text-center">
                                <p className="text-red-500 mb-2">{error}</p>
                                <Button onClick={handleRefetchAll} color="success">
                                    Reintentar
                                </Button>
                            </div>
                        ) : resumenPagina.length > 0 ? (
                            <dt className="flex flex-col gap-2">
                                <DynamicTable
                                    data={resumenPagina.map((r) => ({
                                        Empleado: [r.personal, r.nombreCompleto],
                                        Departamento: r.departamento || "—",
                                        "Sueldo Diario": formatMoney(r.sueldoDiario),
                                        "Días Trabajados": `${r.diasTrabajados}/${r.diasEsperados}`,
                                        Retardos: r.retardos,
                                        Faltas: r.faltas,
                                        "Sueldo Estimado": formatMoney(r.sueldoEstimado),
                                    }))}
                                    onRowClick={(row: any) => {
                                        const empleado = resumenFiltrado.find(
                                            (r) => r.personal === row.Empleado?.[0]
                                        );
                                        if (empleado) handleOpenModal(MODAL_DETALLES_PRE_NOMINA, empleado);
                                    }}
                                    contextMenuItems={(row: any) => [
                                        {
                                            label: "Ver detalles",
                                            icon: <Eye size={16} />,
                                            onClick: () => {
                                                const empleado = resumenFiltrado.find(
                                                    (r) => r.personal === row.Empleado?.[0]
                                                );
                                                if (empleado) handleOpenModal(MODAL_DETALLES_PRE_NOMINA, empleado);
                                            },
                                        },
                                    ]}
                                />
                                <Pagination
                                    currentPage={paginaActual}
                                    loading={isLoading}
                                    setCurrentPage={setCurrentPage}
                                    currentPageSize={pageSize}
                                    onPageSizeChange={(newSize) => {
                                        setPageSize(newSize);
                                        setCurrentPage(1);
                                    }}
                                    totalPages={totalPagesLocal}
                                />
                            </dt>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-gray-500 mb-4">
                                    No se encontraron empleados con los filtros aplicados.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setCurrentPage(1);
                                    }}
                                    className="text-green-600 hover:text-green-800 underline"
                                >
                                    Ver todos los empleados
                                </button>
                            </div>
                        )}
                    </section>
                </article>
            </div>

            <Modal
                modalName={MODAL_DETALLES_PRE_NOMINA}
                title="Detalle de asistencia"
                maxWidth="5xl"
            >
                {empleadoSeleccionado ? (
                    <DetallesPreNomina resumen={empleadoSeleccionado} periodo={periodo} />
                ) : (
                    <div className="p-4 text-center text-gray-500">
                        No se ha seleccionado ningún empleado.
                    </div>
                )}
            </Modal>

            <Modal modalName={MODAL_CHAT_PRE_NOMINA} title="Chat General" maxWidth="xl">
                <></>
            </Modal>
        </>
    );
}

// Página completa para el rol "nómina"
export default function Page() {
    return (
        <>
            <main className="min-h-screen mx-auto p-4 md:p-6 text-gray-900 dark:text-white">
                <header className="mb-8">
                    <h1 className="flex items-center text-2xl font-bold md:text-3xl">
                        Pre-Nómina
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-100">
                        Estimación de sueldo diario, retardos y faltas por período, calculada a
                        partir del checador y del directorio de empleados activos.
                    </p>
                </header>
                <PreNomina />
            </main>
        </>
    );
}