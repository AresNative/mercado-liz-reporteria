"use client"

import {
    Filter,
    MessageCircle,
    Search,
    Truck,
    Package,
    Clock,
    CheckCircle,
    XCircle,
    MapPin,
    Home,
    Store,
    RefreshCw
} from "lucide-react"
import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersGeneralMutation } from "@/hooks/reducers/api"
import { useEffect, useState, useCallback } from "react"
import { TablaPedidos } from "./components/table"
import { LoadingSection } from "@/template/loading-screen"
import { ModalChat } from "./components/modal-chat"
import { useForm } from "react-hook-form"
import ModalPedidos from "./components/modal"
import Pagination from "@/components/pagination"
import { BentoGrid, BentoItem } from "@/components/bento-grid"
import { Modal } from "@/components/modal"

type Filtro = { Key: string; Value: any; Operator: string };
type ActiveFilters = {
    Filtros: Filtro[];
    Selects: any[];
    OrderBy: any | null;
    sum: boolean;
    distinct: boolean;
};

interface Pedido {
    id: number;
    numero_pedido: string;
    cliente_id: number;
    cliente_nombre: string;
    cliente_telefono: string;
    cliente_email: string;
    tipo_entrega: 'pickup' | 'domicilio';
    estado: 'pendiente' | 'preparando' | 'listo' | 'en_camino' | 'entregado' | 'cancelado';
    fecha_creacion: string;
    fecha_entrega_estimada: string;
    total: number;
    direccion_entrega?: string;
    sucursal_recoger?: string;
    repartidor_id?: number;
    repartidor_nombre?: string;
    items: PedidoItem[];
}

interface PedidoItem {
    id: number;
    producto_id: number;
    producto_nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

interface EstadisticasPedidos {
    total_pedidos: number;
    pedidos_pendientes: number;
    pedidos_preparando: number;
    pedidos_listos: number;
    pedidos_en_camino: number;
    pedidos_entregados: number;
    pedidos_cancelados: number;
    total_pickup: number;
    total_domicilio: number;
    promedio_tiempo_entrega: number;
}

export default function GestionPedidos() {
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
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
        pedidos_pendientes: 0,
        pedidos_preparando: 0,
        pedidos_listos: 0,
        pedidos_en_camino: 0,
        pedidos_entregados: 0,
        pedidos_cancelados: 0,
        total_pickup: 0,
        total_domicilio: 0,
        promedio_tiempo_entrega: 0
    });

    const { handleSubmit, register, reset } = useForm();

    const onSubmit = (data: any) => {
        const nuevosFiltros: Filtro[] = [];

        if (data.search) {
            nuevosFiltros.push(
                { Key: "numero_pedido", Value: data.search, Operator: "contains" },
                { Key: "cliente_nombre", Value: data.search, Operator: "contains" }
            );
        }

        if (tipoFiltro !== 'todos') {
            nuevosFiltros.push({ Key: "tipo_entrega", Value: tipoFiltro, Operator: "=" });
        }

        if (estadoFiltro !== 'todos') {
            nuevosFiltros.push({ Key: "estado", Value: estadoFiltro, Operator: "=" });
        }

        setActiveFilters(prev => ({
            ...prev,
            Filtros: nuevosFiltros
        }));
        setCurrentPage(1);
    }

    const dispatch = useAppDispatch();

    const fetchPedidos = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: Pedidos } = await getWithFilter({
                table: "listas",
                pageSize: "10",
                page: currentPage,
                filtros: {
                    Filtros: activeFilters.Filtros,
                    Selects: activeFilters.Selects,
                    Order: activeFilters.OrderBy ? [activeFilters.OrderBy] : []
                }
            });

            if (Pedidos) {
                setTotalPages(Pedidos.totalPages);
                setPedidos(Pedidos.data);

                // Calcular estadísticas
                const stats: EstadisticasPedidos = {
                    total_pedidos: Pedidos.data.length,
                    pedidos_pendientes: Pedidos.data.filter((p: Pedido) => p.estado === 'pendiente').length,
                    pedidos_preparando: Pedidos.data.filter((p: Pedido) => p.estado === 'preparando').length,
                    pedidos_listos: Pedidos.data.filter((p: Pedido) => p.estado === 'listo').length,
                    pedidos_en_camino: Pedidos.data.filter((p: Pedido) => p.estado === 'en_camino').length,
                    pedidos_entregados: Pedidos.data.filter((p: Pedido) => p.estado === 'entregado').length,
                    pedidos_cancelados: Pedidos.data.filter((p: Pedido) => p.estado === 'cancelado').length,
                    total_pickup: Pedidos.data.filter((p: Pedido) => p.tipo_entrega === 'pickup').length,
                    total_domicilio: Pedidos.data.filter((p: Pedido) => p.tipo_entrega === 'domicilio').length,
                    promedio_tiempo_entrega: 45 // Minutos (ejemplo)
                };
                setEstadisticas(stats);
            }
        } catch (error) {
            console.error("Error fetching pedidos:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activeFilters, getWithFilter]);

    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    const handleOpenModal = (pedido: Pedido) => {
        setPedidoSeleccionado(pedido);
        dispatch(openModalReducer({ modalName: "detalle_pedido" }));
    }

    const handleActualizarEstado = async (pedidoId: number, nuevoEstado: string) => {
        try {
            // Lógica para actualizar el estado del pedido
            console.log(`Actualizando pedido ${pedidoId} a estado: ${nuevoEstado}`);
            await fetchPedidos(); // Recargar datos
        } catch (error) {
            console.error("Error actualizando estado:", error);
        }
    }

    const limpiarFiltros = () => {
        reset();
        setTipoFiltro('todos');
        setEstadoFiltro('todos');
        setActiveFilters(prev => ({ ...prev, Filtros: [] }));
        setCurrentPage(1);
    }

    const EstadisticasPedidosComponent = ({ stats }: { stats: EstadisticasPedidos }) => (
        <BentoGrid cols={4} className="mb-6">
            <BentoItem
                title="Total Pedidos"
                description="Hoy"
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
                title="Tiempo Promedio"
                description="Minutos"
                className="bg-orange-50 border-orange-200"
                icon={<Clock className="h-6 w-6 text-orange-600" />}
            >
                <div className="text-2xl font-bold text-orange-600">{stats.promedio_tiempo_entrega}</div>
            </BentoItem>
        </BentoGrid>
    );

    return (
        <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
            <header className="mb-8">
                <h1 className="flex items-center text-2xl font-bold md:text-3xl">
                    <Truck className="mr-2 h-8 w-8 text-blue-600" />
                    Gestión de Pedidos
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-100">
                    Administra pedidos Pick-Up y entregas a domicilio
                </p>
            </header>

            {/* Estadísticas */}
            <EstadisticasPedidosComponent stats={estadisticas} />

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <article className="p-4">
                    <header className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div>
                            <h2 className="text-lg font-semibold">Todos los Pedidos</h2>
                            <p className="text-sm text-gray-500">
                                Mostrando {pedidos.length} de {estadisticas.total_pedidos} pedidos
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-center gap-3">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        {...register("search")}
                                        placeholder="Buscar pedido o cliente..."
                                        className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <select
                                    value={tipoFiltro}
                                    onChange={(e) => setTipoFiltro(e.target.value as any)}
                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="todos">Todos los tipos</option>
                                    <option value="pickup">Solo Pick-Up</option>
                                    <option value="domicilio">Solo Domicilio</option>
                                </select>

                                <select
                                    value={estadoFiltro}
                                    onChange={(e) => setEstadoFiltro(e.target.value)}
                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="todos">Todos los estados</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="preparando">Preparando</option>
                                    <option value="listo">Listo</option>
                                    <option value="en_camino">En camino</option>
                                    <option value="entregado">Entregado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>

                                <button type="submit" className="flex items-center rounded-md px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                    <Filter className="mr-1 h-4 w-4" />
                                    Filtrar
                                </button>

                                <button
                                    onClick={limpiarFiltros}
                                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                                >
                                    Limpiar
                                </button>

                                <button
                                    onClick={fetchPedidos}
                                    className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
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
                            <LoadingSection message="Cargando pedidos..." />
                        ) : pedidos.length > 0 ? (
                            <>
                                <TablaPedidos
                                    data={pedidos}
                                    onViewDetails={handleOpenModal}
                                    onUpdateStatus={handleActualizarEstado}
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
                                <p className="text-gray-500 mb-4">No se encontraron pedidos con los filtros aplicados.</p>
                                <button
                                    onClick={limpiarFiltros}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                >
                                    Ver todos los pedidos
                                </button>
                            </div>
                        )}
                    </section>
                </article>
            </div>

            {/* Modales */}
            <ModalChat telefonoClient={'general'} />

            <Modal
                modalName="detalle_pedido"
                title="Detalles del Pedido"
                maxWidth="2xl"
            >
                {pedidoSeleccionado && (
                    <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="font-semibold mb-2">Información del Cliente</h3>
                                <p><strong>Nombre:</strong> {pedidoSeleccionado.cliente_nombre}</p>
                                <p><strong>Teléfono:</strong> {pedidoSeleccionado.cliente_telefono}</p>
                                <p><strong>Email:</strong> {pedidoSeleccionado.cliente_email}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Información del Pedido</h3>
                                <p><strong>Número:</strong> {pedidoSeleccionado.numero_pedido}</p>
                                <p><strong>Tipo:</strong>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs ${pedidoSeleccionado.tipo_entrega === 'pickup'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {pedidoSeleccionado.tipo_entrega === 'pickup' ? 'Pick-Up' : 'Domicilio'}
                                    </span>
                                </p>
                                <p><strong>Estado:</strong>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs ${pedidoSeleccionado.estado === 'entregado' ? 'bg-green-100 text-green-800' :
                                        pedidoSeleccionado.estado === 'cancelado' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {pedidoSeleccionado.estado}
                                    </span>
                                </p>
                                <p><strong>Total:</strong> ${pedidoSeleccionado.total.toFixed(2)}</p>
                            </div>
                        </div>

                        {pedidoSeleccionado.tipo_entrega === 'domicilio' && pedidoSeleccionado.direccion_entrega && (
                            <div className="mb-6">
                                <h3 className="font-semibold mb-2 flex items-center">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Dirección de Entrega
                                </h3>
                                <p className="text-gray-700">{pedidoSeleccionado.direccion_entrega}</p>
                            </div>
                        )}

                        {pedidoSeleccionado.tipo_entrega === 'pickup' && pedidoSeleccionado.sucursal_recoger && (
                            <div className="mb-6">
                                <h3 className="font-semibold mb-2 flex items-center">
                                    <Store className="h-4 w-4 mr-2" />
                                    Sucursal de Recogida
                                </h3>
                                <p className="text-gray-700">{pedidoSeleccionado.sucursal_recoger}</p>
                            </div>
                        )}

                        <div className="mb-6">
                            <h3 className="font-semibold mb-2">Items del Pedido</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left">Producto</th>
                                            <th className="px-4 py-2 text-center">Cantidad</th>
                                            <th className="px-4 py-2 text-right">Precio Unitario</th>
                                            <th className="px-4 py-2 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedidoSeleccionado.items.map((item, index) => (
                                            <tr key={index} className="border-t">
                                                <td className="px-4 py-2">{item.producto_nombre}</td>
                                                <td className="px-4 py-2 text-center">{item.cantidad}</td>
                                                <td className="px-4 py-2 text-right">${item.precio_unitario.toFixed(2)}</td>
                                                <td className="px-4 py-2 text-right">${item.subtotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button className="px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200">
                                Cerrar
                            </button>
                            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                Imprimir Comprobante
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </main>
    )
}