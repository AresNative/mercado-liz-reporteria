"use client";

import {
    DollarSign,
    Receipt,
    TrendingUp,
    Percent,
    Users,
    ShoppingBag,
    Truck,
    Boxes,
    Package,
    AlertTriangle,
    Warehouse,
    LoaderCircle,
} from "lucide-react";
import { formatValue } from "@/utils/constants/format-values";
import { useMemo } from "react";

const MAIN_METRIC_HINTS = ["Costo", "Ventas", "Mermas", "Inventario", "Utilidad", "Margen"];
const CURRENCY_HINTS = ["Costo", "Ventas", "Mermas", "Precio"];

function isPrincipal(key: string) {
    return MAIN_METRIC_HINTS.some((h) => key.includes(h));
}

function getIcon(key: string) {
    if (key.includes("Venta")) return DollarSign;
    if (key.includes("Merma")) return AlertTriangle;
    if (key.includes("Inventario")) return Warehouse;
    if (key.includes("Costo")) return Receipt;
    if (key.includes("Utilidad")) return TrendingUp;
    if (key.includes("Margen")) return Percent;
    if (key.includes("Proveedor")) return Truck;
    if (key.includes("Cliente")) return Users;
    if (key.includes("Tiket") || key.includes("Ticket")) return ShoppingBag;
    if (key.includes("Articulo")) return Package;
    return Boxes;
}

function parseNumeric(value: unknown): number {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
        const cleaned = value.replace(/[^\d.-]/g, "");
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? NaN : parsed;
    }
    return NaN;
}

function marginTone(value: number): "good" | "warn" | "bad" {
    if (Number.isNaN(value)) return "good";
    if (value >= 30) return "good";
    if (value >= 15) return "warn";
    return "bad";
}

const TONE = {
    good: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
    warn: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30" },
    bad: { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/30" },
} as const;

interface KardexStatsProps {
    dataStats: any[];
    show?: boolean;
    isLoading?: boolean;
    emptyMessage?: string;
}

export default function KardexStats({
    dataStats,
    show = true,
    isLoading = false,
    emptyMessage = "No hay datos disponibles",
}: KardexStatsProps) {
    const { orderedEntries, tone, hasData } = useMemo(() => {
        if (!show || !dataStats || dataStats.length === 0 || isLoading) {
            return { orderedEntries: [], tone: "good" as const, hasData: false };
        }

        const entries = Object.entries(dataStats[0]);
        if (entries.length === 0) {
            return { orderedEntries: [], tone: "good" as const, hasData: false };
        }

        const principales = entries.filter(([k]) => isPrincipal(k));
        const auxiliares = entries.filter(([k]) => !isPrincipal(k));
        const ordered = [...principales, ...auxiliares];

        const margenEntry = entries.find(([k]) => k.includes("Margen"));
        const tone = margenEntry ? marginTone(parseNumeric(margenEntry[1])) : "good";

        return { orderedEntries: ordered, tone, hasData: true };
    }, [dataStats, show, isLoading]);

    if (!show) return null;

    if (isLoading) {
        return (
            <div className="w-full mb-4 sm:mb-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-4 sm:p-6 transition-all">
                <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                    <LoaderCircle className="w-5 h-5 animate-spin text-green-500" />
                    <span className="text-sm sm:text-base">Cargando estadísticas...</span>
                </div>
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className="w-full mb-4 sm:mb-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-4 sm:p-6 transition-all">
                <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    <span>{emptyMessage}</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full mb-4 sm:mb-5 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800"
            role="region"
            aria-label="Estadísticas del kardex"
        >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 divide-x divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {orderedEntries.map(([key, value]) => {
                    const Icon = getIcon(key);
                    const principal = isPrincipal(key);
                    const isMargen = key.includes("Margen");
                    const isUtilidad = key.includes("Utilidad");

                    let formatted: any = value;
                    if (value === undefined || value === null) {
                        formatted = "—";
                    } else if (typeof value === "number") {
                        formatted = CURRENCY_HINTS.some((h) => key.includes(h))
                            ? formatValue(value, "currency")
                            : formatValue(value, "number");
                    } else if (typeof value === "string") {
                        // Si ya está formateado, lo respetamos
                        formatted = value;
                    } else {
                        formatted = String(value);
                    }

                    let accent: (typeof TONE)[keyof typeof TONE] | null = null;
                    if (isMargen) {
                        accent = TONE[tone];
                    } else if (isUtilidad) {
                        const isNegative =
                            typeof value === "string" && value.trim().startsWith("-");
                        accent = isNegative ? TONE.bad : TONE.good;
                    }

                    return (
                        <div
                            key={key}
                            className={`
                                bg-white dark:bg-gray-900 
                                px-2 sm:px-3 md:px-4 
                                flex items-center gap-2 sm:gap-3 
                                ${principal ? "py-2 sm:py-3 md:py-3.5" : "py-1.5 sm:py-2 md:py-2.5"}
                                transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50
                            `}
                        >
                            <div
                                className={`
                                    shrink-0 rounded-md 
                                    p-1 sm:p-1.5 
                                    ${accent ? accent.bg : "bg-slate-100 dark:bg-slate-800"}
                                `}
                            >
                                <Icon
                                    size={principal ? 14 : 12}
                                    strokeWidth={2}
                                    className={`
                                        sm:${principal ? "w-4 h-4" : "w-3.5 h-3.5"}
                                        ${accent ? accent.text : "text-slate-400 dark:text-slate-500"}
                                    `}
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div
                                    className={`
                                        uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium leading-none 
                                        ${principal ? "text-[9px] sm:text-[10px] md:text-[11px]" : "text-[8px] sm:text-[9px] md:text-[10px]"}
                                    `}
                                >
                                    {key}
                                </div>
                                <div
                                    className={`
                                        font-semibold tabular-nums leading-none truncate 
                                        ${principal ? "text-xs sm:text-sm md:text-base" : "text-[10px] sm:text-xs md:text-sm"}
                                        ${accent ? accent.text : "text-gray-900 dark:text-white"}
                                    `}
                                >
                                    {formatted}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}