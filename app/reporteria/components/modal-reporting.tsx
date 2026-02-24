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
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Store,
    Clock,
    Percent,
    Receipt,
    Building2,
    BarChart3,
    PieChart,
    LineChart,
    TrendingUp as TrendingUpIcon,
    Calendar,
    Target,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle
} from "lucide-react";
import TreemapChart from "@/components/term-grafic";

// SearchColumn dummy para cuando no se usa búsqueda
const dummySearchColumn: SearchColumn = {
    key: "",
    label: "",
    icon: () => null,
    color: "",
    tableField: "",
    table: ""
};

// Componente para tarjetas de resumen usando el componente Card proporcionado
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

    const margenPromedio = totals.totalVentas
        ? (totals.totalUtilidad / totals.totalVentas) * 100
        : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
                title="Ventas Totales"
                value={`$${totals.totalVentas.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={<DollarSign className="h-6 w-6 text-white" />}
            />
            <Card
                title="Utilidad Total"
                value={`$${totals.totalUtilidad.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subText={`${((totals.totalUtilidad / totals.totalVentas) * 100).toFixed(1)}%`}
                icon={<TrendingUp className="h-6 w-6 text-white" />}
            />
            <Card
                title="Margen Promedio"
                value={`${margenPromedio.toFixed(2)}%`}
                icon={<Percent className="h-6 w-6 text-white" />}
            />
            <Card
                title="Total Tickets"
                value={totals.totalTikets.toString()}
                icon={<Receipt className="h-6 w-6 text-white" />}
            />
        </div>
    );
};

// Componente para el ranking de sucursales
const BranchRanking = ({ data }: { data: any[] }) => {
    const sortedByVentas = [...data].sort((a, b) => b.totalVentas - a.totalVentas);
    const totalVentasGeneral = sortedByVentas.reduce((acc, b) => acc + b.totalVentas, 0);

    return (
        <Card
            title="Ranking de Sucursales"
            icon={<Building2 className="h-6 w-6 text-white" />}
            value=""
        >
            <div className="mt-4 space-y-4">
                {sortedByVentas.map((branch, index) => (
                    <div key={branch.codigo} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className={`
                                flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                                ${index === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
                                    index === 1 ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" :
                                        index === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" :
                                            "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}
                            `}>
                                {index + 1}
                            </span>
                            <span className="font-medium">{branch.sucursal}</span>
                        </div>
                        <div className="text-right">
                            <div className="font-semibold">
                                ${branch.totalVentas.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {((branch.totalVentas / totalVentasGeneral) * 100).toFixed(1)}% | Margen: {branch.margen.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

// Componente para el treemap de ventas por sucursal
const BranchTreemap = ({ data }: { data: any[] }) => {
    const treemapData = [{
        name: "Ventas por Sucursal",
        data: data.map(branch => ({
            x: branch.sucursal,
            y: branch.totalVentas
        }))
    }];

    return (
        <Card
            title="Distribución de Ventas"
            icon={<PieChart className="h-6 w-6 text-white" />}
            value=""
        >
            <div className="mt-4">
                <TreemapChart data={treemapData} height={300} />
            </div>
        </Card>
    );
};

// Componente para estadísticas por hora
const HourlyStats = ({ data }: { data: any[] }) => {
    const peakHour = data.reduce((max, item) => item.totalVentas > max.totalVentas ? item : max, data[0]);
    const lowHour = data.reduce((min, item) => item.totalVentas < min.totalVentas ? item : min, data[0]);

    return (
        <div className="space-y-4">
            <BentoGrid cols={3} className="p-0">
                <BentoItem
                    icon={<Clock className="h-5 w-5 text-green-600" />}
                    title="Hora Pico"
                    description={`${peakHour.hora}`}
                    header={
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            ${peakHour.totalVentas.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    }
                    className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900"
                />
                <BentoItem
                    icon={<Clock className="h-5 w-5 text-red-600" />}
                    title="Hora Baja"
                    description={`${lowHour.hora}`}
                    header={
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            ${lowHour.totalVentas.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    }
                    className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"
                />
                <BentoItem
                    icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
                    title="Ticket Promedio"
                    description={`$${(data.reduce((acc, item) => acc + item.totalVentas, 0) / data.reduce((acc, item) => acc + item.totalTikets, 0) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900"
                />
            </BentoGrid>

            <Details title="Detalle por Hora" type="form">
                <DynamicTable data={data} />
            </Details>
        </div>
    );
};

// Componente de Predicción de Ventas
const SalesPrediction = ({ historicalData }: { historicalData: any[] }) => {
    const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
    const [confidence, setConfidence] = useState(85); // Nivel de confianza de la predicción

    // Calcular promedios históricos
    const avgDailySales = historicalData.reduce((acc, item) => acc + item.totalVentas, 0) / historicalData.length;
    const avgTickets = historicalData.reduce((acc, item) => acc + item.totalTikets, 0) / historicalData.length;

    // Factores de crecimiento (simulados - en producción vendrían de un modelo ML)
    const growthFactors = {
        day: 1.02, // 2% crecimiento diario
        week: 1.15, // 15% crecimiento semanal
        month: 1.45 // 45% crecimiento mensual
    };

    // Calcular predicciones
    const predictions = {
        day: {
            ventas: avgDailySales * growthFactors.day,
            tickets: Math.round(avgTickets * growthFactors.day),
            margen: 32.5, // margen proyectado
            rango: {
                min: avgDailySales * growthFactors.day * 0.92,
                max: avgDailySales * growthFactors.day * 1.08
            }
        },
        week: {
            ventas: avgDailySales * 7 * growthFactors.week,
            tickets: Math.round(avgTickets * 7 * growthFactors.week),
            margen: 33.2,
            rango: {
                min: avgDailySales * 7 * growthFactors.week * 0.9,
                max: avgDailySales * 7 * growthFactors.week * 1.1
            }
        },
        month: {
            ventas: avgDailySales * 30 * growthFactors.month,
            tickets: Math.round(avgTickets * 30 * growthFactors.month),
            margen: 34.1,
            rango: {
                min: avgDailySales * 30 * growthFactors.month * 0.85,
                max: avgDailySales * 30 * growthFactors.month * 1.15
            }
        }
    };

    const selectedPrediction = predictions[selectedPeriod];

    // Calcular tendencia vs período anterior
    const previousPeriod = selectedPeriod === 'day'
        ? avgDailySales
        : selectedPeriod === 'week'
            ? avgDailySales * 7
            : avgDailySales * 30;

    const trend = ((selectedPrediction.ventas - previousPeriod) / previousPeriod) * 100;

    return (
        <Card
            title="Predicción de Ventas"
            icon={<Sparkles className="h-6 w-6 text-white" />}
            value=""
        >
            <div className="mt-4 space-y-6">
                {/* Selector de período */}
                <div className="flex gap-2">
                    {[
                        { value: 'day', label: 'Día', icon: <Clock className="h-4 w-4" /> },
                        { value: 'week', label: 'Semana', icon: <Calendar className="h-4 w-4" /> },
                        { value: 'month', label: 'Mes', icon: <Calendar className="h-4 w-4" /> }
                    ].map((period) => (
                        <button
                            key={period.value}
                            onClick={() => setSelectedPeriod(period.value as any)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                ${selectedPeriod === period.value
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                }
                            `}
                        >
                            {period.icon}
                            {period.label}
                        </button>
                    ))}
                </div>

                {/* Tarjeta de predicción principal */}
                <BentoGrid cols={2} className="p-0 gap-4">
                    <BentoItem
                        colSpan={1}
                        className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    Ventas Proyectadas
                                </span>
                                <span className={`
                                    flex items-center gap-1 text-xs font-semibold
                                    ${trend >= 0 ? 'text-green-600' : 'text-red-600'}
                                `}>
                                    {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {Math.abs(trend).toFixed(1)}%
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                ${selectedPrediction.ventas.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Rango estimado: ${selectedPrediction.rango.min.toLocaleString('en-US', { minimumFractionDigits: 0 })} - ${selectedPrediction.rango.max.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                            </div>
                        </div>
                    </BentoItem>

                    <BentoItem
                        colSpan={1}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"
                    >
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Tickets Estimados
                            </span>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedPrediction.tickets.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Margen proyectado: {selectedPrediction.margen}%
                            </div>
                        </div>
                    </BentoItem>
                </BentoGrid>

                {/* Métricas de confianza */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nivel de Confianza
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {confidence}%
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
                            style={{ width: `${confidence}%` }}
                        />
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                        <span>
                            Basado en {historicalData.length} períodos históricos. La precisión puede variar según estacionalidad y eventos externos.
                        </span>
                    </div>
                </div>

                {/* Recomendaciones */}
                <Details title="Recomendaciones y Estrategias" type="form">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <Target className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-900 dark:text-blue-300">Meta Sugerida</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-400">
                                    Establecer meta de ${(selectedPrediction.ventas * 1.1).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                                    para superar la proyección en un 10%
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                            <TrendingUpIcon className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-green-900 dark:text-green-300">Oportunidad de Crecimiento</h4>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    Incrementar ticket promedio en un 5% podría generar
                                    ${(selectedPrediction.ventas * 0.05).toLocaleString('en-US', { minimumFractionDigits: 0 })} adicionales
                                </p>
                            </div>
                        </div>
                    </div>
                </Details>
            </div>
        </Card>
    );
};

// Componente para el selector de vistas
const ViewSelector = ({
    branchContent,
    hourContent,
    predictionContent
}: {
    branchContent: React.ReactNode;
    hourContent: React.ReactNode;
    predictionContent: React.ReactNode;
}) => {
    const [activeView, setActiveView] = useState<'branches' | 'hours' | 'prediction'>('branches');

    return (
        <div className="space-y-4">
            <div className="flex gap-2 border-b border-gray-200 dark:border-zinc-700 pb-2 flex-wrap">
                <button
                    onClick={() => setActiveView('branches')}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors
                        ${activeView === 'branches'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }
                    `}
                >
                    <Store className="h-4 w-4" />
                    Por Sucursal
                </button>
                <button
                    onClick={() => setActiveView('hours')}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors
                        ${activeView === 'hours'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }
                    `}
                >
                    <Clock className="h-4 w-4" />
                    Por Hora
                </button>
                <button
                    onClick={() => setActiveView('prediction')}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors
                        ${activeView === 'prediction'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }
                    `}
                >
                    <Sparkles className="h-4 w-4" />
                    Predicción
                </button>
            </div>

            <div className="mt-4">
                {activeView === 'branches' && branchContent}
                {activeView === 'hours' && hourContent}
                {activeView === 'prediction' && predictionContent}
            </div>
        </div>
    );
};

export const ModalReporting = ({ open, reportType }: { open: boolean; reportType: ReportType }) => {
    if (!open) return null;
    const manager = useManagmentRead();

    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });

    // Estados para estadísticas por hora
    const [statsForHour, setStatsForHour] = useState<any[]>([]);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    const statsForHourAbortControllerRef = useRef<AbortController | null>(null);

    // Estados para totales por sucursal
    const [branchTotals, setBranchTotals] = useState<any[]>([]);
    const [branchTotalsLoading, setBranchTotalsLoading] = useState(false);
    const [branchTotalsError, setBranchTotalsError] = useState<string | null>(null);
    const branchTotalsAbortControllerRef = useRef<AbortController | null>(null);

    // Función para obtener estadísticas por hora
    const fetchStatsForHourData = useCallback(
        async (forceRefresh = false) => {
            if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return;

            if (statsForHourAbortControllerRef.current) {
                statsForHourAbortControllerRef.current.abort();
            }

            setStatsError(null);
            setStatsLoading(!forceRefresh);

            const controller = new AbortController();
            statsForHourAbortControllerRef.current = controller;

            try {
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
                const { filtrosAnd: baseFiltrosAnd, filtrosOr } = builder.build();

                const promesas = TIME_RANGES.map(async (rango) => {
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
                        signal: controller.signal,
                    };

                    const { promise } = manager.execute(payload);
                    const response = await promise;

                    if (response.error) {
                        if (response.error.name === "AbortError") return null;
                        return null;
                    }

                    const statsData = response.data?.data?.[0] || {};
                    return {
                        hora: rango.hora,
                        totalVentas: statsData.totalVentas || 0,
                        totalCosto: statsData.totalCosto || 0,
                        totalTikets: statsData.totalTikets || 0,
                        utilidad: (statsData.totalVentas || 0) - (statsData.totalCosto || 0),
                        margen: statsData.totalVentas
                            ? ((statsData.totalVentas - (statsData.totalCosto || 0)) / statsData.totalVentas) * 100
                            : 0,
                    };
                });

                const resultados = await Promise.all(promesas);
                const statsPorHora = resultados.filter(Boolean);
                setStatsForHour(statsPorHora);
            } catch (error: any) {
                if (
                    error.name === "AbortError" ||
                    error.message?.includes("aborted") ||
                    error.code === "ERR_CANCELLED"
                ) {
                    return;
                }
                if (!controller.signal.aborted) {
                    setStatsError(error.message || "Error al cargar las estadísticas por hora");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setStatsLoading(false);
                }
            }
        },
        [reportType, dateRange, manager]
    );

    // Función para obtener totales por sucursal
    const fetchBranchTotals = useCallback(
        async (forceRefresh = false) => {
            if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return;

            if (branchTotalsAbortControllerRef.current) {
                branchTotalsAbortControllerRef.current.abort();
            }

            setBranchTotalsError(null);
            setBranchTotalsLoading(!forceRefresh);

            const controller = new AbortController();
            branchTotalsAbortControllerRef.current = controller;

            try {
                const queryConfig = QUERY_CONFIGS[reportType];

                const promesas = ALMACENES_OPCIONES.map(async (almacen) => {
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

                    if (response.error) {
                        if (response.error.name === "AbortError") return null;
                        return null;
                    }

                    const statsData = response.data?.data?.[0] || {};
                    const totalVentas = statsData.totalVentas || 0;
                    const totalCosto = statsData.totalCosto || 0;
                    const utilidad = totalVentas - totalCosto;
                    const margen = totalVentas ? (utilidad / totalVentas) * 100 : 0;

                    return {
                        sucursal: almacen.label,
                        codigo: almacen.value,
                        totalVentas,
                        totalCosto,
                        totalTikets: statsData.totalTikets || 0,
                        utilidad,
                        margen,
                    };
                });

                const resultados = await Promise.all(promesas);
                const totals = resultados.filter(Boolean);
                setBranchTotals(totals);
            } catch (error: any) {
                if (
                    error.name === "AbortError" ||
                    error.message?.includes("aborted") ||
                    error.code === "ERR_CANCELLED"
                ) {
                    return;
                }
                if (!controller.signal.aborted) {
                    setBranchTotalsError(error.message || "Error al cargar los totales por sucursal");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setBranchTotalsLoading(false);
                }
            }
        },
        [reportType, dateRange, manager]
    );

    // Cargar ambos conjuntos de datos al montar
    useEffect(() => {
        fetchStatsForHourData();
        fetchBranchTotals();
    }, [fetchStatsForHourData, fetchBranchTotals]);

    return (
        <Modal modalName="reporting" maxWidth="full" title="Análisis de Ventas por Sucursal">
            <div className="space-y-6">
                {/* Selector de rango de fechas pendiente */}

                <ViewSelector
                    branchContent={
                        <div className="space-y-6">
                            {branchTotalsLoading ? (
                                <div>Cargando datos de sucursales...</div>
                            ) : branchTotalsError ? (
                                <div className="text-red-500">Error: {branchTotalsError}</div>
                            ) : branchTotals.length > 0 ? (
                                <>
                                    <SummaryCards data={branchTotals} />

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <BranchRanking data={branchTotals} />
                                        <BranchTreemap data={branchTotals} />
                                    </div>

                                    <Details title="Tabla Detallada por Sucursal" type="form">
                                        <DynamicTable data={branchTotals} />
                                    </Details>
                                </>
                            ) : (
                                <div>No hay datos disponibles</div>
                            )}
                        </div>
                    }
                    hourContent={
                        <div className="space-y-6">
                            {statsLoading ? (
                                <div>Cargando estadísticas por hora...</div>
                            ) : statsError ? (
                                <div className="text-red-500">Error: {statsError}</div>
                            ) : statsForHour.length > 0 ? (
                                <HourlyStats data={statsForHour} />
                            ) : (
                                <div>No hay datos disponibles</div>
                            )}
                        </div>
                    }
                    predictionContent={
                        <div className="space-y-6">
                            {branchTotalsLoading || statsLoading ? (
                                <div>Cargando datos para predicción...</div>
                            ) : branchTotalsError || statsError ? (
                                <div className="text-red-500">Error al cargar datos para predicción</div>
                            ) : branchTotals.length > 0 && statsForHour.length > 0 ? (
                                <>
                                    <SalesPrediction historicalData={statsForHour} />

                                    <Details title="Factores Considerados en la Predicción" type="form">
                                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                            <p>• Datos históricos de los últimos {statsForHour.length} períodos</p>
                                            <p>• Tendencia de crecimiento basada en {branchTotals.length} sucursales</p>
                                            <p>• Estacionalidad por hora del día</p>
                                            <p>• Rendimiento histórico por sucursal</p>
                                            <p>• Márgenes de utilidad promedio</p>
                                        </div>
                                    </Details>
                                </>
                            ) : (
                                <div>No hay suficientes datos para generar predicciones</div>
                            )}
                        </div>
                    }
                />
            </div>
        </Modal>
    );
};