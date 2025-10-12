import { Modal } from "@/components/modal";
import { useGetWithFiltersGeneralMutation, usePutGeneralMutation } from "@/hooks/reducers/api"
import jsPDF from "jspdf";
import { useCallback, useEffect, useState } from "react";
import { Trash, Printer, NotepadText } from "lucide-react";
import { usePedidosSignalR } from "../utils/singalr-pedidos";

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

interface ModalListProps {
    pedidoId: number;
    onEstadoActualizado?: (pedidoId: number, nuevoEstado: string) => void;
    onItemActualizado?: (pedidoId: number, itemId: string, tipo: string, valor: boolean) => void;
}

export const ModalList = ({ pedidoId, onEstadoActualizado, onItemActualizado }: ModalListProps) => {
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
    const [putGeneral] = usePutGeneralMutation();
    const [getWithFiltersGeneral] = useGetWithFiltersGeneralMutation();

    // ✅ CALLBACKS CORRECTOS PARA SIGNALR EN EL MODAL
    const handlePedidoActualizado = useCallback((pedidoActualizado: any) => {
        console.log('🔄 Pedido actualizado en modal:', pedidoActualizado);
        if (pedidoActualizado.id === pedidoId) {
            const pedidoProcesado = parseListaData(pedidoActualizado);
            setPedidoSeleccionado(pedidoProcesado);
        }
    }, [pedidoId]);

    const handleNuevoPedido = useCallback(() => {
        // No necesario para el modal
    }, []);

    const handlePedidoEliminado = useCallback((pedidoIdEliminado: number) => {
        if (pedidoIdEliminado === pedidoId) {
            console.log('🗑️ Pedido eliminado, cerrando modal');
            setPedidoSeleccionado(null);
        }
    }, [pedidoId]);

    const handleRefrescarDatos = useCallback(() => {
        console.log('🔄 Refrescando datos del modal...');
        if (pedidoId) {
            fetchPedidoDetalle();
        }
    }, [pedidoId]);

    // ✅ CONEXIÓN SIGNALR ESPECÍFICA PARA EL MODAL
    const {
        connection,
        isConnected,
        unirseAPedido,
        salirDePedido,
        notificarCambioLista
    } = usePedidosSignalR(
        handlePedidoActualizado,
        handleNuevoPedido,
        handlePedidoEliminado,
        handleRefrescarDatos
    );

    // ✅ UNIRSE Y SALIR DEL GRUPO DEL PEDIDO
    useEffect(() => {
        if (pedidoId && isConnected) {
            console.log(`🔗 Uniendo modal al pedido ${pedidoId}`);
            unirseAPedido(pedidoId);
        }

        return () => {
            if (pedidoId && isConnected) {
                console.log(`🔓 Saliendo del pedido ${pedidoId}`);
                salirDePedido(pedidoId);
            }
        };
    }, [pedidoId, isConnected, unirseAPedido, salirDePedido]);

    // ✅ ESCUCHAR ACTUALIZACIONES ESPECÍFICAS DE PRODUCTOS
    useEffect(() => {
        if (connection && isConnected) {
            // Escuchar actualizaciones específicas de recolección
            connection.on("ReceiveProductoRecogidaUpdate", (pedidoIdActualizado: number, productoId: string, recolectado: boolean) => {
                if (pedidoIdActualizado === pedidoId) {
                    console.log(`📦 Actualización de recogida: producto ${productoId} -> ${recolectado}`);
                    setPedidoSeleccionado(prev => prev ? {
                        ...prev,
                        items: prev.items.map(item =>
                            item.id === productoId
                                ? { ...item, recolectado }
                                : item
                        )
                    } : null);
                }
            });

            // Escuchar actualizaciones de no encontrado
            connection.on("ReceiveProductoNoEncontradoUpdate", (pedidoIdActualizado: number, productoId: string, noEncontrado: boolean) => {
                if (pedidoIdActualizado === pedidoId) {
                    console.log(`⚠️ Actualización de no encontrado: producto ${productoId} -> ${noEncontrado}`);
                    setPedidoSeleccionado(prev => prev ? {
                        ...prev,
                        items: prev.items.map(item =>
                            item.id === productoId
                                ? { ...item, noEncontrado }
                                : item
                        )
                    } : null);
                }
            });

            return () => {
                connection.off("ReceiveProductoRecogidaUpdate");
                connection.off("ReceiveProductoNoEncontradoUpdate");
            };
        }
    }, [connection, isConnected, pedidoId]);

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
            urgencia: 'baja',
            tiempo_restante: 0
        };
    }

    // Función para cargar los datos de la lista específica
    const fetchPedidoDetalle = useCallback(async () => {
        if (!pedidoId) return;
        try {
            const filtros = {
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
                Filtros: [
                    { Key: "listas.id", Value: pedidoId, Operator: "=" }
                ],
                Order: [
                    { Key: "listas.id", Direction: "ASC" }
                ]
            };

            const response = await getWithFiltersGeneral({
                table: "listas left join clientes on listas.id_cliente = clientes.id",
                pageSize: 1,
                page: 1,
                tag: 'PedidoDetalle',
                filtros: filtros
            }).unwrap();

            if (response && response.data && response.data.length > 0) {
                const pedidoProcesado = parseListaData(response.data[0]);
                setPedidoSeleccionado(pedidoProcesado);
            }
        } catch (error) {
            console.error("Error fetching pedido detalle:", error);
        }
    }, [getWithFiltersGeneral, pedidoId]);

    // Cargar datos cuando cambia el pedidoId
    useEffect(() => {
        if (pedidoId) {
            fetchPedidoDetalle();
        }
    }, [pedidoId, fetchPedidoDetalle]);

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

    const handleActualizarEstado = async (pedidoId: number, nuevoEstado: string) => {
        if (!pedidoSeleccionado) return;

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
            setPedidoSeleccionado(prev => prev ? {
                ...prev,
                estado: nuevoEstado as any,
                fecha_actualizacion: new Date().toISOString()
            } : null);

            // ✅ NOTIFICAR CAMBIO A TRAVÉS DE SIGNALR
            if (isConnected) {
                await notificarCambioLista('EstadoActualizado', {
                    pedidoId: pedidoId,
                    nuevoEstado: nuevoEstado,
                    timestamp: new Date().toISOString()
                });
            }

            // Notificar al componente padre
            if (onEstadoActualizado) {
                onEstadoActualizado(pedidoId, nuevoEstado);
            }

        } catch (error) {
            console.error("Error actualizando estado:", error);
            await fetchPedidoDetalle();
        }
    };

    // ✅ FUNCIÓN MEJORADA CON SIGNALR PARA RECOLECCIÓN
    const handleToggleRecolectado = async (listaId: number, itemId: string, recolectado: boolean) => {
        if (!pedidoSeleccionado) return;

        try {
            const itemsActualizados = pedidoSeleccionado.items.map((item: any) =>
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

            setPedidoSeleccionado(prev => prev ? {
                ...prev,
                items: itemsActualizados,
                fecha_actualizacion: new Date().toISOString()
            } : null);

            // ✅ NOTIFICAR CAMBIO A TRAVÉS DE SIGNALR
            if (isConnected) {
                await notificarCambioLista('ProductoRecogidaActualizada', {
                    pedidoId: listaId,
                    productoId: itemId,
                    recolectado: recolectado,
                    timestamp: new Date().toISOString()
                });
            }

            // Notificar al componente padre
            if (onItemActualizado) {
                onItemActualizado(listaId, itemId, 'recolectado', recolectado);
            }
        } catch (error) {
            console.error('Error al actualizar estado de recolección:', error);
        }
    };

    // ✅ FUNCIÓN MEJORADA CON SIGNALR PARA NO ENCONTRADO
    const handleToggleNoEncontrado = async (listaId: number, itemId: string, noEncontrado: boolean) => {
        if (!pedidoSeleccionado) return;

        try {
            const itemsActualizados = pedidoSeleccionado.items.map((item: any) =>
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

            setPedidoSeleccionado(prev => prev ? {
                ...prev,
                items: itemsActualizados,
                fecha_actualizacion: new Date().toISOString()
            } : null);

            // ✅ NOTIFICAR CAMBIO A TRAVÉS DE SIGNALR
            if (isConnected) {
                await notificarCambioLista('ProductoNoEncontradoActualizado', {
                    pedidoId: listaId,
                    productoId: itemId,
                    noEncontrado: noEncontrado,
                    timestamp: new Date().toISOString()
                });
            }

            // Notificar al componente padre
            if (onItemActualizado) {
                onItemActualizado(listaId, itemId, 'noEncontrado', noEncontrado);
            }

        } catch (error) {
            console.error('Error al actualizar estado de producto no encontrado:', error);
        }
    };

    const handleMarcarTodosEncontrados = async (listaId: number) => {
        if (!pedidoSeleccionado) return;

        try {
            const itemsActualizados = pedidoSeleccionado.items.map((item: any) => ({
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

            setPedidoSeleccionado(prev => prev ? {
                ...prev,
                items: itemsActualizados,
                fecha_actualizacion: new Date().toISOString()
            } : null);

            // ✅ NOTIFICAR CAMBIO A TRAVÉS DE SIGNALR
            if (isConnected) {
                await notificarCambioLista('TodosProductosEncontrados', {
                    pedidoId: listaId,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('Error al marcar todos como encontrados:', error);
        }
    };

    const handleMarcarTodosRecolectados = async (listaId: number) => {
        if (!pedidoSeleccionado) return;

        try {
            const itemsActualizados = pedidoSeleccionado.items.map((item: any) => ({
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

            setPedidoSeleccionado(prev => prev ? {
                ...prev,
                items: itemsActualizados,
                fecha_actualizacion: new Date().toISOString()
            } : null);

            // ✅ NOTIFICAR CAMBIO A TRAVÉS DE SIGNALR
            if (isConnected) {
                await notificarCambioLista('TodosProductosRecolectados', {
                    pedidoId: listaId,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('Error al marcar todos como recolectados:', error);
        }
    };

    const handleDesmarcarTodosRecolectados = async (listaId: number) => {
        if (!pedidoSeleccionado) return;

        try {
            const itemsActualizados = pedidoSeleccionado.items.map((item: any) => ({
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

            setPedidoSeleccionado(prev => prev ? {
                ...prev,
                items: itemsActualizados,
                fecha_actualizacion: new Date().toISOString()
            } : null);

            // ✅ NOTIFICAR CAMBIO A TRAVÉS DE SIGNALR
            if (isConnected) {
                await notificarCambioLista('TodosProductosDesmarcados', {
                    pedidoId: listaId,
                    timestamp: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('Error al desmarcar todos como recolectados:', error);
        }
    };

    return (
        <Modal
            modalName="detalle_pedido"
            title={`Detalles de la Lista - ${pedidoSeleccionado?.nombre_lista || 'Cargando...'}`}
            maxWidth="4xl"
        >
            {pedidoSeleccionado ? (
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
                                    <Printer className="size-3" />
                                    Imprimir Lista
                                </button>
                                <button
                                    onClick={() => generarPDF(pedidoSeleccionado)}
                                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                                >
                                    <NotepadText className="size-3" />
                                    Imprimir Tiket
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
            ) : (
                <div className="p-8 text-center">
                    <p className="text-gray-500">No se pudo cargar la información del pedido.</p>
                </div>
            )}
        </Modal>
    );
};