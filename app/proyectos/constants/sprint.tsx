import { Field } from "@/utils/types/interfaces";
import { Ampersand } from "lucide-react";

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
        }

    ];
}
