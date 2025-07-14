import { Field } from "@/utils/types/interfaces";

export function TasksField(): Field[] {
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
        },
        {
          name: "prioridad",
          type: "SELECT",
          label: "Prioridad de la tarea...",
          require: true,
          multi: false,
          options: ["alta", "media", "baja"],
        },
      ],
    },

    {
      name: "descripcion",
      type: "INPUT",
      require: true,
      label: "Descripcion",
      placeholder: "Explica en breves palabras que es la tarea...",
      maxLength: 50,
    },
    {
      name: "tags",
      type: "TAG_INPUT",
      require: true,
      label: "Tags",
      placeholder: "Explica en breves palabras que es la tarea...",
      maxLength: 50,
    },
  ];
}
