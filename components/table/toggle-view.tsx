import { AnimatePresence, motion } from "motion/react";
import { Eye, EyeOff, MoreVertical, Columns, SplitSquareHorizontal, AlignJustify } from "lucide-react";
import { useEffect, useRef } from "react";

// ── Tipos ──────────────────────────────────────────────────────────────────────

/**
 * Configuración para columnas cuyo valor puede ser un array.
 * - "first"  → muestra solo el primer elemento  (ej. "PEPE")
 * - "second" → muestra solo el segundo elemento  (ej. "00020")
 * - "both"   → muestra ambos en dos líneas       (ej. "PEPE / 00020")
 */
export type ArrayColumnDisplay = "first" | "second" | "both";

export interface ViewTRProps {
    setShowColumnMenu: (column: string | null) => void;
    column: string;
    toggleColumn: (column: string) => void;
    showColumnMenu: string | null;
    visibleColumns: Record<string, boolean>;
    allColumns?: boolean;
    /** Solo relevante cuando allColumns=false: si el valor de esta columna puede ser un array. */
    isArrayColumn?: boolean;
    /** Modo de display actual para esta columna cuando es array. */
    arrayDisplayMode?: ArrayColumnDisplay;
    /** Callback para cambiar el modo de display de la columna. */
    onArrayDisplayChange?: (column: string, mode: ArrayColumnDisplay) => void;
}

// ── Labels helpers ─────────────────────────────────────────────────────────────

const ARRAY_MODE_LABELS: Record<ArrayColumnDisplay, { label: string; icon: React.ReactNode }> = {
    first: { label: "Solo primero", icon: <AlignJustify className="h-3.5 w-3.5" /> },
    second: { label: "Solo segundo", icon: <AlignJustify className="h-3.5 w-3.5 opacity-50" /> },
    both: { label: "Mostrar ambos", icon: <SplitSquareHorizontal className="h-3.5 w-3.5" /> },
};

// ── Componente ─────────────────────────────────────────────────────────────────

export function ViewTR({
    setShowColumnMenu,
    column,
    toggleColumn,
    showColumnMenu,
    visibleColumns,
    allColumns = false,
    isArrayColumn = false,
    arrayDisplayMode = "both",
    onArrayDisplayChange,
}: ViewTRProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowColumnMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setShowColumnMenu]);

    // Columnas que están actualmente ocultas (solo para el botón global)
    const hiddenColumns = allColumns
        ? Object.entries(visibleColumns)
            .filter(([, visible]) => !visible)
            .map(([col]) => col)
        : [];

    // Altura dinámica del menú global según cuántas columnas ocultas hay
    const globalMenuHeight = 80 + hiddenColumns.length * 36;

    return (
        <div ref={wrapperRef} className="relative flex items-center space-x-1 right-0">
            {/* Botón disparador */}
            <button
                onClick={() => setShowColumnMenu(showColumnMenu === column ? null : column)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full transition-colors"
                aria-label={allColumns ? "Gestionar columnas" : "Opciones de columna"}
            >
                {allColumns
                    ? <Columns className="h-4 w-4" />
                    : <MoreVertical className="h-4 w-4" />}
            </button>

            <AnimatePresence>
                {showColumnMenu === column && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute ${allColumns ? "left-0" : "right-0"} top-8 mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl z-50 ring-1 ring-black/10 dark:ring-zinc-600 overflow-hidden`}
                        style={{
                            minWidth: "14rem",
                            // Ajuste dinámico solo para el menú global
                            ...(allColumns ? { minHeight: `${globalMenuHeight}px` } : {}),
                        }}
                    >
                        {/* ── Menú GLOBAL (allColumns) ────────────────────────── */}
                        {allColumns ? (
                            <div className="py-1">
                                {/* Mostrar / ocultar todas */}
                                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none">
                                    Visibilidad global
                                </div>

                                <button
                                    onClick={() => {
                                        Object.keys(visibleColumns).forEach(col => {
                                            if (!visibleColumns[col]) toggleColumn(col);
                                        });
                                        setShowColumnMenu(null);
                                    }}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Eye className="mr-2.5 h-4 w-4 shrink-0 text-green-500" />
                                    Mostrar todas
                                </button>

                                <button
                                    onClick={() => {
                                        Object.keys(visibleColumns).forEach(col => {
                                            if (visibleColumns[col]) toggleColumn(col);
                                        });
                                        setShowColumnMenu(null);
                                    }}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <EyeOff className="mr-2.5 h-4 w-4 shrink-0 text-red-400" />
                                    Ocultar todas
                                </button>

                                {/* ── Lista de columnas ocultas ──────────────── */}
                                {hiddenColumns.length > 0 && (
                                    <div className="py-1 right-0">
                                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none">
                                            Columnas ocultas ({hiddenColumns.length})
                                        </div>
                                        {hiddenColumns.map(col => (
                                            <button
                                                key={col}
                                                onClick={() => {
                                                    toggleColumn(col);
                                                }}
                                                className="flex items-center w-full text-left px-4 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors group"
                                            >
                                                <Eye className="mr-2.5 h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-zinc-500 group-hover:text-green-500 transition-colors" />
                                                <span className="truncate max-w-40">
                                                    {col.replace("Proveedor_", "Prov. ")}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ── Menú POR COLUMNA ───────────────────────────── */
                            <div className="py-1">
                                {/* Toggle visibilidad de esta columna */}
                                <button
                                    onClick={() => {
                                        toggleColumn(column);
                                        setShowColumnMenu(null);
                                    }}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    {visibleColumns[column] ? (
                                        <>
                                            <EyeOff className="mr-2.5 h-4 w-4 shrink-0 text-red-400" />
                                            Ocultar columna
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="mr-2.5 h-4 w-4 shrink-0 text-green-500" />
                                            Mostrar columna
                                        </>
                                    )}
                                </button>

                                {/* ── Opciones de array (solo si aplica) ────── */}
                                {isArrayColumn && onArrayDisplayChange && (
                                    <>
                                        <div className="mx-3 my-1 border-t border-gray-100 dark:border-zinc-700" />
                                        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none">
                                            Mostrar valor
                                        </div>
                                        {(Object.entries(ARRAY_MODE_LABELS) as [ArrayColumnDisplay, typeof ARRAY_MODE_LABELS[ArrayColumnDisplay]][]).map(
                                            ([mode, { label, icon }]) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => {
                                                        onArrayDisplayChange(column, mode);
                                                        setShowColumnMenu(null);
                                                    }}
                                                    className={`flex items-center w-full text-left px-4 py-2 text-sm transition-colors
                                                        ${arrayDisplayMode === mode
                                                            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium"
                                                            : "text-gray-700 dark:text-gray-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                                        }`}
                                                >
                                                    <span className="mr-2.5 shrink-0">{icon}</span>
                                                    {label}
                                                    {arrayDisplayMode === mode && (
                                                        <span className="ml-auto text-blue-400 text-xs">✓</span>
                                                    )}
                                                </button>
                                            )
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}