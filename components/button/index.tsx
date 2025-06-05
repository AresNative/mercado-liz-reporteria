import { alertClasses } from "@/utils/constants/colors";
import { ButtonProps } from "@/utils/types/interfaces";

export function Button({
    type = "button",
    label,
    size = "medium",
    color = "info",
    onClick,
    children,
    disabled = false,
}: ButtonProps) {
    const styles = alertClasses[color];

    const pointerEvents = disabled ? "none" : "auto";
    const opacity = disabled ? 0.5 : 1;

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
            className={`flex gap-2 justify-center items-center ${sizeClass} ${styles.text} ${styles.bg} ${styles.ring} rounded-md ${styles.hover} transition-all`}
            style={{ pointerEvents, opacity }}
            disabled={disabled}
        >
            {label || children}
        </button>
    );
}
