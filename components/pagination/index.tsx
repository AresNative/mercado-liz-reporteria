import {
    ChevronLeft,
    ChevronRight,
    SkipForward,
    SkipBack,
    Maximize2,
    Filter,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    loading: boolean;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalItems?: number;
    itemsPerPage?: number;
    onJump?: (pages: number) => void;
}

type JumpDirection = "forward" | "backward";

export default function Pagination({
    currentPage,
    totalPages,
    loading,
    setCurrentPage,
    totalItems = 0,
    itemsPerPage = 0,
    onJump,
}: PaginationProps) {
    const [jumpValue, setJumpValue] = useState<number>(5);
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

    /* =========================
       Derivados / Cálculos
    ========================== */

    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= totalPages;

    const { startItem, endItem } = useMemo(() => {
        if (!totalItems || !itemsPerPage) {
            return { startItem: 0, endItem: 0 };
        }

        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalItems);

        return { startItem: start, endItem: end };
    }, [currentPage, itemsPerPage, totalItems]);

    const jumpOptions = useMemo(() => [1, 5, 10, 25, 50, 100], []);

    /* =========================
       Handlers
    ========================== */

    const handleJump = useCallback(
        (direction: JumpDirection) => {
            if (loading) return;

            const pages = Math.max(1, Math.min(jumpValue, totalPages));

            setCurrentPage(prev => {
                const target =
                    direction === "forward"
                        ? Math.min(prev + pages, totalPages)
                        : Math.max(prev - pages, 1);

                return target;
            });

            onJump?.(pages);
        },
        [jumpValue, totalPages, loading, setCurrentPage, onJump]
    );

    const goToPrevious = useCallback(() => {
        if (!isFirstPage && !loading) {
            setCurrentPage(p => Math.max(p - 1, 1));
        }
    }, [isFirstPage, loading, setCurrentPage]);

    const goToNext = useCallback(() => {
        if (!isLastPage && !loading) {
            setCurrentPage(p => Math.min(p + 1, totalPages));
        }
    }, [isLastPage, loading, setCurrentPage, totalPages]);

    /* =========================
       Render
    ========================== */

    return (
        <section className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-lg shadow-sm p-4">
            {/* Header */}
            <header className="flex flex-wrap items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Página {currentPage} de {totalPages}
                        </span>
                    </div>

                    {totalItems > 0 && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Mostrando {startItem}-{endItem} de{" "}
                            {totalItems.toLocaleString()} registros
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setShowAdvanced(v => !v)}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                    <Maximize2 className="h-4 w-4" />
                    {showAdvanced ? "Ocultar controles" : "Controles avanzados"}
                </button>
            </header>

            {/* Navegación principal */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleJump("backward")}
                        disabled={isFirstPage || loading}
                        aria-label="Saltar páginas hacia atrás"
                        className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                        <SkipBack className="h-4 w-4" />
                        <span className="text-sm font-medium">-{jumpValue}</span>
                    </button>

                    <button
                        onClick={goToPrevious}
                        disabled={isFirstPage || loading}
                        aria-label="Página anterior"
                        className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                </div>

                <div className="text-center min-w-[120px]">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currentPage}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Página actual
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={goToNext}
                        disabled={isLastPage || loading}
                        aria-label="Página siguiente"
                        className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>

                    <button
                        onClick={() => handleJump("forward")}
                        disabled={isLastPage || loading}
                        aria-label="Saltar páginas hacia adelante"
                        className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                        <span className="text-sm font-medium">+{jumpValue}</span>
                        <SkipForward className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Controles avanzados */}
            {showAdvanced && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tamaño de salto
                        </label>

                        <div className="flex flex-wrap gap-2">
                            {jumpOptions.map(option => (
                                <button
                                    key={option}
                                    onClick={() => setJumpValue(option)}
                                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors border ${jumpValue === option
                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700"
                                        }`}
                                >
                                    {option} páginas
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between text-sm">
                        {loading ? (
                            <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                Cargando datos…
                            </span>
                        ) : (
                            <span />
                        )}

                        <span className="text-gray-500 dark:text-gray-400">
                            {totalPages > 1000 ? "Big Data Mode" : "Standard Mode"}
                        </span>
                    </div>
                </div>
            )}
        </section>
    );
}
