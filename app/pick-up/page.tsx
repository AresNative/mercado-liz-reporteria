"use client"
import 'jspdf-autotable';
import {
    Filter,
    MessageCircle,
    Search,
    Truck,
    Package,
    Clock,
    Home,
    Store,
    RefreshCw,
    AlertCircle
} from "lucide-react"
import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersGeneralMutation, usePutGeneralMutation } from "@/hooks/reducers/api"
import { useEffect, useState, useCallback } from "react"
import { TablaPedidos } from "./components/table"
import { LoadingSection } from "@/template/loading-screen"
import { ModalChat } from "./components/modal-chat"
import { useForm } from "react-hook-form"
import Pagination from "@/components/pagination"
import { BentoGrid, BentoItem } from "@/components/bento-grid"
import { usePedidosSignalR } from './utils/singalr-pedidos';
import { ModalList } from './components/modal-list';

type Filtro = { Key: string; Value: any; Operator: string };
type ActiveFilters = {
    Filtros: Filtro[];
    Selects: any[];
    OrderBy: any | null;
    sum: boolean;
    distinct: boolean;
};

interface ListaItem {
    id: string;
    articulo: string;
    categoria: string;
    nombre: string;
    precio: number;
    precioRegular: number;
    unidad: string;
    cantidad: number;
    factor: number;
    quantity: number;
    recolectado?: boolean;
    noEncontrado?: boolean;
}

interface Cliente {
    id: number;
    nombre: string;
    telefono: string;
    email: string;
    direccion?: string;
    ciudad?: string;
    estado?: string;
}

interface Pedido {
    id: number;
    id_lista: number;
    id_cliente: number;
    usuario_id: number;
    sucursal_id: number;
    nombre_lista: string;
    tipo_lista: string;
    servicio: string;
    array_lista: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
    estado: 'nuevo' | 'proceso' | 'listo' | 'entregado' | 'cancelado' | 'incompleto';
    es_publica: number;
    items: ListaItem[];
    cliente?: Cliente;
    nombre?: string;
    cliente_telefono?: string;
    cliente_email?: string;
    total: number;
    urgencia?: 'alta' | 'media' | 'baja';
    tiempo_restante?: number;
}

interface EstadisticasPedidos {
    total_pedidos: number;
    pedidos_nuevos: number;
    pedidos_proceso: number;
    pedidos_listos: number;
    pedidos_entregados: number;
    pedidos_cancelados: number;
    total_pickup: number;
    total_domicilio: number;
    promedio_tiempo_entrega: number;
    pedidos_urgentes: number;
}

export default function GestionPedidos() {
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState<number | null>(null)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [getWithFilter] = useGetWithFiltersGeneralMutation();
    const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'pickup' | 'domicilio'>('todos');
    const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [],
        Selects: [],
        OrderBy: null,
        sum: false,
        distinct: false
    });

    const [estadisticas, setEstadisticas] = useState<EstadisticasPedidos>({
        total_pedidos: 0,
        pedidos_nuevos: 0,
        pedidos_proceso: 0,
        pedidos_listos: 0,
        pedidos_entregados: 0,
        pedidos_cancelados: 0,
        total_pickup: 0,
        total_domicilio: 0,
        promedio_tiempo_entrega: 0,
        pedidos_urgentes: 0
    });

    const { handleSubmit, register, reset } = useForm();
    const dispatch = useAppDispatch();

    // Función para parsear array_lista y calcular total
    const parseListaData = (lista: any): Pedido => {
        let items: ListaItem[] = [];
        let total = 0;

        try {
            if (lista.array_lista) {
                items = JSON.parse(lista.array_lista);
                total = items.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
            }
        } catch (error) {
            console.error('Error parsing array_lista:', error);
            items = [];
        }

        const calcularUrgencia = (fechaCita: string, estado: string): { urgencia: 'alta' | 'media' | 'baja', tiempo_restante: number } => {
            if (estado !== 'nuevo' && estado !== 'proceso') {
                return { urgencia: 'baja', tiempo_restante: 0 };
            }

            if (!fechaCita) return { urgencia: 'baja', tiempo_restante: 0 };

            const ahora = new Date();
            const cita = new Date(fechaCita);
            const diferenciaMs = cita.getTime() - ahora.getTime();
            const minutosRestantes = Math.floor(diferenciaMs / (1000 * 60));

            let urgencia: 'alta' | 'media' | 'baja' = 'baja';
            if (minutosRestantes <= 30) urgencia = 'alta';
            else if (minutosRestantes <= 120) urgencia = 'media';

            return { urgencia, tiempo_restante: minutosRestantes };
        };

        const { urgencia, tiempo_restante } = calcularUrgencia(lista.nombre_lista, lista.estado);

        return {
            id: lista.id,
            id_lista: lista.id,
            id_cliente: lista.id_cliente,
            usuario_id: lista.usuario_id,
            sucursal_id: lista.sucursal_id,
            nombre_lista: lista.nombre_lista,
            tipo_lista: lista.tipo_lista,
            servicio: lista.servicio,
            array_lista: lista.array_lista,
            fecha_creacion: lista.fecha_creacion,
            fecha_actualizacion: lista.fecha_actualizacion,
            estado: lista.estado,
            es_publica: lista.es_publica,
            items: items,
            cliente: lista.nombre ? {
                id: lista.id_cliente,
                nombre: lista.nombre,
                telefono: lista.telefono,
                email: lista.email,
                direccion: lista.direccion,
                ciudad: lista.ciudad,
                estado: lista.estado
            } : undefined,
            nombre: lista.nombre || `Cliente ${lista.id_cliente}`,
            cliente_telefono: lista.telefono || 'N/A',
            cliente_email: lista.email || 'N/A',
            total: total,
            urgencia,
            tiempo_restante
        };
    }

    const fetchPedidos = useCallback(async () => {
        setIsLoading(true);
        try {
            const filtros: any = {
                Selects: [
                    { key: "listas.id" },
                    { key: "listas.id_cliente" },
                    { key: "listas.nombre_lista" },
                    { key: "listas.tipo_lista" },
                    { key: "listas.servicio" },
                    { key: "listas.array_lista" },
                    { key: "listas.fecha_creacion" },
                    { key: "listas.fecha_actualizacion" },
                    { key: "listas.estado" },
                    { key: "clientes.nombre" },
                    { key: "clientes.telefono" },
                    { key: "clientes.email" },
                    { key: "clientes.direccion" },
                ],
                Order: [
                    { Key: "listas.fecha_creacion", Direction: "Desc" }
                ]
            };

            if (activeFilters.Filtros.length > 0) {
                filtros.Filtros = activeFilters.Filtros;
            }

            const response = await getWithFilter({
                table: "listas left join clientes on listas.id_cliente = clientes.id",
                pageSize: 10,
                page: currentPage,
                tag: 'Pedidos',
                filtros: filtros
            }).unwrap();

            if (response && response.data) {
                setTotalPages(response.TotalPages || 1);
                setTotalItems(response.TotalRecords || response.data.length);

                const pedidosProcesados: Pedido[] = response.data.map(parseListaData);

                const pedidosOrdenados = pedidosProcesados.sort((a, b) => {
                    const prioridadEstado = { 'nuevo': 3, 'proceso': 2, 'listo': 1, 'entregado': 0, 'cancelado': 0, 'incompleto': 0 };
                    const prioridadEstadoA = prioridadEstado[a.estado] || 0;
                    const prioridadEstadoB = prioridadEstado[b.estado] || 0;

                    if (prioridadEstadoA !== prioridadEstadoB) {
                        return prioridadEstadoB - prioridadEstadoA;
                    }

                    if (a.estado === 'nuevo' || a.estado === 'proceso') {
                        const prioridadUrgencia = { 'alta': 3, 'media': 2, 'baja': 1 };
                        return (prioridadUrgencia[b.urgencia || 'baja'] - prioridadUrgencia[a.urgencia || 'baja']);
                    }

                    return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
                });

                setPedidos(pedidosOrdenados);

                // Calcular estadísticas
                const stats: EstadisticasPedidos = {
                    total_pedidos: response.TotalRecords || pedidosOrdenados.length,
                    pedidos_nuevos: pedidosOrdenados.filter(p => p.estado === 'nuevo').length,
                    pedidos_proceso: pedidosOrdenados.filter(p => p.estado === 'proceso').length,
                    pedidos_listos: pedidosOrdenados.filter(p => p.estado === 'listo').length,
                    pedidos_entregados: pedidosOrdenados.filter(p => p.estado === 'entregado').length,
                    pedidos_cancelados: pedidosOrdenados.filter(p => p.estado === 'cancelado').length,
                    total_pickup: pedidosOrdenados.filter(p => p.servicio === 'Pickup').length,
                    total_domicilio: pedidosOrdenados.filter(p => p.servicio === 'Domicilio').length,
                    promedio_tiempo_entrega: 45,
                    pedidos_urgentes: pedidosOrdenados.filter(p =>
                        (p.estado === 'nuevo' || p.estado === 'proceso') && p.urgencia === 'alta'
                    ).length
                };
                setEstadisticas(stats);
            }
        } catch (error) {
            console.error("Error fetching pedidos:", error);
            setPedidos([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activeFilters, getWithFilter]);

    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    // ✅ Función para calcular estadísticas
    const calcularEstadisticas = useCallback((listaPedidos: Pedido[]) => {
        const stats: EstadisticasPedidos = {
            total_pedidos: listaPedidos.length,
            pedidos_nuevos: listaPedidos.filter(p => p.estado === 'nuevo').length,
            pedidos_proceso: listaPedidos.filter(p => p.estado === 'proceso').length,
            pedidos_listos: listaPedidos.filter(p => p.estado === 'listo').length,
            pedidos_entregados: listaPedidos.filter(p => p.estado === 'entregado').length,
            pedidos_cancelados: listaPedidos.filter(p => p.estado === 'cancelado').length,
            total_pickup: listaPedidos.filter(p => p.servicio === 'Pickup').length,
            total_domicilio: listaPedidos.filter(p => p.servicio === 'Domicilio').length,
            promedio_tiempo_entrega: 45,
            pedidos_urgentes: listaPedidos.filter(p =>
                (p.estado === 'nuevo' || p.estado === 'proceso') && p.urgencia === 'alta'
            ).length
        };
        setEstadisticas(stats);
    }, []);

    // ✅ HANDLERS CORREGIDOS PARA SIGNALR - SIN DUPLICACIÓN
    const handlePedidoActualizado = useCallback((pedidoActualizado: any) => {
        console.log('🔄 Pedido actualizado desde hub:', pedidoActualizado);

        setPedidos(prev => {
            const pedidoProcesado = parseListaData(pedidoActualizado);
            const existeIndex = prev.findIndex(p => p.id === pedidoProcesado.id);

            if (existeIndex >= 0) {
                const nuevosPedidos = [...prev];
                nuevosPedidos[existeIndex] = pedidoProcesado;
                calcularEstadisticas(nuevosPedidos);
                return nuevosPedidos;
            } else {
                const nuevosPedidos = [pedidoProcesado, ...prev];
                calcularEstadisticas(nuevosPedidos);
                return nuevosPedidos;
            }
        });
    }, [calcularEstadisticas]);

    const handleNuevoPedido = useCallback((nuevoPedido: any) => {
        console.log('🆕 Nuevo pedido desde hub:', nuevoPedido);
        const pedidoProcesado = parseListaData(nuevoPedido);

        setPedidos(prev => {
            const existe = prev.some(p => p.id === pedidoProcesado.id);
            if (!existe) {
                const nuevosPedidos = [pedidoProcesado, ...prev];
                calcularEstadisticas(nuevosPedidos);
                return nuevosPedidos;
            }
            return prev;
        });
    }, [calcularEstadisticas]);

    const handlePedidoEliminado = useCallback((pedidoId: number) => {
        console.log('🗑️ Pedido eliminado recibido:', pedidoId);

        setPedidos(prev => {
            const nuevosPedidos = prev.filter(pedido => pedido.id !== pedidoId);
            calcularEstadisticas(nuevosPedidos);
            return nuevosPedidos;
        });

        if (pedidoSeleccionadoId === pedidoId) {
            setPedidoSeleccionadoId(null);
        }
    }, [pedidoSeleccionadoId, calcularEstadisticas]);

    const handleRefrescarDatos = useCallback(() => {
        console.log('🔄 Refrescando datos por solicitud de sincronización');
        fetchPedidos();
    }, [fetchPedidos]);

    // ✅ SOLO UNA CONEXIÓN SIGNALR - en el componente principal
    const { isConnected } = usePedidosSignalR(
        handlePedidoActualizado,
        handleNuevoPedido,
        handlePedidoEliminado,
        handleRefrescarDatos
    );

    const handleOpenModal = (pedido: Pedido) => {
        setPedidoSeleccionadoId(pedido.id);
        dispatch(openModalReducer({ modalName: "detalle_pedido" }));
    }

    const [putGeneral] = usePutGeneralMutation();

    // ✅ Función para manejar actualizaciones de estado desde el modal
    const handleEstadoActualizadoDesdeModal = useCallback(async (pedidoId: number, nuevoEstado: string) => {
        try {
            await putGeneral({
                table: "listas",
                id: pedidoId,
                data: {
                    estado: nuevoEstado,
                    fecha_actualizacion: new Date().toISOString()
                }
            }).unwrap();

            // Actualizar localmente
            setPedidos(prev => prev.map(pedido =>
                pedido.id === pedidoId
                    ? {
                        ...pedido,
                        estado: nuevoEstado as any,
                        fecha_actualizacion: new Date().toISOString()
                    }
                    : pedido
            ));

        } catch (error) {
            console.error("Error actualizando estado desde modal:", error);
            await fetchPedidos();
        }
    }, [putGeneral, fetchPedidos]);

    const limpiarFiltros = () => {
        reset();
        setTipoFiltro('todos');
        setEstadoFiltro('todos');
        setActiveFilters(prev => ({ ...prev, Filtros: [] }));
        setCurrentPage(1);
    }

    const onSubmit = (data: any) => {
        const nuevosFiltros: Filtro[] = [];

        if (data.search) {
            nuevosFiltros.push({
                Key: "clientes.nombre",
                Value: data.search,
                Operator: "like"
            });
        }

        if (tipoFiltro !== 'todos') {
            nuevosFiltros.push({
                Key: "servicio",
                Value: tipoFiltro === 'pickup' ? 'Pickup' : 'Domicilio',
                Operator: "="
            });
        }

        if (estadoFiltro !== 'todos') {
            nuevosFiltros.push({
                Key: "estado",
                Value: estadoFiltro,
                Operator: "="
            });
        }

        setActiveFilters(prev => ({
            ...prev,
            Filtros: nuevosFiltros
        }));
        setCurrentPage(1);
    }

    const EstadisticasPedidosComponent = ({ stats }: { stats: EstadisticasPedidos }) => (
        <BentoGrid cols={5} className="mb-6">
            <BentoItem
                title="Total Listas"
                description="Todas las listas"
                className="bg-blue-50 border-blue-200"
                icon={<Package className="h-6 w-6 text-blue-600" />}
            >
                <div className="text-2xl font-bold text-blue-600">{stats.total_pedidos}</div>
            </BentoItem>

            <BentoItem
                title="Pick-Up"
                description="Para recoger"
                className="bg-green-50 border-green-200"
                icon={<Store className="h-6 w-6 text-green-600" />}
            >
                <div className="text-2xl font-bold text-green-600">{stats.total_pickup}</div>
            </BentoItem>

            <BentoItem
                title="Domicilio"
                description="Para entregar"
                className="bg-purple-50 border-purple-200"
                icon={<Home className="h-6 w-6 text-purple-600" />}
            >
                <div className="text-2xl font-bold text-purple-600">{stats.total_domicilio}</div>
            </BentoItem>

            <BentoItem
                title="Urgentes"
                description="Por atender"
                className="bg-red-50 border-red-200"
                icon={<Clock className="h-6 w-6 text-red-600" />}
            >
                <div className="text-2xl font-bold text-red-600">{stats.pedidos_urgentes || 0}</div>
            </BentoItem>

            <BentoItem
                title="Nuevos"
                description="Por procesar"
                className="bg-orange-50 border-orange-200"
                icon={<AlertCircle className="h-6 w-6 text-orange-600" />}
            >
                <div className="text-2xl font-bold text-orange-600">{stats.pedidos_nuevos}</div>
            </BentoItem>
        </BentoGrid>
    );

    return (
        <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
            <header className="mb-8">
                <h1 className="flex items-center text-2xl font-bold md:text-3xl">
                    <Truck className="mr-2 h-8 w-8 text-blue-600" />
                    Gestión de Pedidos
                    {isConnected && (
                        <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            {isConnected ? '🟢  En tiempo real' : '🔴 Sin conexion'}
                        </span>
                    )}
                </h1>
                <p className="mt-2 text-gray-600">
                    Administra listas Pick-Up y entregas a domicilio
                </p>
            </header>

            <EstadisticasPedidosComponent stats={estadisticas} />

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <article className="p-4">
                    <header className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div>
                            <h2 className="text-lg font-semibold">Todas las Listas</h2>
                            <p className="text-sm text-gray-500">
                                Mostrando {pedidos.length} de {totalItems} listas
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-center gap-3">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        {...register("search")}
                                        placeholder="Buscar por nombre de lista..."
                                        className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <select
                                    value={tipoFiltro}
                                    onChange={(e) => setTipoFiltro(e.target.value as any)}
                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="todos">Todos los servicios</option>
                                    <option value="pickup">Solo Pick-Up</option>
                                    <option value="domicilio">Solo Domicilio</option>
                                </select>

                                <select
                                    value={estadoFiltro}
                                    onChange={(e) => setEstadoFiltro(e.target.value)}
                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="todos">Todos los estados</option>
                                    <option value="nuevo">Nuevo</option>
                                    <option value="proceso">En proceso</option>
                                    <option value="listo">Listo</option>
                                    <option value="entregado">Entregado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>

                                <button
                                    type="submit"
                                    className="flex items-center rounded-md px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                    <Filter className="mr-1 h-4 w-4" />
                                    Filtrar
                                </button>

                                <button
                                    type="button"
                                    onClick={limpiarFiltros}
                                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                                >
                                    Limpiar
                                </button>

                                <button
                                    type="button"
                                    onClick={fetchPedidos}
                                    className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                                    title="Actualizar"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                            </form>

                            <button
                                onClick={() => dispatch(openModalReducer({ modalName: 'chat_general' }))}
                                className="flex items-center bg-purple-500 text-white text-sm px-3 py-2 rounded-md cursor-pointer hover:bg-purple-600 transition-colors"
                                title="Chat general"
                            >
                                <MessageCircle className="h-4 w-4" />
                            </button>
                        </div>
                    </header>

                    <section className="overflow-x-auto">
                        {isLoading ? (
                            <LoadingSection message="Cargando listas..." />
                        ) : pedidos.length > 0 ? (
                            <>
                                <TablaPedidos
                                    data={pedidos}
                                    onViewDetails={handleOpenModal}
                                    onUpdateStatus={handleEstadoActualizadoDesdeModal}
                                />
                                <div className="p-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        loading={isLoading}
                                        setCurrentPage={setCurrentPage}
                                        totalPages={totalPages}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="p-8 text-center">
                                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">No se encontraron listas con los filtros aplicados.</p>
                                <button
                                    onClick={limpiarFiltros}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                >
                                    Ver todas las listas
                                </button>
                            </div>
                        )}
                    </section>
                </article>
            </div>

            <ModalChat telefonoClient={'general'} />

            {pedidoSeleccionadoId && (
                <ModalList
                    pedidoId={pedidoSeleccionadoId}
                    onEstadoActualizado={handleEstadoActualizadoDesdeModal}
                />
            )}
        </main>
    )
}