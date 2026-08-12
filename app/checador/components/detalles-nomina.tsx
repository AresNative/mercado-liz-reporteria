"use client";

import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    UserX,
} from "lucide-react";
import DynamicTable from "@/components/table";

export interface DiaAsistencia {
    fecha: string; // "YYYY-MM-DD"
    horaEntrada: string | null;
    horaSalida: string | null;
    estado: "A tiempo" | "Retardo" | "Falta";
}

export interface ResumenEmpleado {
    personal: string;
    nombreCompleto: string;
    departamento?: string;
    puesto?: string;
    jornada?: string;
    sueldoDiario: number;
    diasEsperados: number;
    diasTrabajados: number;
    retardos: number;
    faltas: number;
    sueldoEstimado: number;
    dias: DiaAsistencia[];
}

const formatMoney = (n: number) =>
    n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

function StatCard({
    icon,
    label,
    value,
    tone = "default",
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    tone?: "default" | "warning" | "danger";
}) {
    const toneClasses = {
        default: "text-gray-900 dark:text-white",
        warning: "text-amber-600 dark:text-amber-400",
        danger: "text-red-600 dark:text-red-400",
    }[tone];

    return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 flex flex-col gap-1">
            <span className="text-gray-400">{icon}</span>
            <span className="text-xs text-gray-500">{label}</span>
            <span className={`text-lg font-semibold ${toneClasses}`}>{value}</span>
        </div>
    );
}

export const DetallesPreNomina = ({
    resumen,
    periodo,
}: {
    resumen: ResumenEmpleado | null;
    periodo: string;
}) => {
    if (!resumen) return null;

    const dataDias = resumen.dias.map((d) => ({
        Fecha: d.fecha,
        "Hora Entrada": d.horaEntrada ? d.horaEntrada.slice(0, 5) : "—",
        "Hora Salida": d.horaSalida ? d.horaSalida.slice(0, 5) : "—",
        Estado: d.estado,
    }));

    return (
        <main className="p-4">
            <header className="bg-zinc-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {resumen.nombreCompleto}
                </h2>
                <p className="text-sm text-gray-500">
                    #{resumen.personal}
                    {resumen.departamento ? ` · ${resumen.departamento}` : ""}
                    {resumen.puesto ? ` · ${resumen.puesto}` : ""}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    Período: {periodo.replace(" AND ", " al ")}
                </p>
            </header>

            <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <StatCard
                    icon={<DollarSign className="size-5" />}
                    label="Sueldo diario"
                    value={formatMoney(resumen.sueldoDiario)}
                />
                <StatCard
                    icon={<Calendar className="size-5" />}
                    label="Días trabajados"
                    value={`${resumen.diasTrabajados}/${resumen.diasEsperados}`}
                />
                <StatCard
                    icon={<Clock className="size-5" />}
                    label="Retardos"
                    value={resumen.retardos.toString()}
                    tone={resumen.retardos > 0 ? "warning" : "default"}
                />
                <StatCard
                    icon={<UserX className="size-5" />}
                    label="Faltas"
                    value={resumen.faltas.toString()}
                    tone={resumen.faltas > 0 ? "danger" : "default"}
                />
                <StatCard
                    icon={<CheckCircle2 className="size-5" />}
                    label="Sueldo estimado"
                    value={formatMoney(resumen.sueldoEstimado)}
                />
            </section>

            {(resumen.faltas > 0 || resumen.retardos > 0) && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300 rounded-md p-3 mb-4">
                    <AlertTriangle className="size-4 shrink-0" />
                    Este cálculo es una estimación basada en el checador y en la hora
                    esperada configurada para la jornada del empleado; verifica contra
                    el horario real antes de aplicarlo a la nómina definitiva.
                </div>
            )}

            <DynamicTable data={dataDias} />
        </main>
    );
};