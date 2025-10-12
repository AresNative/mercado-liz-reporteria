"use client"

import { openModalReducer } from "@/hooks/reducers/drop-down";
import { useAppDispatch } from "@/hooks/selector";
import { Eye, Truck, Clock, CheckCircle, XCircle, Store, Home, MessageCircle } from "lucide-react"
import { useState } from "react";
import { ModalChat } from "./modal-chat";
import { CountdownTimer } from "@/components/counter-down";

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
    estado: 'nuevo' | 'proceso' | 'listo' | 'entregado' | 'cancelado' | 'incompleto';
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
const getUrgenciaBadge = (
    urgencia: string,
    fechaEntrega: any, // nombre_lista es la fecha de entrega
    pedidoId: number,
    estadoActual: string,
    onUpdateStatus: (pedidoId: number, nuevoEstado: string) => void
) => {
    // Convertir la fecha de entrega (nombre_lista) a timestamp
    const fechaExpiracion = new Date(fechaEntrega);

    const handleTiempoExpirado = () => {
        // Si el tiempo expiró y el pedido no está entregado o cancelado, marcarlo como incompleto
        if (estadoActual !== 'entregado' && estadoActual !== 'incompleto' && estadoActual !== 'cancelado') {
            console.log(`⏰ Tiempo expirado para pedido ${pedidoId}, marcando como INCOMPLETO`);
            onUpdateStatus(pedidoId, 'incompleto');
        }
    };

    switch (urgencia) {
        case 'alta':
            return (
                <span className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Clock className="h-3 w-3 mr-1" />
                    <CountdownTimer
                        endDate={fechaExpiracion}
                        refrech={handleTiempoExpirado}
                    />
                </span>
            );
        case 'media':
            return (
                <span className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3 mr-1" />
                    <CountdownTimer
                        endDate={fechaExpiracion}
                        refrech={handleTiempoExpirado}
                    />
                </span>
            );
        default:
            return null;
    }
};

interface TablaPedidosProps {
    data: Pedido[];
    onViewDetails: (pedido: Pedido) => void;
    onUpdateStatus: (pedidoId: number, nuevoEstado: string) => void;
}

export const TablaPedidos = ({ data, onViewDetails, onUpdateStatus }: TablaPedidosProps) => {
    const dispatch = useAppDispatch();

    const handleOpenChat = (pedido: Pedido) => {
        const telefonoCliente = pedido.cliente_telefono || 'general';
        dispatch(openModalReducer({ modalName: `chat_${telefonoCliente}` }));
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'entregado': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'cancelado': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'incompleto': return <XCircle className="h-4 w-4 text-orange-500" />;
            case 'proceso': return <CheckCircle className="h-4 w-4 text-indigo-500" />;
            case 'listo': return <CheckCircle className="h-4 w-4 text-blue-500" />;
            default: return <Clock className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'nuevo': return 'bg-yellow-100 text-yellow-800';
            case 'proceso': return 'bg-indigo-100 text-indigo-800';
            case 'listo': return 'bg-blue-100 text-blue-800';
            case 'entregado': return 'bg-green-100 text-green-800';
            case 'cancelado': return 'bg-red-100 text-red-800';
            case 'incompleto': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getEstadoDisplay = (estado: string) => {
        const estados: { [key: string]: string } = {
            'nuevo': 'Nuevo',
            'proceso': 'En Proceso',
            'listo': 'Listo',
            'entregado': 'Entregado',
            'cancelado': 'Cancelado',
            'incompleto': 'Incompleto'
        };
        return estados[estado] || estado;
    };

    const getServicioIcon = (servicio: string) => {
        switch (servicio) {
            case 'Pickup': return <Store className="h-4 w-4 text-green-500" />;
            case 'Domicilio': return <Home className="h-4 w-4 text-blue-500" />;
            default: return <Truck className="h-4 w-4 text-gray-500" />;
        }
    };

    const getServicioColor = (servicio: string) => {
        switch (servicio) {
            case 'Pickup': return 'text-green-700';
            case 'Domicilio': return 'text-blue-700';
            default: return 'text-gray-700';
        }
    };

    const formatFecha = (fecha: string) => {
        try {
            return new Date(fecha).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    };

    const getNextEstado = (currentEstado: string): string | null => {
        const workflow: { [key: string]: string } = {
            'nuevo': 'proceso',
            'proceso': 'listo',
            'listo': 'entregado'
        };
        // No permitir cambiar estado si está incompleto, cancelado o entregado
        if (currentEstado === 'incompleto' || currentEstado === 'cancelado' || currentEstado === 'entregado') {
            return null;
        }
        return workflow[currentEstado] || null;
    };

    const getActionIcon = (nextEstado: string) => {
        switch (nextEstado) {
            case 'proceso': return <Clock className="h-4 w-4" />;
            case 'listo': return <CheckCircle className="h-4 w-4" />;
            case 'entregado': return <Truck className="h-4 w-4" />;
            default: return <CheckCircle className="h-4 w-4" />;
        }
    };

    const getActionTitle = (nextEstado: string) => {
        switch (nextEstado) {
            case 'proceso': return 'Marcar como En Proceso';
            case 'listo': return 'Marcar como Listo';
            case 'entregado': return 'Marcar como Entregado';
            default: return 'Actualizar estado';
        }
    };

    const getActionColor = (nextEstado: string) => {
        switch (nextEstado) {
            case 'proceso': return 'text-blue-600 hover:text-blue-900';
            case 'listo': return 'text-green-600 hover:text-green-900';
            case 'entregado': return 'text-purple-600 hover:text-purple-900';
            default: return 'text-gray-600 hover:text-gray-900';
        }
    };

    // Función para determinar si mostrar el contador
    const debeMostrarContador = (pedido: Pedido): boolean => {
        // Solo mostrar contador para pedidos activos que tengan fecha de entrega
        const estadosActivos = ['nuevo', 'proceso', 'listo'];
        return (
            estadosActivos.includes(pedido.estado) &&
            typeof pedido.urgencia !== 'undefined' &&
            pedido.urgencia !== 'baja' &&
            pedido.nombre_lista !== undefined &&
            pedido.nombre_lista !== null &&
            pedido.nombre_lista !== ''
        );
    };

    return (
        <div className="overflow-x-auto">
            {/* Modal de chat para cada cliente específico */}
            {data.map((pedido) => {
                const telefonoCliente = pedido.cliente_telefono || 'general';
                return (
                    <ModalChat
                        key={`chat-${pedido.id}`}
                        telefonoClient={telefonoCliente}
                    />
                );
            })}

            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Cita</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map((pedido) => {
                        const nextEstado = getNextEstado(pedido.estado);
                        const itemsCount = pedido.items?.length || 0;
                        const mostrarContador = debeMostrarContador(pedido);

                        return (
                            <tr key={pedido.id} className="hover:bg-gray-50">
                                {/* Columna de Prioridad */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {mostrarContador && pedido.urgencia && pedido.nombre_lista ? (
                                        getUrgenciaBadge(
                                            pedido.urgencia,
                                            pedido.nombre_lista,
                                            pedido.id,
                                            pedido.estado,
                                            onUpdateStatus
                                        )
                                    ) : (
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            {pedido.estado === 'incompleto' ? 'Incompleto' : 'Normal'}
                                        </span>
                                    )}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">#{pedido.id}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {pedido.nombre || `Cliente ${pedido.id_cliente}`}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {pedido.cliente_telefono || 'N/A'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {getServicioIcon(pedido.servicio)}
                                        <span className={`ml-2 text-sm font-medium ${getServicioColor(pedido.servicio)}`}>
                                            {pedido.servicio}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {getEstadoIcon(pedido.estado)}
                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(pedido.estado)}`}>
                                            {getEstadoDisplay(pedido.estado)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        {itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                        {pedido.nombre_lista ? formatFecha(pedido.nombre_lista) : 'No asignada'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        ${pedido.total.toFixed(2)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => onViewDetails(pedido)}
                                            className="text-blue-600 hover:text-blue-900 transition-colors"
                                            title="Ver detalles"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>

                                        {/* Botón de Chat */}
                                        <button
                                            onClick={() => handleOpenChat(pedido)}
                                            className="text-purple-600 hover:text-purple-900 transition-colors"
                                            title={`Abrir chat con ${pedido.nombre || 'cliente'}`}
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </button>

                                        {nextEstado && pedido.estado !== 'cancelado' && (
                                            <button
                                                onClick={() => onUpdateStatus(pedido.id, nextEstado)}
                                                className={`transition-colors ${getActionColor(nextEstado)}`}
                                                title={getActionTitle(nextEstado)}
                                            >
                                                {getActionIcon(nextEstado)}
                                            </button>
                                        )}

                                        {pedido.estado !== 'cancelado' && (
                                            <button
                                                onClick={() => onUpdateStatus(pedido.id, 'cancelado')}
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                                title="Cancelar lista"
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};