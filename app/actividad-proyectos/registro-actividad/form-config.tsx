import { Field } from "@/utils/types/interfaces";
import { User, Briefcase, Clock, FileText, Calendar } from "lucide-react";

// Recibe las opciones de proyectos y el estado de carga
export const formConfigActividad = (
    proyectosOptions: { value: string; label: string }[] = [],
    loading = false
): Field[] => [
        {
            type: "Flex",
            require: false,
            elements: [
                {
                    type: "SEARCH",
                    name: "proyecto",
                    label: "Proyecto (selecciona o escribe uno nuevo)",
                    icon: <Briefcase className="h-4 w-4" />,
                    placeholder: loading ? "Cargando proyectos..." : "Busca o escribe el nombre del proyecto",
                    options: proyectosOptions,
                    saveData: true, // permite guardar texto libre
                    require: false, // opcional, para tareas independientes
                },
                {
                    type: "INPUT",
                    name: "tarea",
                    label: "Tarea",
                    icon: <FileText className="h-4 w-4" />,
                    placeholder: "Descripción corta de la tarea",
                    require: true,
                },
            ],
        },
        {
            type: "TEXT_AREA",
            name: "descripcion",
            label: "Descripción detallada",
            placeholder: "Explica lo que hiciste...",
            require: true,
        },
        {
            type: "Flex",
            require: false,
            elements: [
                {
                    type: "DATE",
                    name: "fecha",
                    label: "Fecha",
                    icon: <Calendar className="h-4 w-4" />,
                    valueDefined: new Date().toISOString().split("T")[0],
                    require: true,
                },
                {
                    type: "NUMBER",
                    name: "horas",
                    label: "Horas invertidas",
                    icon: <Clock className="h-4 w-4" />,
                    placeholder: "Ej: 2.5",
                    require: true,
                    minLength: 0,
                },
            ],
        },
        {
            type: "INPUT",
            name: "responsable",
            label: "Responsable (tu nombre)",
            icon: <User className="h-4 w-4" />,
            placeholder: "Nombre del desarrollador",
            require: true,
        },
    ];