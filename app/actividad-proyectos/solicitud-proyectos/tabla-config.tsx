export const columnConfigActividad: Record<string, boolean> = {
    id: true,
    proyecto: true,
    tarea: true,
    descripcion: true,
    fecha: true,
    horas: true,
    responsable: true,
    fecha_creacion: false,
};

export const columnConfigSolicitud: Record<string, boolean> = {
    id: true,
    nombre: true,
    descripcion: true,
    justificacion: true,
    fecha_inicio: true,
    fecha_fin: true,
    presupuesto: true,
    recursos: true,
    estado: true,
    solicitante: true,
    fecha_creacion: false,
};