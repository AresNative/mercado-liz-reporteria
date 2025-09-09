import { Field } from "@/utils/types/interfaces";
import { Container, Users } from "lucide-react";

export function ChecadorField(data?: any): Field[] {

    return [
        {
            name: "sucursal",
            type: "SELECT",
            label: "Sucursal",
            require: true,
            multi: true,
            options: ["mayoreo", "guadalupe", "testerazo", "palmas"],
            icon: <Container className="text-orange-500" />,
        },
        {
            name: "empleado",
            type: "NUMBER",
            require: true,
            label: "Numero de empleado",
            maxLength: 6,
            placeholder: "Ingresa tu ID:",
            icon: <Users className="text-green-500" />,
        },];
}
