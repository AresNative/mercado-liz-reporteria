"use client";

import { formatDateToISO, formatDuracion } from "@/utils/constants/format-values";
import { Button } from "@/components/button";
import { Edit, Trash2, Calendar, Clock, User, Briefcase, FileText } from "lucide-react";
import { FormattedText } from "@/components/formatted";

interface DetallesActividadProps {
    data: any;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function DetallesActividad({ data, onEdit, onDelete }: DetallesActividadProps) {
    return (
        <div className="space-y-6 p-2">
            {/* Encabezado con título y acciones */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {data.tarea || "Actividad sin título"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        #{data.id} · {formatDateToISO(data.fecha)}
                    </p>
                </div>
                <div className="flex gap-2">
                    {onEdit && (
                        <Button color="info" size="small" onClick={onEdit}>
                            <Edit className="h-4 w-4 mr-1" /> Editar
                        </Button>
                    )}
                    {onDelete && (
                        <Button color="error" size="small" onClick={onDelete}>
                            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                        </Button>
                    )}
                </div>
            </div>

            {/* Grid de información */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Briefcase className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Proyecto</p>
                        <p className="font-medium">{data.proyecto || "Independiente"}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Clock className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tiempo invertido</p>
                        <p className="font-medium">{formatDuracion(data.horas, data.minutos)}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <User className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Responsable</p>
                        <p className="font-medium">{data.responsable}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Fecha</p>
                        <p className="font-medium">{formatDateToISO(data.fecha)}</p>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Descripción</p>
                            <FormattedText text={data.descripcion} className="text-gray-800 dark:text-gray-100" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}