import { Field } from "@/utils/types/interfaces";
import { Text } from "lucide-react";

export function CommentsField(data?: any): Field[] {

    return [
        {
            name: "NewComment",
            type: "TEXT_AREA",
            require: true,
            label: "Comentario",
            placeholder: "Explica en breves palabras que es la tarea...",
            maxLength: 50,
            icon: <Text className="text-blue-500" />,
            valueDefined: data?.description || "",
        }
    ];
}
