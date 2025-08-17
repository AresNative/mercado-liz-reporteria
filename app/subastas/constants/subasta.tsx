import { Field } from "@/utils/types/interfaces";
import { Ampersand, ChartNoAxesGantt, Hash } from "lucide-react";

export function SubastaField(data?: any): Field[] {

    return [{
        type: "Flex",
        require: false,
        elements: [
            {
                name: "listas",
                type: "SELECT",
                require: true,
                multi: true,
                label: "Lista(s)",
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
        name: "proveedores",
        type: "SELECT",
        label: "Proveedor(es)",
        require: true,
        multi: true,
        options: ["alta", "media", "baja"],
        icon: <ChartNoAxesGantt className="text-orange-500" />,
    },
    {
        name: "fecha_inicio",
        type: "DATE",
        require: true,
        multiple: true,
        label: "Fecha de inicio",
        placeholder: "Fecha de inico de periodo:",
        icon: <Hash className="text-green-500" />,
    },
    {
        name: "fecha_fin",
        type: "DATE",
        require: true,
        multiple: true,
        label: "Fecha fin",
        placeholder: "Fecha de fin de periodo:",
        icon: <Hash className="text-green-500" />,
    },];
}
