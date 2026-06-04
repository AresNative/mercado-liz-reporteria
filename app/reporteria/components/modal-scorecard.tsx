"use client";

import { Modal } from "@/components/modal";
import {
    useManagmentRead,
    type RequestPayload,
} from "@/hooks/classes/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { QUERY_CONFIGS, QUERY_CHART_META, type SupportedChartType } from "../utils/config-scorecard";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import DynamicTable from "@/components/table";
import Pagination from "@/components/pagination";
import {
    RefreshCw, Clock, Send, Filter,
    BarChart3, TrendingUp, ArrowLeftRight, X,
    ArrowUp, ArrowDown, Settings2, PieChart, AreaChart,
    ChevronsUpDown, Calendar,
} from "lucide-react";
import Details from "@/components/details";
import { sendWhatsAppMessage } from "@/hooks/classes/send-whats";
import DynamicChart from "@/components/dynamic-chart";
import TreemapChart from "@/components/term-grafic";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type QueryKey = keyof typeof QUERY_CONFIGS;

interface SortConfig { key: string; direction: "ASC" | "DESC"; }

interface ChartOverride { chartType: SupportedChartType; xKey: string; yKey: string; }

// ─── Queries ──────────────────────────────────────────────────────────────────

const GRID_QUERY_KEYS: QueryKey[] = ["PERIODOS_SEMANA", "80-20", "PROVEEDORES_RESUMEN"];
const ADDITIONAL_QUERIES: QueryKey[] = ["PERIODOS_CATEGORIA", "PROVEEDORES_DETALLE"];
const ALL_QUERY_KEYS: QueryKey[] = [...GRID_QUERY_KEYS, ...ADDITIONAL_QUERIES];

// ─── Config visual base ───────────────────────────────────────────────────────

interface QueryDisplayConfig { title: string; showTable?: boolean; defaultView?: "table" | "chart"; }

const QUERY_DISPLAY_CONFIG: Record<QueryKey, QueryDisplayConfig> = {
    "PERIODOS_SEMANA": { title: "Comparación de Períodos", showTable: true, defaultView: "chart" },
    "PERIODOS_CATEGORIA": { title: "Categorías de Precio", showTable: true, defaultView: "chart" },
    "80-20": { title: "80-20 (Top Artículos)", showTable: true, defaultView: "chart" },
    "PROVEEDORES_RESUMEN": { title: "Proveedores (Resumen)", showTable: true, defaultView: "table" },
    "PROVEEDORES_DETALLE": { title: "Proveedores (Detalle)", showTable: true, defaultView: "table" },
};

// ─── Estado ───────────────────────────────────────────────────────────────────

interface ComparisonPeriod { id: string; label: string; startDate: string; endDate: string; }

interface QueryState {
    data: any[]; loading: boolean; error: string | null; lastUpdated: Date | null;
    viewMode: "table" | "chart"; currentPage: number; totalRecords: number; pageSize: number;
    sortConfig: SortConfig | null;
}

interface FilterEntry { field: string; operator: string; value: any; }
interface FilterState { [key: string]: FilterEntry[]; }

// ─── Helpers de fecha ─────────────────────────────────────────────────────────
// new Date("YYYY-MM-DD") parsea en UTC → desfase en timezones negativos (MX -6).
// Usamos hora local explícita para evitarlo.

const dateToInput = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const inputToDate = (s: string): Date => new Date(`${s}T00:00:00`);

// ─── Otros helpers ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const h = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(h);
    }, [value, delay]);
    return debounced;
}

const getPageSize = (key: QueryKey): number => (key === "80-20" ? 20 : 10);

const OPERATOR_OPTIONS = ["=", "!=", ">", ">=", "<", "<=", "LIKE", "NOT LIKE"];

const CHART_TYPE_ICONS: Record<SupportedChartType, React.ReactNode> = {
    bar: <BarChart3 size={13} />,
    line: <TrendingUp size={13} />,
    area: <AreaChart size={13} />,
    pie: <PieChart size={13} />,
    treemap: <Settings2 size={13} />,
};

const CHART_TYPE_LABELS: Record<SupportedChartType, string> = {
    bar: "Barras", line: "Línea", area: "Área", pie: "Pastel", treemap: "Mapa árbol",
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

const fetchPeriodData = async (
    manager: { execute: (p: any) => { promise: Promise<any> } },
    key: QueryKey,
    period: ComparisonPeriod,
    signal?: AbortSignal
): Promise<any[]> => {
    const config = QUERY_CONFIGS[key];
    const payload: RequestPayload = {
        table: config.table,
        filtros: {
            agregaciones: config.agregaciones,
            selects: config.selects,
            FiltrosAnd: [{ OperadorLogico: "AND" as const, Filtros: [{ Key: config.fechaField, Operator: "BETWEEN", Value: `${period.startDate} AND ${period.endDate}` }] }],
            Order: config.Order,
        },
        page: 1, pageSize: getPageSize(key), signal,
    };
    const { promise } = manager.execute(payload);
    const response = await promise;
    if (response.error) throw response.error;
    return response.data?.data ?? [];
};

const transformComparisonData = (data1: any[], data2: any[], xKey: string, yKey: string) => {
    const map1 = new Map<string, number>();
    const map2 = new Map<string, number>();
    data1.forEach(item => map1.set(String(item[xKey]), item[yKey] || 0));
    data2.forEach(item => map2.set(String(item[xKey]), item[yKey] || 0));
    const allKeys = Array.from(new Set([...map1.keys(), ...map2.keys()]));
    return {
        series: [
            { name: "Período 1", data: allKeys.map((k, i) => ({ x: k, y: map1.get(k) || 0, order: i + 1 })) },
            { name: "Período 2", data: allKeys.map((k, i) => ({ x: k, y: map2.get(k) || 0, order: i + 1 })) },
        ],
        categories: allKeys,
    };
};

// ─── DateRangePicker (mismo patrón que modal-reporting) ───────────────────────

interface DateRangeStr { start: string; end: string; }

const PRESETS = [
    { label: "7 d", days: 7 },
    { label: "30 d", days: 30 },
    { label: "90 d", days: 90 },
];

const DateRangePicker = ({ value, onChange, onApply, loading, extraActions }: {
    value: DateRangeStr;
    onChange: (r: DateRangeStr) => void;
    onApply: () => void;
    loading: boolean;
    extraActions?: React.ReactNode;
}) => (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
        <Calendar className="h-4 w-4 text-gray-400 shrink-0" />

        <div className="flex items-center gap-2">
            <input type="date" value={value.start}
                onChange={e => onChange({ ...value, start: e.target.value })}
                className="px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-700 dark:text-white" />
            <span className="text-gray-400 text-sm">→</span>
            <input type="date" value={value.end}
                onChange={e => onChange({ ...value, end: e.target.value })}
                className="px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-700 dark:text-white" />
        </div>

        <div className="flex gap-1">
            {PRESETS.map(p => (
                <button key={p.days}
                    onClick={() => {
                        const to = new Date();
                        const from = new Date();
                        from.setDate(to.getDate() - p.days);
                        onChange({ start: dateToInput(from), end: dateToInput(to) });
                    }}
                    className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 hover:border-blue-400 hover:text-blue-600 transition-colors">
                    {p.label}
                </button>
            ))}
        </div>

        <button onClick={onApply} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm disabled:opacity-50 transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Aplicar
        </button>

        {extraActions}
    </div>
);

// ─── ScoreCard ────────────────────────────────────────────────────────────────

const ScoreCard = ({ open }: { open: boolean }) => {
    if (!open) return null;

    const [manager] = useManagmentRead();
    const controllersRef = useRef<Map<string, AbortController>>(new Map());

    // Estado de comparación de períodos (usa strings YYYY-MM-DD directamente,
    // sin pasar por Date, para no tener problemas de timezone)
    const [comparisonPeriods, setComparisonPeriods] = useState<{ period1: ComparisonPeriod; period2: ComparisonPeriod; }>({
        period1: { id: "p1", label: "Semana 1", startDate: "2026-03-15", endDate: "2026-03-21" },
        period2: { id: "p2", label: "Semana 2", startDate: "2026-03-22", endDate: "2026-03-28" },
    });

    // Rango general también como strings YYYY-MM-DD
    const [dateRange, setDateRange] = useState<DateRangeStr>({ start: "2026-03-01", end: "2026-03-31" });
    const debouncedDateRange = useDebounce(dateRange, 500);

    const [filters, setFilters] = useState<FilterState>({});
    const [showFilters, setShowFilters] = useState<Record<string, boolean>>({});
    const [showChartConfig, setShowChartConfig] = useState<Record<string, boolean>>({});
    const [chartOverrides, setChartOverrides] = useState<Record<string, ChartOverride>>({});
    const [pendingFilter, setPendingFilter] = useState<Record<string, Partial<FilterEntry>>>({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshProgress, setRefreshProgress] = useState({ current: 0, total: 0 });
    const [whatsappStatus, setWhatsappStatus] = useState<{ sending: boolean; lastResult: string | null }>({ sending: false, lastResult: null });

    const [comparisonData, setComparisonData] = useState<{ period1Data: any[]; period2Data: any[]; loading: boolean; error: string | null; }>({
        period1Data: [], period2Data: [], loading: false, error: null
    });

    const [queriesState, setQueriesState] = useState<Record<QueryKey, QueryState>>(() => {
        const initial = {} as Record<QueryKey, QueryState>;
        ALL_QUERY_KEYS.forEach(key => {
            initial[key] = {
                data: [], loading: false, error: null, lastUpdated: null,
                viewMode: QUERY_DISPLAY_CONFIG[key]?.defaultView || "table",
                currentPage: 1, totalRecords: 0, pageSize: getPageSize(key),
                sortConfig: null,
            };
        });
        return initial;
    });

    const queriesStateRef = useRef(queriesState);
    useEffect(() => { queriesStateRef.current = queriesState; }, [queriesState]);

    // ── Chart helpers ──────────────────────────────────────────────────────────

    const getChartMeta = useCallback((key: QueryKey) => QUERY_CHART_META[key], []);

    const getEffectiveChartConfig = useCallback((key: QueryKey): ChartOverride => {
        if (chartOverrides[key]) return chartOverrides[key];
        const meta = QUERY_CHART_META[key];
        if (meta) return { chartType: meta.defaultChartType, xKey: meta.defaultXKey, yKey: meta.defaultYKey };
        return { chartType: "bar", xKey: "name", yKey: "value" };
    }, [chartOverrides]);

    const updateChartOverride = useCallback((key: QueryKey, partial: Partial<ChartOverride>) => {
        setChartOverrides(prev => ({ ...prev, [key]: { ...getEffectiveChartConfig(key), ...partial } }));
    }, [getEffectiveChartConfig]);

    // ── Sort directo ───────────────────────────────────────────────────────────

    const handleColumnSort = useCallback((key: QueryKey, columnKey: string) => {
        setQueriesState(prev => {
            const current = prev[key].sortConfig;
            const newSort: SortConfig = current?.key === columnKey
                ? { key: columnKey, direction: current.direction === "ASC" ? "DESC" : "ASC" }
                : { key: columnKey, direction: "DESC" };

            const sorted = [...prev[key].data].sort((a, b) => {
                const va = a[columnKey];
                const vb = b[columnKey];
                if (typeof va === "number" && typeof vb === "number")
                    return newSort.direction === "ASC" ? va - vb : vb - va;
                return newSort.direction === "ASC"
                    ? String(va).localeCompare(String(vb))
                    : String(vb).localeCompare(String(va));
            });

            return { ...prev, [key]: { ...prev[key], sortConfig: newSort, data: sorted } };
        });
    }, []);

    // ── Fetch comparación ──────────────────────────────────────────────────────

    const fetchComparisonData = useCallback(async () => {
        const qKey = "PERIODOS_SEMANA";
        const controller = new AbortController();
        controllersRef.current.set(`comparison_${qKey}`, controller);
        setComparisonData(prev => ({ ...prev, loading: true, error: null }));
        try {
            const [data1, data2] = await Promise.all([
                fetchPeriodData(manager, qKey, comparisonPeriods.period1, controller.signal),
                fetchPeriodData(manager, qKey, comparisonPeriods.period2, controller.signal),
            ]);
            setComparisonData({ period1Data: data1, period2Data: data2, loading: false, error: null });
            setQueriesState(prev => ({
                ...prev,
                [qKey]: {
                    ...prev[qKey],
                    data: [
                        ...data1.map(d => ({ ...d, tipoPeriodo: "Período 1" })),
                        ...data2.map(d => ({ ...d, tipoPeriodo: "Período 2" })),
                    ],
                    lastUpdated: new Date(), loading: false, error: null,
                }
            }));
        } catch (err: any) {
            if (err?.name !== "AbortError")
                setComparisonData(prev => ({ ...prev, error: err?.message || "Error desconocido", loading: false }));
        } finally {
            controllersRef.current.delete(`comparison_${qKey}`);
        }
    }, [manager, comparisonPeriods]);

    // ── Fetch normal ───────────────────────────────────────────────────────────

    const fetchData = useCallback(
        async (keys: QueryKey[], range = debouncedDateRange, customFilters?: FilterState) => {
            const normalKeys = keys.filter(k => k !== "PERIODOS_SEMANA");
            if (!normalKeys.length) return;

            setIsRefreshing(true);
            setRefreshProgress({ current: 0, total: normalKeys.length });
            normalKeys.forEach(k => { controllersRef.current.get(k)?.abort(); controllersRef.current.delete(k); });
            setQueriesState(prev => {
                const n = { ...prev };
                normalKeys.forEach(k => { n[k] = { ...n[k], loading: true, error: null }; });
                return n;
            });

            const activeFilters = customFilters || filters;

            const promises = normalKeys.map(async (key, idx) => {
                const controller = new AbortController();
                controllersRef.current.set(key, controller);
                try {
                    const config = QUERY_CONFIGS[key];
                    const stateSnap = queriesStateRef.current[key];
                    const orderToUse = stateSnap.sortConfig
                        ? [{ Key: stateSnap.sortConfig.key, Direction: stateSnap.sortConfig.direction }]
                        : config.Order;

                    const filtrosAnd: any[] = [{
                        OperadorLogico: "AND" as const,
                        Filtros: [{ Key: config.fechaField, Operator: "BETWEEN", Value: `${range.start} AND ${range.end}` }],
                    }];
                    const qFilters = activeFilters[key];
                    if (qFilters?.length) {
                        filtrosAnd.push({
                            OperadorLogico: "AND" as const,
                            Filtros: qFilters.map(f => ({ Key: f.field, Operator: f.operator, Value: f.value })),
                        });
                    }

                    const payload: RequestPayload = {
                        table: config.table,
                        filtros: { agregaciones: config.agregaciones, selects: config.selects, FiltrosAnd: filtrosAnd, Order: orderToUse },
                        page: stateSnap?.currentPage ?? 1,
                        pageSize: stateSnap?.pageSize ?? getPageSize(key),
                        signal: controller.signal,
                    };

                    const { promise } = manager.execute<any>(payload);
                    const response = await promise;
                    if (response.error) throw response.error;
                    setRefreshProgress(prev => ({ ...prev, current: idx + 1 }));
                    return { key, data: response.data?.data ?? [], totalRecords: response.data?.totalRecords ?? 0, lastUpdated: new Date(), error: null };
                } catch (err: any) {
                    if (err?.name === "AbortError") return { key, data: [], totalRecords: 0, lastUpdated: null, error: "__ABORTED__" };
                    return { key, data: [], totalRecords: 0, lastUpdated: null, error: err?.message || "Error desconocido" };
                }
            });

            const results = await Promise.all(promises);
            setQueriesState(prev => {
                const n = { ...prev };
                results.forEach(({ key, data, totalRecords, lastUpdated, error }) => {
                    if (error === "__ABORTED__") return;
                    n[key] = { ...n[key], data, totalRecords: totalRecords ?? n[key].totalRecords, loading: false, error, lastUpdated };
                });
                return n;
            });
            normalKeys.forEach(k => controllersRef.current.delete(k));
            setIsRefreshing(false);
            setRefreshProgress({ current: 0, total: 0 });
        },
        [manager, debouncedDateRange, filters]
    );

    // ── Acciones ───────────────────────────────────────────────────────────────

    const toggleFilters = useCallback((key: QueryKey) => setShowFilters(p => ({ ...p, [key]: !p[key] })), []);
    const toggleChartConfig = useCallback((key: QueryKey) => setShowChartConfig(p => ({ ...p, [key]: !p[key] })), []);
    const toggleViewMode = useCallback((key: QueryKey) => setQueriesState(p => ({ ...p, [key]: { ...p[key], viewMode: p[key].viewMode === "table" ? "chart" : "table" } })), []);

    const addFilter = useCallback((key: QueryKey) => {
        const pending = pendingFilter[key];
        if (!pending?.field || !pending?.operator || pending?.value === undefined || pending?.value === "") return;
        setFilters(prev => ({ ...prev, [key]: [...(prev[key] || []), { field: pending.field!, operator: pending.operator!, value: pending.value }] }));
        setPendingFilter(prev => ({ ...prev, [key]: {} }));
    }, [pendingFilter]);

    const removeFilter = useCallback((key: QueryKey, i: number) => setFilters(p => ({ ...p, [key]: p[key]?.filter((_, idx) => idx !== i) || [] })), []);
    const clearFilters = useCallback((key: QueryKey) => setFilters(p => ({ ...p, [key]: [] })), []);
    const applyFilters = useCallback((key: QueryKey) => fetchData([key], debouncedDateRange), [fetchData, debouncedDateRange]);

    const setQueryPageSize = useCallback((key: QueryKey, size: number) => {
        setQueriesState(prev => {
            const updated = { ...prev, [key]: { ...prev[key], pageSize: size, currentPage: 1 } };
            queriesStateRef.current = updated;
            return updated;
        });
        fetchData([key]);
    }, [fetchData]);

    useEffect(() => {
        if (open) {
            fetchComparisonData();
            fetchData(ALL_QUERY_KEYS.filter(k => k !== "PERIODOS_SEMANA"), debouncedDateRange);
        }
        return () => { controllersRef.current.forEach(c => c.abort()); controllersRef.current.clear(); };
    }, [open]);

    // ── WhatsApp ───────────────────────────────────────────────────────────────

    const sendScoreCardReport = useCallback(async () => {
        setWhatsappStatus({ sending: true, lastResult: null });
        const summary = ALL_QUERY_KEYS.map(key => {
            const state = queriesState[key];
            const registros = state?.data?.length ?? 0;
            let totalVentas = "";
            if (state?.data?.length) {
                const firstItem = state.data[0];
                const sumKey = ["totalVentas", "totalComprado"].find(k => firstItem?.[k] !== undefined);
                if (sumKey) {
                    const sum = state.data.reduce((acc: number, r: any) => acc + (r[sumKey] || 0), 0);
                    totalVentas = ` | Total: $${sum.toLocaleString("es-MX")}`;
                }
            }
            return `• ${QUERY_DISPLAY_CONFIG[key]?.title || key}: ${registros} registros${totalVentas}`;
        }).join("\n");

        const result = await sendWhatsAppMessage("+526462895421",
            `📊 *Reporte ScoreCard*\n🗓️ Período: ${dateRange.start} al ${dateRange.end}\n\n${summary}\n\n🕐 ${new Date().toLocaleString("es-MX")}`
        );
        setWhatsappStatus({ sending: false, lastResult: result.success ? "✅ Enviado" : `❌ Error: ${result.error}` });
        setTimeout(() => setWhatsappStatus(p => ({ ...p, lastResult: null })), 5000);
    }, [queriesState, dateRange]);

    // ── Utilidades ────────────────────────────────────────────────────────────

    const formatTime = (d: Date | null) => d?.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "";
    const anyLoading = Object.values(queriesState).some(q => q.loading) || comparisonData.loading;

    const transformToChartData = (data: any[], xKey: string, yKey: string, nameKey?: string) => {
        if (!data?.length) return [];
        if (nameKey) {
            const grouped = new Map<string, { x: string; y: number }[]>();
            data.forEach(item => {
                const name = String(item[nameKey]);
                if (!grouped.has(name)) grouped.set(name, []);
                grouped.get(name)!.push({ x: String(item[xKey]), y: item[yKey] || 0 });
            });
            return Array.from(grouped.entries()).map(([name, values]) => ({ name, data: values }));
        }
        return [{ name: yKey, data: data.map((item, i) => ({ x: String(item[xKey]), y: item[yKey] || 0, order: i + 1 })) }];
    };

    // ── Panel config gráfica ──────────────────────────────────────────────────

    const renderChartConfigPanel = (key: QueryKey) => {
        const meta = getChartMeta(key);
        if (!meta) return null;
        const effective = getEffectiveChartConfig(key);

        return (
            <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Configuración de gráfica</h4>
                    <button onClick={() => toggleChartConfig(key)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                </div>

                {/* Tipo de gráfica */}
                <div className="mb-3">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Tipo de gráfica</label>
                    <div className="flex flex-wrap gap-1">
                        {meta.availableChartTypes.map(type => (
                            <button key={type} onClick={() => updateChartOverride(key, { chartType: type })}
                                className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${effective.chartType === type
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400 dark:bg-gray-700 dark:text-gray-300"
                                    }`}>
                                {CHART_TYPE_ICONS[type]}{CHART_TYPE_LABELS[type]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Eje X (no para pie/treemap) */}
                {effective.chartType !== "pie" && effective.chartType !== "treemap" && (
                    <div className="mb-3">
                        <label className="text-xs font-medium text-gray-500 block mb-1">Eje X (Dimensión)</label>
                        <select value={effective.xKey} onChange={e => updateChartOverride(key, { xKey: e.target.value })}
                            className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600">
                            {meta.xFieldOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                        </select>
                    </div>
                )}

                {/* Eje Y */}
                <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">
                        {effective.chartType === "pie" || effective.chartType === "treemap" ? "Valor" : "Eje Y (Métrica)"}
                    </label>
                    <select value={effective.yKey} onChange={e => updateChartOverride(key, { yKey: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600">
                        {meta.yFieldOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                    </select>
                </div>
            </div>
        );
    };

    // ── Panel de filtros ───────────────────────────────────────────────────────

    const renderFiltersPanel = (key: QueryKey) => {
        const queryFilters = filters[key] || [];
        const pending = pendingFilter[key] || {};
        const allColumns = [
            ...(QUERY_CONFIGS[key]?.selects || []).map(s => ({ key: s.Alias || s.Key, label: s.Alias || s.Key })),
            ...(QUERY_CONFIGS[key]?.agregaciones || []).map(a => ({ key: a.Alias || a.Key, label: a.Alias || a.Key })),
        ];

        return (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300">Filtros</h4>
                    <div className="flex items-center gap-2">
                        {queryFilters.length > 0 && (
                            <button onClick={() => clearFilters(key)} className="text-xs text-red-500 hover:text-red-700 underline">
                                Limpiar todos
                            </button>
                        )}
                        <button onClick={() => toggleFilters(key)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                </div>

                {/* Filtros activos */}
                {queryFilters.length > 0 && (
                    <div className="space-y-1 mb-3">
                        {queryFilters.map((filter, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs bg-white dark:bg-gray-700 rounded px-2 py-1.5 border">
                                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">{filter.field}</span>
                                <span className="text-gray-400">{filter.operator}</span>
                                <span className="font-mono text-gray-700 dark:text-gray-300 flex-1">{String(filter.value)}</span>
                                <button onClick={() => removeFilter(key, idx)} className="text-red-400 hover:text-red-600 ml-auto">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Constructor nuevo filtro */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                    <select value={pending.field || ""}
                        onChange={e => setPendingFilter(p => ({ ...p, [key]: { ...p[key], field: e.target.value } }))}
                        className="px-2 py-1.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600">
                        <option value="">Campo...</option>
                        {allColumns.map(col => <option key={col.key} value={col.key}>{col.label}</option>)}
                    </select>
                    <select value={pending.operator || ""}
                        onChange={e => setPendingFilter(p => ({ ...p, [key]: { ...p[key], operator: e.target.value } }))}
                        className="px-2 py-1.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600">
                        <option value="">Operador...</option>
                        {OPERATOR_OPTIONS.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                    <input type="text" placeholder="Valor..." value={String(pending.value ?? "")}
                        onChange={e => setPendingFilter(p => ({ ...p, [key]: { ...p[key], value: e.target.value } }))}
                        className="px-2 py-1.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => addFilter(key)}
                        disabled={!pending.field || !pending.operator || pending.value === undefined || pending.value === ""}
                        className="flex-1 px-3 py-1.5 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        + Agregar filtro
                    </button>
                    {queryFilters.length > 0 && (
                        <button onClick={() => applyFilters(key)}
                            className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                            Aplicar y recargar
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // ── Barra de sort de tabla ────────────────────────────────────────────────
    // Nota: DynamicTable ya tiene sort integrado en los encabezados.
    // Este renderSortableHeader es opcional para mostrar el estado del sort server-side.

    const renderSortBadge = (key: QueryKey) => {
        const sortConfig = queriesState[key]?.sortConfig;
        if (!sortConfig) return null;
        return (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                {sortConfig.direction === "ASC" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                {sortConfig.key}
                <button onClick={() => setQueriesState(p => ({ ...p, [key]: { ...p[key], sortConfig: null } }))}
                    className="ml-0.5 hover:text-red-500"><X size={10} /></button>
            </span>
        );
    };

    // ── Render contenido ───────────────────────────────────────────────────────

    const renderContent = (key: QueryKey, state: QueryState) => {
        if (state.loading) return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
        if (state.error) return <div className="p-4 text-center text-red-500">Error: {state.error}</div>;
        if (!state.data?.length) return <div className="p-4 text-center text-gray-400">No hay datos para el período</div>;

        const effective = getEffectiveChartConfig(key);
        const meta = getChartMeta(key);

        if (state.viewMode === "chart" && meta) {
            const chartData = transformToChartData(state.data, effective.xKey, effective.yKey);
            const categories = state.data.map(item => String(item[effective.xKey]));
            if (effective.chartType === "treemap") return <TreemapChart data={chartData} height={400} />;
            return (
                <DynamicChart
                    type={effective.chartType as "bar" | "line" | "area" | "pie"}
                    categories={categories}
                    data={chartData}
                    height={400}
                />
            );
        }

        // Vista tabla — onSortChange notifica para re-fetch server-side si se quisiera
        const totalPages = state.pageSize > 0 ? Math.ceil(state.totalRecords / state.pageSize) : 1;

        return (
            <div className="flex flex-col gap-2">
                <DynamicTable
                    data={state.data}
                    loading={false}
                    onSortChange={(col, dir) => handleColumnSort(key, col)}
                />
                {state.totalRecords > state.pageSize && (
                    <Pagination
                        currentPage={state.currentPage}
                        totalPages={totalPages}
                        loading={state.loading}
                        setCurrentPage={page => {
                            const nextPage = typeof page === "function" ? page(state.currentPage) : page;
                            setQueriesState(prev => {
                                const updated = { ...prev, [key]: { ...prev[key], currentPage: nextPage } };
                                queriesStateRef.current = updated;
                                return updated;
                            });
                            fetchData([key]);
                        }}
                        totalItems={state.totalRecords}
                        itemsPerPage={state.pageSize}
                        onPageSizeChange={newSize => setQueryPageSize(key, newSize)}
                        currentPageSize={state.pageSize}
                    />
                )}
            </div>
        );
    };

    // ── Render BentoItem ───────────────────────────────────────────────────────

    const renderQueryItem = (key: QueryKey, title: string) => {
        const state = queriesState[key];
        const meta = getChartMeta(key);
        const effective = getEffectiveChartConfig(key);
        const queryFilters = filters[key] || [];

        return (
            <BentoItem key={key} title={title} className="overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-2 py-1 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                        <Clock size={12} />
                        {state?.lastUpdated ? formatTime(state.lastUpdated) : "Sin datos"}
                        {queryFilters.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-medium">
                                {queryFilters.length} filtro{queryFilters.length > 1 ? "s" : ""}
                            </span>
                        )}
                        {renderSortBadge(key)}
                    </div>

                    <div className="flex items-center gap-0.5">
                        {meta && state?.viewMode === "chart" && (
                            <>
                                <button onClick={() => toggleChartConfig(key)}
                                    className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${showChartConfig[key] ? "text-indigo-500" : "text-gray-400"}`}
                                    title="Configurar gráfica">
                                    <Settings2 size={14} />
                                </button>
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 rounded">
                                    {CHART_TYPE_ICONS[effective.chartType]}{CHART_TYPE_LABELS[effective.chartType]}
                                </span>
                            </>
                        )}
                        {meta && (
                            <button onClick={() => toggleViewMode(key)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                title={state?.viewMode === "table" ? "Ver gráfico" : "Ver tabla"}>
                                {state?.viewMode === "table" ? <TrendingUp size={14} /> : <BarChart3 size={14} />}
                            </button>
                        )}
                        <button onClick={() => toggleFilters(key)}
                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${showFilters[key] ? "text-amber-500" : "text-gray-400"}`}
                            title="Filtros">
                            <Filter size={14} />
                        </button>
                        <button onClick={() => fetchData([key], debouncedDateRange)} disabled={state?.loading}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                            <RefreshCw size={14} className={state?.loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {showChartConfig[key] && meta && renderChartConfigPanel(key)}
                {showFilters[key] && renderFiltersPanel(key)}

                <div className="flex-1 overflow-auto min-h-72">
                    {renderContent(key, state)}
                </div>
            </BentoItem>
        );
    };

    // ── Render comparación ────────────────────────────────────────────────────

    const renderComparisonItem = () => {
        const state = queriesState["PERIODOS_SEMANA"];
        const effective = getEffectiveChartConfig("PERIODOS_SEMANA");
        const meta = getChartMeta("PERIODOS_SEMANA");

        const renderChart = () => {
            if (comparisonData.loading)
                return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
            if (!comparisonData.period1Data.length && !comparisonData.period2Data.length)
                return <div className="p-4 text-center text-gray-400">No hay datos para los períodos seleccionados</div>;

            const { series, categories } = transformComparisonData(
                comparisonData.period1Data, comparisonData.period2Data,
                effective.xKey, effective.yKey
            );
            return (
                <DynamicChart
                    type={(effective.chartType === "treemap" ? "bar" : effective.chartType) as any}
                    categories={categories}
                    data={series}
                    height={380}
                />
            );
        };

        const renderTable = () => {
            if (comparisonData.loading)
                return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

            const xKey = effective.xKey;
            const yKey = effective.yKey;
            const map1 = new Map<string, any>();
            const map2 = new Map<string, any>();
            comparisonData.period1Data.forEach(item => map1.set(String(item[xKey]), item));
            comparisonData.period2Data.forEach(item => map2.set(String(item[xKey]), item));
            const allKeys = Array.from(new Set([...map1.keys(), ...map2.keys()]));

            const tableData = allKeys.map(k => {
                const v1 = map1.get(k)?.[yKey] || 0;
                const v2 = map2.get(k)?.[yKey] || 0;
                const diff = v2 - v1;
                return {
                    [xKey]: k,
                    [comparisonPeriods.period1.label]: v1,
                    [comparisonPeriods.period2.label]: v2,
                    diferencia: diff,
                    variacion: v1 ? `${((diff / v1) * 100).toFixed(1)}%` : "N/A",
                };
            }).sort((a, b) => b.diferencia - a.diferencia);

            return (
                <div className="overflow-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                            <tr>
                                {[xKey, comparisonPeriods.period1.label, comparisonPeriods.period2.label, "Diferencia", "Variación"].map(h => (
                                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {tableData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-3 py-1.5 font-medium">{row[xKey]}</td>
                                    <td className="px-3 py-1.5">${(row[comparisonPeriods.period1.label] as number).toLocaleString("es-MX")}</td>
                                    <td className="px-3 py-1.5">${(row[comparisonPeriods.period2.label] as number).toLocaleString("es-MX")}</td>
                                    <td className={`px-3 py-1.5 font-medium ${row.diferencia >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {row.diferencia >= 0 ? "+" : ""}${row.diferencia.toLocaleString("es-MX")}
                                    </td>
                                    <td className={`px-3 py-1.5 ${row.variacion !== "N/A" && parseFloat(row.variacion as string) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {row.variacion}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        };

        return (
            <BentoItem key="PERIODOS_SEMANA" title="Comparación de Períodos" className="overflow-hidden flex flex-col">
                {/* Selectores de períodos */}
                <div className="flex flex-wrap items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                    {(["period1", "period2"] as const).map((p, i) => (
                        <div key={p} className="flex-1 min-w-52">
                            <label className="text-xs font-semibold text-blue-600 block mb-1">Período {i + 1}</label>
                            <div className="flex items-center gap-1">
                                <input type="date" value={comparisonPeriods[p].startDate}
                                    onChange={e => setComparisonPeriods(prev => ({ ...prev, [p]: { ...prev[p], startDate: e.target.value } }))}
                                    className="px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                <span className="text-gray-400 text-xs">→</span>
                                <input type="date" value={comparisonPeriods[p].endDate}
                                    onChange={e => setComparisonPeriods(prev => ({ ...prev, [p]: { ...prev[p], endDate: e.target.value } }))}
                                    className="px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                        </div>
                    ))}
                    <button onClick={fetchComparisonData} disabled={comparisonData.loading}
                        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap">
                        {comparisonData.loading ? "Cargando..." : "Comparar"}
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-2 py-1 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={12} />
                        {state?.lastUpdated ? formatTime(state.lastUpdated) : "Sin datos"}
                    </div>
                    <div className="flex items-center gap-0.5">
                        {state?.viewMode === "chart" && meta && (
                            <button onClick={() => toggleChartConfig("PERIODOS_SEMANA")}
                                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${showChartConfig["PERIODOS_SEMANA"] ? "text-indigo-500" : "text-gray-400"}`}>
                                <Settings2 size={14} />
                            </button>
                        )}
                        <button onClick={() => toggleViewMode("PERIODOS_SEMANA")} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            {state?.viewMode === "table" ? <TrendingUp size={14} /> : <BarChart3 size={14} />}
                        </button>
                        <button onClick={fetchComparisonData} disabled={comparisonData.loading}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                            <RefreshCw size={14} className={comparisonData.loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {showChartConfig["PERIODOS_SEMANA"] && renderChartConfigPanel("PERIODOS_SEMANA")}

                <div className="flex-1 overflow-auto min-h-96">
                    {state?.viewMode === "table" ? renderTable() : renderChart()}
                </div>
            </BentoItem>
        );
    };

    // ── JSX ───────────────────────────────────────────────────────────────────

    return (
        <Modal modalName="scorecard" maxWidth="full" title="ScoreCard Dashboard">

            {/* Barra de fechas general */}
            <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                onApply={() => fetchData(ALL_QUERY_KEYS.filter(k => k !== "PERIODOS_SEMANA"), dateRange)}
                loading={anyLoading}
                extraActions={
                    <div className="flex items-center gap-2 ml-auto">
                        {isRefreshing && refreshProgress.total > 0 && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${(refreshProgress.current / refreshProgress.total) * 100}%` }} />
                                </div>
                                <span className="text-xs text-gray-400">{refreshProgress.current}/{refreshProgress.total}</span>
                            </div>
                        )}
                        {whatsappStatus.lastResult && (
                            <span className={`text-xs ${whatsappStatus.lastResult.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
                                {whatsappStatus.lastResult}
                            </span>
                        )}
                        <button onClick={sendScoreCardReport} disabled={whatsappStatus.sending || anyLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50">
                            <Send size={14} className={whatsappStatus.sending ? "animate-pulse" : ""} />
                            {whatsappStatus.sending ? "Enviando..." : "Enviar reporte"}
                        </button>
                        <button
                            onClick={() => { fetchComparisonData(); fetchData(ALL_QUERY_KEYS.filter(k => k !== "PERIODOS_SEMANA"), dateRange); }}
                            disabled={anyLoading}
                            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm rounded hover:bg-gray-50 disabled:opacity-50">
                            <RefreshCw size={14} className={anyLoading ? "animate-spin" : ""} />
                            Recargar todo
                        </button>
                    </div>
                }
            />

            {/* Comparación de períodos */}
            <Details title="Comparación de Períodos" type="form">
                {renderComparisonItem()}
            </Details>

            {/* Dashboard principal */}
            <Details title="Dashboard Principal" type="form">
                <BentoGrid cols={2} className="p-2">
                    {GRID_QUERY_KEYS.filter(k => k !== "PERIODOS_SEMANA").map(key =>
                        renderQueryItem(key, QUERY_DISPLAY_CONFIG[key].title)
                    )}
                </BentoGrid>
            </Details>

            {/* Queries adicionales */}
            {ADDITIONAL_QUERIES.map(key => (
                <Details key={key} title={QUERY_DISPLAY_CONFIG[key].title} type="form">
                    <BentoGrid cols={1} className="p-2">
                        {renderQueryItem(key, QUERY_DISPLAY_CONFIG[key].title)}
                    </BentoGrid>
                </Details>
            ))}
        </Modal>
    );
};

export default ScoreCard;