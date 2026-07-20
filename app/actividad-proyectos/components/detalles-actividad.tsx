import { formatDateToISO } from "@/utils/constants/format-values";

export function DetallesActividad({ data }: { data: any }) {
    return (
        <div className="space-y-3 p-2">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="text-sm text-gray-500">Proyecto</span>
                    <p className="font-medium">{data.proyecto || "Independiente"}</p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Tarea</span>
                    <p className="font-medium">{data.tarea}</p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Fecha</span>
                    <p className="font-medium">{formatDateToISO(data.fecha)}</p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Horas</span>
                    <p className="font-medium">{data.horas}</p>
                </div>
                <div className="col-span-2">
                    <span className="text-sm text-gray-500">Descripción</span>
                    <p className="whitespace-pre-wrap">{data.descripcion}</p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Responsable</span>
                    <p className="font-medium">{data.responsable}</p>
                </div>
            </div>
        </div>
    );
}