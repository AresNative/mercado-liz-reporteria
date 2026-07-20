"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useAppDispatch } from "@/hooks/selector";
import { closeModalReducer, openModalReducer } from "@/hooks/reducers/drop-down";
import {
    useGetWithFiltersMutation,
    usePostGeneralMutation,
    usePutGeneralMutation,
    useDeleteGeneralMutation,
} from "@/hooks/api/api";
import Segment from "@/components/segment";
import MainForm from "@/components/form/main-form";
import DynamicTable from "@/components/table";
import Pagination from "@/components/pagination";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { LoadingSection } from "@/template/loading-screen";
import { ContextMenu, ContextMenuItem } from "@/components/context-menu";
import {
    RefreshCw,
    Eye,
    Copy,
    CheckCircle,
    Plus,
    Edit,
    Trash2,
    Clock,
    Calendar,
} from "lucide-react";
import DynamicChart from "@/components/dynamic-chart";
import { DetallesActividad } from "./components/detalles-actividad";
import { DetallesSolicitud } from "./components/detalles-solicitud";
import { formConfigActividad } from "./registro-actividad/form-config";
import { columnConfigActividad, columnConfigSolicitud } from "./registro-actividad/tabla-config";
import { formConfigSolicitud } from "./solicitud-proyectos/form-config";
import { CountdownTimer } from "@/components/counter-down";

type Seccion = "actividad" | "solicitudes";

const TABLAS = {
    actividad: "actividad_diaria",
    solicitudes: "solicitud_proyectos",
};

export default function ActividadProyectosPage() {
    const dispatch = useAppDispatch();
    const [seccion, setSeccion] = useState<Seccion>("actividad");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Filtros activos
    const [activeFilters, setActiveFilters] = useState<any>({
        Filtros: [],
        FiltrosAnd: [],
    });

    // Opciones de proyectos para el campo SEARCH en actividad
    const [proyectosOptions, setProyectosOptions] = useState<{ value: string; label: string }[]>([]);
    const [cargandoProyectos, setCargandoProyectos] = useState(false);

    const [getWithFilter] = useGetWithFiltersMutation();
    const [postGeneral] = usePostGeneralMutation();
    const [putGeneral] = usePutGeneralMutation();
    const [deleteGeneral] = useDeleteGeneralMutation();

    const formRegistroRef = useRef<any>(null);
    const formEdicionRef = useRef<any>(null);

    // Estados para modales
    const [selectedActividad, setSelectedActividad] = useState<any>(null);
    const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);
    const [modalEditando, setModalEditando] = useState(false);
    const [itemAEditar, setItemAEditar] = useState<any>(null);

    // ─── Carga de datos ──────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const table = TABLAS[seccion];
        try {
            const response = await getWithFilter({
                table,
                filtros: {
                    Selects: [],
                    FiltrosAnd: activeFilters.FiltrosAnd || [],
                    Order: [{ Key: "fecha_creacion", Direction: "DESC" }],
                },
                page: currentPage,
                pageSize,
            });
            if ("data" in response) {
                const rawData = response.data.data;
                const transformed = rawData.map((item: any) => ({
                    ...item,
                    ID: item.id,
                }));
                setData(transformed);
                setTotalPages(response.data.totalPages);
                setTotalRecords(response.data.totalRecords);
            } else {
                throw new Error("Error al cargar datos");
            }
        } catch (err: any) {
            setError(err.message || "Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    }, [seccion, activeFilters, currentPage, pageSize, getWithFilter]);

    // ─── Carga de opciones de proyectos (únicos desde actividad_diaria) ────
    const cargarProyectos = useCallback(async () => {
        if (seccion !== "actividad") return;
        setCargandoProyectos(true);
        try {
            const response = await getWithFilter({
                table: TABLAS.actividad,
                filtros: {
                    Selects: [{ Key: "proyecto" }],
                    distinct: true,
                    FiltrosAnd: [],
                    Order: [{ Key: "proyecto", Direction: "ASC" }],
                },
                page: 1,
                pageSize: 1000, // traer todos los proyectos únicos
            });
            if ("data" in response) {
                const proyectos = response.data.data
                    .map((item: any) => item.proyecto)
                    .filter(Boolean)
                    .map((nombre: string) => ({
                        value: nombre,
                        label: nombre,
                    }));
                // Eliminar duplicados (por si acaso)
                const unique:any = Array.from(new Map(proyectos.map((p: any) => [p.value, p])).values());
                setProyectosOptions(unique);
            }
        } catch (err) {
            console.error("Error al cargar proyectos:", err);
        } finally {
            setCargandoProyectos(false);
        }
    }, [seccion, getWithFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        cargarProyectos();
    }, [cargarProyectos]);

    // ─── Estadísticas para gráficos ─────────────────────────────────────────
    const stats = useMemo(() => {
        if (seccion === "actividad") {
            const proyectoMap = new Map<string, number>();
            data.forEach((item) => {
                const p = item.proyecto || "Sin proyecto";
                proyectoMap.set(p, (proyectoMap.get(p) || 0) + (Number(item.horas) || 0));
            });
            const categories = Array.from(proyectoMap.keys());
            const series = [
                {
                    name: "Horas",
                    data: categories.map((cat, idx) => ({
                        x: cat,
                        y: proyectoMap.get(cat) || 0,
                        order: idx + 1,
                    })),
                },
            ];
            return { categories, series, tipo: "bar" as const };
        } else {
            const estadoMap = new Map<string, number>();
            data.forEach((item) => {
                const e = item.estado || "pendiente";
                estadoMap.set(e, (estadoMap.get(e) || 0) + 1);
            });
            const categories = Array.from(estadoMap.keys());
            const series = [
                {
                    name: "Cantidad",
                    data: categories.map((cat, idx) => ({
                        x: cat,
                        y: estadoMap.get(cat) || 0,
                        order: idx + 1,
                    })),
                },
            ];
            return { categories, series, tipo: "pie" as const };
        }
    }, [seccion, data]);

    // ─── Manejadores de éxito ──────────────────────────────────────────────
    const handleRegistroSuccess = async () => {
        await fetchData();
        await cargarProyectos(); // actualizar lista de proyectos
        formRegistroRef.current?.reset?.();
    };

    const handleSolicitudSuccess = async () => {
        await fetchData();
        dispatch(closeModalReducer({ modalName: "form-solicitud" }));
        setModalEditando(false);
        setItemAEditar(null);
    };

    // ─── Eliminar registro ──────────────────────────────────────────────────
    const handleDelete = useCallback(
        async (id: number, tabla: string) => {
            if (!confirm(`¿Estás seguro de eliminar este registro (ID: ${id})?`)) return;
            try {
                await deleteGeneral({
                    table: tabla,
                    filtros: [{ Key: "id", Value: id, Operator: "=" }],
                }).unwrap();
                await fetchData();
                if (tabla === TABLAS.actividad) await cargarProyectos();
            } catch (err: any) {
                console.error("Error al eliminar:", err);
                alert("No se pudo eliminar el registro.");
            }
        },
        [deleteGeneral, fetchData, cargarProyectos]
    );

    // ─── Abrir modal de edición ────────────────────────────────────────────
    const openEditModal = (row: any) => {
        setItemAEditar(row);
        setModalEditando(true);
        if (seccion === "solicitudes") {
            setSelectedSolicitud(row);
            dispatch(openModalReducer({ modalName: "form-solicitud" }));
        } else {
            // Para actividad, usamos el mismo modal de creación pero con valores precargados
            // Como el formulario de actividad está en la misma página, podemos usar un modal independiente
            // o simplemente precargar en el formulario inline. Por simplicidad, usaremos un modal.
            setSelectedActividad(row);
            dispatch(openModalReducer({ modalName: "form-actividad" }));
        }
    };

    // ─── Filtros ─────────────────────────────────────────────────────────────
    const handleFilterSubmit = (filtros: any) => {
        const { fecha_desde, fecha_hasta, proyecto, estado } = filtros;
        const filtrosAnd: any = [];
        if (fecha_desde && fecha_hasta) {
            filtrosAnd.push({
                Key: "fecha",
                Operator: "BETWEEN",
                Value: `${fecha_desde} AND ${fecha_hasta}`,
            });
        }
        if (proyecto) {
            filtrosAnd.push({ Key: "proyecto", Operator: "=", Value: proyecto });
        }
        if (estado && seccion === "solicitudes") {
            filtrosAnd.push({ Key: "estado", Operator: "=", Value: estado });
        }
        setActiveFilters((prev: any) => ({ ...prev, FiltrosAnd: filtrosAnd }));
        setCurrentPage(1);
    };

    // ─── Abrir modales de detalle ──────────────────────────────────────────
    const handleRowClick = (row: any) => {
        if (seccion === "actividad") {
            setSelectedActividad(row);
            dispatch(openModalReducer({ modalName: "detalle-actividad" }));
        } else {
            setSelectedSolicitud(row);
            dispatch(openModalReducer({ modalName: "detalle-solicitud" }));
        }
    };

    // ─── Menú contextual ──────────────────────────────────────────────────
    const contextRowRef = useRef<any>(null);

    const getContextMenuItems = useCallback((): ContextMenuItem[] => {
        const baseItems: ContextMenuItem[] = [
            {
                label: "Ver detalles",
                icon: <Eye size={16} />,
                onClick: () => {
                    if (contextRowRef.current) handleRowClick(contextRowRef.current);
                },
            },
            {
                label: "Copiar ID",
                icon: <Copy size={16} />,
                onClick: () => {
                    if (contextRowRef.current?.id) {
                        navigator.clipboard.writeText(String(contextRowRef.current.id));
                    }
                },
            },
            {
                label: "Editar",
                icon: <Edit size={16} />,
                onClick: () => {
                    if (contextRowRef.current) openEditModal(contextRowRef.current);
                },
            },
            {
                label: "Eliminar",
                icon: <Trash2 size={16} />,
                danger: true,
                onClick: () => {
                    if (contextRowRef.current?.id) {
                        handleDelete(contextRowRef.current.id, TABLAS[seccion]);
                    }
                },
            },
        ];

        if (seccion === "solicitudes") {
            return [
                ...baseItems,
                {
                    label: "Cambiar estado",
                    icon: <Clock size={16} />,
                    onClick: () => {
                        console.log("Cambiar estado de", contextRowRef.current?.id);
                    },
                },
            ];
        }
        return baseItems;
    }, [seccion, handleDelete, openEditModal]);

    // ─── Render ─────────────────────────────────────────────────────────────
    return (
        <main className="min-h-screen mx-auto p-4 md:p-6 text-gray-900 dark:text-white">
            <header className="mb-6 flex flex-wrap items-center justify-between">
                <h1 className="text-2xl font-bold">Gestión de Actividades y Proyectos</h1>
                <Segment
                    items={[
                        { value: "actividad", label: "Registro de Actividad" },
                        { value: "solicitudes", label: "Solicitud de Proyectos" },
                    ]}
                    value={seccion}
                    onValueChange={(val) => {
                        setSeccion(val as Seccion);
                        setCurrentPage(1);
                        setActiveFilters({ Filtros: [], FiltrosAnd: [] });
                    }}
                />
            </header>

            {/* ─── Panel de estadísticas ─────────────────────────────────────────── */}
            {data.length > 0 && (
                <section className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-lg font-semibold mb-2">
                        {seccion === "actividad" ? "Horas por proyecto" : "Distribución de solicitudes"}
                    </h2>
                    <DynamicChart
                        type={stats.tipo}
                        categories={stats.categories}
                        data={stats.series}
                        height={250}
                    />
                </section>
            )}

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm p-4">
                {/* ─── Formulario de registro (actividad) ─── */}
                {seccion === "actividad" && (
                    <section className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Plus className="h-5 w-5" /> Registrar actividad diaria
                        </h2>
                        <MainForm
                            ref={formRegistroRef}
                            message_button="Guardar actividad"
                            iconButton={<CheckCircle className="mr-1 h-4 w-4" />}
                            actionType="post-general"
                            table={TABLAS.actividad}
                            onSuccess={handleRegistroSuccess}
                            dataForm={formConfigActividad(proyectosOptions, cargandoProyectos)}
                            flexDirection="flex-col"
                        />
                    </section>
                )}

                {/* ─── Formulario de filtros ─── */}
                <section className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <MainForm
                        message_button="Filtrar"
                        iconButton={<RefreshCw className="mr-1 h-4 w-4" />}
                        actionType=""
                        onSuccess={handleFilterSubmit}
                        dataForm={
                            (seccion === "actividad"
                                ? filtrosActividad
                                : filtrosSolicitud) as any
                        }
                        flexDirection="flex-row"
                    />
                </section>

                {/* ─── Tabla ─── */}
                {loading ? (
                    <LoadingSection message="Cargando..." />
                ) : error ? (
                    <div className="text-center py-4">
                        <p className="text-red-500">{error}</p>
                        <Button color="success" onClick={fetchData}>
                            Reintentar
                        </Button>
                    </div>
                ) : (
                    <>
                        <ContextMenu items={getContextMenuItems()}>
                            <DynamicTable
                                data={data.map((row) => {
                                    if (seccion === "solicitudes" && row.fecha_fin) {
                                        const endDate = new Date(row.fecha_fin);
                                        return {
                                            ...row,
                                            tiempo_restante: <CountdownTimer endDate={endDate} refrech={() => { }} />,
                                        };
                                    }
                                    return row;
                                })}
                                loading={loading}
                                onRowClick={handleRowClick}
                                visibleColumns={
                                    seccion === "actividad" ? columnConfigActividad : columnConfigSolicitud
                                }
                            />
                        </ContextMenu>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            loading={loading}
                            setCurrentPage={setCurrentPage}
                            totalItems={totalRecords}
                            itemsPerPage={pageSize}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setCurrentPage(1);
                            }}
                            currentPageSize={pageSize}
                        />
                    </>
                )}
            </div>

            {/* ─── Modales ─── */}
            <Modal modalName="detalle-actividad" title="Detalle de actividad" maxWidth="2xl">
                {selectedActividad && <DetallesActividad data={selectedActividad} />}
            </Modal>
            <Modal modalName="detalle-solicitud" title="Detalle de solicitud" maxWidth="2xl">
                {selectedSolicitud && <DetallesSolicitud data={selectedSolicitud} />}
            </Modal>

            {/* Modal para editar actividad (reutiliza el mismo formulario) */}
            <Modal modalName="form-actividad" title="Editar actividad" maxWidth="2xl">
                <MainForm
                    key={itemAEditar?.id || "edit"}
                    ref={formEdicionRef}
                    message_button="Actualizar"
                    iconButton={<CheckCircle className="mr-1 h-4 w-4" />}
                    actionType="put-general"
                    table={TABLAS.actividad}
                    onSuccess={handleRegistroSuccess}
                    dataForm={formConfigActividad(proyectosOptions, cargandoProyectos)}
                    aditionalData={{ id: itemAEditar?.id }}
                    valueAssign={itemAEditar}
                    flexDirection="flex-col"
                />
            </Modal>

            {/* Modal para crear/editar solicitud */}
            <Modal
                modalName="form-solicitud"
                title={modalEditando ? "Editar solicitud" : "Nueva solicitud"}
                maxWidth="3xl"
            >
                <MainForm
                    key={modalEditando ? itemAEditar?.id : "new"}
                    ref={formEdicionRef}
                    message_button={modalEditando ? "Actualizar" : "Crear"}
                    iconButton={<CheckCircle className="mr-1 h-4 w-4" />}
                    actionType={modalEditando ? "put-general" : "post-general"}
                    table={TABLAS.solicitudes}
                    onSuccess={handleSolicitudSuccess}
                    dataForm={formConfigSolicitud}
                    aditionalData={modalEditando ? { id: itemAEditar?.id } : { solicitante: "Usuario actual" }}
                    valueAssign={modalEditando ? itemAEditar : undefined}
                    flexDirection="flex-col"
                />
            </Modal>

            {/* Botón flotante para nueva solicitud */}
            {seccion === "solicitudes" && (
                <button
                    className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-colors z-40"
                    onClick={() => {
                        setModalEditando(false);
                        setItemAEditar(null);
                        setSelectedSolicitud(null);
                        dispatch(openModalReducer({ modalName: "form-solicitud" }));
                    }}
                >
                    <Plus className="h-6 w-6" />
                </button>
            )}
        </main>
    );
}

// ─── Configuración de filtros ──────────────────────────────────────────────
const filtrosActividad = [
    {
        type: "Flex",
        require: false,
        elements: [
            {
                type: "DATE_RANGE",
                name: "fecha",
                label: "Rango de fechas",
                icon: <Calendar className="h-4 w-4" />,
                require: false,
            },
            {
                type: "INPUT",
                name: "proyecto",
                label: "Proyecto",
                placeholder: "Nombre del proyecto",
                require: false,
            },
        ],
    },
];

const filtrosSolicitud = [
    {
        type: "Flex",
        require: false,
        elements: [
            {
                type: "DATE_RANGE",
                name: "fecha",
                label: "Rango de fechas",
                icon: <Calendar className="h-4 w-4" />,
                require: false,
            },
            {
                type: "SELECT",
                name: "estado",
                label: "Estado",
                options: [
                    { value: "pendiente", label: "Pendiente" },
                    { value: "aprobado", label: "Aprobado" },
                    { value: "rechazado", label: "Rechazado" },
                ],
                require: false,
            },
        ],
    },
];