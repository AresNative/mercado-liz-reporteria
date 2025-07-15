import { Field } from "@/utils/types/interfaces";
import { Ampersand, ChartNoAxesGantt, Text } from "lucide-react";

export function TasksField(data?: any): Field[] {

  return [
    {
      type: "Flex",
      require: false,
      elements: [
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
          name: "prioridad",
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
      name: "descripcion",
      type: "TEXT_AREA",
      require: true,
      label: "Descripcion",
      placeholder: "Explica en breves palabras que es la tarea...",
      maxLength: 50,
      icon: <Text className="text-blue-500" />,
      valueDefined: data?.description || "",
    },
    {
      name: "tags",
      type: "TAG_INPUT",
      require: true,
      label: "Tags",
      placeholder: "Agrega tags para la tarea, considera que son palabras clave",
      maxLength: 50,
      jsonString: true,
      valueDefined: data?.tags || "",
    },
  ];
}
