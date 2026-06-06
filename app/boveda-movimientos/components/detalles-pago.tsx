"use client";

import {
    User, Mail, Phone, MapPin, Calendar, Briefcase,
    Building, DollarSign, FileText, BadgeCheck,
    Download, Clock, Hash, X
} from "lucide-react";
import { useAppSelector } from "@/hooks/selector";
import { closeModalReducer } from "@/hooks/reducers/drop-down";
import { useAppDispatch } from "@/hooks/selector";
import { Button } from "@/components/button";

export const DetallesPago = ({ selectedPago }: any) => {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state: any) => state.dropDownReducer.modals['detalles-pago']);

    const handleClose = () => {
        dispatch(closeModalReducer({ modalName: 'detalles-pago' }));
    };

    if (!isOpen || !selectedPago) return null;

    const pago:any = selectedPago;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const getStatusColor = (estado: string) => {
        return estado === "Activo"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
    };

    const SectionTitle = ({ title }: { title: string }) => (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            {title}
        </h3>
    );

    return (
        <div className="p-4">
            {/* Header con información básica */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900">
                            {pago.nombre} {pago.apellido}
                        </h2>
                        <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pago.estado)}`}>
                                {pago.estado}
                            </span>
                            <span className="text-sm text-gray-500">#{pago.num_empleado}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                <Button
                    onClick={handleClose}
                    color="second"
                    size="small"
                >
                    Cerrar
                </Button>
                <Button
                    onClick={() => {
                        // Aquí puedes implementar la descarga de información
                        console.log('Descargar información de', pago.nombre);
                    }}
                    color="success"
                    size="small"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Info
                </Button>
            </div>
        </div>
    );
};