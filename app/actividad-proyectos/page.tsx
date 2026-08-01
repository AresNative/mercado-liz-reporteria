"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useAppDispatch } from "@/hooks/selector";
import {
    closeModalReducer,
    openModalReducer,
    openAlertReducer,
} from "@/hooks/reducers/drop-down";
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
    Filter,
    List,
    EyeOff,
    BarChart3,
} from "lucide-react";
import DynamicChart from "@/components/dynamic-chart";
import { DetallesActividad } from "./components/detalles-actividad";
import { DetallesSolicitud } from "./components/detalles-solicitud";
import { CountdownTimer } from "@/components/counter-down";
import { BentoGrid, BentoItem } from "@/components/bento-grid";

import {
    TABLAS,
    formConfigActividad,
    formConfigSolicitud,
    columnConfigActividad,
    columnConfigSolicitud,
    filtrosActividad,
    filtrosSolicitud,
} from "./config";

type Seccion = "actividad" | "solicitudes";

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
    const [proyectosOptions, setProyectosOptions] = useState<
        { value: string; label: string }[]
    >([]);
    const [cargandoProyectos, setCargandoProyectos] = useState(false);

    // Estado para estadísticas (gráfica y resumen)
    const [statsData, setStatsData] = useState<any[]>([]);
    const [statsLoading, setStatsLoading] = useState(false);
    const [showStats, setShowStats] = useState(true);
    const [showResumen, setShowResumen] = useState(true);

    const [activeFilters, setActiveFilters] = useState<{
        Filtros: any[];
        FiltrosAnd: any[];
    }>({
        Filtros: [],
        FiltrosAnd: [],
    });

    const [selectedActividad, setSelectedActividad] = useState<any>(null);
    const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);
    const [modalEditando, setModalEditando] = useState(false);
    const [itemAEditar, setItemAEditar] = useState<any>(null);

    const formRegistroRef = useRef<any>(null);
    const formEdicionRef = useRef<any>(null);
    const contextRowRef = useRef<any>(null);

    const [getWithFilter] = useGetWithFiltersMutation();
    const [postGeneral] = usePostGeneralMutation();
    const [putGeneral] = usePutGeneralMutation();
    const [deleteGeneral] = useDeleteGeneralMutation();

    // ─── Carga de datos de la tabla (paginada) ──────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const table = TABLAS[seccion];
        try {
            const response = await getWithFilter({
                table,
                filtros: {
                    Selects: [],
                    Filtros: activeFilters.Filtros || [],
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
            dispatch(
                openAlertReducer({
                    type: "error",
                    title: "Error",
                    message: "No se pudieron cargar los datos",
                    icon: "alert",
                    duration: 5000,
                })
            );
        } finally {
            setLoading(false);
        }
    }, [seccion, activeFilters, currentPage, pageSize, getWithFilter, dispatch]);

    // ─── Carga de estadísticas (todos los datos, sin paginación) ────────────
    const fetchStats = useCallback(async () => {
        if (seccion !== "actividad") return;
        setStatsLoading(true);
        try {
            const response = await getWithFilter({
                table: TABLAS.actividad,
                filtros: {
                    Selects: [],
                    Filtros: activeFilters.Filtros || [],
                    FiltrosAnd: activeFilters.FiltrosAnd || [],
                    Order: [{ Key: "proyecto", Direction: "ASC" }],
                },
                page: 1,
                pageSize: 10000,
            });
            if ("data" in response) {
                setStatsData(response.data.data);
            } else {
                setStatsData([]);
            }
        } catch (err) {
            console.error("Error al cargar estadísticas:", err);
            setStatsData([]);
        } finally {
            setStatsLoading(false);
        }
    }, [seccion, activeFilters, getWithFilter]);

    // ─── Carga de opciones de proyectos ─────────────────────────────────────
    const cargarProyectos = useCallback(async () => {
        if (seccion !== "actividad") return;
        setCargandoProyectos(true);
        try {
            const response = await getWithFilter({
                table: TABLAS.actividad,
                filtros: {
                    Selects: [{ Key: "proyecto" }],
                    distinct: true,
                    Filtros: [],
                    FiltrosAnd: [],
                    Order: [{ Key: "proyecto", Direction: "ASC" }],
                },
                page: 1,
                pageSize: 1000,
            });
            if ("data" in response) {
                const proyectos = response.data.data
                    .map((item: any) => item.proyecto)
                    .filter(Boolean)
                    .map((nombre: string) => ({ value: nombre, label: nombre }));
                const unique: any[] = Array.from(
                    new Map(proyectos.map((p: any) => [p.value, p])).values()
                );
                setProyectosOptions(unique);
            }
        } catch (err) {
            console.error("Error al cargar proyectos:", err);
        } finally {
            setCargandoProyectos(false);
        }
    }, [seccion, getWithFilter]);

    // ─── Efectos ─────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        cargarProyectos();
    }, [cargarProyectos]);

    // ─── Estadísticas para gráficos (CORREGIDO) ─────────────────────────────
    const stats = useMemo(() => {
        if (seccion === "actividad" && statsData.length > 0) {
            const proyectoMap = new Map<string, number>();
            statsData.forEach((item) => {
                const p = item.proyecto || "Sin proyecto";
                const horas = Number(item.horas) || 0;
                const minutos = Number(item.minutos) || 0;
                const totalHoras = horas + minutos / 60;
                proyectoMap.set(p, (proyectoMap.get(p) || 0) + totalHoras);
            });
            // Ordenar de mayor a menor
            const sorted = Array.from(proyectoMap.entries()).sort((a, b) => b[1] - a[1]);
            const categories = sorted.map(([name]) => name);
            // Serie de datos: array de números en el mismo orden que categories
            const series = [
                {
                    name: "Horas",
                    data: categories.map((cat) => {
                        const found = sorted.find(([name]) => name === cat);
                        return found ? Math.round(found[1] * 100) / 100 : 0;
                    }),
                },
            ];
            return { categories, series, tipo: "bar" as const };
        } else if (seccion === "solicitudes") {
            const estadoMap = new Map<string, number>();
            data.forEach((item) => {
                const e = item.estado || "pendiente";
                estadoMap.set(e, (estadoMap.get(e) || 0) + 1);
            });
            const categories = Array.from(estadoMap.keys());
            // Para pie, data debe ser un array de números
            const series = [
                {
                    name: "Cantidad",
                    data: categories.map((cat) => ({
                        x: cat,
                        y: estadoMap.get(cat) || 0,
                    })),
                },
            ];
            return { categories, series, tipo: "pie" as const };
        }
        return { categories: [], series: [], tipo: "bar" as const };
    }, [seccion, statsData, data]);

    // ─── Resumen por proyecto (agrupación) ──────────────────────────────────
    const resumenProyectos = useMemo(() => {
        if (seccion !== "actividad" || statsData.length === 0) return [];
        const proyectoMap = new Map<
            string,
            { totalHoras: number; cantidadTareas: number }
        >();
        statsData.forEach((item) => {
            const p = item.proyecto || "Sin proyecto";
            const horas = Number(item.horas) || 0;
            const minutos = Number(item.minutos) || 0;
            const totalHoras = horas + minutos / 60;
            if (!proyectoMap.has(p)) {
                proyectoMap.set(p, { totalHoras: 0, cantidadTareas: 0 });
            }
            const current = proyectoMap.get(p)!;
            current.totalHoras += totalHoras;
            current.cantidadTareas += 1;
        });
        return Array.from(proyectoMap.entries())
            .map(([proyecto, datos]) => ({
                proyecto,
                totalHoras: Math.round(datos.totalHoras * 100) / 100,
                cantidadTareas: datos.cantidadTareas,
            }))
            .sort((a, b) => b.totalHoras - a.totalHoras);
    }, [seccion, statsData]);

    // ─── Manejadores de éxito ──────────────────────────────────────────────
    const handleRegistroSuccess = async () => {
        await fetchData();
        await fetchStats();
        await cargarProyectos();
        dispatch(
            openAlertReducer({
                type: "success",
                title: "Éxito",
                message: "Actividad registrada correctamente",
                icon: "archivo",
                duration: 3000,
            })
        );
        dispatch(closeModalReducer({ modalName: "form-actividad-crear" }));
    };

    const handleSolicitudSuccess = async () => {
        await fetchData();
        dispatch(closeModalReducer({ modalName: "form-solicitud" }));
        setModalEditando(false);
        setItemAEditar(null);
        dispatch(
            openAlertReducer({
                type: "success",
                title: modalEditando ? "Actualizado" : "Creado",
                message: modalEditando ? "Solicitud actualizada" : "Solicitud creada",
                icon: "archivo",
                duration: 3000,
            })
        );
    };

    // ─── Eliminar registro ──────────────────────────────────────────────────
    const handleDelete = useCallback(
        async (id: number, tabla: string) => {
            if (!confirm(`¿Estás seguro de eliminar este registro (ID: ${id})?`))
                return;
            try {
                await deleteGeneral({
                    table: tabla,
                    filtros: [{ Key: "id", Value: id, Operator: "=" }],
                }).unwrap();
                await fetchData();
                await fetchStats();
                if (tabla === TABLAS.actividad) await cargarProyectos();
                dispatch(
                    openAlertReducer({
                        type: "success",
                        title: "Eliminado",
                        message: "Registro eliminado correctamente",
                        icon: "archivo",
                        duration: 3000,
                    })
                );
            } catch (err: any) {
                console.error("Error al eliminar:", err);
                dispatch(
                    openAlertReducer({
                        type: "error",
                        title: "Error",
                        message: "No se pudo eliminar el registro",
                        icon: "alert",
                        duration: 5000,
                    })
                );
            }
        },
        [deleteGeneral, fetchData, fetchStats, cargarProyectos, dispatch]
    );

    // ─── Abrir modal de edición ────────────────────────────────────────────
    const openEditModal = (row: any) => {
        setItemAEditar(row);
        setModalEditando(true);
        if (seccion === "solicitudes") {
            setSelectedSolicitud(row);
            dispatch(openModalReducer({ modalName: "form-solicitud" }));
        } else {
            setSelectedActividad(row);
            dispatch(openModalReducer({ modalName: "form-actividad-editar" }));
        }
    };

    // ─── Filtros ─────────────────────────────────────────────────────────────
    const handleFilterSubmit = useCallback(
        (_result: any, filtros: any) => {
            const { fecha_desde, fecha_hasta, proyecto, responsable, horas_min, horas_max, estado } =
                filtros;
            const filtrosArray: any[] = [];
            if (fecha_desde && fecha_hasta) {
                filtrosArray.push({
                    Key: "fecha",
                    Operator: "BETWEEN",
                    Value: `${fecha_desde} AND ${fecha_hasta}`,
                });
            }
            if (proyecto) {
                filtrosArray.push({ Key: "proyecto", Operator: "=", Value: proyecto });
            }
            if (responsable) {
                filtrosArray.push({ Key: "responsable", Operator: "LIKE", Value: `%${responsable}%` });
            }
            if (horas_min !== undefined && horas_min !== "") {
                filtrosArray.push({ Key: "horas", Operator: ">=", Value: Number(horas_min) });
            }
            if (horas_max !== undefined && horas_max !== "") {
                filtrosArray.push({ Key: "horas", Operator: "<=", Value: Number(horas_max) });
            }
            if (estado && seccion === "solicitudes") {
                filtrosArray.push({ Key: "estado", Operator: "=", Value: estado });
            }

            setActiveFilters({
                Filtros: filtrosArray,
                FiltrosAnd: [],
            });
            setCurrentPage(1);
            dispatch(
                openAlertReducer({
                    type: "info",
                    title: "Filtros aplicados",
                    message: "Los filtros se han aplicado correctamente",
                    icon: "archivo",
                    duration: 2000,
                })
            );
        },
        [seccion, dispatch]
    );

    // ─── Limpiar filtros ────────────────────────────────────────────────────
    const limpiarFiltros = useCallback(() => {
        setActiveFilters({ Filtros: [], FiltrosAnd: [] });
        setCurrentPage(1);
        dispatch(
            openAlertReducer({
                type: "info",
                title: "Filtros eliminados",
                message: "Se han eliminado todos los filtros",
                icon: "archivo",
                duration: 2000,
            })
        );
    }, [dispatch]);

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
                        dispatch(
                            openAlertReducer({
                                type: "success",
                                title: "Copiado",
                                message: "ID copiado al portapapeles",
                                icon: "archivo",
                                duration: 1500,
                            })
                        );
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
    }, [seccion, handleDelete, openEditModal, dispatch]);

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
                        setStatsData([]);
                    }}
                />
            </header>

            {/* ─── Panel de estadísticas (gráfica) ──────────────────────────────── */}
            {stats.categories.length > 0 && (
                <section className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            {seccion === "actividad" ? "Horas por proyecto" : "Distribución de solicitudes"}
                        </h2>
                        <Button
                            size="small"
                            color="second"
                            onClick={() => setShowStats(!showStats)}
                        >
                            {showStats ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                    </div>
                    {showStats && (
                        <BentoGrid cols={1} className="p-0">
                            <BentoItem colSpan={1} className="border-0 shadow-none bg-transparent">
                                {statsLoading ? (
                                    <div className="h-60 flex items-center justify-center text-gray-400">
                                        Cargando estadísticas...
                                    </div>
                                ) : (
                                    <DynamicChart
                                        type={stats.tipo}
                                        categories={stats.categories}
                                        data={stats.series}
                                        height={250}
                                    />
                                )}
                            </BentoItem>
                        </BentoGrid>
                    )}
                </section>
            )}

            {/* ─── Resumen por proyecto (solo actividad) ────────────────────────── */}
            {seccion === "actividad" && resumenProyectos.length > 0 && (
                <section className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <List className="h-5 w-5" />
                            Resumen por proyecto
                        </h2>
                        <Button
                            size="small"
                            color="second"
                            onClick={() => setShowResumen(!showResumen)}
                        >
                            {showResumen ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                    </div>
                    {showResumen && (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="text-left py-2 px-3 font-medium">Proyecto</th>
                                        <th className="text-right py-2 px-3 font-medium">Horas totales</th>
                                        <th className="text-right py-2 px-3 font-medium">Tareas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resumenProyectos.map((row) => (
                                        <tr key={row.proyecto} className="border-b border-gray-100 dark:border-gray-800">
                                            <td className="py-2 px-3">{row.proyecto}</td>
                                            <td className="text-right py-2 px-3">{row.totalHoras.toFixed(2)}h</td>
                                            <td className="text-right py-2 px-3">{row.cantidadTareas}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm p-4">
                {/* ─── Formulario de filtros ─── */}
                <section className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Filter className="h-5 w-5 text-gray-500" />
                        <h3 className="font-medium">Filtros</h3>
                        <Button
                            size="small"
                            color="error"
                            onClick={limpiarFiltros}
                        >
                            Limpiar
                        </Button>
                    </div>
                    <MainForm
                        message_button="Filtrar"
                        iconButton={<RefreshCw className="mr-1 h-4 w-4" />}
                        actionType=""
                        onSuccess={handleFilterSubmit}
                        dataForm={
                            seccion === "actividad"
                                ? filtrosActividad(proyectosOptions)
                                : filtrosSolicitud as any
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
                                            tiempo_restante: (
                                                <CountdownTimer endDate={endDate} refrech={() => { }} />
                                            ),
                                        };
                                    }
                                    return row;
                                })}
                                loading={loading}
                                onRowClick={handleRowClick}
                                visibleColumns={
                                    seccion === "actividad"
                                        ? columnConfigActividad
                                        : columnConfigSolicitud
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

            {/* ─── Modales ─────────────────────────────────────────────────────────── */}

            {/* Modal de detalle de actividad */}
            <Modal modalName="detalle-actividad" title="Detalle de actividad" maxWidth="2xl">
                {selectedActividad && (
                    <DetallesActividad
                        data={selectedActividad}
                        onEdit={() => {
                            dispatch(closeModalReducer({ modalName: "detalle-actividad" }));
                            openEditModal(selectedActividad);
                        }}
                        onDelete={() => {
                            if (selectedActividad?.id) {
                                handleDelete(selectedActividad.id, TABLAS.actividad);
                                dispatch(closeModalReducer({ modalName: "detalle-actividad" }));
                            }
                        }}
                    />
                )}
            </Modal>

            {/* Modal de detalle de solicitud */}
            <Modal modalName="detalle-solicitud" title="Detalle de solicitud" maxWidth="2xl">
                {selectedSolicitud && <DetallesSolicitud data={selectedSolicitud} />}
            </Modal>

            {/* Modal para editar actividad */}
            <Modal modalName="form-actividad-editar" title="Editar actividad" maxWidth="2xl">
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

            {/* Modal para crear actividad */}
            <Modal modalName="form-actividad-crear" title="Registrar actividad" maxWidth="2xl">
                <MainForm
                    key="crear-actividad"
                    ref={formRegistroRef}
                    message_button="Guardar actividad"
                    iconButton={<CheckCircle className="mr-1 h-4 w-4" />}
                    actionType="post-general"
                    table={TABLAS.actividad}
                    onSuccess={handleRegistroSuccess}
                    dataForm={formConfigActividad(proyectosOptions, cargandoProyectos)}
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
                    aditionalData={
                        modalEditando
                            ? { id: itemAEditar?.id }
                            : { solicitante: "Usuario actual" }
                    }
                    valueAssign={modalEditando ? itemAEditar : undefined}
                    flexDirection="flex-col"
                />
            </Modal>

            {/* ─── Botones flotantes (solo iconos) ──────────────────────────────── */}

            {/* Botón para nueva actividad (sección actividad) */}
            {seccion === "actividad" && (
                <button
                    className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors z-40"
                    onClick={() => {
                        dispatch(openModalReducer({ modalName: "form-actividad-crear" }));
                    }}
                >
                    <Plus className="h-6 w-6" />
                </button>
            )}

            {/* Botón para nueva solicitud (sección solicitudes) */}
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