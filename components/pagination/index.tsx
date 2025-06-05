import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface PaginationProps {
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    currentPage: number;
    totalPages: number;
    loading: boolean;
}

export default function Pagination({
    setCurrentPage,
    currentPage,
    totalPages,
    loading,
}: PaginationProps) {
    return (
        <div className="flex items-center justify-center space-x-2 text-gray-700 dark:text-white">
            <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="px-3 py-2 rounded-md bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="px-3 py-2 rounded-md bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700">
                {currentPage} de {totalPages}
            </span>
            <button
                onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || loading}
                className="px-3 py-2 rounded-md bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronRight className="h-5 w-5" />
            </button>
        </div>
    );
}