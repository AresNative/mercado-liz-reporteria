import { Field } from "@/utils/types/interfaces";
import { Ampersand, ChartNoAxesGantt, Text } from "lucide-react";

export function ProjectField(data?: any): Field[] {

    return [
        {
            type: "Flex",
            require: false,
            elements: [
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
                    name: "State",
                    type: "SELECT",
                    label: "Prioridad de la tarea",
                    require: true,
                    multi: false,
                    options: ["alta", "media", "baja"],
                    icon: <ChartNoAxesGantt className="text-orange-500" />,
                    valueDefined: data?.prioridad || "",
                },
            ],
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
