import { buttonClasses } from "@/utils/constants/colors";
import { cn } from "@/utils/functions/cn";
import { ButtonProps } from "@/utils/types/interfaces";

export function Button({
    type = "button",
    label,
    size = "medium",
    aling = "justify-center",
    color = "info",
    onClick,
    children,
    disabled = false,
}: ButtonProps) {
    const styles = buttonClasses[color];

    // Define estilos para el tamaño del botón
    const sizeClass = size === "small" ? "px-3 py-1 text-sm" :
        size === "large" ? "px-6 py-3 text-lg" : "px-4 py-2 text-base";

    // Maneja el evento onMouseDown para evitar que se active el drag-and-drop
    const handleMouseDown = (event: React.MouseEvent) => {
        event.stopPropagation(); // Evita que el evento se propague al contenedor de arrastre
    };

    return (
        <button
            type={type}
            onClick={onClick}
            onMouseDown={handleMouseDown}  // Agregar onMouseDown para evitar el drag
            className={cn(`flex gap-2 cursor-pointer justify-center items-center ${aling} ${sizeClass} ${styles.text} ${styles.bg} ${styles.ring} ${styles.hover} rounded-md transition-all`)}
            disabled={disabled}
        >
            {label || children}
        </button>
    );
}
