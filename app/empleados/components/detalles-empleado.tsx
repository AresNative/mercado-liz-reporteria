"use client";

import {
    User, Mail, Phone, MapPin, Calendar, Briefcase,
    Building, DollarSign, FileText, BadgeCheck,
    Download, Clock, Hash, X
} from "lucide-react";
import { useAppSelector } from "@/hooks/selector";
import { closeModalReducer } from "@/hooks/reducers/drop-down";
import { useAppDispatch } from "@/hooks/selector";

interface Empleado {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    direccion: string | null;
    fecha_nacimiento: string;
    fecha_ingreso: string;
    puesto: string;
    departamento: string;
    salario: number;
    estado: string;
    rfc: string;
    curp: string;
    nss: string;
    cuenta_bancaria: string | null;
    banco: string | null;
    clabe: string | null;
    usuario_id: number;
    num_empleado: number;
}

export const ModalDetallesEmpleado = ({ selectedEmpleado }: any) => {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state: any) => state.dropDownReducer.modals['detalles-empleado']);

    const handleClose = () => {
        dispatch(closeModalReducer({ modalName: 'detalles-empleado' }));
    };

    if (!isOpen || !selectedEmpleado) return null;

    const empleado: Empleado = selectedEmpleado;

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

    const InfoItem = ({ icon: Icon, label, value, className = "" }: {
        icon: any;
        label: string;
        value: string | number | null;
        className?: string;
    }) => (
        <div className={`flex items-start space-x-3 ${className}`}>
            <Icon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-sm text-gray-900 mt-1 break-words">
                    {value || "No especificado"}
                </p>
            </div>
        </div>
    );

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
                            {empleado.nombre} {empleado.apellido}
                        </h2>
                        <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(empleado.estado)}`}>
                                {empleado.estado}
                            </span>
                            <span className="text-sm text-gray-500">#{empleado.num_empleado}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div className="space-y-4">
                    <SectionTitle title="Información Personal" />

                    <InfoItem
                        icon={Mail}
                        label="Email"
                        value={empleado.email}
                    />

                    <InfoItem
                        icon={Phone}
                        label="Teléfono"
                        value={empleado.telefono}
                    />

                    <InfoItem
                        icon={MapPin}
                        label="Dirección"
                        value={empleado.direccion}
                    />

                    <InfoItem
                        icon={Calendar}
                        label="Fecha de Nacimiento"
                        value={formatDate(empleado.fecha_nacimiento)}
                    />
                </div>

                {/* Información Laboral */}
                <div className="space-y-4">
                    <SectionTitle title="Información Laboral" />

                    <InfoItem
                        icon={Briefcase}
                        label="Puesto"
                        value={empleado.puesto}
                    />

                    <InfoItem
                        icon={Building}
                        label="Departamento"
                        value={empleado.departamento}
                    />

                    <InfoItem
                        icon={DollarSign}
                        label="Salario"
                        value={formatCurrency(empleado.salario)}
                    />

                    <InfoItem
                        icon={Calendar}
                        label="Fecha de Ingreso"
                        value={formatDate(empleado.fecha_ingreso)}
                    />
                </div>
            </div>

            {/* Información Fiscal y Bancaria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-4">
                    <SectionTitle title="Información Fiscal" />

                    <InfoItem
                        icon={FileText}
                        label="RFC"
                        value={empleado.rfc}
                    />

                    <InfoItem
                        icon={BadgeCheck}
                        label="CURP"
                        value={empleado.curp}
                    />

                    <InfoItem
                        icon={Hash}
                        label="NSS"
                        value={empleado.nss}
                    />
                </div>

                <div className="space-y-4">
                    <SectionTitle title="Información Bancaria" />

                    <InfoItem
                        icon={Building}
                        label="Banco"
                        value={empleado.banco}
                    />

                    <InfoItem
                        icon={Hash}
                        label="Cuenta Bancaria"
                        value={empleado.cuenta_bancaria}
                    />

                    <InfoItem
                        icon={Hash}
                        label="CLABE"
                        value={empleado.clabe}
                    />
                </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                    Cerrar
                </button>
                <button
                    onClick={() => {
                        // Aquí puedes implementar la descarga de información
                        console.log('Descargar información de', empleado.nombre);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Info
                </button>
            </div>
        </div>
    );
};