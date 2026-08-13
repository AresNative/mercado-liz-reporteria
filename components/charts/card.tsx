"use client";

import { ReactNode } from "react";
import { BarChart3 } from "lucide-react";

interface ChartCardProps {
    title?: string;
    subtitle?: string;
    height?: string | number;
    isEmpty?: boolean;
    emptyMessage?: string;
    loading?: boolean;
    children: ReactNode;
}

/**
 * Contenedor estándar para gráficos: mismo look & feel (card, borde, radio,
 * sombra) en claro/oscuro, más estados de carga y vacío consistentes.
 * Úsalo como envoltorio de cualquier gráfico (DynamicChart, TreemapChart, etc.)
 * para que todos se vean parte del mismo sistema.
 */
export function ChartCard({
    title,
    subtitle,
    height = 350,
    isEmpty = false,
    emptyMessage = "No hay datos para mostrar",
    loading = false,
    children,
}: ChartCardProps) {
    const resolvedHeight = typeof height === "number" ? `${height}px` : height;

    return (
        <div className="w-full h-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm transition-colors">
            {(title || subtitle) && (
                <div className="mb-3">
                    {title && (
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {title}
                        </h3>
                    )}
                    {subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
                    )}
                </div>
            )}

            {loading ? (
                <div
                    className="animate-pulse rounded-lg bg-gray-100 dark:bg-zinc-800"
                    style={{ height: resolvedHeight }}
                    aria-label="Cargando gráfico"
                    role="status"
                />
            ) : isEmpty ? (
                <div
                    className="flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-600"
                    style={{ height: resolvedHeight }}
                >
                    <BarChart3 className="h-8 w-8" aria-hidden="true" />
                    <p className="text-sm">{emptyMessage}</p>
                </div>
            ) : (
                children
            )}
        </div>
    );
}