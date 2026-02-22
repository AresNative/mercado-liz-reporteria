import { Modal } from "@/components/modal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateRange } from "../types/filter";
import { QUERY_CONFIGS } from "../utils/config-constants";
import { SearchColumn } from "../types/config";
import { ReportType } from "../types/consultas";
import { RequestPayload, useManagmentRead } from "@/hooks/classes/api";
import { FilterBuilder } from "../utils/filter-class";
import DynamicTable from "@/components/table";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Card from "@/components/card";
import { RefreshCw, Store, Calendar, Clock, DollarSign, TrendingUp, Users } from "lucide-react";
import { CountdownTimer } from "@/components/counter-down";

// ============================================================================
// CONSTANTES Y TIPOS
// ============================================================================

const ALMACENES_OPCIONES = [
    { value: "ALMVGPE", label: "Guadalupe" },
    { value: "ALMMAYO", label: "Mayoreo" },
    { value: "ALMTESTE", label: "Testerazo" },
    { value: "ALMPALM", label: "Palmas" },
] as const;

const TIME_RANGES = [
    { hora: "07:00-07:30", value: "09:00:00 AND 09:30:00" },
    { hora: "07:30-08:00", value: "09:30:00 AND 10:00:00" },
    { hora: "08:00-08:30", value: "10:00:00 AND 10:30:00" },
    { hora: "08:30-09:00", value: "10:30:00 AND 11:00:00" },
    { hora: "09:00-09:30", value: "11:00:00 AND 11:30:00" },
    { hora: "09:30-10:00", value: "11:30:00 AND 12:00:00" },
    { hora: "10:00-10:30", value: "12:00:00 AND 12:30:00" },
    { hora: "10:30-11:00", value: "12:30:00 AND 13:00:00" },
    { hora: "11:00-11:30", value: "13:00:00 AND 13:30:00" },
    { hora: "11:30-12:00", value: "13:30:00 AND 14:00:00" },
    { hora: "12:00-12:30", value: "14:00:00 AND 14:30:00" },
    { hora: "12:30-13:00", value: "14:30:00 AND 15:00:00" },
    { hora: "13:00-13:30", value: "15:00:00 AND 15:30:00" },
    { hora: "13:30-14:00", value: "15:30:00 AND 16:00:00" },
    { hora: "14:00-14:30", value: "16:00:00 AND 16:30:00" },
    { hora: "14:30-15:00", value: "16:30:00 AND 17:00:00" },
    { hora: "15:00-15:30", value: "17:00:00 AND 17:30:00" },
    { hora: "15:30-16:00", value: "17:30:00 AND 18:00:00" },
    { hora: "16:00-16:30", value: "18:00:00 AND 18:30:00" },
    { hora: "16:30-17:00", value: "18:30:00 AND 19:00:00" },
    { hora: "17:00-17:30", value: "19:00:00 AND 19:30:00" },
    { hora: "17:30-18:00", value: "19:30:00 AND 20:00:00" },
    { hora: "18:00-18:30", value: "20:00:00 AND 20:30:00" },
    { hora: "18:30-19:00", value: "20:30:00 AND 21:00:00" },
    { hora: "19:00-19:30", value: "21:00:00 AND 21:30:00" },
    { hora: "19:30-20:00", value: "21:30:00 AND 22:00:00" },
    { hora: "20:00-20:30", value: "22:00:00 AND 22:30:00" },
    { hora: "20:30-21:00", value: "22:30:00 AND 23:00:00" },
    { hora: "21:00-21:30", value: "23:00:00 AND 23:30:00" },
    { hora: "21:30-22:00", value: "23:30:00 AND 23:59:59" },
    { hora: "22:00-22:30", value: "01:00:00 AND 01:30:00" },
] as const;

const AGGREGATIONS = [
    { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
    { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
    { Key: "venta.ID", Alias: "totalTikets", Operation: "COUNT DISTINCT" },
] as Array<{ Key: string; Alias: string; Operation: string }>;

// SearchColumn dummy requerido por FilterBuilder
const dummySearchColumn: SearchColumn = {
    key: "",
    label: "",
    icon: () => null,
    color: "",
    tableField: "",
};

interface StatsData {
    totalVentas?: number;
    totalTikets?: number;
    totalCosto?: number;
    totalArticulos?: number;
    totalCompras?: number;
    diferencia?: number;
    totalClientes?: number;
    totalProveedores?: number;
    utilidad?: number;
    margen?: number;
    promedio?: number;
}

// ============================================================================
// HOOK BASE PARA PETICIONES CON ABORT CONTROL
// ============================================================================

function useFetchData<T>(
    fetchFn: (signal: AbortSignal) => Promise<T>,
    dependencies: any[]
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const execute = useCallback(
        async (forceRefresh = false) => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            setError(null);
            setLoading(!forceRefresh);

            const controller = new AbortController();
            abortControllerRef.current = controller;

            try {
                const result = await fetchFn(controller.signal);
                if (!controller.signal.aborted) {
                    setData(result);
                }
            } catch (err: any) {
                if (
                    err.name === "AbortError" ||
                    err.message?.includes("aborted") ||
                    err.code === "ERR_CANCELLED"
                ) {
                    return;
                }
                if (!controller.signal.aborted) {
                    setError(err.message || "Error en la petición");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        },
        [fetchFn]
    );

    useEffect(() => {
        execute();
    }, dependencies);

    return { data, loading, error, execute, setData };
}

// ============================================================================
// HOOKS ESPECÍFICOS PARA CADA CONJUNTO DE DATOS
// ============================================================================

function useHourlyStats(reportType: ReportType, dateRange: DateRange, selectedBranches: string[], manager: any) {
    const fetchFn = useCallback(
        async (signal: AbortSignal) => {
            if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return [];

            const queryConfig = QUERY_CONFIGS[reportType];
            const branchesToFetch = selectedBranches.length > 0 ? selectedBranches : ALMACENES_OPCIONES.map(b => b.value);

            const allPromises = branchesToFetch.flatMap(sucursalCodigo => {
                const sucursalLabel = ALMACENES_OPCIONES.find(b => b.value === sucursalCodigo)?.label || sucursalCodigo;
                return TIME_RANGES.map(async (rango) => {
                    const builder = new FilterBuilder({
                        quickMode: true,
                        filterGroups: [],
                        searchTerm: "",
                        searchColumn: dummySearchColumn,
                        almacenFilter: sucursalCodigo,
                        dateRange,
                        reportType,
                        searchApplied: false,
                        includeSearchTerm: false,
                    });
                    const { filtrosAnd: baseFiltrosAnd, filtrosOr } = builder.build();

                    const payload: RequestPayload = {
                        table: queryConfig.table,
                        filtros: {
                            agregaciones: AGGREGATIONS,
                            FiltrosAnd: [
                                ...baseFiltrosAnd,
                                {
                                    Filtros: [
                                        {
                                            Key: "venta.FechaRegistro",
                                            Operator: "TIME_BETWEEN",
                                            Value: rango.value,
                                        },
                                    ],
                                    OperadorLogico: "AND",
                                },
                            ],
                            ...(filtrosOr.length > 0 && { FiltrosOr: filtrosOr }),
                        },
                        signal,
                    };

                    const { promise } = manager.execute(payload);
                    const response = await promise;
                    if (response.error) return null;

                    const stats = response.data?.data?.[0] || {};
                    const totalVentas = stats.totalVentas || 0;
                    const totalCosto = stats.totalCosto || 0;
                    const utilidad = totalVentas - totalCosto;
                    const margen = totalVentas ? (utilidad / totalVentas) * 100 : 0;

                    return {
                        sucursal: sucursalLabel,
                        hora: rango.hora,
                        totalVentas,
                        totalCosto,
                        totalTikets: stats.totalTikets || 0,
                        utilidad,
                        margen,
                    };
                });
            });

            const results = await Promise.all(allPromises);
            return results.filter(Boolean);
        },
        [reportType, dateRange, selectedBranches, manager]
    );

    return useFetchData(fetchFn, [reportType, dateRange, selectedBranches, manager]);
}

function useBranchTotals(reportType: ReportType, dateRange: DateRange, manager: any) {
    const fetchFn = useCallback(
        async (signal: AbortSignal) => {
            if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return [];

            const queryConfig = QUERY_CONFIGS[reportType];

            const promises = ALMACENES_OPCIONES.map(async (almacen) => {
                const builder = new FilterBuilder({
                    quickMode: true,
                    filterGroups: [],
                    searchTerm: "",
                    searchColumn: dummySearchColumn,
                    almacenFilter: almacen.value,
                    dateRange,
                    reportType,
                    searchApplied: false,
                    includeSearchTerm: false,
                });
                const { filtrosAnd, filtrosOr } = builder.build();

                const payload: RequestPayload = {
                    table: queryConfig.table,
                    filtros: {
                        agregaciones: AGGREGATIONS,
                        FiltrosAnd: filtrosAnd,
                        ...(filtrosOr.length > 0 && { FiltrosOr: filtrosOr }),
                    },
                    signal,
                };

                const { promise } = manager.execute(payload);
                const response = await promise;
                if (response.error) return null;

                const stats = response.data?.data?.[0] || {};
                const totalVentas = stats.totalVentas || 0;
                const totalCosto = stats.totalCosto || 0;
                const utilidad = totalVentas - totalCosto;
                const margen = totalVentas ? (utilidad / totalVentas) * 100 : 0;

                return {
                    sucursal: almacen.label,
                    codigo: almacen.value,
                    totalVentas,
                    totalCosto,
                    totalTikets: stats.totalTikets || 0,
                    utilidad,
                    margen,
                };
            });

            const results = await Promise.all(promises);
            return results.filter(Boolean);
        },
        [reportType, dateRange, manager]
    );

    const { data, loading, error, execute, setData } = useFetchData(fetchFn, [reportType, dateRange, manager]);

    const globalTotals = useMemo(() => {
        if (!data) return {};
        return processStatsData(data);
    }, [data]);

    return { branchTotals: data, globalTotals, loading, error, refresh: execute };
}

function useMonthlyData(reportType: ReportType, dateRange: DateRange, manager: any) {
    const fetchFn = useCallback(
        async (signal: AbortSignal) => {
            if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return [];

            const queryConfig = QUERY_CONFIGS[reportType];
            const builder = new FilterBuilder({
                quickMode: true,
                filterGroups: [],
                searchTerm: "",
                searchColumn: dummySearchColumn,
                almacenFilter: "",
                dateRange,
                reportType,
                searchApplied: false,
                includeSearchTerm: false,
            });
            const { filtrosAnd, filtrosOr } = builder.build();

            const filtros = {
                agregaciones: AGGREGATIONS,
                FiltrosAnd: filtrosAnd,
                ...(filtrosOr.length > 0 && { FiltrosOr: filtrosOr }),
                GroupBy: ["venta.Almacen", "YEAR(venta.FechaRegistro)", "MONTH(venta.FechaRegistro)"],
            };

            const payload: RequestPayload = {
                table: queryConfig.table,
                filtros: filtros as RequestPayload["filtros"],
                signal,
            };

            const { promise } = manager.execute(payload);
            const response = await promise;
            if (response.error) throw response.error;

            const rawData = response.data?.data || [];
            return rawData.map((item: any) => {
                const ventas = item.totalVentas || 0;
                const tickets = item.totalTikets || 0;
                const ticketPromedio = tickets > 0 ? ventas / tickets : 0;
                const year = item["YEAR(venta.FechaRegistro)"];
                const month = item["MONTH(venta.FechaRegistro)"];
                const daysInMonth = new Date(year, month, 0).getDate();
                const porDia = tickets / daysInMonth;

                return {
                    tienda: item["venta.Almacen"] || "Sin tienda",
                    clientes: tickets,
                    ticketPromedio: ticketPromedio.toFixed(2),
                    porDia: porDia.toFixed(0),
                    year,
                    mes: new Date(year, month - 1).toLocaleString("default", { month: "long" }),
                };
            });
        },
        [reportType, dateRange, manager]
    );

    return useFetchData(fetchFn, [reportType, dateRange, manager]);
}

function useDailyData(reportType: ReportType, dateRange: DateRange, selectedBranch: string, manager: any) {
    const fetchFn = useCallback(
        async (signal: AbortSignal) => {
            if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return [];

            const queryConfig = QUERY_CONFIGS[reportType];
            const builder = new FilterBuilder({
                quickMode: true,
                filterGroups: [],
                searchTerm: "",
                searchColumn: dummySearchColumn,
                almacenFilter: selectedBranch,
                dateRange,
                reportType,
                searchApplied: false,
                includeSearchTerm: false,
            });
            const { filtrosAnd, filtrosOr } = builder.build();

            const filtros = {
                agregaciones: [
                    { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
                    { Key: "venta.ID", Alias: "totalTikets", Operation: "COUNT DISTINCT" },
                ],
                FiltrosAnd: filtrosAnd,
                ...(filtrosOr.length > 0 && { FiltrosOr: filtrosOr }),
                GroupBy: ["DAY(venta.FechaRegistro)"],
            };

            const payload: RequestPayload = {
                table: queryConfig.table,
                filtros: filtros as RequestPayload["filtros"],
                signal,
            };

            const { promise } = manager.execute(payload);
            const response = await promise;
            if (response.error) throw response.error;

            const rawData = response.data?.data || [];
            return rawData
                .map((item: any) => {
                    const dia = item["DAY(venta.FechaRegistro)"];
                    const tickets = item.totalTikets || 0;
                    const ventas = item.totalVentas || 0;
                    const ticketPromedio = tickets > 0 ? ventas / tickets : 0;
                    return {
                        dia,
                        clientes: tickets,
                        ticketPromedio: ticketPromedio.toFixed(2),
                    };
                })
                .sort((a: any, b: any) => a.dia - b.dia);
        },
        [reportType, dateRange, selectedBranch, manager]
    );

    return useFetchData(fetchFn, [reportType, dateRange, selectedBranch, manager]);
}

// ============================================================================
// FUNCIÓN AUXILIAR PARA PROCESAR ESTADÍSTICAS GLOBALES
// ============================================================================

const processStatsData = (statsData: any[] | any): StatsData => {
    const out: StatsData = {};
    const dataToProcess = Array.isArray(statsData) ? statsData : [statsData].filter(Boolean);

    dataToProcess.forEach((s: any) => {
        if (!s || typeof s !== "object") return;
        if (s.totalVentas !== undefined) out.totalVentas = (out.totalVentas ?? 0) + s.totalVentas;
        if (s.totalTikets !== undefined) out.totalTikets = (out.totalTikets ?? 0) + s.totalTikets;
        if (s.totalCosto !== undefined) out.totalCosto = (out.totalCosto ?? 0) + s.totalCosto;
        if (s.totalArticulos !== undefined) out.totalArticulos = (out.totalArticulos ?? 0) + s.totalArticulos;
        if (s.totalCompras !== undefined) out.totalCompras = (out.totalCompras ?? 0) + s.totalCompras;
        if (s.diferencia !== undefined) out.diferencia = (out.diferencia ?? 0) + s.diferencia;
        if (s.totalClientes !== undefined) out.totalClientes = (out.totalClientes ?? 0) + s.totalClientes;
        if (s.totalProveedores !== undefined) out.totalProveedores = (out.totalProveedores ?? 0) + s.totalProveedores;
    });

    if (out.totalVentas !== undefined) {
        if (out.totalCosto !== undefined) {
            out.utilidad = +(out.totalVentas - out.totalCosto).toFixed(2);
            out.margen = out.totalVentas > 0 ? +((out.utilidad / out.totalVentas) * 100).toFixed(2) : 0;
        }
        if (out.totalCompras !== undefined) {
            out.utilidad = +(out.totalVentas - out.totalCompras).toFixed(2);
            out.margen = out.totalVentas > 0 ? +((out.utilidad / out.totalVentas) * 100).toFixed(2) : 0;
            out.diferencia = out.utilidad;
        }
        if (out.totalTikets && out.totalTikets > 0) {
            out.promedio = +(out.totalVentas / out.totalTikets).toFixed(2);
        }
    }
    return out;
};

// ============================================================================
// COMPONENTES PRESENTACIONALES PEQUEÑOS
// ============================================================================

const GlobalMetrics = ({ totals }: { totals: StatsData }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
            title="Ventas Totales"
            value={`$${totals.totalVentas?.toLocaleString() || 0}`}
            icon={<DollarSign className="text-white" size={24} />}
        />
        <Card
            title="Tickets"
            value={totals.totalTikets?.toLocaleString() || 0}
            icon={<TrendingUp className="text-white" size={24} />}
        />
        <Card
            title="Utilidad"
            value={`$${totals.utilidad?.toLocaleString() || 0}`}
            icon={<TrendingUp className="text-white" size={24} />}
        />
        <Card
            title="Ticket Promedio"
            value={`$${totals.promedio?.toFixed(2) || 0}`}
            icon={<Users className="text-white" size={24} />}
        />
    </div>
);

const BranchTotalsPanel = ({ data, loading, error, onRefresh }: any) => (
    <BentoItem
        colSpan={3}
        title="Totales por Sucursal"
        description="Acumulado en el período seleccionado"
        icon={<Store className="text-purple-600" size={24} />}
        header={
            <button
                onClick={onRefresh}
                className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100"
            >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
        }
    >
        {loading && !data?.length ? (
            <div className="h-32 bg-gray-100 animate-pulse rounded" />
        ) : error ? (
            <p className="text-red-500">Error: {error}</p>
        ) : (
            <DynamicTable data={data || []} />
        )}
    </BentoItem>
);

const MonthlySummaryPanel = ({ data, loading, error, onRefresh }: any) => (
    <BentoItem
        colSpan={3}
        title="Resumen Mensual por Sucursal"
        description="Comparativo año/mes"
        icon={<Calendar className="text-purple-600" size={24} />}
        header={
            <button
                onClick={onRefresh}
                className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100"
            >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
        }
    >
        {loading && !data?.length ? (
            <div className="h-32 bg-gray-100 animate-pulse rounded" />
        ) : error ? (
            <p className="text-red-500">Error: {error}</p>
        ) : (
            <DynamicTable
                data={(data || []).map((item: any) => ({
                    TIENDA: item.tienda,
                    CTES: item.clientes,
                    "T.PROM": `$${item.ticketPromedio}`,
                    "por día": item.porDia,
                    año: item.year,
                    mes: item.mes,
                }))}
            />
        )}
    </BentoItem>
);

const DailyDetailPanel = ({
    data,
    loading,
    error,
    selectedBranch,
    onBranchChange,
    onRefresh,
}: any) => (
    <BentoItem
        colSpan={3}
        title="Detalle Diario"
        description={`Sucursal: ${ALMACENES_OPCIONES.find((op) => op.value === selectedBranch)?.label
            }`}
        icon={<Clock className="text-purple-600" size={24} />}
        header={
            <div className="flex items-center gap-2 absolute top-2 right-2">
                <select
                    value={selectedBranch}
                    onChange={(e) => onBranchChange(e.target.value)}
                    className="text-sm border rounded p-1"
                >
                    {ALMACENES_OPCIONES.map((op) => (
                        <option key={op.value} value={op.value}>
                            {op.label}
                        </option>
                    ))}
                </select>
                <button onClick={onRefresh} className="p-1 rounded hover:bg-gray-100">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>
        }
    >
        {loading && !data?.length ? (
            <div className="h-32 bg-gray-100 animate-pulse rounded" />
        ) : error ? (
            <p className="text-red-500">Error: {error}</p>
        ) : (
            <DynamicTable
                data={(data || []).map((item: any) => ({
                    Día: item.dia,
                    Clientes: item.clientes,
                    "Ticket Prom.": `$${item.ticketPromedio}`,
                }))}
            />
        )}
    </BentoItem>
);

const HourlyStatsPanel = ({ data, loading, error, onRefresh, branches, selectedBranches, onBranchChange }: any) => (
    <BentoItem
        colSpan={3}
        title="Estadísticas por Hora"
        description="Distribución horaria de ventas"
        icon={<Clock className="text-purple-600" size={24} />}
        header={
            <div className="flex items-center gap-2 absolute top-2 right-2">
                <select
                    multiple
                    value={selectedBranches}
                    onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        onBranchChange(values);
                    }}
                    className="text-sm border rounded p-1 max-h-20"
                >
                    {branches.map((b: any) => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                </select>
                <button onClick={onRefresh} className="p-1 rounded hover:bg-gray-100">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>
        }
    >
        {loading && !data?.length ? (
            <div className="h-32 bg-gray-100 animate-pulse rounded" />
        ) : error ? (
            <p className="text-red-500">Error: {error}</p>
        ) : (
            <DynamicTable data={data || []} />
        )}
    </BentoItem>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ModalReporting = ({ reportType }: { reportType: ReportType }) => {
    const manager = useManagmentRead();

    const [dateRange] = useState<DateRange>({
        from: new Date("2025-01-01"),
        to: new Date(),
    });

    const [selectedBranch, setSelectedBranch] = useState<string>("ALMVGPE");
    const [selectedHourlyBranches, setSelectedHourlyBranches] = useState<string[]>(
        ALMACENES_OPCIONES.map(b => b.value) // Por defecto todas
    );

    // Hooks personalizados para cada conjunto de datos
    const hourlyStats = useHourlyStats(reportType, dateRange, selectedHourlyBranches, manager);
    const branchTotals = useBranchTotals(reportType, dateRange, manager);
    const monthlyData = useMonthlyData(reportType, dateRange, manager);
    const dailyData = useDailyData(reportType, dateRange, selectedBranch, manager);

    const refreshAll = useCallback(() => {
        hourlyStats.execute(true);
        branchTotals.refresh(true);
        monthlyData.execute(true);
        dailyData.execute(true);
    }, [hourlyStats, branchTotals, monthlyData, dailyData]);

    return (
        <Modal modalName="reporting" maxWidth="full" title="Reportes de ventas">
            <div className="space-y-6 p-2">
                {/* Cabecera */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold">Dashboard de Ventas</h2>
                    <div className="flex items-center gap-3">
                        <CountdownTimer
                            endDate={new Date(Date.now() + 5 * 60 * 1000)}
                            refrech={refreshAll}
                        />
                        <button
                            onClick={refreshAll}
                            className="p-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>

                {/* Métricas globales */}
                <GlobalMetrics totals={branchTotals.globalTotals} />

                {/* Grid principal */}
                <BentoGrid cols={6} className="mt-6">
                    <BranchTotalsPanel
                        data={branchTotals.branchTotals}
                        loading={branchTotals.loading}
                        error={branchTotals.error}
                        onRefresh={() => branchTotals.refresh(true)}
                    />

                    <MonthlySummaryPanel
                        data={monthlyData.data}
                        loading={monthlyData.loading}
                        error={monthlyData.error}
                        onRefresh={() => monthlyData.execute(true)}
                    />

                    <DailyDetailPanel
                        data={dailyData.data}
                        loading={dailyData.loading}
                        error={dailyData.error}
                        selectedBranch={selectedBranch}
                        onBranchChange={setSelectedBranch}
                        onRefresh={() => dailyData.execute(true)}
                    />

                    <HourlyStatsPanel
                        data={hourlyStats.data}
                        loading={hourlyStats.loading}
                        error={hourlyStats.error}
                        onRefresh={() => hourlyStats.execute(true)}
                        branches={ALMACENES_OPCIONES}
                        selectedBranches={selectedHourlyBranches}
                        onBranchChange={setSelectedHourlyBranches}
                    />
                </BentoGrid>
            </div>
        </Modal>
    );
};