import { Field } from "@/utils/types/interfaces";
import { FileText, Calendar, DollarSign, Users } from "lucide-react";

export const formConfigSolicitud: Field[] = [
    {
        type: "INPUT",
        name: "nombre",
        label: "Nombre del proyecto",
        icon: <FileText className="h-4 w-4" />,
        placeholder: "Título del proyecto",
        require: true,
    },
    {
        type: "TEXT_AREA",
        name: "descripcion",
        label: "Descripción",
        placeholder: "Explica de qué trata el proyecto",
        require: true,
    },
    {
        type: "TEXT_AREA",
        name: "justificacion",
        label: "Justificación",
        placeholder: "¿Por qué es necesario?",
        require: true,
    },
    {
        type: "Flex",
        require: false,
        elements: [
            {
                type: "DATE",
                name: "fecha_inicio",
                label: "Fecha estimada de inicio",
                icon: <Calendar className="h-4 w-4" />,
                require: true,
            },
            {
                type: "DATE",
                name: "fecha_fin",
                label: "Fecha estimada de fin",
                icon: <Calendar className="h-4 w-4" />,
                require: true,
            },
        ],
    },
    {
        type: "Flex",
        require: false,
        elements: [
            {
                type: "NUMBER",
                name: "presupuesto",
                label: "Presupuesto estimado (MXN)",
                icon: <DollarSign className="h-4 w-4" />,
                placeholder: "Ej: 100000",
                require: false,
                minLength: 0,
            },
            {
                type: "INPUT",
                name: "recursos",
                label: "Recursos necesarios",
                icon: <Users className="h-4 w-4" />,
                placeholder: "Ej: 2 desarrolladores, 1 diseñador",
                require: false,
            },
        ],
    },
];