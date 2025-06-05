import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import { useEffect, useRef } from "react";

export function ViewTR({ setShowColumnMenu, column, toggleColumn, showColumnMenu, visibleColumns }: any) {

    const skillsRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (skillsRef.current && !skillsRef.current.contains(e.target as Node)) {
                setShowColumnMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <li className="relative flex items-center space-x-1">{/* nombre - fabricante - proveedor - fecha - codigo - articulo */}
            {["nombre", "fabricante", "proveedor", "fechaemision", "codigo", "articulo"].includes(column.toLowerCase()) && (
                <button
                    onClick={() => setShowColumnMenu(showColumnMenu === column ? null : column)}
                    className="p-1 hover:bg-zinc-100 rounded-full"
                >
                    <MoreVertical className="h-4 w-4" />
                </button>)}
            <AnimatePresence>
                {showColumnMenu === column && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute -right-10  -bottom-12 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5"
                    >
                        <div className="py-1" ref={skillsRef}>
                            <button
                                onClick={() => toggleColumn(column)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-zinc-100"
                            >
                                {visibleColumns[column] ? "Ocultar columna" : "Ver columna"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </li>
    )
}