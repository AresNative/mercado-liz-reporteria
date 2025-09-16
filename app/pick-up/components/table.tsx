"use client"

import { Eye, Truck, Clock, CheckCircle, XCircle } from "lucide-react"

interface Pedido {
    id: number;
    numero_pedido: string;
    cliente_nombre: string;
    tipo_entrega: 'pickup' | 'domicilio';
    estado: string;
    fecha_creacion: string;
    total: number;
    direccion_entrega?: string;
    sucursal_recoger?: string;
}

interface TablaPedidosProps {
    data: Pedido[];
    onViewDetails: (_: any) => void;
    onUpdateStatus: (pedidoId: number, nuevoEstado: string) => void;
}

export const TablaPedidos = ({ data, onViewDetails, onUpdateStatus }: TablaPedidosProps) => {
    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'entregado': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'cancelado': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Clock className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'preparando': return 'bg-blue-100 text-blue-800';
            case 'listo': return 'bg-green-100 text-green-800';
            case 'en_camino': return 'bg-purple-100 text-purple-800';
            case 'entregado': return 'bg-green-100 text-green-800';
            case 'cancelado': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map((pedido) => (
                        <tr key={pedido.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{pedido.numero_pedido}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{pedido.cliente_nombre}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    {pedido.tipo_entrega === 'pickup' ? (
                                        <>
                                            <Truck className="h-4 w-4 text-green-500 mr-1" />
                                            <span className="text-sm text-green-700">Pick-Up</span>
                                        </>
                                    ) : (
                                        <>
                                            <Truck className="h-4 w-4 text-blue-500 mr-1" />
                                            <span className="text-sm text-blue-700">Domicilio</span>
                                        </>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    {getEstadoIcon(pedido.estado)}
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(pedido.estado)}`}>
                                        {pedido.estado.replace('_', ' ')}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{formatFecha(pedido.fecha_creacion)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">${pedido.total.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => onViewDetails(pedido)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Ver detalles"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    {pedido.estado === 'listo' && pedido.tipo_entrega === 'domicilio' && (
                                        <button
                                            onClick={() => onUpdateStatus(pedido.id, 'en_camino')}
                                            className="text-green-600 hover:text-green-900"
                                            title="Marcar como en camino"
                                        >
                                            <Truck className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}