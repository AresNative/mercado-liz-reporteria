import { CountdownTimer } from "@/components/counter-down";
import Details from "@/components/details";
import { formatDateToISO, formatValue } from "@/utils/constants/format-values";

export function DetallesSolicitud({ data }: { data: any }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="text-sm text-gray-500">Proyecto</span>
                    <p className="font-medium">{data.nombre}</p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Estado</span>
                    <p className="font-medium capitalize">{data.estado || "Pendiente"}</p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Fecha inicio</span>
                    <p className="font-medium">{formatDateToISO(data.fecha_inicio)}</p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Fecha fin</span>
                    <p className="font-medium flex items-center gap-2">
                        {formatDateToISO(data.fecha_fin)}
                        {data.fecha_fin && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                <CountdownTimer endDate={new Date(data.fecha_fin)} refrech={() => { }} />
                            </span>
                        )}
                    </p>
                </div>
                <div className="col-span-2">
                    <span className="text-sm text-gray-500">Descripción</span>
                    <p className="whitespace-pre-wrap">{data.descripcion}</p>
                </div>
                <div className="col-span-2">
                    <span className="text-sm text-gray-500">Justificación</span>
                    <p className="whitespace-pre-wrap">{data.justificacion}</p>
                </div>
                {data.presupuesto && (
                    <div>
                        <span className="text-sm text-gray-500">Presupuesto</span>
                        <p className="font-medium">{formatValue(data.presupuesto, "currency")}</p>
                    </div>
                )}
                {data.recursos && (
                    <div>
                        <span className="text-sm text-gray-500">Recursos</span>
                        <p className="font-medium">{data.recursos}</p>
                    </div>
                )}
            </div>

            <Details title="Historial de cambios" description="Aquí se mostrarían los cambios de estado y comentarios.">
                <p className="text-sm text-gray-500">Sin historial disponible.</p>
            </Details>
        </div>
    );
}