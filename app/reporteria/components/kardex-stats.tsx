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
} from "lucide-react";
import { formatValue } from "@/utils/constants/format-values";

const MAIN_METRIC_HINTS = ["Costo", "Ventas", "Mermas", "Inventario", "Utilidad", "Margen"];
const CURRENCY_HINTS = ["Costo", "Ventas", "Mermas", "Precio"];

function isPrincipal(key: string) {
    return MAIN_METRIC_HINTS.some((h) => key.includes(h));
}

// Ícono según el reporte/palabra clave (venta, compra, merma, inventario...)
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
    if (typeof value === "string") return parseFloat(value.replace(/[^\d.-]/g, ""));
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
}

export default function KardexStats({ dataStats, show = true }: KardexStatsProps) {
    if (!show || !dataStats || dataStats.length === 0) return null;

    const entries = Object.entries(dataStats[0]);
    if (entries.length === 0) return null;

    const principales = entries.filter(([k]) => isPrincipal(k));
    const auxiliares = entries.filter(([k]) => !isPrincipal(k));
    const ordered = [...principales, ...auxiliares];

    const margenEntry = entries.find(([k]) => k.includes("Margen"));
    const tone = margenEntry ? marginTone(parseNumeric(margenEntry[1])) : "good";

    return (
        <div className="w-full mb-5 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px">
                {ordered.map(([key, value]) => {
                    const Icon = getIcon(key);
                    const principal = isPrincipal(key);
                    const isMargen = key.includes("Margen");
                    const isUtilidad = key.includes("Utilidad");

                    // El valor puede llegar crudo (la mayoría de las agregaciones)
                    // o ya formateado como string (Utilidad/Margen, calculados en
                    // fetchStatsData) — igual que en tu lógica original.
                    let formatted: any = value;
                    if (typeof value === "number") {
                        formatted = CURRENCY_HINTS.some((h) => key.includes(h))
                            ? formatValue(value, "currency")
                            : formatValue(value, "number");
                    }

                    let accent: (typeof TONE)[keyof typeof TONE] | null = null;
                    if (isMargen) {
                        accent = TONE[tone];
                    } else if (isUtilidad) {
                        const negativo = typeof value === "string" && value.trim().startsWith("-");
                        accent = negativo ? TONE.bad : TONE.good;
                    }

                    return (
                        <div
                            key={key}
                            className={`bg-white dark:bg-gray-900 px-4 flex items-center gap-3 ${principal ? "py-3.5" : "py-2.5"
                                }`}
                        >
                            <div
                                className={`shrink-0 rounded-md p-1.5 ${accent ? accent.bg : "bg-slate-100 dark:bg-slate-800"
                                    }`}
                            >
                                <Icon
                                    size={principal ? 16 : 14}
                                    strokeWidth={2}
                                    className={accent ? accent.text : "text-slate-400 dark:text-slate-500"}
                                />
                            </div>
                            <div className="min-w-0">
                                <div
                                    className={`uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium leading-none mb-1 ${principal ? "text-[11px]" : "text-[10px]"
                                        }`}
                                >
                                    {key}
                                </div>
                                <div
                                    className={`font-semibold tabular-nums leading-none truncate ${principal ? "text-base" : "text-sm"
                                        } ${accent ? accent.text : "text-gray-900 dark:text-white"}`}
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