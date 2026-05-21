// components/context-menu.tsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean; // para estilo rojo
}

interface ContextMenuProps {
    items: ContextMenuItem[];
    children: React.ReactNode;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, children }) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);

    // Mostrar el menú en la posición del clic derecho
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        // Obtener coordenadas del mouse
        let x = e.clientX;
        let y = e.clientY;

        // Ajustar para que no se salga de la pantalla (se calcula después del render, pero guardamos las coordenadas)
        setPosition({ x, y });
        setVisible(true);
    };

    // Cerrar el menú
    const closeMenu = () => setVisible(false);

    // Manejar clic en un ítem
    const handleItemClick = (item: ContextMenuItem) => {
        if (item.disabled) return;
        item.onClick();
        closeMenu();
    };

    // Efecto para ajustar posición si el menú se sale de la ventana
    useEffect(() => {
        if (visible && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let { x, y } = position;
            if (x + rect.width > viewportWidth) x = viewportWidth - rect.width - 5;
            if (y + rect.height > viewportHeight) y = viewportHeight - rect.height - 5;
            if (x < 0) x = 5;
            if (y < 0) y = 5;

            if (x !== position.x || y !== position.y) {
                setPosition({ x, y });
            }
        }
    }, [visible, position]);

    // Cerrar al hacer clic fuera o presionar Escape
    useEffect(() => {
        if (!visible) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                closeMenu();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeMenu();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [visible]);

    return (
        <>
            <div onContextMenu={handleContextMenu} style={{ display: 'contents' }}>
                {children}
            </div>
            {visible &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-50 min-w-[160px] bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: position.y, left: position.x }}
                    >
                        {items.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleItemClick(item)}
                                disabled={item.disabled}
                                className={`
                  w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors
                  ${item.disabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                  ${item.danger && !item.disabled ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-700 dark:text-gray-200'}
                `}
                            >
                                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                                {item.label}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
        </>
    );
};