import { Field } from "@/utils/types/interfaces";

export function LogInField(): Field[] {
  return [
    {
      id: 0,
      type: "MAIL",
      name: "email",
      label: "Correo",
      placeholder: "example@mercadosliz.com",
      require: true,
    },
    {
      id: 1,
      type: "PASSWORD",
      name: "password",
      label: "Contraseña",
      placeholder: "UseExample@123",
      require: true,
    },
    {
      id: 2,
      type: "CHECKBOX",
      name: "remember_me",
      label: "Recuerdame",
      require: false,
    },
  ];
}
