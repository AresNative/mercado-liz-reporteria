import { Field } from "@/utils/types/interfaces";
import { Ampersand, Calendar, ChartNoAxesGantt, Text } from "lucide-react";

export function ProjectField(data?: any): Field[] {

    return [
                {
                    name: "Nombre",
                    type: "INPUT",
                    require: true,
                    label: "Titulo",
                    placeholder: "Titulo de la tarea:",
                    icon: <Ampersand className="text-green-500" />,
                    valueDefined: data?.title || "",
        },
        {
            require: false,
            type: "Flex",
            elements: [
                {

                    name: "fecha_inicio",
                    type: "DATE",
                    require: true,
                    label: "Fecha de inicio",
                    placeholder: "Fecha de inicio del sprint:",
                    icon: <Calendar className="text-green-500" />,
                    valueDefined: data?.title || "",
                }, {

                    name: "fecha_fin",
                    type: "DATE",
                    require: true,
                    label: "Fecha de fin",
                    placeholder: "Fecha de fin del sprint:",
                    icon: <Calendar className="text-green-500" />,
                    valueDefined: data?.title || "",
                }
            ]
        },

        {
            name: "Descripcion",
            type: "TEXT_AREA",
            require: true,
            label: "Descripcion",
            placeholder: "Explica en breves palabras que es la tarea...",
            maxLength: 50,
            icon: <Text className="text-blue-500" />,
            valueDefined: data?.description || "",
        }
    ];
}