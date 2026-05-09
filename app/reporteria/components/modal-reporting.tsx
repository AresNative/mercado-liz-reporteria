import { Modal } from "@/components/modal";
import { useCallback, useEffect, useRef, useState } from "react";
import { DateRange } from "../types/filter";
import { QUERY_CONFIGS } from "../utils/config-constants";
import { SearchColumn } from "../types/config";
import { ReportType } from "../types/consultas";
import { RequestPayload, useManagmentRead } from "@/hooks/classes/api";
import { FilterBuilder } from "../utils/filter-class";
import DynamicTable from "@/components/table";
import { ALMACENES_OPCIONES } from "../utils/almacenes-constants";
import { TIME_RANGES } from "../utils/consultas-constants";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Card from "@/components/card";
import Details from "@/components/details";
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Store,
    Clock,
    Percent,
    Receipt,
    Building2,
    PieChart,
    TrendingUp as TrendingUpIcon,
    Calendar,
    Target,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import TreemapChart from "@/components/term-grafic";
import { formatValue } from "@/utils/constants/format-values";

// ─── Tipos ────────────────────────────────────────────────────────────────────

const dummySearchColumn: SearchColumn = {
    key: "", label: "", icon: () => null, color: "", tableField: "", table: ""
};

type ViewTab = "branches" | "hours" | "prediction" | "daily";
type SortDir = "asc" | "desc";
const dateToInput = (d: Date | null): string => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const inputToDate = (s: string): Date | null => {
    if (!s) return null;
    return new Date(`${s}T00:00:00`);
};

// ─── SummaryCards ─────────────────────────────────────────────────────────────

const SummaryCards = ({ data }: { data: any[] }) => {
    const totals = data.reduce(
        (acc, item) => ({
            totalVentas: acc.totalVentas + item.totalVentas,
            totalCosto: acc.totalCosto + item.totalCosto,
            totalTikets: acc.totalTikets + item.totalTikets,
            totalUtilidad: acc.totalUtilidad + item.utilidad,
        }),
        { totalVentas: 0, totalCosto: 0, totalTikets: 0, totalUtilidad: 0 }
    );
    const margen = totals.totalVentas ? (totals.totalUtilidad / totals.totalVentas) * 100 : 0;
    const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Ventas Totales" value={`$${fmt(totals.totalVentas)}`} icon={<DollarSign className="h-6 w-6 text-white" />} />
            <Card title="Utilidad Total" value={`$${fmt(totals.totalUtilidad)}`}
                subText={`${((totals.totalUtilidad / (totals.totalVentas || 1)) * 100).toFixed(1)}%`}
                icon={<TrendingUp className="h-6 w-6 text-white" />} />
            <Card title="Margen Promedio" value={`${margen.toFixed(2)}%`} icon={<Percent className="h-6 w-6 text-white" />} />
            <Card title="Total Tickets" value={totals.totalTikets.toString()} icon={<Receipt className="h-6 w-6 text-white" />} />
        </div>
    );
};

// ─── BranchRanking ────────────────────────────────────────────────────────────

const BRANCH_SORT_OPTIONS = [
    { key: "totalVentas", label: "Ventas" },
    { key: "utilidad", label: "Utilidad" },
    { key: "margen", label: "Margen" },
    { key: "totalTikets", label: "Tickets" },
];

const BranchRanking = ({ data, sortKey, sortDir, onSortChange }: {
    data: any[]; sortKey: string; sortDir: SortDir; onSortChange: (k: string) => void;
}) => {
    const sorted = [...data].sort((a, b) => {
        const av = a[sortKey] ?? 0;
        const bv = b[sortKey] ?? 0;
        return sortDir === "desc" ? bv - av : av - bv;
    });
    const total = sorted.reduce((acc, b) => acc + b.totalVentas, 0);

    return (
        <Card title="Ranking de Sucursales" icon={<Building2 className="h-6 w-6 text-white" />} value="">
            <div className="flex flex-wrap gap-1 mt-3 mb-4">
                {BRANCH_SORT_OPTIONS.map(opt => (
                    <button key={opt.key} onClick={() => onSortChange(opt.key)}
                        className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${sortKey === opt.key
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white dark:bg-zinc-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-zinc-600 hover:border-blue-400"
                            }`}>
                        {opt.label}{sortKey === opt.key && (sortDir === "desc" ? " ↓" : " ↑")}
                    </button>
                ))}
            </div>
            <div className="space-y-3">
                {sorted.map((branch, index) => (
                    <div key={branch.codigo} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${index === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                                index === 1 ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" :
                                    index === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" :
                                        "bg-gray-50 text-gray-500 dark:bg-zinc-800 dark:text-gray-500"
                                }`}>{index + 1}</span>
                            <span className="font-medium text-sm">{branch.sucursal}</span>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="font-semibold text-sm">
                                ${branch.totalVentas.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-gray-400">
                                {((branch.totalVentas / (total || 1)) * 100).toFixed(1)}% · Margen {branch.margen.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

// ─── BranchTreemap ────────────────────────────────────────────────────────────

const BranchTreemap = ({ data }: { data: any[] }) => (
    <Card title="Distribución de Ventas" icon={<PieChart className="h-6 w-6 text-white" />} value="">
        <div className="mt-4">
            <TreemapChart
                data={[{ name: "Ventas por Sucursal", data: data.map(b => ({ x: b.sucursal, y: b.totalVentas })) }]}
                height={300}
            />
        </div>
    </Card>
);

// ─── HourlyStats ──────────────────────────────────────────────────────────────

const HourlyStats = ({ data }: { data: any[] }) => {
    if (!data.length) return null;
    const peakHour = data.reduce((mx, i) => i.totalVentas > mx.totalVentas ? i : mx, data[0]);
    const lowHour = data.reduce((mn, i) => i.totalVentas < mn.totalVentas ? i : mn, data[0]);
    const totalVentas = data.reduce((acc, i) => acc + i.totalVentas, 0);
    const totalTickets = data.reduce((acc, i) => acc + i.totalTikets, 0);

    return (
        <div className="space-y-4">
            <BentoGrid cols={3} className="p-0">
                <BentoItem icon={<Clock className="h-5 w-5 text-green-600" />} title="Hora Pico"
                    description={String(peakHour.hora)}
                    header={<div className="text-sm text-gray-500">${peakHour.totalVentas.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>}
                    className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900" />
                <BentoItem icon={<Clock className="h-5 w-5 text-red-600" />} title="Hora Baja"
                    description={String(lowHour.hora)}
                    header={<div className="text-sm text-gray-500">${lowHour.totalVentas.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>}
                    className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900" />
                <BentoItem icon={<TrendingUp className="h-5 w-5 text-blue-600" />} title="Ticket Promedio"
                    description={`$${(totalTickets ? totalVentas / totalTickets : 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900" />
            </BentoGrid>
            <Details title="Detalle por Hora" type="form">
                <DynamicTable data={data} loading={false} />
            </Details>
        </div>
    );
};

// ─── SalesPrediction ──────────────────────────────────────────────────────────

const SalesPrediction = ({ historicalData }: { historicalData: any[] }) => {
    const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month">("week");
    const n = historicalData.length || 1;
    const avgDailySales = historicalData.reduce((acc, i) => acc + i.totalVentas, 0) / n;
    const avgTickets = historicalData.reduce((acc, i) => acc + i.totalTikets, 0) / n;
    const growthFactors = { day: 1.02, week: 1.15, month: 1.45 };

    const predictions = {
        day: { ventas: avgDailySales * growthFactors.day, tickets: Math.round(avgTickets * growthFactors.day), margen: 32.5, rango: { min: avgDailySales * growthFactors.day * 0.92, max: avgDailySales * growthFactors.day * 1.08 } },
        week: { ventas: avgDailySales * 7 * growthFactors.week, tickets: Math.round(avgTickets * 7 * growthFactors.week), margen: 33.2, rango: { min: avgDailySales * 7 * growthFactors.week * 0.9, max: avgDailySales * 7 * growthFactors.week * 1.1 } },
        month: { ventas: avgDailySales * 30 * growthFactors.month, tickets: Math.round(avgTickets * 30 * growthFactors.month), margen: 34.1, rango: { min: avgDailySales * 30 * growthFactors.month * 0.85, max: avgDailySales * 30 * growthFactors.month * 1.15 } },
    };

    const pred = predictions[selectedPeriod];
    const prev = selectedPeriod === "day" ? avgDailySales : selectedPeriod === "week" ? avgDailySales * 7 : avgDailySales * 30;
    const trend = ((pred.ventas - prev) / (prev || 1)) * 100;
    const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <Card title="Predicción de Ventas" icon={<Sparkles className="h-6 w-6 text-white" />} value="">
            <div className="mt-4 space-y-5">
                <div className="flex gap-2 flex-wrap">
                    {([["day", "Día"], ["week", "Semana"], ["month", "Mes"]] as const).map(([v, l]) => (
                        <button key={v} onClick={() => setSelectedPeriod(v)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === v ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
                                }`}>
                            <Calendar className="h-3.5 w-3.5" /> {l}
                        </button>
                    ))}
                </div>

                <BentoGrid cols={2} className="p-0 gap-4">
                    <BentoItem colSpan={1} className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Ventas Proyectadas</span>
                                <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {Math.abs(trend).toFixed(1)}%
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">${fmt(pred.ventas)}</div>
                            <div className="text-xs text-gray-500">
                                Rango: ${pred.rango.min.toLocaleString("en-US", { minimumFractionDigits: 0 })} – ${pred.rango.max.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                            </div>
                        </div>
                    </BentoItem>
                    <BentoItem colSpan={1} className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                        <div className="space-y-1.5">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Tickets Estimados</span>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{pred.tickets.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Margen proyectado: {pred.margen}%</div>
                        </div>
                    </BentoItem>
                </BentoGrid>

                <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                    Basado en {historicalData.length} períodos históricos. La precisión puede variar.
                </div>

                <Details title="Recomendaciones" type="form">
                    <div className="space-y-2">
                        <div className="flex items-start gap-2.5 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <Target className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-900 dark:text-blue-300 text-sm">Meta Sugerida</h4>
                                <p className="text-xs text-blue-700 dark:text-blue-400">
                                    ${(pred.ventas * 1.1).toLocaleString("en-US", { minimumFractionDigits: 0 })} (+10% sobre proyección)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                            <TrendingUpIcon className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-green-900 dark:text-green-300 text-sm">Oportunidad de Crecimiento</h4>
                                <p className="text-xs text-green-700 dark:text-green-400">
                                    +5% en ticket promedio = ${(pred.ventas * 0.05).toLocaleString("en-US", { minimumFractionDigits: 0 })} adicionales
                                </p>
                            </div>
                        </div>
                    </div>
                </Details>
            </div>
        </Card>
    );
};

// ─── DailyTrends ──────────────────────────────────────────────────────────────

const DailyTrends = ({ data, year, onYearChange, branch, onBranchChange, loading, onRefresh }: {
    data: any[]; year: number; onYearChange: (y: number) => void;
    branch: string; onBranchChange: (b: string) => void;
    loading: boolean; onRefresh: () => void;
}) => {
    const totals = data.reduce(
        (acc, d) => ({ totalVentas: acc.totalVentas + d.totalVentas, totalTikets: acc.totalTikets + d.totalTikets, Costos: acc.Costos + d.Costos }),
        { totalVentas: 0, totalTikets: 0, Costos: 0 }
    );
    console.log(data);
    
    const promedioTicket = totals.totalTikets > 0 ? totals.totalVentas / totals.totalTikets : 0;
    const promedioClientes = data.length > 0 ? totals.Costos / data.length : 0;
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: currentYear - 2019 + 2 }, (_, i) => 2020 + i);
    const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="space-y-5">
            {/* Controles */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-1.5">
                    <button onClick={() => onYearChange(year - 1)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <select value={year} onChange={e => onYearChange(Number(e.target.value))}
                            className="px-2 py-1.5 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm">
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button onClick={() => onYearChange(year + 1)} disabled={year >= currentYear + 1}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-1.5">
                    <Store className="h-4 w-4 text-gray-500" />
                    <select value={branch} onChange={e => onBranchChange(e.target.value)}
                        className="px-2 py-1.5 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm">
                        <option value="all">Todas las sucursales</option>
                        {ALMACENES_OPCIONES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                </div>

                <button onClick={onRefresh} disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    Actualizar
                </button>
            </div>

            {/* Tarjetas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card title="Ventas Anuales" value={`$${fmt(totals.totalVentas)}`} icon={<DollarSign className="h-6 w-6 text-white" />} />
                <Card title="Total Tickets" value={totals.totalTikets.toLocaleString()} icon={<Receipt className="h-6 w-6 text-white" />} />
                <Card title="Costos" value={`$${fmt(totals.Costos)}`} icon={<ShoppingCart className="h-6 w-6 text-white" />} />
                <Card title="Ticket Promedio" value={`$${fmt(promedioTicket)}`}
                    subText={`${formatValue(promedioClientes, "number")} clientes/día`}
                    icon={<TrendingUp className="h-6 w-6 text-white" />} />
            </div>

            <Details title="Evolución Diaria" type="form">
                {loading ? (
                    <div className="text-center py-8 flex items-center justify-center gap-2 text-gray-500">
                        <RefreshCw className="h-4 w-4 animate-spin" /> Cargando datos diarios...
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No hay datos para el período</div>
                ) : (
                    <DynamicTable data={data} loading={false} />
                )}
            </Details>
        </div>
    );
};

// ─── ViewSelector (tabs) ──────────────────────────────────────────────────────

const TABS: { id: ViewTab; label: string; icon: React.ReactNode; activeClass: string }[] = [
    { id: "branches", label: "Por Sucursal", icon: <Store className="h-4 w-4" />, activeClass: "bg-blue-500 text-white" },
    { id: "hours", label: "Por Hora", icon: <Clock className="h-4 w-4" />, activeClass: "bg-blue-500 text-white" },
    { id: "prediction", label: "Predicción", icon: <Sparkles className="h-4 w-4" />, activeClass: "bg-green-500 text-white" },
    { id: "daily", label: "Tendencia Diaria", icon: <Calendar className="h-4 w-4" />, activeClass: "bg-purple-500 text-white" },
];

const ViewSelector = ({ contents }: { contents: Record<ViewTab, React.ReactNode> }) => {
    const [active, setActive] = useState<ViewTab>("branches");
    return (
        <div className="space-y-4">
            <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-700 flex-wrap">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActive(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${active === tab.id
                            ? tab.activeClass
                            : "bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800"
                            }`}>
                        {tab.icon}{tab.label}
                    </button>
                ))}
            </div>
            <div className="mt-2">{contents[active]}</div>
        </div>
    );
};

const PRESETS = [
    { label: "7 d", days: 7 },
    { label: "30 d", days: 30 },
    { label: "90 d", days: 90 },
];

const DateRangePicker = ({ value, onChange, onApply, loading }: {
    value: DateRange;
    onChange: (range: DateRange) => void;
    onApply: () => void;
    loading: boolean;
}) => (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
        <Calendar className="h-4 w-4 text-gray-400 shrink-0" />

        {/* Inputs de fecha */}
        <div className="flex items-center gap-2">
            <input
                type="date"
                value={dateToInput(value.from)}
                onChange={e => onChange({ ...value, from: inputToDate(e.target.value) })}
                className="px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-700 dark:text-white"
            />
            <span className="text-gray-400 text-sm">→</span>
            <input
                type="date"
                value={dateToInput(value.to)}
                onChange={e => onChange({ ...value, to: inputToDate(e.target.value) })}
                className="px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-700 dark:text-white"
            />
        </div>

        {/* Presets rápidos */}
        <div className="flex gap-1">
            {PRESETS.map(p => (
                <button key={p.days}
                    onClick={() => {
                        const to = new Date();
                        const from = new Date();
                        from.setDate(to.getDate() - p.days);
                        onChange({ from, to });
                    }}
                    className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 hover:border-blue-400 hover:text-blue-600 transition-colors">
                    {p.label}
                </button>
            ))}
        </div>

        {/* Aplicar */}
        <button onClick={onApply} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50 transition-colors ml-auto">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Aplicar
        </button>
    </div>
);

// ─── Modal principal ──────────────────────────────────────────────────────────

export const ModalReporting = ({ open, reportType }: { open: boolean; reportType: ReportType }) => {
    if (!open) return null;

    const manager = useManagmentRead();

    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });

    // ── Estados ────────────────────────────────────────────────────────────────
    const [statsForHour, setStatsForHour] = useState<any[]>([]);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    const statsAbortRef = useRef<AbortController | null>(null);

    const [branchTotals, setBranchTotals] = useState<any[]>([]);
    const [branchTotalsLoading, setBranchTotalsLoading] = useState(false);
    const [branchTotalsError, setBranchTotalsError] = useState<string | null>(null);
    const branchAbortRef = useRef<AbortController | null>(null);

    const [dailyData, setDailyData] = useState<any[]>([]);
    const [dailyLoading, setDailyLoading] = useState(false);
    const [dailyError, setDailyError] = useState<string | null>(null);
    const dailyAbortRef = useRef<AbortController | null>(null);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedBranch, setSelectedBranch] = useState("all");

    // Sort del ranking de sucursales
    const [branchSortKey, setBranchSortKey] = useState("totalVentas");
    const [branchSortDir, setBranchSortDir] = useState<SortDir>("desc");
    const handleBranchSort = (key: string) => {
        setBranchSortDir(prev => branchSortKey === key ? (prev === "desc" ? "asc" : "desc") : "desc");
        setBranchSortKey(key);
    };

    // ── Fetch por hora ────────────────────────────────────────────────────────
    const fetchStatsForHourData = useCallback(async () => {
        if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return;
        statsAbortRef.current?.abort();
        setStatsError(null); setStatsLoading(true);
        const controller = new AbortController();
        statsAbortRef.current = controller;
        try {
            const queryConfig = QUERY_CONFIGS[reportType];
            const builder = new FilterBuilder({
                quickMode: true, filterGroups: [], searchTerm: "", searchColumn: dummySearchColumn,
                almacenFilter: "", dateRange, reportType, searchApplied: false, includeSearchTerm: false,
            });
            const { filtrosAnd: baseFiltrosAnd, filtrosOr } = builder.build();

            const promesas = TIME_RANGES.map(async rango => {
                const payload: RequestPayload = {
                    table: queryConfig.table,
                    filtros: {
                        agregaciones: [
                            { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
                            { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
                            { Key: "venta.ID", Alias: "totalTikets", Operation: "COUNT DISTINCT" },
                        ],
                        FiltrosAnd: [
                            ...baseFiltrosAnd,
                            { Filtros: [{ Key: "venta.FechaRegistro", Operator: "TIME_BETWEEN", Value: rango.value }], OperadorLogico: "AND" as const },
                        ],
                        ...(filtrosOr.length > 0 && { FiltrosOr: filtrosOr }),
                    },
                    signal: controller.signal,
                };
                const { promise } = manager.execute(payload);
                const response = await promise;
                if (response.error?.name === "AbortError" || response.error) return null;
                const d = response.data?.data?.[0] || {};
                const totalVentas = d.totalVentas || 0;
                const totalTikets = d.totalTikets || 0;
                return {
                    hora: rango.hora, totalVentas, totalCosto: d.totalCosto || 0, totalTikets,
                    utilidad: totalVentas - (d.totalCosto || 0),
                    margen: totalVentas ? ((totalVentas - (d.totalCosto || 0)) / totalVentas) * 100 : 0,
                    ticketPromedio: totalTikets ? totalVentas / totalTikets : 0,
                };
            });
            const resultados = await Promise.all(promesas);
            setStatsForHour(resultados.filter(Boolean));
        } catch (err: any) {
            if (err?.name !== "AbortError" && !err?.message?.includes("aborted"))
                setStatsError(err?.message || "Error al cargar estadísticas por hora");
        } finally {
            if (!controller.signal.aborted) setStatsLoading(false);
        }
    }, [reportType, dateRange, manager]);

    // ── Fetch por sucursal ────────────────────────────────────────────────────
    const fetchBranchTotals = useCallback(async () => {
        if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return;
        branchAbortRef.current?.abort();
        setBranchTotalsError(null); setBranchTotalsLoading(true);
        const controller = new AbortController();
        branchAbortRef.current = controller;
        try {
            const queryConfig = QUERY_CONFIGS[reportType];
            const promesas = ALMACENES_OPCIONES.map(async almacen => {
                const builder = new FilterBuilder({
                    quickMode: true, filterGroups: [], searchTerm: "", searchColumn: dummySearchColumn,
                    almacenFilter: almacen.value, dateRange, reportType, searchApplied: false, includeSearchTerm: false,
                });
                const { filtrosAnd, filtrosOr } = builder.build();
                const payload: RequestPayload = {
                    table: queryConfig.table,
                    filtros: {
                        agregaciones: [
                            { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
                            { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
                            { Key: "venta.ID", Alias: "totalTikets", Operation: "COUNT DISTINCT" },
                        ],
                        FiltrosAnd: filtrosAnd,
                        ...(filtrosOr.length > 0 && { FiltrosOr: filtrosOr }),
                    },
                    signal: controller.signal,
                };
                const { promise } = manager.execute(payload);
                const response = await promise;
                if (response.error?.name === "AbortError" || response.error) return null;
                const d = response.data?.data?.[0] || {};
                const totalVentas = d.totalVentas || 0;
                const totalCosto = d.totalCosto || 0;
                const utilidad = totalVentas - totalCosto;
                return {
                    sucursal: almacen.label, codigo: almacen.value,
                    totalVentas, totalCosto, totalTikets: d.totalTikets || 0,
                    utilidad, margen: totalVentas ? (utilidad / totalVentas) * 100 : 0,
                };
            });
            const resultados = await Promise.all(promesas);
            setBranchTotals(resultados.filter(Boolean));
        } catch (err: any) {
            if (err?.name !== "AbortError" && !err?.message?.includes("aborted"))
                setBranchTotalsError(err?.message || "Error al cargar sucursales");
        } finally {
            if (!controller.signal.aborted) setBranchTotalsLoading(false);
        }
    }, [reportType, dateRange, manager]);

    // ── Fetch diario ──────────────────────────────────────────────────────────
    const fetchDailyData = useCallback(async (year: number, branchCode: string) => {
        if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return;
        dailyAbortRef.current?.abort();
        setDailyError(null);
        setDailyLoading(true);
        const controller = new AbortController();
        dailyAbortRef.current = controller;
        try {
            const queryConfig = QUERY_CONFIGS[reportType];
            const days: Date[] = [];
            // Generar lista de días del año (sin horas)
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31);
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                days.push(new Date(d.getFullYear(), d.getMonth(), d.getDate())); // solo fecha, sin hora
            }

            const promises = days.map(async day => {
                // Periodo fijo del día: desde las 00:00:00.000 hasta las 23:59:59.999
                const dayStart = new Date(day);
                dayStart.setUTCHours(0, 0, 0, 0); // Establece las 00:00 en tiempo universal
  // 00:00:00.000

                const dayEnd = new Date(day);
                dayEnd.setUTCHours(23, 59, 59, 999); // 23:59:59.999   

                const builder = new FilterBuilder({
                    quickMode: true,
                    filterGroups: [],
                    searchTerm: "",
                    searchColumn: dummySearchColumn,
                    almacenFilter: branchCode === "all" ? "" : branchCode,
                    dateRange: { from: dayStart, to: dayEnd },
                    reportType,
                    searchApplied: false,
                    includeSearchTerm: false,
                });
                const { filtrosAnd, filtrosOr } = builder.build();
                const payload: RequestPayload = {
                    table: queryConfig.table,
                    filtros: {
                        agregaciones: [
                            { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
                            { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
                            { Key: "venta.ID", Alias: "totalTikets", Operation: "COUNT DISTINCT" },
                            { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "Costos", Operation: "SUM" },
                        ],
                        FiltrosAnd: filtrosAnd,
                        ...(filtrosOr.length > 0 && { FiltrosOr: filtrosOr }),
                    },
                    signal: controller.signal,
                };
                const { promise } = manager.execute(payload);
                const response = await promise;
                if (response.error?.name === "AbortError" || response.error) return null;
                const d2 = response.data?.data?.[0] || {};
                const totalVentas = d2.totalVentas || 0;
                const totalTikets = d2.totalTikets || 0;
                return {
                    fecha: dateToInput(day),
                    totalVentas,    
                    totalCosto: d2.totalCosto || 0,
                    totalTikets,
                    Costos: d2.Costos || 0,
                    utilidad: totalVentas - (d2.totalCosto || 0),
                    ticketPromedio: totalTikets ? totalVentas / totalTikets : 0,
                };
            });
            const resultados = await Promise.all(promises);
            setDailyData(resultados.filter(Boolean));
        } catch (err: any) {
            if (err?.name !== "AbortError" && !err?.message?.includes("aborted")) {
                setDailyError(err?.message || "Error al cargar datos diarios");
            }
        } finally {
            if (!controller.signal.aborted) setDailyLoading(false);
        }
    }, [reportType, manager]);

    const refreshAll = useCallback(() => {
        fetchStatsForHourData();
        fetchBranchTotals();
        fetchDailyData(selectedYear, selectedBranch);
    }, [fetchStatsForHourData, fetchBranchTotals, fetchDailyData, selectedYear, selectedBranch]);

    useEffect(() => { fetchStatsForHourData(); fetchBranchTotals(); }, []);
    useEffect(() => { fetchDailyData(selectedYear, selectedBranch); }, [selectedYear, selectedBranch]);

    const anyLoading = statsLoading || branchTotalsLoading || dailyLoading;

    // ── Contenidos de tabs ────────────────────────────────────────────────────
    const tabContents: Record<ViewTab, React.ReactNode> = {

        branches: branchTotalsLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
                <RefreshCw className="h-4 w-4 animate-spin" /> Cargando sucursales...
            </div>
        ) : branchTotalsError ? (
            <div className="text-red-500 p-4">Error: {branchTotalsError}</div>
        ) : branchTotals.length > 0 ? (
            <div className="space-y-6">
                <SummaryCards data={branchTotals} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BranchRanking data={branchTotals} sortKey={branchSortKey} sortDir={branchSortDir} onSortChange={handleBranchSort} />
                    <BranchTreemap data={branchTotals} />
                </div>
                <Details title="Tabla Detallada por Sucursal" type="form">
                    <DynamicTable data={branchTotals} />
                </Details>
            </div>
        ) : (
            <div className="text-center py-8 text-gray-400">No hay datos disponibles</div>
        ),

        hours: statsLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
                <RefreshCw className="h-4 w-4 animate-spin" /> Cargando estadísticas por hora...
            </div>
        ) : statsError ? (
            <div className="text-red-500 p-4">Error: {statsError}</div>
        ) : statsForHour.length > 0 ? (
            <HourlyStats data={statsForHour} />
        ) : (
            <div className="text-center py-8 text-gray-400">No hay datos disponibles</div>
        ),

        prediction: branchTotalsLoading || statsLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
                <RefreshCw className="h-4 w-4 animate-spin" /> Cargando datos para predicción...
            </div>
        ) : branchTotals.length > 0 && statsForHour.length > 0 ? (
            <div className="space-y-6">
                <SalesPrediction historicalData={statsForHour} />
                <Details title="Factores de Predicción" type="form">
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <p>• Datos históricos de {statsForHour.length} períodos analizados</p>
                        <p>• Tendencia de {branchTotals.length} sucursales incluidas</p>
                        <p>• Estacionalidad por hora del día</p>
                        <p>• Márgenes de utilidad promedio</p>
                    </div>
                </Details>
            </div>
        ) : (
            <div className="text-center py-8 text-gray-400">No hay suficientes datos para predicciones</div>
        ),

        daily: dailyError ? (
            <div className="text-red-500 p-4">Error: {dailyError}</div>
        ) : (
            <DailyTrends
                data={dailyData} year={selectedYear} onYearChange={setSelectedYear}
                branch={selectedBranch} onBranchChange={setSelectedBranch}
                loading={dailyLoading} onRefresh={() => fetchDailyData(selectedYear, selectedBranch)}
            />
        ),
    };

    return (
        <Modal modalName="reporting" maxWidth="full" title="Análisis de Ventas por Sucursal">
            <div className="space-y-5">
                <DateRangePicker value={dateRange} onChange={setDateRange} onApply={refreshAll} loading={anyLoading} />
                <ViewSelector contents={tabContents} />
            </div>
        </Modal>
    );
};