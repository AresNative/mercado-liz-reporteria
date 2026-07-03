"use client";

import {
    User, Mail, Phone, MapPin, Calendar, Briefcase,
    Building, DollarSign, FileText, BadgeCheck,
    Download, Hash, Users, CreditCard, Landmark, Clock
} from "lucide-react";
import { useAppSelector } from "@/hooks/selector";
import { closeModalReducer } from "@/hooks/reducers/drop-down";
import { useAppDispatch } from "@/hooks/selector";

const SUCURSALES: Record<string, string> = {
    "1": "Guadalupe",
    "2": "Testerazo",
    "3": "Palmas",
    "4": "Mayoreo",
};

export const ModalDetallesEmpleado = ({ selectedEmpleado }: { selectedEmpleado: any | null }) => {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state: any) => state.dropDownReducer.modals['detalles-empleado']);

    const handleClose = () => {
        dispatch(closeModalReducer({ modalName: 'detalles-empleado' }));
    };

    if (!isOpen || !selectedEmpleado) return null;

    const empleado = selectedEmpleado;

    // --- Helpers a prueba de nulls ---

    const getNumber = (value: any): number | null => {
        if (value === null || value === undefined) return null;
        if (typeof value === "number") return value;
        return typeof value.parsedValue === "number" ? value.parsedValue : null;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (value: any) => {
        const amount = getNumber(value);
        if (amount === null) return null;
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const nombreCompleto = [empleado.Nombre, empleado.ApellidoPaterno, empleado.ApellidoMaterno]
        .filter(Boolean)
        .join(" ");

    const direccionCompleta = [
        empleado.Direccion && empleado.DireccionNumero
            ? `${empleado.Direccion} #${empleado.DireccionNumero}`
            : empleado.Direccion,
        empleado.DireccionNumeroInt ? `Int. ${empleado.DireccionNumeroInt}` : null,
        empleado.Colonia,
        empleado.Delegacion,
        empleado.Poblacion,
        empleado.Estado,
        empleado.CodigoPostal ? `C.P. ${empleado.CodigoPostal}` : null,
    ].filter(Boolean).join(", ") || null;

    const isActivo = empleado.Estatus === "ALTA";

    const getStatusColor = (estatus: string | null) => {
        return estatus === "ALTA"
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400";
    };

    const sucursal = empleado.SucursalTrabajo
        ? SUCURSALES[String(empleado.SucursalTrabajo)] ?? `Sucursal ${empleado.SucursalTrabajo}`
        : null;

    const InfoItem = ({ icon: Icon, label, value, className = "" }: {
        icon: any;
        label: string;
        value: string | number | null | undefined;
        className?: string;
    }) => (
        <div className={`flex items-start space-x-3 ${className}`}>
            <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 break-words">
                    {value || value === 0 ? value : "No especificado"}
                </p>
            </div>
        </div>
    );

    const SectionTitle = ({ title, icon: Icon }: { title: string; icon?: any }) => (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />}
            {title}
        </h3>
    );

    return (
        <div className="p-4">
            {/* Header con información básica */}
            <div className="bg-gray-50 dark:bg-gray-800/70 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
                            {nombreCompleto || "Sin nombre registrado"}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(empleado.Estatus)}`}>
                                {empleado.Estatus === "ALTA" ? "Activo" : empleado.Estatus === "BAJA" ? "Baja" : (empleado.Estatus || "Sin estatus")}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">No. {empleado.Personal}</span>
                            {sucursal && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Building className="h-3.5 w-3.5" /> {sucursal}
                                </span>
                            )}
                        </div>
                        {!isActivo && empleado.ConceptoBaja && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Motivo de baja: {empleado.ConceptoBaja}
                                {formatDate(empleado.FechaBaja) ? ` · ${formatDate(empleado.FechaBaja)}` : ""}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div className="space-y-4">
                    <SectionTitle title="Información Personal" icon={User} />

                    <InfoItem icon={Mail} label="Email" value={empleado.eMail} />
                    <InfoItem icon={Phone} label="Teléfono" value={empleado.Telefono} />
                    <InfoItem icon={MapPin} label="Dirección" value={direccionCompleta} />
                    <InfoItem icon={Calendar} label="Fecha de Nacimiento" value={formatDate(empleado.FechaNacimiento)} />
                    <InfoItem icon={Users} label="Estado Civil" value={empleado.EstadoCivil} />
                    <InfoItem icon={Users} label="Hijos / Dependientes" value={
                        empleado.Hijos !== null && empleado.Hijos !== undefined
                            ? `${empleado.Hijos} hijo(s), ${empleado.Dependientes ?? 0} dependiente(s)`
                            : null
                    } />
                </div>

                {/* Información Laboral */}
                <div className="space-y-4">
                    <SectionTitle title="Información Laboral" icon={Briefcase} />

                    <InfoItem icon={Briefcase} label="Puesto" value={empleado.Puesto} />
                    <InfoItem icon={Building} label="Departamento" value={empleado.Departamento} />
                    <InfoItem icon={DollarSign} label="Sueldo Diario" value={formatCurrency(empleado.SueldoDiario)} />
                    <InfoItem icon={DollarSign} label="SDI" value={formatCurrency(empleado.SDI)} />
                    <InfoItem icon={Calendar} label="Fecha de Ingreso" value={formatDate(empleado.FechaAlta)} />
                    <InfoItem icon={Clock} label="Jornada / Tipo de Contrato" value={
                        [empleado.Jornada, empleado.TipoContrato].filter(Boolean).join(" · ") || null
                    } />
                </div>
            </div>

            {/* Información Fiscal y Bancaria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-4">
                    <SectionTitle title="Información Fiscal" icon={FileText} />

                    <InfoItem icon={FileText} label="RFC" value={empleado.Registro} />
                    <InfoItem icon={BadgeCheck} label="CURP" value={empleado.Registro2} />
                    <InfoItem icon={Hash} label="NSS" value={empleado.Registro3} />
                </div>

                <div className="space-y-4">
                    <SectionTitle title="Información Bancaria" icon={Landmark} />

                    <InfoItem icon={Landmark} label="Banco" value={empleado.PersonalSucursal} />
                    <InfoItem icon={CreditCard} label="Cuenta Bancaria" value={empleado.PersonalCuenta} />
                    <InfoItem icon={DollarSign} label="Forma de Pago" value={empleado.FormaPago} />
                </div>
            </div>

            {/* Beneficiario */}
            {empleado.Beneficiario && (
                <div className="mt-6">
                    <SectionTitle title="Beneficiario" icon={Users} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InfoItem icon={User} label="Nombre" value={empleado.Beneficiario} />
                        <InfoItem icon={Users} label="Parentesco" value={empleado.Parentesco} />
                        <InfoItem icon={Hash} label="Porcentaje" value={
                            getNumber(empleado.Porcentaje) !== null ? `${getNumber(empleado.Porcentaje)}%` : null
                        } />
                    </div>
                </div>
            )}
        </div>
    );
};