import { Field } from "@/utils/types/interfaces";
import { Ampersand, Calendar } from "lucide-react";

export function SprintField(data?: any): Field[] {

    return [
        {

            name: "nombre",
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
    ];
}