"use client"

import jsPDF from 'jspdf';
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
    AlertCircle,
    Trash
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
import { Modal } from "@/components/modal"
import { usePedidosSignalR } from './utils/singalr-pedidos';

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

        // Calcular urgencia - CORREGIDO: usar fecha_cita en lugar de nombre_lista
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
            // CORREGIDO: Construir filtros correctamente
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

            // Añadir filtros activos si existen
            if (activeFilters.Filtros.length > 0) {
                filtros.Filtros = activeFilters.Filtros;
            }

            const response = await getWithFilter({
                table: "listas as listas left join clientes as clientes on listas.id_cliente = clientes.id",
                pageSize: 10, // CORREGIDO: número en lugar de string
                page: currentPage,
                tag: 'Pedidos',
                filtros: filtros
            }).unwrap();

            if (response && response.data) {
                setTotalPages(response.TotalPages || 1);
                setTotalItems(response.TotalRecords || response.data.length);

                // Mapear y procesar los datos
                const pedidosProcesados: Pedido[] = response.data.map(parseListaData);

                // Ordenar: primero por estado (nuevo y proceso primero), luego por urgencia
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


    // ✅ NUEVO: Función para calcular estadísticas
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
            promedio_tiempo_entrega: 45, // Esto podría calcularse basado en datos reales
            pedidos_urgentes: listaPedidos.filter(p =>
                (p.estado === 'nuevo' || p.estado === 'proceso') && p.urgencia === 'alta'
            ).length
        };
        setEstadisticas(stats);
    }, []);
    // ✅ HANDLERS CORREGIDOS PARA SIGNALR
    const handlePedidoActualizado = useCallback((pedidoActualizado: any) => {
        console.log('🔄 Pedido actualizado desde hub:', pedidoActualizado);

        setPedidos(prev => {
            const pedidoProcesado = parseListaData(pedidoActualizado);
            const existeIndex = prev.findIndex(p => p.id === pedidoProcesado.id);

            if (existeIndex >= 0) {
                const nuevosPedidos = [...prev];
                nuevosPedidos[existeIndex] = pedidoProcesado;

                // Recalcular estadísticas después de actualizar
                calcularEstadisticas(nuevosPedidos);
                return nuevosPedidos;
            } else {
                const nuevosPedidos = [pedidoProcesado, ...prev];
                calcularEstadisticas(nuevosPedidos);
                return nuevosPedidos;
            }
        });

        if (pedidoSeleccionado && pedidoSeleccionado.id === pedidoActualizado.id) {
            setPedidoSeleccionado(parseListaData(pedidoActualizado));
        }
    }, [pedidoSeleccionado, calcularEstadisticas]);

    const handleNuevoPedido = useCallback((nuevoPedido: any) => {
        console.log('🆕 Nuevo pedido desde hub:', nuevoPedido);
        const pedidoProcesado = parseListaData(nuevoPedido);

        setPedidos(prev => {
            // Verificar que no exista ya para evitar duplicados
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

        if (pedidoSeleccionado && pedidoSeleccionado.id === pedidoId) {
            setPedidoSeleccionado(null);
        }
    }, [pedidoSeleccionado, calcularEstadisticas]);

    const handleRefrescarDatos = useCallback(() => {
        console.log('🔄 Refrescando datos por solicitud de sincronización');
        fetchPedidos();
    }, [fetchPedidos]);

    // ✅ ACTUALIZADO: Pasar todos los handlers a SignalR (después de definir calcularEstadisticas)
    const { connection, isConnected, unirseAPedido, salirDePedido, notificarCambioLista } = usePedidosSignalR(
        handlePedidoActualizado,
        handleNuevoPedido,
        handlePedidoEliminado,
        handleRefrescarDatos
    );
    // Unirse/salir del grupo cuando se selecciona/deselecciona un pedido
    useEffect(() => {
        if (pedidoSeleccionado) {
            unirseAPedido(pedidoSeleccionado.id);
        }
        return () => {
            if (pedidoSeleccionado) {
                salirDePedido(pedidoSeleccionado.id);
            }
        };
    }, [pedidoSeleccionado, unirseAPedido, salirDePedido]);

    const handleOpenModal = (pedido: Pedido) => {
        setPedidoSeleccionado(pedido);
        dispatch(openModalReducer({ modalName: "detalle_pedido" }));
    }

    const [putGeneral] = usePutGeneralMutation();

    // ✅ MODIFICAR LAS FUNCIONES DE ACTUALIZACIÓN PARA NOTIFICAR CAMBIOS
    const handleActualizarEstado = async (pedidoId: number, nuevoEstado: string) => {
        try {
            await putGeneral({
                table: "listas",
                id: pedidoId,
                data: {
                    estado: nuevoEstado,
                    fecha_actualizacion: new Date().toISOString()
                }
            }).unwrap();

            // Notificar el cambio a otros usuarios
            await notificarCambioLista("updated", {
                id: pedidoId,
                estado: nuevoEstado,
                fecha_actualizacion: new Date().toISOString()
            });

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

            if (pedidoSeleccionado && pedidoSeleccionado.id === pedidoId) {
                setPedidoSeleccionado(prev => prev ? {
                    ...prev,
                    estado: nuevoEstado as any,
                    fecha_actualizacion: new Date().toISOString()
                } : null);
            }

        } catch (error) {
            console.error("Error actualizando estado:", error);
            await fetchPedidos();
        }
    };

    const handleToggleRecolectado = async (listaId: number, itemId: string, recolectado: boolean) => {
        try {
            const listaActual = pedidos.find(p => p.id === listaId);
            if (!listaActual) return;

            const itemsActualizados = listaActual.items.map((item: any) =>
                item.id === itemId
                    ? { ...item, recolectado }
                    : item
            );

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
            // Notificar el cambio
            await notificarCambioLista("item_recolectado", {
                listaId,
                itemId,
                recolectado,
                usuario: "usuario_actual"
            });
        } catch (error) {
            console.error('Error al actualizar estado de recolección:', error);
        }
    };

    const handleToggleNoEncontrado = async (listaId: number, itemId: string, noEncontrado: boolean) => {
        try {
            const listaActual = pedidos.find(p => p.id === listaId);
            if (!listaActual) return;

            const itemsActualizados = listaActual.items.map((item: any) =>
                item.id === itemId
                    ? { ...item, noEncontrado }
                    : item
            );

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

        } catch (error) {
            console.error('Error al actualizar estado de producto no encontrado:', error);
        }
    };

    const handleMarcarTodosEncontrados = async (listaId: number) => {
        try {
            const listaActual = pedidos.find(p => p.id === listaId);
            if (!listaActual) return;

            const itemsActualizados = listaActual.items.map((item: any) => ({
                ...item,
                noEncontrado: false
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

        } catch (error) {
            console.error('Error al marcar todos como encontrados:', error);
        }
    };

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

        } catch (error) {
            console.error('Error al marcar todos como recolectados:', error);
        }
    };

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

        } catch (error) {
            console.error('Error al desmarcar todos como recolectados:', error);
        }
    };

    const generarPDF = (pedido: Pedido) => {
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;
        let yPosition = margin;

        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('LISTA DE PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);

        doc.text(`ID Pedido: ${pedido.id}`, margin, yPosition);
        yPosition += 8;
        doc.text(`Cliente: ${pedido.nombre || 'N/A'}`, margin, yPosition);
        yPosition += 8;
        doc.text(`Fecha: ${formatDate(pedido.fecha_creacion)}`, margin, yPosition);
        yPosition += 8;
        doc.text(`Servicio: ${pedido.servicio}`, margin, yPosition);
        yPosition += 8;
        doc.text(`Estado: ${pedido.estado}`, margin, yPosition);
        yPosition += 15;

        const tableColumn = ["Producto", "Cantidad", "Precio Unit.", "Subtotal"];
        const tableRows = [];

        for (const item of pedido.items) {
            const productData = [
                item.nombre || 'Producto sin nombre',
                `${item.quantity || 0} ${item.unidad || 'unidad'}`,
                `$${(item.precio || 0).toFixed(2)}`,
                `$${((item.precio || 0) * (item.quantity || 0)).toFixed(2)}`
            ];
            tableRows.push(productData);
        }

        tableRows.push([
            'TOTAL',
            '',
            '',
            `$${pedido.total?.toFixed(2) || '0.00'}`
        ]);

        (doc as any).autoTable({
            startY: yPosition,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { left: margin, right: margin },
            didDrawPage: (data: any) => {
                const pageHeight = doc.internal.pageSize.getHeight();
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Generado el ${new Date().toLocaleDateString()} - Página ${data.pageNumber}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }
        });

        doc.save(`pedido-${pedido.id}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

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

            <ModalChat telefonoClient={'general'} />

            <Modal
                modalName="detalle_pedido"
                title={`Detalles de la Lista - ${pedidoSeleccionado?.nombre_lista || ''}`}
                maxWidth="4xl"
            >
                {pedidoSeleccionado && (
                    <div className="p-4 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg border-gray-300 border-b pb-2">Información General</h3>
                                <div><strong>ID Lista:</strong> {pedidoSeleccionado.id}</div>
                                <div><strong>Cliente ID:</strong> {pedidoSeleccionado.id_cliente}</div>
                                <div><strong>Nombre:</strong> {pedidoSeleccionado.nombre_lista}</div>
                                <div><strong>Tipo:</strong> {pedidoSeleccionado.tipo_lista}</div>
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
                                <div><strong>Total:</strong> ${pedidoSeleccionado.total.toFixed(2)}</div>
                                <div><strong>Creado:</strong> {formatDate(pedidoSeleccionado.fecha_creacion)}</div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg border-gray-300 border-b pb-2">Progreso</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
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
                                    </div>

                                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-1">
                                        <div className="flex justify-between items-center text-xs">
                                            <div>
                                                <span className="text-red-700">Productos no encontrados:</span>
                                                <span className="text-red-600 ml-2">
                                                    {pedidoSeleccionado.items.filter((item: any) => item.noEncontrado).length}
                                                </span>
                                            </div>
                                            {pedidoSeleccionado.items.some((item: any) => item.noEncontrado) && (
                                                <button
                                                    onClick={() => handleMarcarTodosEncontrados(pedidoSeleccionado.id)}
                                                    className="px-2 py-1 flex gap-2 items-center bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                                                >
                                                    Limpiar <Trash className='size-4' />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <button
                                            onClick={() => handleMarcarTodosRecolectados(pedidoSeleccionado.id)}
                                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        >
                                            Marcar todos recolectados
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

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-lg">Productos en la Lista</h3>
                                <div className="flex gap-4 text-sm text-gray-500">
                                    <div>
                                        {pedidoSeleccionado.items.filter((item: any) => item.recolectado).length} de {pedidoSeleccionado.items.length} recolectados
                                    </div>
                                    <div className="text-red-500">
                                        {pedidoSeleccionado.items.filter((item: any) => item.noEncontrado).length} no encontrados
                                    </div>
                                </div>
                            </div>

                            <div className="border-gray-300 border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold w-10">✓</th>
                                            <th className="px-4 py-3 text-left font-semibold w-10">⚠️</th>
                                            <th className="px-4 py-3 text-left font-semibold">Producto</th>
                                            <th className="px-4 py-3 text-left font-semibold">Categoría</th>
                                            <th className="px-4 py-3 text-center font-semibold">Cantidad</th>
                                            <th className="px-4 py-3 text-right font-semibold">Precio Unitario</th>
                                            <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedidoSeleccionado.items.map((item: any, index) => {
                                            const isNoEncontrado = item.noEncontrado;
                                            const isRecolectado = item.recolectado;

                                            return (
                                                <tr
                                                    key={index}
                                                    className={`border-gray-300 border-t transition-colors ${isNoEncontrado
                                                        ? 'bg-red-50 hover:bg-red-100'
                                                        : isRecolectado
                                                            ? 'bg-green-50 hover:bg-green-100'
                                                            : 'hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isRecolectado || false}
                                                            onChange={(e) => handleToggleRecolectado(
                                                                pedidoSeleccionado.id,
                                                                item.id,
                                                                e.target.checked
                                                            )}
                                                            disabled={isNoEncontrado}
                                                            className={`h-4 w-4 rounded border-gray-300 focus:ring-green-500 ${isNoEncontrado
                                                                ? 'text-gray-400 cursor-not-allowed'
                                                                : 'text-green-600'
                                                                }`}
                                                        />
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isNoEncontrado || false}
                                                            onChange={(e) => handleToggleNoEncontrado(
                                                                pedidoSeleccionado.id,
                                                                item.id,
                                                                e.target.checked
                                                            )}
                                                            disabled={isRecolectado}
                                                            className={`h-4 w-4 rounded border-gray-300 focus:ring-red-500 ${isRecolectado
                                                                ? 'text-gray-400 cursor-not-allowed'
                                                                : 'text-red-600'
                                                                }`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className={`font-medium flex flex-col ${isNoEncontrado ? 'line-through text-red-600' : ''
                                                            }`}>
                                                            {item.nombre}
                                                            <span className="px-4 py-3 text-xs"><strong>CB: </strong>{item.id}</span>
                                                        </div>
                                                        {item.articulo && (
                                                            <div className="text-xs text-gray-500">Artículo: {item.articulo}</div>
                                                        )}
                                                        {isNoEncontrado && (
                                                            <div className="text-xs text-red-500 font-medium mt-1">
                                                                ⚠️ Producto no encontrado
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">{item.categoria}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`font-medium ${isNoEncontrado ? 'line-through' : ''
                                                            }`}>
                                                            {item.quantity}
                                                        </span>
                                                        <span className="text-xs text-gray-500 ml-1">{item.unidad}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={isNoEncontrado ? 'line-through' : ''}>
                                                            ${item.precio?.toFixed(2) || '0.00'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        <span className={isNoEncontrado ? 'line-through text-red-600' : ''}>
                                                            ${((item.precio || 0) * (item.quantity || 0)).toFixed(2)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

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

                                    <button
                                        onClick={() => generarPDF(pedidoSeleccionado)}
                                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Imprimir Lista
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    {pedidoSeleccionado.items.some((item: any) => item.noEncontrado) ? (
                                        <div className="flex items-center text-red-600">
                                            <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                                            <span>Productos marcados como no encontrados</span>
                                        </div>
                                    ) : pedidoSeleccionado.items.every((item: any) => item.recolectado) ? (
                                        <div className="flex items-center text-green-600">
                                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                            <span>Todos los productos recolectados</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-yellow-600">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                                            <span>Productos pendientes por recolectar</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </main>
    )
}