import { Field } from "@/utils/types/interfaces";
import { Ampersand, ChartNoAxesGantt, Hash } from "lucide-react";

export function SubastaField(data?: any): Field[] {

    return [{
        type: "Flex",
        require: false,
        elements: [
            {
                name: "producto",
                type: "SELECT",
                require: true,
                multi: true,
                label: "Producto(s) buscado(s)",
                options: ["alta", "media", "baja"],
                icon: <Ampersand className="text-green-500" />,
            },
            {
                name: "prioridad",
                type: "SELECT",
                label: "Prioridad de la tarea",
                require: true,
                multi: false,
                options: ["alta", "media", "baja"],
                icon: <ChartNoAxesGantt className="text-orange-500" />,
            },
        ],
    },
    {
        name: "fecha",
        type: "DATE_RANGE",
        require: true,
        multiple: true,
        label: "Periodo de la subasta",
        placeholder: "Factor:",
        icon: <Hash className="text-green-500" />,
    },];
}
