import { Modal } from "@/components/modal";
import { useGetWithFiltersGeneralMutation, usePostImgMutation, usePutGeneralMutation } from "@/hooks/api/api"
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { useCallback, useEffect, useRef, useState } from "react";
import { Signature, NotepadText, Tag, CheckCircle2, XCircle, Package, AlertTriangle, Zap, MessageCircle } from "lucide-react";
import { usePedidosSignalR } from "../utils/singalr-pedidos";
import { formatValue } from "@/utils/constants/format-values";
import { Button } from "@/components/button";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import { useAppDispatch } from "@/hooks/selector";
import { FirestoreService } from "@/hooks/use-firebase";
import { Message } from "./modal-chat";

interface ListaItem {
    id: string;
    articulo: string;
    categoria: string;
    nombre: string;
    precio: number;
    descuento?: number;
    unidad: string;
    cantidad: number;
    factor: number;
    quantity: number;
    recolectado?: boolean;
    noEncontrado?: boolean;
    esServicio?: boolean;
    codigo?: string;
    descripcion?: string;
    impuesto1?: number;
    tipoImpuesto1?: string;
    fecha_servicio?: string;
    hora_servicio?: string;
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
    subtotal: number;
    descuentoTotal: number;
    servicioFee: number;
    urgencia?: 'alta' | 'media' | 'baja';
    tiempo_restante?: number;
    firma?: string;
}

interface ModalListProps {
    pedidoId: number;
    onEstadoActualizado?: (pedidoId: number, nuevoEstado: string) => void;
    onItemActualizado?: (pedidoId: number, itemId: string, tipo: string, valor: boolean) => void;
}

const ESTADO_META: Record<string, { label: string; color: string; bg: string; ring: string }> = {
    nuevo: { label: 'Nuevo', color: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-300' },
    proceso: { label: 'En Proceso', color: 'text-blue-700', bg: 'bg-blue-50', ring: 'ring-blue-300' },
    listo: { label: 'Listo', color: 'text-green-700', bg: 'bg-green-50', ring: 'ring-green-300' },
    entregado: { label: 'Entregado', color: 'text-indigo-700', bg: 'bg-indigo-50', ring: 'ring-indigo-300' },
    cancelado: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-300' },
    incompleto: { label: 'Incompleto', color: 'text-orange-700', bg: 'bg-orange-50', ring: 'ring-orange-300' },
};

const calcularEstadoAutomatico = (items: ListaItem[], estadoActual: string): string | null => {
    if (['entregado', 'cancelado', 'nuevo'].includes(estadoActual)) return null;
    const productosReales = items.filter(i => !i.esServicio && i.codigo !== "SPICKUP");
    if (productosReales.length === 0) return null;
    const hayNoEncontrado = productosReales.some(i => i.noEncontrado);
    const todosRecolectados = productosReales.every(i => i.recolectado);
    const algunoRecolectado = productosReales.some(i => i.recolectado);
    if (hayNoEncontrado && !todosRecolectados) return 'incompleto';
    if (todosRecolectados) return 'listo';
    if (algunoRecolectado) return 'proceso';
    return null;
};

export const ModalList = ({ pedidoId, onEstadoActualizado, onItemActualizado }: ModalListProps) => {
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
    const [autoEstadoMsg, setAutoEstadoMsg] = useState<string | null>(null);
    const [putGeneral] = usePutGeneralMutation();
    const [getWithFiltersGeneral] = useGetWithFiltersGeneralMutation();
    const [postImg] = usePostImgMutation();
    const dispatch = useAppDispatch();

    // ── Firma ──────────────────────────────────────────────────────────────────
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // ── SignalR ────────────────────────────────────────────────────────────────
    const handlePedidoActualizado = useCallback((pedidoActualizado: any) => {
        if (pedidoActualizado.id === pedidoId) {
            setPedidoSeleccionado(parseListaData(pedidoActualizado));
        }
    }, [pedidoId]);

    const handleNuevoPedido = useCallback(() => { }, []);
    const handlePedidoEliminado = useCallback((id: number) => {
        if (id === pedidoId) setPedidoSeleccionado(null);
    }, [pedidoId]);
    const handleRefrescarDatos = useCallback(() => {
        if (pedidoId) fetchPedidoDetalle();
    }, [pedidoId]);

    const { connection, isConnected, unirseAPedido, salirDePedido, notificarCambioLista } =
        usePedidosSignalR(handlePedidoActualizado, handleNuevoPedido, handlePedidoEliminado, handleRefrescarDatos);

    useEffect(() => {
        if (pedidoId && isConnected) unirseAPedido(pedidoId);
        return () => { if (pedidoId && isConnected) salirDePedido(pedidoId); };
    }, [pedidoId, isConnected]);

    useEffect(() => {
        if (!connection || !isConnected) return;
        connection.on("ReceiveProductoRecogidaUpdate", (pid: number, productoId: string, recolectado: boolean) => {
            if (pid === pedidoId) {
                setPedidoSeleccionado(prev => prev ? {
                    ...prev,
                    items: prev.items.map(i => i.id === productoId ? { ...i, recolectado } : i)
                } : null);
            }
        });
        connection.on("ReceiveProductoNoEncontradoUpdate", (pid: number, productoId: string, noEncontrado: boolean) => {
            if (pid === pedidoId) {
                setPedidoSeleccionado(prev => prev ? {
                    ...prev,
                    items: prev.items.map(i => i.id === productoId ? { ...i, noEncontrado } : i)
                } : null);
            }
        });
        return () => {
            connection.off("ReceiveProductoRecogidaUpdate");
            connection.off("ReceiveProductoNoEncontradoUpdate");
        };
    }, [connection, isConnected, pedidoId]);

    // ── Parseo ─────────────────────────────────────────────────────────────────
    const parseListaData = (lista: any): Pedido => {
        let items: ListaItem[] = [];
        let subtotal = 0, descuentoTotal = 0, servicioFee = 0;
        try {
            if (lista.array_lista) {
                items = JSON.parse(lista.array_lista);
                items.forEach(item => {
                    const precioOriginal = item.precio || 0;
                    const precioFinal = item.descuento || precioOriginal;
                    const cantidad = item.quantity || 1;
                    descuentoTotal += (precioOriginal - precioFinal) * cantidad;
                    if (item.esServicio || item.codigo === "SPICKUP") {
                        servicioFee += precioFinal * cantidad;
                        subtotal += precioFinal * cantidad;
                    } else {
                        subtotal += precioFinal * cantidad;
                    }
                });
            }
        } catch (e) { items = []; }
        return {
            id: lista.id, id_lista: lista.id, id_cliente: lista.id_cliente,
            usuario_id: lista.usuario_id, sucursal_id: lista.sucursal_id,
            nombre_lista: lista.nombre_lista, tipo_lista: lista.tipo_lista,
            servicio: lista.servicio, array_lista: lista.array_lista,
            fecha_creacion: lista.fecha_creacion, fecha_actualizacion: lista.fecha_actualizacion,
            estado: lista.estado, es_publica: lista.es_publica, items,
            cliente: lista.nombre ? { id: lista.id_cliente, nombre: lista.nombre, telefono: lista.telefono, email: lista.email, direccion: lista.direccion, ciudad: lista.ciudad, estado: lista.estado } : undefined,
            nombre: lista.nombre || `Cliente ${lista.id_cliente}`,
            cliente_telefono: lista.telefono || 'N/A', cliente_email: lista.email || 'N/A',
            total: subtotal, subtotal, descuentoTotal, servicioFee,
            urgencia: 'baja', tiempo_restante: 0,
            firma: lista.firma
        };
    };

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchPedidoDetalle = useCallback(async () => {
        if (!pedidoId) return;
        try {
            const response = await getWithFiltersGeneral({
                table: "listas left join clientes on listas.id_cliente = clientes.id",
                pageSize: 1, page: 1, tag: 'PedidoDetalle',
                filtros: {
                    Selects: [
                        { key: "listas.id" }, { key: "listas.id_cliente" }, { key: "listas.nombre_lista" },
                        { key: "listas.tipo_lista" }, { key: "listas.servicio" }, { key: "listas.array_lista" },
                        { key: "listas.fecha_creacion" }, { key: "listas.fecha_actualizacion" },
                        { key: "listas.estado" }, { key: "clientes.nombre" }, { key: "clientes.telefono" },
                        { key: "clientes.email" }, { key: "clientes.direccion" },
                    ],
                    Filtros: [{ Key: "listas.id", Value: pedidoId, Operator: "=" }],
                    Order: [{ Key: "listas.id", Direction: "ASC" }]
                }
            }).unwrap();
            if (response?.data?.length > 0) setPedidoSeleccionado(parseListaData(response.data[0]));
        } catch (e) { console.error("Error fetching pedido detalle:", e); }
    }, [getWithFiltersGeneral, pedidoId]);

    useEffect(() => { if (pedidoId) fetchPedidoDetalle(); }, [pedidoId, fetchPedidoDetalle]);

    // ── Actualizar estado en BD ────────────────────────────────────────────────
    const actualizarEstadoDB = useCallback(async (nuevoEstado: string, silencioso = false) => {
        if (!pedidoSeleccionado) return;
        try {
            await putGeneral({
                table: "listas",
                data: {
                    Data: { estado: nuevoEstado, fecha_actualizacion: new Date().toISOString() },
                    Filtros: [{ Key: "ID", Value: pedidoSeleccionado.id, Operator: "=" }]
                }
            }).unwrap();

            setPedidoSeleccionado(prev => prev ? { ...prev, estado: nuevoEstado as any, fecha_actualizacion: new Date().toISOString() } : null);

            if (isConnected) {
                await notificarCambioLista('EstadoActualizado', {
                    pedidoId: pedidoSeleccionado.id, nuevoEstado, timestamp: new Date().toISOString()
                });
            }
            onEstadoActualizado?.(pedidoSeleccionado.id, nuevoEstado);

            if (!silencioso) {
                setAutoEstadoMsg(`Estado cambiado automáticamente a "${ESTADO_META[nuevoEstado]?.label}"`);
                setTimeout(() => setAutoEstadoMsg(null), 3500);
            }
        } catch (e) {
            console.error("Error actualizando estado:", e);
            fetchPedidoDetalle();
        }
    }, [pedidoSeleccionado, isConnected, notificarCambioLista, onEstadoActualizado, fetchPedidoDetalle]);

    // ── Guardar items y evaluar estado automático ──────────────────────────────
    const guardarItemsYEvaluarEstado = useCallback(async (itemsActualizados: ListaItem[]) => {
        if (!pedidoSeleccionado) return;

        const arrayListaActualizado = JSON.stringify(itemsActualizados);
        await putGeneral({
            table: "listas",
            data: {
                Data: { array_lista: arrayListaActualizado, fecha_actualizacion: new Date().toISOString() },
                Filtros: [{ Key: "ID", Value: pedidoSeleccionado.id, Operator: "=" }]
            }
        }).unwrap();

        setPedidoSeleccionado(prev => prev ? { ...prev, items: itemsActualizados, fecha_actualizacion: new Date().toISOString() } : null);

        const estadoSugerido = calcularEstadoAutomatico(itemsActualizados, pedidoSeleccionado.estado);
        if (estadoSugerido && estadoSugerido !== pedidoSeleccionado.estado) {
            setTimeout(() => actualizarEstadoDB(estadoSugerido), 300);
        }
    }, [pedidoSeleccionado, putGeneral, actualizarEstadoDB]);

    // ── Enviar notificación al chat del cliente (Firestore) ────────────────────
    const enviarNotificacionNoEncontrado = useCallback(async (item: ListaItem) => {
        if (!pedidoSeleccionado) return;
        const telefono = pedidoSeleccionado.cliente_telefono;
        if (!telefono || telefono === 'N/A') return;

        const path = `chats/${telefono}/${pedidoSeleccionado.id}/messages/`;
        const chatService = new FirestoreService<Message>(path);

        const mensaje: Omit<Message, 'id'> = {
            text: `⚠️ El producto "${item.nombre}" no se encuentra disponible en nuestro inventario. ¿Deseas reemplazarlo por otro similar o eliminarlo de tu pedido?`,
            userId: 'system',
            userName: 'Sistema',
            timestamp: Date.now(),
            type: 'system',
            actions: [
                {
                    label: 'Reemplazar',
                    action: 'replace',
                    productId: item.id,
                    productName: item.nombre
                },
                {
                    label: 'Eliminar',
                    action: 'remove',
                    productId: item.id,
                    productName: item.nombre
                }
            ]
        };
        try {
            await chatService.create(mensaje);
            // Abrir automáticamente el chat para que el operador vea la interacción
            dispatch(openModalReducer({ modalName: `chat_${telefono}_${pedidoSeleccionado.id}` }));
        } catch (error) {
            console.error("Error enviando notificación a Firestore:", error);
        }
    }, [pedidoSeleccionado, dispatch]);

    // ── Toggle no encontrado (con notificación) ────────────────────────────────
    const handleToggleNoEncontrado = useCallback(async (listaId: number, itemId: string, noEncontrado: boolean) => {
        if (!pedidoSeleccionado) return;
        try {
            const itemsActualizados = pedidoSeleccionado.items.map(i =>
                i.id === itemId ? { ...i, noEncontrado, recolectado: noEncontrado ? false : i.recolectado } : i
            );

            if (noEncontrado && pedidoSeleccionado.estado === 'nuevo') {
                await actualizarEstadoDB('proceso', true);
            }

            await guardarItemsYEvaluarEstado(itemsActualizados);

            const itemModificado = pedidoSeleccionado.items.find(i => i.id === itemId);
            if (noEncontrado && itemModificado) {
                await enviarNotificacionNoEncontrado(itemModificado);
            }

            if (isConnected) {
                await notificarCambioLista('ProductoNoEncontradoActualizado', { pedidoId: listaId, productoId: itemId, noEncontrado, timestamp: new Date().toISOString() });
            }
            onItemActualizado?.(listaId, itemId, 'noEncontrado', noEncontrado);
        } catch (e) { console.error('Error toggle noEncontrado:', e); }
    }, [pedidoSeleccionado, actualizarEstadoDB, guardarItemsYEvaluarEstado, enviarNotificacionNoEncontrado, isConnected, notificarCambioLista, onItemActualizado]);

    // ── Toggle recolectado ─────────────────────────────────────────────────────
    const handleToggleRecolectado = useCallback(async (listaId: number, itemId: string, recolectado: boolean) => {
        if (!pedidoSeleccionado) return;
        try {
            const itemsActualizados = pedidoSeleccionado.items.map(i =>
                i.id === itemId ? { ...i, recolectado, noEncontrado: recolectado ? false : i.noEncontrado } : i
            );

            if (recolectado && pedidoSeleccionado.estado === 'nuevo') {
                await actualizarEstadoDB('proceso', true);
            }

            await guardarItemsYEvaluarEstado(itemsActualizados);

            if (isConnected) {
                await notificarCambioLista('ProductoRecogidaActualizada', { pedidoId: listaId, productoId: itemId, recolectado, timestamp: new Date().toISOString() });
            }
            onItemActualizado?.(listaId, itemId, 'recolectado', recolectado);
        } catch (e) { console.error('Error toggle recolectado:', e); }
    }, [pedidoSeleccionado, actualizarEstadoDB, guardarItemsYEvaluarEstado, isConnected, notificarCambioLista, onItemActualizado]);

    // ── Cambio manual de estado ────────────────────────────────────────────────
    const handleActualizarEstado = (nuevoEstado: string) => actualizarEstadoDB(nuevoEstado, true);

    // ── Firma ──────────────────────────────────────────────────────────────────
    const getCanvasContext = (): CanvasRenderingContext2D | null => {
        if (!canvasRef.current) return null;
        if (!canvasCtxRef.current) {
            canvasCtxRef.current = canvasRef.current.getContext('2d');
            if (canvasCtxRef.current) {
                canvasCtxRef.current.lineWidth = 2;
                canvasCtxRef.current.lineCap = 'round';
                canvasCtxRef.current.strokeStyle = '#000';
            }
        }
        return canvasCtxRef.current;
    };

    const startDrawing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        const ctx = getCanvasContext();
        if (!ctx || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = getCanvasContext();
        if (!ctx || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const startDrawingTouch = (e: React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        const ctx = getCanvasContext();
        if (!ctx || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const drawTouch = (e: React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = getCanvasContext();
        if (!ctx || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const clearSignature = () => {
        const ctx = canvasCtxRef.current;
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const confirmSignature = async () => {
        if (!canvasRef.current || !pedidoSeleccionado) return;
        const dataURL = canvasRef.current.toDataURL('image/png');
        try {
            await putGeneral({
                table: "listas",
                data: {
                    Data: {
                        firma: dataURL,
                        fecha_actualizacion: new Date().toISOString()
                    },
                    Filtros: [{ Key: "ID", Value: pedidoSeleccionado.id, Operator: "=" }]
                }
            }).unwrap();

            await actualizarEstadoDB('entregado', true);
            setShowSignaturePad(false);
        } catch (e) {
            console.error('Error al guardar la firma:', e);
        }
    };

    const handleOpenSignaturePad = () => {
        if (!pedidoSeleccionado || !['listo', 'proceso'].includes(pedidoSeleccionado.estado)) return;
        setShowSignaturePad(true);
    };

    // ── Utilidades de presentación ─────────────────────────────────────────────
    const getEstadoBadgeClass = (estado: string) => {
        const m = ESTADO_META[estado];
        return m ? `${m.bg} ${m.color} ring-1 ${m.ring}` : 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        } catch { return dateString; }
    };

    const renderPrecio = (item: ListaItem) => {
        const tieneDescuento = item.descuento && item.descuento > 0;
        const precioFinal = item.descuento || item.precio;
        const porcentaje = tieneDescuento ? Math.round(((item.precio - precioFinal) / item.precio) * 100) : 0;
        if (tieneDescuento) {
            return (
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-purple-600">{formatValue(precioFinal, "currency")}</span>
                        <span className="text-[11px] text-gray-400 line-through">{formatValue(item.precio, "currency")}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <Tag className="w-3 h-3" /><span>{porcentaje}% OFF</span>
                    </div>
                </div>
            );
        }
        return <span className="font-medium">{formatValue(precioFinal, "currency")}</span>;
    };

    const calcularSubtotalItem = (item: ListaItem) => (item.descuento || item.precio) * (item.quantity || 0);

    const generarPDF = (pedido: Pedido) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;
        let y = margin;

        doc.setFontSize(20); doc.setTextColor(40, 40, 40);
        doc.text('LISTA DE PEDIDO', pageWidth / 2, y, { align: 'center' }); y += 15;
        doc.setFontSize(12); doc.setTextColor(80, 80, 80);
        doc.text(`ID Pedido: ${pedido.id}`, margin, y); y += 8;
        doc.text(`Cliente: ${pedido.nombre || 'N/A'}`, margin, y); y += 8;
        doc.text(`Fecha: ${formatDate(pedido.fecha_creacion)}`, margin, y); y += 8;
        doc.text(`Servicio: ${pedido.servicio}`, margin, y); y += 15;

        const rows = pedido.items.map(item => {
            const precioFinal = item.descuento || item.precio;
            return [item.nombre || 'Producto', `${item.quantity} ${item.unidad}`, `$${item.precio.toFixed(2)}`,
            item.descuento ? `-$${(item.precio - precioFinal).toFixed(2)}` : '-',
            `$${(precioFinal * item.quantity).toFixed(2)}`];
        });
        rows.push(['TOTAL', '', '', pedido.descuentoTotal > 0 ? `-$${pedido.descuentoTotal.toFixed(2)}` : '-', `$${pedido.total.toFixed(2)}`]);

        autoTable(doc, {
            startY: y, head: [["Producto", "Cantidad", "Precio Unit.", "Descuento", "Subtotal"]], body: rows,
            theme: 'grid', styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] }, margin: { left: margin, right: margin }
        });
        doc.save(`pedido-${pedido.id}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // ── Progreso ───────────────────────────────────────────────────────────────
    const productosReales = pedidoSeleccionado?.items.filter(i => !i.esServicio && i.codigo !== "SPICKUP") ?? [];
    const recolectados = productosReales.filter(i => i.recolectado).length;
    const noEncontrados = productosReales.filter(i => i.noEncontrado).length;
    const pendientes = productosReales.length - recolectados - noEncontrados;
    const pct = productosReales.length > 0 ? Math.round(((recolectados + noEncontrados) / productosReales.length) * 100) : 0;

    const handleOpenChat = (pedido: Pedido) => {
        dispatch(openModalReducer({ modalName: `chat_${pedido.cliente_telefono}_${pedido.id}` }));
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Modal
            modalName="detalle_pedido"
            title={`Detalles de la Lista — ${pedidoSeleccionado?.nombre_lista || 'Cargando...'}`}
            maxWidth="4xl"
        >
            {pedidoSeleccionado ? (
                <div className="p-4 space-y-5">
                    {autoEstadoMsg && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-2.5 rounded-lg animate-pulse">
                            <Zap className="size-4 shrink-0" />
                            <span>{autoEstadoMsg}</span>
                        </div>
                    )}

                    {/* Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-2 text-sm">
                            <h3 className="font-semibold text-base border-b border-gray-200 pb-1.5">Información General</h3>
                            <p><span className="text-gray-500">ID Lista:</span> <strong>{pedidoSeleccionado.id}</strong></p>
                            <p><span className="text-gray-500">Cliente:</span> <strong>{pedidoSeleccionado.nombre}</strong></p>
                            <p><span className="text-gray-500">Tipo:</span> {pedidoSeleccionado.tipo_lista}</p>
                            <p><span className="text-gray-500">Creado:</span> {formatDate(pedidoSeleccionado.fecha_creacion)}</p>
                        </div>
                        <div className="space-y-2 text-sm">
                            <h3 className="font-semibold text-base border-b border-gray-200 pb-1.5">Estado y Servicio</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Servicio:</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pedidoSeleccionado.servicio === 'Pickup' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {pedidoSeleccionado.servicio}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">Estado:</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoBadgeClass(pedidoSeleccionado.estado)}`}>
                                    {ESTADO_META[pedidoSeleccionado.estado]?.label ?? pedidoSeleccionado.estado}
                                </span>
                            </div>
                            {pedidoSeleccionado.firma && (
                                <div className="mt-2">
                                    <span className="text-xs text-gray-400">Firma registrada</span>
                                    <img src={pedidoSeleccionado.firma} alt="Firma" className="max-h-20 border rounded" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 text-sm">
                            <h3 className="font-semibold text-base border-b border-gray-200 pb-1.5">Resumen Financiero</h3>
                            <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>{formatValue(pedidoSeleccionado.subtotal, "currency")}</span></div>
                            {pedidoSeleccionado.descuentoTotal > 0 && (
                                <div className="flex justify-between text-red-600"><span>Descuento:</span><span>-{formatValue(pedidoSeleccionado.descuentoTotal, "currency")}</span></div>
                            )}
                            <div className="flex justify-between font-bold border-t pt-2 mt-1"><span>Total:</span><span>{formatValue(pedidoSeleccionado.total, "currency")}</span></div>
                        </div>
                    </div>

                    {/* Barra de progreso */}
                    {productosReales.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span className="text-gray-700">Progreso de recolección</span>
                                <span className="text-gray-500">{pct}%</span>
                            </div>
                            <div className="h-3 rounded-full bg-gray-200 overflow-hidden flex gap-0.5">
                                {recolectados > 0 && <div className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full" style={{ width: `${(recolectados / productosReales.length) * 100}%` }} />}
                                {noEncontrados > 0 && <div className="h-full bg-red-400 transition-all duration-500" style={{ width: `${(noEncontrados / productosReales.length) * 100}%` }} />}
                                {pendientes > 0 && <div className="h-full bg-gray-200 flex-1 rounded-r-full" />}
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs">
                                <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-500 inline-block" /><span className="text-gray-600">Recolectados: <strong className="text-emerald-700">{recolectados}</strong></span></div>
                                <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-400 inline-block" /><span className="text-gray-600">No encontrados: <strong className="text-red-600">{noEncontrados}</strong></span></div>
                                <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-gray-300 inline-block" /><span className="text-gray-600">Pendientes: <strong>{pendientes}</strong></span></div>
                            </div>
                            {pct === 100 && noEncontrados === 0 && <p className="text-xs text-emerald-700 flex items-center gap-1 font-medium"><CheckCircle2 className="size-3.5" /> ¡Todos los productos recolectados! El pedido se marcó como <strong>Listo</strong>.</p>}
                            {noEncontrados > 0 && pendientes === 0 && <p className="text-xs text-orange-600 flex items-center gap-1 font-medium"><AlertTriangle className="size-3.5" /> Hay productos no encontrados. El pedido se marcó como <strong>Incompleto</strong>.</p>}
                            {noEncontrados > 0 && pendientes > 0 && <p className="text-xs text-amber-600 flex items-center gap-1 font-medium"><AlertTriangle className="size-3.5" /> Atención: {noEncontrados} producto(s) marcado(s) como no encontrado. El estado cambiará al terminar.</p>}
                        </div>
                    )}

                    {/* Tabla de productos */}
                    <div className="overflow-x-auto">
                        <h3 className="font-semibold text-base mb-3">Productos en la Lista <span className="text-sm font-normal text-gray-400">({pedidoSeleccionado.items.length} items)</span></h3>
                        <div className="border border-gray-200 rounded-xl overflow-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                    <tr>
                                        <th className="px-3 py-2.5 text-center w-10">✓</th>
                                        <th className="px-3 py-2.5 text-center w-10">⚠️</th>
                                        <th className="px-4 py-2.5 text-left">Producto</th>
                                        <th className="px-4 py-2.5 text-left">Categoría</th>
                                        <th className="px-4 py-2.5 text-center">Cant.</th>
                                        <th className="px-4 py-2.5 text-right">Precio</th>
                                        <th className="px-4 py-2.5 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedidoSeleccionado.items.map((item: any, index) => {
                                        const isNo = item.noEncontrado;
                                        const isRec = item.recolectado;
                                        const esServicio = item.esServicio || item.codigo === "SPICKUP";
                                        let rowClass = 'border-t border-gray-100 transition-colors ';
                                        if (isNo) rowClass += 'bg-red-50 hover:bg-red-100/70';
                                        else if (isRec) rowClass += 'bg-emerald-50 hover:bg-emerald-100/70';
                                        else if (esServicio) rowClass += 'bg-blue-50 hover:bg-blue-100/70';
                                        else rowClass += 'hover:bg-gray-50';
                                        return (
                                            <tr key={index} className={rowClass}>
                                                <td className="px-3 py-3 text-center">
                                                    <button
                                                        onClick={() => !isNo && handleToggleRecolectado(pedidoSeleccionado.id, item.id, !isRec)}
                                                        disabled={isNo}
                                                        className={`size-6 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${isNo ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-40' : isRec ? 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600' : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'}`}
                                                    >
                                                        {isRec && <CheckCircle2 className="size-3.5" />}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <button
                                                        onClick={() => !isRec && handleToggleNoEncontrado(pedidoSeleccionado.id, item.id, !isNo)}
                                                        disabled={isRec}
                                                        className={`size-6 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${isRec ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-40' : isNo ? 'border-red-500 bg-red-500 text-white hover:bg-red-600' : 'border-gray-300 hover:border-red-400 hover:bg-red-50'}`}
                                                    >
                                                        {isNo && <XCircle className="size-3.5" />}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className={`font-medium flex flex-col ${isNo ? 'line-through text-red-500' : ''}`}>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span>{item.nombre || item.descripcion}</span>
                                                            {esServicio && <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded">Servicio</span>}
                                                            {isRec && <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded font-medium">✓ Recolectado</span>}
                                                            {isNo && <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 rounded font-medium">⚠ No encontrado</span>}
                                                        </div>
                                                        <span className="text-xs text-gray-400 mt-0.5">CB: {item.id}{item.codigo && item.codigo !== "SPICKUP" ? ` · ${item.codigo}` : ''}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">{item.categoria || 'Servicio'}</td>
                                                <td className="px-4 py-3 text-center"><span className={`font-medium ${isNo ? 'line-through text-gray-400' : ''}`}>{item.quantity}</span><span className="text-xs text-gray-400 ml-1">{item.unidad}</span></td>
                                                <td className="px-4 py-3 text-right">{renderPrecio(item)}</td>
                                                <td className={`px-4 py-3 text-right font-medium ${isNo ? 'line-through text-red-400' : ''}`}>{formatValue(calcularSubtotalItem(item), "currency")}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Panel de control */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex flex-wrap gap-4 items-start justify-between">
                            {pedidoSeleccionado.estado !== 'entregado' && (
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={() => handleActualizarEstado('cancelado')} className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${pedidoSeleccionado.estado === 'cancelado' ? 'bg-red-50 text-red-600 ring-1 ring-red-300 cursor-default' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>Cancelar</button>
                                </div>
                            )}
                            <div className="flex gap-2 flex-wrap">
                                <button onClick={() => { generarPDF(pedidoSeleccionado); handleActualizarEstado('proceso') }} className="cursor-pointer px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5"><NotepadText className="size-3.5" /> PDF</button>
                                <button onClick={handleOpenSignaturePad} disabled={!['listo', 'proceso'].includes(pedidoSeleccionado.estado)} className="cursor-pointer px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-40"><Signature className="size-3.5" /> Entregar</button>
                                <button onClick={() => handleOpenChat(pedidoSeleccionado)} className="cursor-pointer px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white transition-colors rounded-lg" title={`Abrir chat con ${pedidoSeleccionado.nombre || 'cliente'}`}><MessageCircle className="h-4 w-4" /></button>
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1"><Zap className="size-3 text-amber-400" /> El estado cambia <strong className="text-gray-500">automáticamente</strong> al marcar productos como recolectados o no encontrados.</p>
                    </div>

                    {/* Modal de firma */}
                    {showSignaturePad && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
                                <ul className="flex flex-col relative">
                                    <li><h3 className="text-lg font-semibold flex items-center gap-2"><Signature className="size-5" /> Firma de entrega</h3></li>
                                    <li className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 className="size-3 text-emerald-500" /> Productos recolectados: {recolectados}</li>
                                    <li className="flex items-center gap-2 text-sm text-gray-600"><XCircle className="size-3 text-red-400" /> Productos no encontrados: {noEncontrados}</li>
                                    <li className="absolute right-0"><Button onClick={() => setShowSignaturePad(false)} color="completed" size="small">cerrar</Button></li>
                                </ul>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                                    <canvas ref={canvasRef} width={400} height={200} className="w-full touch-none bg-white" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawingTouch} onTouchMove={drawTouch} onTouchEnd={stopDrawing} />
                                </div>
                                <div className="flex justify-between">
                                    <Button onClick={clearSignature} color="second" size="small">Limpiar</Button>
                                    <Button onClick={confirmSignature} color="completed" size="small">Confirmar entrega</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-12 text-center">
                    <Package className="size-14 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No se pudo cargar la información del pedido.</p>
                </div>
            )}
        </Modal>
    );
};