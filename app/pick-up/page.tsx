"use client"
import 'jspdf-autotable';
import {
    Filter,
    Search,
    Truck,
    Package,
    Clock,
    RefreshCw,
    AlertCircle,
    Copy,
    Edit,
    FileText,
    Printer,
    Eye,
    Image,
    ImageDown,
    MessageCircle,
} from "lucide-react"
import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersMutation, usePutGeneralMutation } from "@/hooks/api/api"
import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { LoadingSection } from "@/template/loading-screen"
import Pagination from "@/components/pagination"
import { usePedidosSignalR } from './utils/singalr-pedidos';
import { ModalList } from './components/modal-list';
import Header from '@/template/header';
import Footer from '@/template/footer';
import { ModalChat } from './components/modal-chat';
import DynamicTable from "@/components/table";
import MainForm from "@/components/form/main-form";
import { Modal } from "@/components/modal";
import { Button } from "@/components/button";
import { formatValue } from "@/utils/constants/format-values";
import { CountdownTimer } from '@/components/counter-down';

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
    fecha_entrega: string;
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

export default function GestionPedidos() {
    const [pedidos, setPedidos] = useState<Pedido[]>([])
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false); // refresco silencioso (SignalR / countdown)
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersMutation();
    const [putGeneral] = usePutGeneralMutation();

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [{ Key: "listas.estado", Operator: "<>", Value: "cancelado" }],
        Selects: [],
        OrderBy: null,
        sum: false,
        distinct: false
    });

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

        const { urgencia, tiempo_restante } = calcularUrgencia(lista.fecha_entrega, lista.estado);

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
            fecha_entrega: lista.fecha_entrega,
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

    // Formatear pedido para DynamicTable
    const formatPedidoForTable = (pedido: Pedido) => {
        const getEstadoBadge = (estado: string) => {
            const colors: Record<string, string> = {
                nuevo: 'bg-blue-100 text-blue-800',
                proceso: 'bg-yellow-100 text-yellow-800',
                listo: 'bg-green-100 text-green-800',
                entregado: 'bg-gray-100 text-gray-800',
                cancelado: 'bg-red-100 text-red-800',
                incompleto: 'bg-orange-100 text-orange-800'
            };
            return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[estado] || 'bg-gray-100'}`}>
                {estado.toUpperCase()}
            </span>;
        };

        const renderFechaEntrega = () => {
            if (!pedido.fecha_entrega) {
                return <span className="text-gray-400 dark:text-gray-200">Sin programar</span>;
            }
            const fecha = new Date(pedido.fecha_entrega);
            const fechaTexto = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const horaTexto = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

            const esActivo = pedido.estado === 'nuevo' || pedido.estado === 'proceso' || pedido.estado === 'listo';
            const colorHora = esActivo
                ? pedido.urgencia === 'alta'
                    ? 'text-red-600'
                    : pedido.urgencia === 'media'
                        ? 'text-amber-600'
                        : 'text-gray-700 dark:text-gray-300'
                : 'text-gray-500 dark:text-gray-200';

            return (
                <div className="flex flex-col leading-tight">
                    <span className="text-xs text-gray-500 dark:text-white">{fechaTexto}</span>
                    <span className={`font-semibold ${colorHora}`}>{horaTexto}</span>
                </div>
            );
        };

        return {
            ID: [pedido.id],
            Cliente: [pedido.nombre || 'N/A', pedido.cliente_telefono],
            Servicio: [pedido.servicio],
            Estado: [getEstadoBadge(pedido.estado)],
            Creacion: [new Date(pedido.fecha_creacion).toLocaleDateString()],
            Entrega: renderFechaEntrega(),
            Urgencia: pedido.fecha_entrega && (pedido.estado === 'nuevo' || pedido.estado === 'proceso' || pedido.estado === 'listo')
                ? <CountdownTimer endDate={new Date(pedido.fecha_entrega)} refrech={() => { }} />
                : <span className="text-gray-400">—</span>,
            Total: [formatValue(pedido.total, 'currency')],
            // Guardamos el objeto original para referencia
            _original: pedido
        };
    };

    // Petición en curso: nos permite cancelar una anterior si llega otra antes
    // de que termine (p.ej. el usuario cambia de página muy rápido, o un
    // refresco de SignalR llega mientras ya había uno en vuelo). Sin esto,
    // la respuesta más vieja podía llegar después y pisar datos más nuevos.
    const peticionActualRef = useRef<{ abort: () => void } | null>(null);

    const fetchPedidos = useCallback(async (opciones?: { silent?: boolean }) => {
        const silencioso = opciones?.silent ?? false;

        peticionActualRef.current?.abort();

        if (silencioso) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const filtros: any = {
                Selects: [
                    { key: "listas.id" },
                    { key: "listas.id_cliente" },
                    { key: "listas.usuario_id" },
                    { key: "listas.nombre_lista" },
                    { key: "listas.tipo_lista" },
                    { key: "listas.servicio" },
                    { key: "listas.array_lista" },
                    { key: "listas.fecha_creacion" },
                    { key: "listas.fecha_actualizacion" },
                    { key: "listas.fecha_entrega" },
                    { key: "listas.estado" },
                    { key: "clientes.nombre" },
                    { key: "clientes.telefono" },
                    { key: "clientes.email" },
                    { key: "clientes.direccion" },
                ]
            };

            if (activeFilters.Filtros.length > 0) {
                filtros.Filtros = activeFilters.Filtros;
            }

            // Ordenamos en el servidor por fecha de entrega (más próxima primero).
            // Esto es indispensable porque los datos vienen paginados: si solo
            // ordenáramos en el cliente, cada página mostraría un orden correcto
            // "hacia adentro" pero los pedidos más urgentes podrían quedar
            // repartidos en páginas distintas en vez de aparecer primero.
            filtros.Order = activeFilters.OrderBy
                ? [activeFilters.OrderBy]
                : [{ Key: "listas.fecha_entrega", Direction: "ASC" }];

            const peticion = getWithFilter({
                table: `listas left join clientes on listas.id_cliente = clientes.id`,
                pageSize,
                page: currentPage,
                tag: 'Pedidos',
                filtros: filtros
            });
            peticionActualRef.current = peticion;

            const response = await peticion.unwrap();

            if (response && response.data) {
                setTotalPages(response.totalPages);
                setTotalRecords(response.totalRecords);

                const pedidosProcesados: Pedido[] = response.data.map(parseListaData);

                // El servidor ya devuelve la página ordenada por fecha_entrega ASC
                // (ver filtros.Order más arriba). Este sort adicional solo afina el
                // orden dentro de la página actual (p.ej. tras una actualización por
                // SignalR) y prioriza pedidos activos y urgentes sobre los demás.
                const pedidosOrdenados = pedidosProcesados.sort((a, b) => {
                    const estadosActivos = ['nuevo', 'proceso', 'listo'];
                    const esAActivo = estadosActivos.includes(a.estado);
                    const esBActivo = estadosActivos.includes(b.estado);

                    if (esAActivo && !esBActivo) return -1;
                    if (!esAActivo && esBActivo) return 1;

                    if (esAActivo && esBActivo) {
                        const ordenUrgencia = { alta: 0, media: 1, baja: 2 };
                        const urgenciaA = ordenUrgencia[a.urgencia || 'baja'];
                        const urgenciaB = ordenUrgencia[b.urgencia || 'baja'];
                        if (urgenciaA !== urgenciaB) return urgenciaA - urgenciaB;

                        if (a.tiempo_restante !== b.tiempo_restante) {
                            return (a.tiempo_restante || 9999) - (b.tiempo_restante || 9999);
                        }
                    }

                    return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
                });

                setPedidos(pedidosOrdenados);
            }
        } catch (error: any) {
            // Si fue cancelada por una petición más nueva, la ignoramos: no es
            // un error real, solo una respuesta vieja que ya no nos interesa.
            if (error?.name === 'AbortError' || error?.message === 'Aborted') {
                return;
            }
            console.error("Error fetching pedidos:", error);
            setError("No se pudieron cargar los pedidos. Verifica tu conexión e intenta de nuevo.");
            // Solo limpiamos la tabla si era la carga inicial; en un refresco
            // silencioso preferimos mantener los últimos datos buenos en pantalla.
            if (!silencioso) {
                setPedidos([]);
            }
        } finally {
            if (silencioso) {
                setIsRefreshing(false);
            } else {
                setIsLoading(false);
            }
        }
    }, [currentPage, activeFilters, getWithFilter, pageSize]);

    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    // Punto único de entrada para refrescos en segundo plano (SignalR y
    // countdowns que expiran). Se agrupan con un pequeño debounce: si varios
    // disparadores llegan casi juntos (p.ej. 3 pedidos expiran el mismo
    // segundo), solo se hace UNA petición en vez de varias simultáneas.
    const debounceRefrescoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const refrescarSilenciosamente = useCallback(() => {
        if (debounceRefrescoRef.current) clearTimeout(debounceRefrescoRef.current);
        debounceRefrescoRef.current = setTimeout(() => {
            fetchPedidos({ silent: true });
        }, 300);
    }, [fetchPedidos]);

    useEffect(() => {
        return () => {
            if (debounceRefrescoRef.current) clearTimeout(debounceRefrescoRef.current);
        };
    }, []);

    // SignalR
    const handlePedidoActualizado = useCallback((pedidoActualizado: any) => {
        console.log('🔄 Pedido actualizado desde hub:', pedidoActualizado);
        setPedidos(prev => {
            const pedidoProcesado = parseListaData(pedidoActualizado);
            const existeIndex = prev.findIndex(p => p.id === pedidoProcesado.id);
            if (existeIndex >= 0) {
                const nuevosPedidos = [...prev];
                nuevosPedidos[existeIndex] = pedidoProcesado;
                return nuevosPedidos;
            } else {
                return [pedidoProcesado, ...prev];
            }
        });
    }, []);

    const handleNuevoPedido = useCallback((nuevoPedido: any) => {
        console.log('🆕 Nuevo pedido desde hub:', nuevoPedido);
        const pedidoProcesado = parseListaData(nuevoPedido);
        setPedidos(prev => {
            const existe = prev.some(p => p.id === pedidoProcesado.id);
            if (!existe) {
                return [pedidoProcesado, ...prev];
            }
            return prev;
        });
    }, []);

    const handlePedidoEliminado = useCallback((pedidoId: number) => {
        console.log('🗑️ Pedido eliminado recibido:', pedidoId);
        setPedidos(prev => prev.filter(pedido => pedido.id !== pedidoId));
        if (pedidoSeleccionado?.id === pedidoId) {
            setPedidoSeleccionado(null);
        }
    }, [pedidoSeleccionado]);

    const handleRefrescarDatos = useCallback(() => {
        console.log('🔄 Refrescando datos por solicitud de sincronización');
        refrescarSilenciosamente();
    }, [refrescarSilenciosamente]);

    const { isConnected, notificarCambioLista } = usePedidosSignalR(
        handlePedidoActualizado,
        handleNuevoPedido,
        handlePedidoEliminado,
        handleRefrescarDatos
    );

    // ── Auto-cancelación de pedidos vencidos ────────────────────────────────
    // Un pedido "activo" (nuevo, en proceso o listo) cuya fecha_entrega ya
    // pasó y que nadie marcó como entregado se considera vencido: se cancela
    // automáticamente en la BD y se refleja en la tabla. Un ref evita mandar
    // la misma petición dos veces si el intervalo dispara mientras la
    // anterior sigue en curso.
    const pedidosCancelandoRef = useRef<Set<number>>(new Set());

    const cancelarPedidosVencidos = useCallback(async () => {
        const ahora = Date.now();
        const estadosActivos = ['nuevo', 'proceso', 'listo'];

        const vencidos = pedidos.filter(p =>
            estadosActivos.includes(p.estado) &&
            !!p.fecha_entrega &&
            new Date(p.fecha_entrega).getTime() < ahora &&
            !pedidosCancelandoRef.current.has(p.id)
        );

        if (vencidos.length === 0) return;

        vencidos.forEach(p => pedidosCancelandoRef.current.add(p.id));

        await Promise.all(vencidos.map(async (pedido) => {
            try {
                await putGeneral({
                    table: "listas",
                    data: {
                        Data: { estado: "cancelado", fecha_actualizacion: new Date().toISOString() },
                        Filtros: [{ Key: "ID", Value: pedido.id, Operator: "=" }]
                    }
                }).unwrap();

                setPedidos(prev => prev.map(p =>
                    p.id === pedido.id
                        ? { ...p, estado: 'cancelado', urgencia: 'baja', tiempo_restante: 0, fecha_actualizacion: new Date().toISOString() }
                        : p
                ));

                if (pedidoSeleccionado?.id === pedido.id) {
                    setPedidoSeleccionado(prev => prev ? { ...prev, estado: 'cancelado' } : prev);
                }

                if (isConnected) {
                    await notificarCambioLista('EstadoActualizado', {
                        pedidoId: pedido.id,
                        nuevoEstado: 'cancelado',
                        timestamp: new Date().toISOString()
                    });
                }

                console.log(`⏰ Pedido #${pedido.id} cancelado automáticamente: se pasó de su hora de entrega.`);
            } catch (error) {
                console.error(`Error cancelando automáticamente el pedido #${pedido.id} por tiempo vencido:`, error);
            } finally {
                pedidosCancelandoRef.current.delete(pedido.id);
            }
        }));
    }, [pedidos, putGeneral, pedidoSeleccionado, isConnected, notificarCambioLista]);

    // Revisamos cada vez que cambia la lista de pedidos (nueva carga, update
    // por SignalR, etc.) y además con un intervalo fijo para detectar los
    // que vencen simplemente porque pasó el tiempo, sin que nada más cambie.
    useEffect(() => {
        cancelarPedidosVencidos();
        const intervalo = setInterval(cancelarPedidosVencidos, 30000);
        return () => clearInterval(intervalo);
    }, [cancelarPedidosVencidos]);

    // Manejo de filtros (MainForm)
    const loadFiltros = (data: any) => {
        const filtros: Filtro[] = [];

        if (data.search) {
            filtros.push({ Key: "clientes.nombre", Value: data.search, Operator: "like" });
        }
        if (data.servicio && data.servicio !== 'todos') {
            filtros.push({ Key: "listas.servicio", Value: data.servicio, Operator: "=" });
        }
        if (data.estado && data.estado !== 'todos') {
            filtros.push({ Key: "listas.estado", Value: data.estado, Operator: "=" });
        }

        setActiveFilters(prev => ({
            ...prev,
            Filtros: filtros.length ? filtros : [{ Key: "listas.estado", Operator: "<>", Value: "cancelado" }]
        }));
        setCurrentPage(1);
    };

    const limpiarFiltros = () => {
        setActiveFilters(prev => ({
            ...prev,
            Filtros: [{ Key: "listas.estado", Operator: "<>", Value: "cancelado" }]
        }));
        setCurrentPage(1);
    };

    // Actualización de estado desde modal
    const handleEstadoActualizadoDesdeModal = useCallback(async (pedidoId: number, nuevoEstado: string) => {
        if (!pedidoId) return;
        try {
            await putGeneral({
                table: "listas",
                data: {
                    Data: {
                        "estado": nuevoEstado,
                        "fecha_actualizacion": new Date().toISOString()
                    },
                    Filtros: [{ "Key": "ID", "Value": pedidoId, "Operator": "=" }]
                }
            }).unwrap();

            setPedidos(prev => prev.map(pedido =>
                pedido.id === pedidoId
                    ? { ...pedido, estado: nuevoEstado as any, fecha_actualizacion: new Date().toISOString() }
                    : pedido
            ));
        } catch (error) {
            console.error("Error actualizando estado desde modal:", error);
            await fetchPedidos({ silent: true });
        }
    }, [putGeneral, fetchPedidos]);

    // Abrir modal de detalles
    const handleOpenModal = (pedido: Pedido) => {
        setPedidoSeleccionado(pedido);
        dispatch(openModalReducer({ modalName: "detalle_pedido" }));
    };

    // Preparar datos para DynamicTable
    // Memoizado: solo se recalcula cuando cambian los pedidos, no en cada
    // render (p.ej. cuando solo cambia isRefreshing).
    const tableData = useMemo(() => pedidos.map(p => formatPedidoForTable(p)), [pedidos]);

    return (
        <>
            <Header />
            <main className="min-h-screen mx-auto p-4 md:p-6 text-gray-900">
                <header className="mb-8">
                    <h1 className="flex items-center text-2xl font-bold md:text-3xl dark:text-white">
                        Gestión de Pedidos
                        {isConnected && (
                            <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                🟢 En tiempo real
                            </span>
                        )}
                        {isRefreshing && (
                            <span className="ml-2 text-xs text-gray-400 flex items-center gap-1">
                                <RefreshCw className="size-3 animate-spin" /> Actualizando...
                            </span>
                        )}
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-100 dark:text-gray-300">
                        Administra listas Pick-Up y entregas a domicilio
                    </p>
                </header>

                {error && (
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        <span className="flex items-center gap-2">
                            <AlertCircle className="size-4 shrink-0" /> {error}
                        </span>
                        <button
                            onClick={() => fetchPedidos()}
                            className="font-medium underline hover:no-underline shrink-0"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                    <article className="p-4">
                        <span className="mr-4 flex justify-between">
                            <label>
                                <h2 className="text-lg font-semibold dark:text-white">Gestión de articulos</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-300">
                                    Mostrando {tableData.length} de {totalRecords} articulos
                                </p>
                            </label>
                        </span>
                        <dt className="relative flex flex-col gap-2">
                            {/* Filtros con MainForm */}
                            <MainForm
                                message_button="Filtrar"
                                onSuccess={loadFiltros}
                                iconButton={<Filter className="mr-1 h-4 w-4" />}
                                actionType=""
                                flexDirection="flex-row"
                                dataForm={[
                                    {
                                        type: "Flex",
                                        require: false,
                                        elements: [
                                            {
                                                name: "search",
                                                type: "SEARCH",
                                                label: "Buscar por cliente",
                                                icon: <Search className="size-4" />,
                                                placeholder: "Nombre del cliente...",
                                                require: false,
                                            },
                                            {
                                                name: "servicio",
                                                type: "SELECT",
                                                label: "Servicio",
                                                icon: <Truck className="size-4" />,
                                                options: [
                                                    { label: "Todos", value: "todos" },
                                                    { label: "Pickup", value: "Pickup" },
                                                    { label: "Domicilio", value: "Domicilio" },
                                                ],
                                                placeholder: "Seleccionar servicio",
                                                require: false,
                                            },
                                            {
                                                name: "estado",
                                                type: "SELECT",
                                                label: "Estado",
                                                icon: <Package className="size-4" />,
                                                options: [
                                                    { label: "Todos", value: "todos" },
                                                    { label: "Nuevo", value: "nuevo" },
                                                    { label: "En proceso", value: "proceso" },
                                                    { label: "Listo", value: "listo" },
                                                    { label: "Entregado", value: "entregado" },
                                                    { label: "Cancelado", value: "cancelado" },
                                                ],
                                                placeholder: "Seleccionar estado",
                                                require: false,
                                            },
                                        ],
                                    },
                                ]}
                            />
                            <dl className="flex gap-2 ml-auto">
                                <Button
                                    onClick={() => dispatch(openModalReducer({ modalName: 'chat_general' }))}
                                    color="info"
                                >
                                    Chat <MessageCircle className="size-4" />
                                </Button>

                                <Button
                                    onClick={() => fetchPedidos()}
                                    color="success"
                                >
                                    Actualizar <RefreshCw className="size-4" />
                                </Button>
                            </dl>
                        </dt>

                        <section className="overflow-x-auto">
                            {isLoading ? (
                                <LoadingSection message="Cargando pedidos..." />
                            ) : tableData.length > 0 ? (
                                <>
                                    <DynamicTable
                                        data={tableData}
                                        contextMenuItems={(row, selected) => {
                                            const targetRows = selected || [row];
                                            const original = row._original as Pedido;
                                            return [
                                                {
                                                    label: 'Ver detalles',
                                                    icon: <Eye size={16} />,
                                                    onClick: () => handleOpenModal(original),
                                                },
                                                {
                                                    label: 'Copiar ID',
                                                    icon: <Copy size={16} />,
                                                    onClick: () => navigator.clipboard.writeText(String(original.id)),
                                                },
                                                {
                                                    label: 'Cambiar estado',
                                                    icon: <Edit size={16} />,
                                                    onClick: () => targetRows.forEach(r => {
                                                        const ped = (r as any)._original as Pedido;
                                                        // Aquí podrías abrir un modal de cambio rápido
                                                        console.log('Cambiar estado de', ped.id);
                                                    }),
                                                },
                                                {
                                                    label: 'Imprimir',
                                                    icon: <Printer size={16} />,
                                                    onClick: () => targetRows.forEach(r => {
                                                        console.log('Imprimir', (r as any)._original.id);
                                                    }),
                                                },
                                            ];
                                        }}
                                        onRowClick={(row) => {
                                            const original = row._original as Pedido;
                                            handleOpenModal(original);
                                        }}
                                    />
                                    <div className="p-4">
                                        <Pagination
                                            currentPage={currentPage}
                                            loading={isLoading}
                                            setCurrentPage={setCurrentPage}
                                            currentPageSize={pageSize}
                                            onPageSizeChange={setPageSize}
                                            totalPages={totalPages}
                                        />
                                    </div>
                                </>
                            ) : error ? null : (
                                <div className="p-8 text-center">
                                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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

                {/* Modal de detalles */}
                <Modal
                    modalName="detalle_pedido"
                    title="Detalles del Pedido"
                    maxWidth="4xl"
                >
                    {pedidoSeleccionado && (
                        <ModalList
                            pedidoId={pedidoSeleccionado.id}
                            onEstadoActualizado={handleEstadoActualizadoDesdeModal}
                        />
                    )}
                </Modal>

                {pedidoSeleccionado ? (
                    <ModalChat
                        telefonoClient={pedidoSeleccionado.cliente_telefono || 'general'}
                        pedido={pedidoSeleccionado}
                    />
                ) : (
                    <ModalChat telefonoClient="general" pedido={null} />
                )}
            </main>
            <Footer />
        </>
    );
}