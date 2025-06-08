import { Field } from "@/utils/types/interfaces";

export function ScrumField(): Field[] {
  return [
    {
      name: "nombre",
      type: "INPUT",
      label: "Nombre del Sprint",
      placeholder: "Sprint 1",
      require: true,
    },
    {
      type: "Flex",
      require: false,
      elements: [
        {
          name: "fecha_inicio",
          type: "DATE",
          label: "Fecha de inicio",
          placeholder: "No anterior al dia actual",
          require: true,
        },
        {
          name: "fecha_fin",
          type: "DATE",
          label: "Fecha de cierre",
          placeholder: "Minimo 3 dias mayor a la fecha de inicio",
          require: true,
        },
      ],
    },
    /* {
      type: "SELECT",
      name: "usuarios",
      label: "Usuarios Relacionados",
      require: true,
      multi: true,
      options: ["JavaScript", "React", "Node.js"],
    }, */
  ];
}
