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
    RefreshCw,
    AlertCircle
} from "lucide-react"
import { closeModalReducer, openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersGeneralMutation, usePutGeneralMutation } from "@/hooks/reducers/api"
import { useEffect, useState, useCallback } from "react"
import { TablaPedidos } from "./components/table"
import { LoadingSection } from "@/template/loading-screen"
import { ModalChat } from "./components/modal-chat"
import { useForm } from "react-hook-form"
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
    fecha_cita?: string; // Nueva fecha de cita
    estado: 'nuevo' | 'proceso' | 'listo' | 'entregado' | 'cancelado';
    es_publica: number;
    items: ListaItem[];
    cliente?: Cliente; // Información del cliente desde JOIN
    nombre?: string;
    cliente_telefono?: string;
    cliente_email?: string;
    total: number;
    urgencia?: 'alta' | 'media' | 'baja'; // Nueva propiedad para urgencia
    tiempo_restante?: number; // Minutos restantes para la cita
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
    pedidos_urgentes: number; // Nueva propiedad
}

export default function GestionPedidos() {
    const [pedidos, setPedidos] = useState<any[]>([])
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null)
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

    const onSubmit = (data: any) => {
        const nuevosFiltros: Filtro[] = [];

        if (data.search) {
            nuevosFiltros.push({
                Key: "nombre_lista",
                Value: data.search,
                Operator: "contains"
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

    const dispatch = useAppDispatch();

    // Función para parsear array_lista y calcular total
    const parseListaData = (lista: any): Pedido => {
        let items: ListaItem[] = [];
        let total = 0;

        try {
            if (lista.array_lista) {
                items = JSON.parse(lista.array_lista);
                // Calcular total basado en los items
                total = items.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
            }
        } catch (error) {
            console.error('Error parsing array_lista:', error);
            items = [];
        }

        // Calcular urgencia basada en la fecha de cita
        const calcularUrgencia = (fechaCita: string): { urgencia: 'alta' | 'media' | 'baja', tiempo_restante: number } => {
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

        const { urgencia, tiempo_restante } = calcularUrgencia(lista.fecha_cita || lista.fecha_creacion);

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
            fecha_cita: lista.fecha_cita,
            estado: lista.estado,
            es_publica: lista.es_publica,
            items: items,
            cliente: lista ? {
                id: lista.id,
                nombre: lista.nombre,
                telefono: lista.telefono,
                email: lista.email,
                direccion: lista.direccion,
                ciudad: lista.ciudad,
                estado: lista.estado
            } : undefined,
            nombre: lista?.nombre || `Cliente ${lista.id_cliente}`,
            cliente_telefono: lista?.telefono || 'N/A',
            cliente_email: lista?.email || 'N/A',
            total: total,
            urgencia,
            tiempo_restante
        };
    }

    const fetchPedidos = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await getWithFilter({
                table: "listas as listas left join clientes as clientes on listas.id_cliente = clientes.id",
                pageSize: "10",
                page: currentPage,
                filtros: {
                    /* Filtros: activeFilters.Filtros, */
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
                        { key: "clientes.ciudad" }
                    ],
                    Order: [
                        // Ordenar por urgencia primero, luego por fecha de creación
                        { Key: "listas.fecha_creacion", Direction: "Desc" }
                    ]
                }
            }).unwrap();

            if (response && response.data) {
                setTotalPages(response.totalPages || 1);
                setTotalItems(response.totalItems || response.data.length);
                console.log(response.data);

                // Mapear y procesar los datos de las listas
                const pedidosProcesados: Pedido[] = response.data.map(parseListaData);

                // Ordenar por urgencia (alta primero)
                const pedidosOrdenados = pedidosProcesados.sort((a, b) => {
                    const prioridad = { 'alta': 3, 'media': 2, 'baja': 1 };
                    return (prioridad[b.urgencia || 'baja'] - prioridad[a.urgencia || 'baja']);
                });

                setPedidos(pedidosOrdenados);

                // Calcular estadísticas actualizadas
                const stats: EstadisticasPedidos = {
                    total_pedidos: response.totalItems || pedidosOrdenados.length,
                    pedidos_nuevos: pedidosOrdenados.filter((p: Pedido) => p.estado === 'nuevo').length,
                    pedidos_proceso: pedidosOrdenados.filter((p: Pedido) => p.estado === 'proceso').length,
                    pedidos_listos: pedidosOrdenados.filter((p: Pedido) => p.estado === 'listo').length,
                    pedidos_entregados: pedidosOrdenados.filter((p: Pedido) => p.estado === 'entregado').length,
                    pedidos_cancelados: pedidosOrdenados.filter((p: Pedido) => p.estado === 'cancelado').length,
                    total_pickup: pedidosOrdenados.filter((p: Pedido) => p.servicio === 'Pickup').length,
                    total_domicilio: pedidosOrdenados.filter((p: Pedido) => p.servicio === 'Domicilio').length,
                    promedio_tiempo_entrega: 45,
                    pedidos_urgentes: pedidosOrdenados.filter((p: Pedido) => p.urgencia === 'alta').length
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

    const handleOpenModal = (pedido: Pedido) => {
        setPedidoSeleccionado(pedido);
        dispatch(openModalReducer({ modalName: "detalle_pedido" }));
    }

    const [putGeneral] = usePutGeneralMutation();

    const handleActualizarEstado = async (pedidoId: number, nuevoEstado: string) => {
        try {
            console.log(`Actualizando lista ${pedidoId} a estado: ${nuevoEstado}`);

            // Actualizar el estado usando el endpoint putGeneral
            const response = await putGeneral({
                table: "listas", // Especificar la tabla
                id: pedidoId,    // ID de la lista a actualizar
                data: {          // Datos a actualizar
                    estado: nuevoEstado,
                    fecha_actualizacion: new Date().toISOString()
                }
            }).unwrap();

            console.log('Estado actualizado exitosamente:', response);

            // Actualizar el estado local inmediatamente (optimistic update)
            setPedidos(prev => prev.map(pedido =>
                pedido.id === pedidoId
                    ? {
                        ...pedido,
                        estado: nuevoEstado as any,
                        fecha_actualizacion: new Date().toISOString()
                    }
                    : pedido
            ));

            // Actualizar el pedido seleccionado si está abierto
            if (pedidoSeleccionado && pedidoSeleccionado.id === pedidoId) {
                setPedidoSeleccionado(prev => prev ? {
                    ...prev,
                    estado: nuevoEstado as any,
                    fecha_actualizacion: new Date().toISOString()
                } : null);
            }

            // Opcional: Mostrar mensaje de éxito
            // alert(`Estado actualizado a: ${nuevoEstado}`);

        } catch (error) {
            console.error("Error actualizando estado:", error);

            // Revertir el cambio en caso de error
            await fetchPedidos();

            // Mostrar mensaje de error
            alert('Error al actualizar el estado. Por favor, intenta nuevamente.');
        }
    };
    const handleToggleRecolectado = async (listaId: number, itemId: string, recolectado: boolean) => {
        try {
            // Obtener la lista actual
            const listaActual = pedidos.find(p => p.id === listaId);
            if (!listaActual) return;

            // Actualizar el array_lista con el nuevo estado de recolección
            const itemsActualizados = listaActual.items.map((item: any) =>
                item.id === itemId
                    ? { ...item, recolectado }
                    : item
            );

            // Convertir a JSON para guardar en array_lista
            const arrayListaActualizado = JSON.stringify(itemsActualizados);

            // Actualizar en la base de datos
            await putGeneral({
                table: "listas",
                id: listaId,
                data: {
                    array_lista: arrayListaActualizado,
                    fecha_actualizacion: new Date().toISOString()
                }
            }).unwrap();

            // Actualizar estado local
            setPedidos(prev => prev.map(pedido =>
                pedido.id === listaId
                    ? {
                        ...pedido,
                        items: itemsActualizados,
                        fecha_actualizacion: new Date().toISOString()
                    }
                    : pedido
            ));

            // Actualizar el pedido seleccionado si está abierto
            if (pedidoSeleccionado && pedidoSeleccionado.id === listaId) {
                setPedidoSeleccionado(prev => prev ? {
                    ...prev,
                    items: itemsActualizados,
                    fecha_actualizacion: new Date().toISOString()
                } : null);
            }

        } catch (error) {
            console.error('Error al actualizar estado de recolección:', error);
            alert('Error al actualizar el producto. Por favor, intenta nuevamente.');
        }
    };

    // Función para marcar todos los productos como recolectados
    const handleMarcarTodosRecolectados = async (listaId: number) => {
        try {
            const listaActual = pedidos.find(p => p.id === listaId);
            if (!listaActual) return;

            const itemsActualizados = listaActual.items.map((item: any) => ({
                ...item,
                recolectado: true
            }));

            const arrayListaActualizado = JSON.stringify(itemsActualizados);

            await putGeneral({
                table: "listas",
                id: listaId,
                data: {
                    array_lista: arrayListaActualizado,
                    fecha_actualizacion: new Date().toISOString()
                }
            }).unwrap();

            setPedidos(prev => prev.map(pedido =>
                pedido.id === listaId
                    ? {
                        ...pedido,
                        items: itemsActualizados,
                        fecha_actualizacion: new Date().toISOString()
                    }
                    : pedido
            ));

            if (pedidoSeleccionado && pedidoSeleccionado.id === listaId) {
                setPedidoSeleccionado(prev => prev ? {
                    ...prev,
                    items: itemsActualizados,
                    fecha_actualizacion: new Date().toISOString()
                } : null);
            }

            /* alert('Todos los productos marcados como recolectados.'); */

        } catch (error) {
            console.error('Error al marcar todos como recolectados:', error);
            alert('Error al actualizar los productos. Por favor, intenta nuevamente.');
        }
    };

    // Función para desmarcar todos los productos como recolectados
    const handleDesmarcarTodosRecolectados = async (listaId: number) => {
        try {
            const listaActual = pedidos.find(p => p.id === listaId);
            if (!listaActual) return;

            const itemsActualizados = listaActual.items.map((item: any) => ({
                ...item,
                recolectado: false
            }));

            const arrayListaActualizado = JSON.stringify(itemsActualizados);

            await putGeneral({
                table: "listas",
                id: listaId,
                data: {
                    array_lista: arrayListaActualizado,
                    fecha_actualizacion: new Date().toISOString()
                }
            }).unwrap();

            setPedidos(prev => prev.map(pedido =>
                pedido.id === listaId
                    ? {
                        ...pedido,
                        items: itemsActualizados,
                        fecha_actualizacion: new Date().toISOString()
                    }
                    : pedido
            ));

            if (pedidoSeleccionado && pedidoSeleccionado.id === listaId) {
                setPedidoSeleccionado(prev => prev ? {
                    ...prev,
                    items: itemsActualizados,
                    fecha_actualizacion: new Date().toISOString()
                } : null);
            }

            /* alert('Todos los productos desmarcados como recolectados.'); */

        } catch (error) {
            console.error('Error al desmarcar todos como recolectados:', error);
            alert('Error al actualizar los productos. Por favor, intenta nuevamente.');
        }
    };

    // Función auxiliar para mostrar estados
    const getEstadoDisplay = (estado: string) => {
        const estados: { [key: string]: string } = {
            'nuevo': 'Nuevo',
            'proceso': 'En Proceso',
            'listo': 'Listo',
            'entregado': 'Entregado',
            'cancelado': 'Cancelado'
        };
        return estados[estado] || estado;
    };

    const limpiarFiltros = () => {
        reset();
        setTipoFiltro('todos');
        setEstadoFiltro('todos');
        setActiveFilters(prev => ({ ...prev, Filtros: [] }));
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

    const getEstadoBadgeClass = (estado: string) => {
        switch (estado) {
            case 'entregado':
                return 'bg-green-100 text-green-800';
            case 'cancelado':
                return 'bg-red-100 text-red-800';
            case 'nuevo':
                return 'bg-yellow-100 text-yellow-800';
            case 'proceso':
                return 'bg-blue-100 text-blue-800';
            case 'listo':
                return 'bg-indigo-100 text-indigo-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('es-MX', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    };

    return (
        <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
            <header className="mb-8">
                <h1 className="flex items-center text-2xl font-bold md:text-3xl">
                    <Truck className="mr-2 h-8 w-8 text-blue-600" />
                    Gestión de Listas/Pedidos
                </h1>
                <p className="mt-2 text-gray-600">
                    Administra listas Pick-Up y entregas a domicilio
                </p>
            </header>

            {/* Estadísticas */}
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

            {/* Modales */}
            <ModalChat telefonoClient={'general'} />

            <Modal
                modalName="detalle_pedido"
                title={`Detalles de la Lista - ${pedidoSeleccionado?.nombre_lista || ''}`}
                maxWidth="4xl"
            >
                {pedidoSeleccionado && (
                    <div className="p-4 space-y-6">
                        {/* Header con información general y progreso */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg border-gray-300 border-b pb-2">Información General</h3>
                                <div>
                                    <strong>ID Lista:</strong> {pedidoSeleccionado.id}
                                </div>
                                <div>
                                    <strong>Cliente ID:</strong> {pedidoSeleccionado.id_cliente}
                                </div>
                                <div>
                                    <strong>Nombre:</strong> {pedidoSeleccionado.nombre_lista}
                                </div>
                                <div>
                                    <strong>Tipo:</strong> {pedidoSeleccionado.tipo_lista}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg border-gray-300 border-b pb-2">Estado y Servicio</h3>
                                <div className="flex items-center">
                                    <strong>Servicio:</strong>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs ${pedidoSeleccionado.servicio === 'Pickup'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {pedidoSeleccionado.servicio}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <strong>Estado:</strong>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs ${getEstadoBadgeClass(pedidoSeleccionado.estado)}`}>
                                        {pedidoSeleccionado.estado}
                                    </span>
                                </div>
                                <div>
                                    <strong>Total:</strong> ${pedidoSeleccionado.total.toFixed(2)}
                                </div>
                                <div>
                                    <strong>Creado:</strong> {formatDate(pedidoSeleccionado.fecha_creacion)}
                                </div>
                            </div>

                            {/* Progreso de recolección */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg border-gray-300 border-b pb-2">Progreso</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Productos recolectados:</span>
                                        <span className="font-medium">
                                            {pedidoSeleccionado.items.filter((item: any) => item.recolectado).length} / {pedidoSeleccionado.items.length}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${(pedidoSeleccionado.items.filter((item: any) => item.recolectado).length / pedidoSeleccionado.items.length) * 100}%`
                                            }}
                                        ></div>
                                    </div>

                                    {/* Botones de acción rápida */}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <button
                                            onClick={() => handleMarcarTodosRecolectados(pedidoSeleccionado.id)}
                                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        >
                                            Marcar todos
                                        </button>
                                        <button
                                            onClick={() => handleDesmarcarTodosRecolectados(pedidoSeleccionado.id)}
                                            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                        >
                                            Desmarcar todos
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lista de productos con checkboxes */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-lg">Productos en la Lista</h3>
                                <div className="text-sm text-gray-500">
                                    {pedidoSeleccionado.items.filter((item: any) => item.recolectado).length} de {pedidoSeleccionado.items.length} recolectados
                                </div>
                            </div>

                            <div className="border-gray-300 border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold w-10">✓</th>
                                            <th className="px-4 py-3 text-left font-semibold">Producto</th>
                                            <th className="px-4 py-3 text-left font-semibold">Categoría</th>
                                            <th className="px-4 py-3 text-center font-semibold">Cantidad</th>
                                            <th className="px-4 py-3 text-right font-semibold">Precio Unitario</th>
                                            <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedidoSeleccionado.items.map((item: any, index) => (
                                            <tr
                                                key={index}
                                                className={`border-gray-300 border-t transition-colors ${item.recolectado
                                                    ? 'bg-green-50 hover:bg-green-100'
                                                    : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.recolectado || false}
                                                        onChange={(e) => handleToggleRecolectado(
                                                            pedidoSeleccionado.id,
                                                            item.id,
                                                            e.target.checked
                                                        )}
                                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{item.nombre}</div>
                                                    <div className="text-xs text-gray-500">{item.unidad}</div>
                                                    {item.articulo && (
                                                        <div className="text-xs text-gray-400">SKU: {item.articulo}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs rounded ${item.categoria === 'REFRIGERADOS' ? 'bg-blue-100 text-blue-800' :
                                                        item.categoria === 'CONGELADOS' ? 'bg-purple-100 text-purple-800' :
                                                            item.categoria === 'SECOS' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {item.categoria}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-medium">{item.quantity}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">${item.precio.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right">${(item.precio * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        <tr className="border-gray-300 border-t bg-gray-50 font-semibold">
                                            <td colSpan={5} className="px-4 py-3 text-right">Total:</td>
                                            <td className="px-4 py-3 text-right">${pedidoSeleccionado.total.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Control de estado del pedido */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-3">Control del Pedido</h3>
                            <div className="flex flex-wrap gap-3 items-center justify-between">
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-sm text-gray-600">Cambiar estado:</span>
                                    {['nuevo', 'proceso', 'listo', 'entregado', 'cancelado'].map((estado) => (
                                        <button
                                            key={estado}
                                            onClick={() => handleActualizarEstado(pedidoSeleccionado.id, estado)}
                                            disabled={pedidoSeleccionado.estado === estado}
                                            className={`px-3 py-1 text-xs rounded transition-colors ${pedidoSeleccionado.estado === estado
                                                ? 'bg-blue-600 text-white cursor-default'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {getEstadoDisplay(estado)}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <div className={`w-2 h-2 rounded-full ${pedidoSeleccionado.items.every((item: any) => item.recolectado)
                                        ? 'bg-green-500'
                                        : 'bg-yellow-500'
                                        }`}></div>
                                    <span className="text-gray-600">
                                        {pedidoSeleccionado.items.every((item: any) => item.recolectado)
                                            ? 'Todos los productos recolectados'
                                            : 'Productos pendientes por recolectar'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Acciones finales */}
                        <div className="flex justify-between items-center pt-4 border-gray-300 border-t">
                            <div className="text-sm text-gray-500">
                                Última actualización: {formatDate(pedidoSeleccionado.fecha_actualizacion)}
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => dispatch(closeModalReducer({ modalName: "detalle_pedido" }))}
                                    className="px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cerrar
                                </button>

                                {pedidoSeleccionado.items.every((item: any) => item.recolectado) && (
                                    <button
                                        onClick={() => handleActualizarEstado(pedidoSeleccionado.id, 'listo')}
                                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        Marcar como Listo
                                    </button>
                                )}

                                <button
                                    onClick={() => handleActualizarEstado(pedidoSeleccionado.id, 'proceso')}
                                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                    Imprimir Lista
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </main>
    )
}