import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, MoreVertical } from "lucide-react";
import { useEffect, useRef } from "react";

interface ViewTRProps {
    setShowColumnMenu: (column: string | null) => void;
    column: string;
    toggleColumn: (column: string) => void;
    showColumnMenu: string | null;
    visibleColumns: Record<string, boolean>;
    allColumns?: boolean;
}

export function ViewTR({
    setShowColumnMenu,
    column,
    toggleColumn,
    showColumnMenu,
    visibleColumns,
    allColumns = false
}: ViewTRProps) {
    const skillsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (skillsRef.current && !skillsRef.current.contains(e.target as Node)) {
                setShowColumnMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="absolute flex items-center space-x-1 right-0 Z-100">
            <button
                onClick={() => setShowColumnMenu(showColumnMenu === column ? null : column)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full"
                aria-label="Opciones de columna"
            >
                {allColumns ? (<Eye className="h-4 w-4" />) : (<MoreVertical className="h-4 w-4" />)}
            </button>

            <AnimatePresence>
                {showColumnMenu === column && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute ${allColumns ? 'right-0' : '-right-10'} -bottom-12 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-md shadow-lg z-10 ring-1 ring-black ring-opacity-5 dark:ring-zinc-600`}
                    >
                        <div className="py-1" ref={skillsRef}>

                            {allColumns ? (
                                <>
                                    <button
                                        onClick={() => {
                                            Object.keys(visibleColumns).forEach(col => {
                                                if (!visibleColumns[col]) toggleColumn(col);
                                            });
                                            setShowColumnMenu(null);
                                        }}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Mostrar todas
                                    </button>
                                    <button
                                        onClick={() => {
                                            Object.keys(visibleColumns).forEach(col => {
                                                if (visibleColumns[col]) toggleColumn(col);
                                            });
                                            setShowColumnMenu(null);
                                        }}
                                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    >
                                        <EyeOff className="mr-2 h-4 w-4" />
                                        Ocultar todas
                                    </button>
                                </>
                            ) : (<button
                                onClick={() => {
                                    toggleColumn(column);
                                    setShowColumnMenu(null);
                                }}
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                            >
                                {visibleColumns[column] ? (
                                    <>
                                        <EyeOff className="mr-2 h-4 w-4" />
                                        Ocultar columna
                                    </>
                                ) : (
                                    <>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Mostrar columna
                                    </>
                                )}
                            </button>)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}