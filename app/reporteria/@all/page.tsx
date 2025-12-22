"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useGetWithFiltersMutation } from "../hooks/useMasivoQuery";
import { safeCall } from "@/hooks/use-debounce";
import DynamicTable from "@/components/table";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Pagination from "@/components/pagination";
import { formatValue } from "@/utils/constants/format-values";
import {
    DollarSign, TrendingUp, Package, Users, Minus,
    TrendingDown, RefreshCw, Building, Download, Filter,
    Loader2, RefreshCcw, Search, ShoppingCart, X, Zap
} from "lucide-react";

// Constantes y configuración
const CONFIG = {
    PAGE_SIZE: 10,
    STATUS: { CONCLUIDO: "CONCLUIDO" },
    MARGIN_WARNING: 20,
    MARGIN_CRITICAL: 10,
    REPORT_TYPES: {
        VENTAS: "ventas",
        COMPRAS: "compras",
        MERMAS: "mermas",
        COMPARACION: "comparacion"
    } as const
} as const;

type ReportType = "ventas" | "compras" | "mermas" | "comparacion";

// Interfaces para tipado
interface TableData {
    [key: string]: any;
}

interface StatsData {
    totalVentas?: number;
    totalCosto?: number;
    totalArticulos?: number;
    totalClientes?: number;
    totalProveedores?: number;
    totalMermas?: number;
    utilidad?: number;
    margen?: number;
}

interface QueryConfig {
    table: string;
    selects: Array<{ Key: string; Alias?: string }>;
    agregaciones: Array<{ Key: string; Alias: string; Operation: string }>;
    fechaField: string;
}

interface ApiResponse {
    data?: {
        data: any[];
        page?: number;
        totalRecords?: number;
    };
    error?: any;
}

// Configuración de consultas por tipo de reporte
const QUERY_CONFIGS: Record<ReportType, QueryConfig> = {
    ventas: {
        table: `VENTA AS venta
            INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID
            INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo
            INNER JOIN Cte AS C ON venta.Cliente = C.Cliente`,
        selects: [
            { Key: "C.Nombre", Alias: "Cliente" },
            { Key: "ventad.Articulo" },
            { Key: "ART.Descripcion1", Alias: "Nombre" },
            { Key: "ART.Categoria" },
            { Key: "ART.Grupo" },
            { Key: "ART.Linea" },
            { Key: "ART.Familia" },
            { Key: "ventad.Cantidad" },
            { Key: "venta.FechaEmision" },
            { Key: "ventad.Almacen" },
            { Key: "ventad.Precio", Alias: "PrecioUnitario" },
            { Key: "ventad.Costo", Alias: "CostoUnitario" },
            { Key: "ventad.Codigo" }
        ],
        agregaciones: [
            { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
            { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
            { Key: "ventad.Articulo", Alias: "totalArticulos", Operation: "COUNT" },
            { Key: "venta.Cliente", Alias: "totalClientes", Operation: "COUNT DISTINCT" }
        ],
        fechaField: "venta.FechaEmision"
    },
    compras: {
        table: `COMPRA AS compra
            INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID
            INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo
            LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor`,
        selects: [
            { Key: "P.Nombre", Alias: "Proveedor" },
            { Key: "ART.Fabricante" },
            { Key: "comprad.Articulo" },
            { Key: "ART.Descripcion1", Alias: "Nombre" },
            { Key: "ART.Categoria" },
            { Key: "ART.Grupo" },
            { Key: "ART.Linea" },
            { Key: "ART.Familia" },
            { Key: "comprad.Cantidad" },
            { Key: "comprad.CantidadInventario" },
            { Key: "comprad.Costo", Alias: "CostoUnitario" },
            { Key: "comprad.Almacen" },
            { Key: "compra.FechaEmision" },
            { Key: "comprad.Codigo" }
        ],
        agregaciones: [
            { Key: "(comprad.Costo * comprad.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
            { Key: "comprad.Articulo", Alias: "totalArticulos", Operation: "COUNT" },
            { Key: "compra.Proveedor", Alias: "totalProveedores", Operation: "COUNT" }
        ],
        fechaField: "compra.FechaEmision"
    },
    mermas: {
        table: `INV AS inv
            INNER JOIN INVD AS invd ON invd.ID = inv.ID
            INNER JOIN Art AS art ON art.Articulo = invd.Articulo`,
        selects: [
            { Key: "art.Articulo" },
            { Key: "art.Descripcion1", Alias: "Nombre" },
            { Key: "art.Categoria" },
            { Key: "art.Grupo" },
            { Key: "art.Linea" },
            { Key: "art.Familia" },
            { Key: "inv.Concepto" },
            { Key: "invd.Cantidad" },
            { Key: "invd.Costo" },
            { Key: "invd.Unidad" },
            { Key: "inv.Sucursal" },
            { Key: "inv.movid" },
            { Key: "inv.estatus" },
            { Key: "inv.FechaEmision" }
        ],
        agregaciones: [
            { Key: "(invd.Costo * invd.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
            { Key: "invd.Articulo", Alias: "totalArticulos", Operation: "COUNT" }
        ],
        fechaField: "inv.FechaEmision"
    },
    comparacion: {
        table: "",
        selects: [],
        agregaciones: [],
        fechaField: ""
    }
};

// Métricas para cada tipo de reporte
const BENTO_METRICS_CONFIG: Record<string, any[]> = {
    ventas: [
        {
            title: "Ventas",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: DollarSign
        },
        {
            title: "Costos",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: DollarSign
        },
        {
            title: "Margen",
            raw: 0,
            display: formatValue(0, "percentage"),
            type: "percent",
            icon: TrendingUp
        },
        {
            title: "Utilidad",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: TrendingUp
        },
        {
            title: "Artículos",
            raw: 0,
            display: formatValue(0, "number"),
            type: "number",
            icon: Package
        }
    ],
    compras: [
        {
            title: "Costo Total",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: DollarSign
        },
        {
            title: "Artículos",
            raw: 0,
            display: formatValue(0, "number"),
            type: "number",
            icon: Package
        },
        {
            title: "Proveedores",
            raw: 0,
            display: formatValue(0, "number"),
            type: "number",
            icon: Users
        }
    ],
    mermas: [
        {
            title: "Costo Merma",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: DollarSign
        },
        {
            title: "Artículos",
            raw: 0,
            display: formatValue(0, "number"),
            type: "number",
            icon: Package
        }
    ],
    comparacion: []
};

// Helper para procesar estadísticas
const processStatsData = (statsData: any[] | any): StatsData => {
    const out: StatsData = {};
    const dataToProcess = Array.isArray(statsData) ? statsData : [statsData].filter(Boolean);

    dataToProcess.forEach((s: any) => {
        if (!s || typeof s !== 'object') return;

        if (s.totalVentas !== undefined) out.totalVentas = (out.totalVentas ?? 0) + s.totalVentas;
        if (s.totalCosto !== undefined) out.totalCosto = (out.totalCosto ?? 0) + s.totalCosto;
        if (s.totalArticulos !== undefined) out.totalArticulos = (out.totalArticulos ?? 0) + s.totalArticulos;
        if (s.totalClientes !== undefined) out.totalClientes = (out.totalClientes ?? 0) + s.totalClientes;
        if (s.totalProveedores !== undefined) out.totalProveedores = (out.totalProveedores ?? 0) + s.totalProveedores;
        if (s.totalMermas !== undefined) out.totalMermas = (out.totalMermas ?? 0) + s.totalMermas;
    });

    if (out.totalVentas !== undefined && out.totalCosto !== undefined) {
        out.utilidad = +(out.totalVentas - out.totalCosto).toFixed(2);
        out.margen = out.totalVentas > 0 ? +((out.utilidad / out.totalVentas) * 100).toFixed(2) : undefined;
    }

    return out;
};

// Helper para extraer almacenes únicos
const extractUniqueAlmacenes = (data: TableData[]): string[] => {
    if (!data.length) return [];

    const almacenes = data
        .map((item: any) => item.Almacen)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index);

    return almacenes as string[];
};

// Componente principal
export default function Report() {
    const [getData] = useGetWithFiltersMutation();

    // Estado para datos de tabla
    const [reportType, setReportType] = useState<ReportType>("ventas");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [tableLoading, setTableLoading] = useState(false);
    const [dataTable, setDataTable] = useState<TableData[]>([]);

    // Estado para estadísticas (independiente)
    const [stats, setStats] = useState<StatsData>({});
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [tableError, setTableError] = useState<string | null>(null);

    // Estado para refrescos individuales
    const [refreshingTable, setRefreshingTable] = useState(false);
    const [refreshingStats, setRefreshingStats] = useState(false);

    // Filtros
    const [almacenFilter, setAlmacenFilter] = useState<string>("");
    const [almacenes, setAlmacenes] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [quickMode, setQuickMode] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Función para cargar datos de la tabla (con paginación)
    const fetchTableData = useCallback(async (page = currentPage, forceRefresh = false) => {
        if (!QUERY_CONFIGS[reportType] || reportType === "comparacion") return;

        setTableLoading(!forceRefresh);
        if (forceRefresh) setRefreshingTable(true);
        setTableError(null);

        try {
            const queryConfig = QUERY_CONFIGS[reportType];
            const response: ApiResponse = await safeCall(() => getData({
                table: queryConfig.table,
                filtros: {
                    selects: queryConfig.selects,
                    Order: [{ Key: queryConfig.fechaField, Direction: "desc" }]
                },
                page: page,
                pageSize: CONFIG.PAGE_SIZE
            }), "getTableData");

            if (response.error) {
                setTableError("Error al cargar los datos de la tabla");
                console.error("Error fetching table data:", response.error);
                return;
            }

            const tableData = response.data?.data || [];
            setCurrentPage(response.data?.page || 1);
            setTotalRecords(response.data?.totalRecords || 0);
            setDataTable(tableData);

            // Actualizar lista de almacenes basado en los datos de la tabla
            setAlmacenes(extractUniqueAlmacenes(tableData));
        } catch (error) {
            setTableError("Error al cargar los datos de la tabla");
            console.error('Error fetching table data:', error);
        } finally {
            setTableLoading(false);
            setRefreshingTable(false);
        }
    }, [reportType, currentPage, getData]);

    // Función para cargar estadísticas (sin paginación)
    const fetchStatsData = useCallback(async (forceRefresh = false) => {
        if (!QUERY_CONFIGS[reportType] || reportType === "comparacion") return;

        setStatsLoading(!forceRefresh);
        if (forceRefresh) setRefreshingStats(true);
        setStatsError(null);

        try {
            const queryConfig = QUERY_CONFIGS[reportType];
            const response: ApiResponse = await safeCall(() => getData({
                table: queryConfig.table,
                filtros: {
                    agregaciones: queryConfig.agregaciones,
                },
                pageSize: 10000000 // Sin paginación para stats
            }), "getStatsData");

            if (response.error) {
                setStatsError("Error al cargar las estadísticas");
                console.error("Error fetching stats:", response.error);
                return;
            }

            const statsData = response.data?.data || [];
            const processedStats = processStatsData(statsData);
            setStats(processedStats);
        } catch (error) {
            setStatsError("Error al cargar las estadísticas");
            console.error('Error fetching stats:', error);
        } finally {
            setStatsLoading(false);
            setRefreshingStats(false);
        }
    }, [reportType, getData]);

    // Función para recargar solo la tabla
    const refreshTable = () => {
        setCurrentPage(1);
        fetchTableData(1, true);
    };

    // Función para recargar solo las estadísticas
    const refreshStats = () => {
        fetchStatsData(true);
    };

    // Función para recargar ambas
    const refreshAll = () => {
        refreshTable();
        refreshStats();
    };

    // Cargar datos iniciales
    useEffect(() => {
        if (reportType !== "comparacion") {
            fetchTableData(1);
            fetchStatsData();
        }
    }, [reportType]);

    // Cambiar página de la tabla
    useEffect(() => {
        if (currentPage !== 1 && reportType !== "comparacion") {
            fetchTableData(currentPage);
        }
    }, [currentPage]);

    // Handlers para búsqueda y filtros
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (value.length >= 2) {
            setShowSuggestions(true);
            setSuggestions([]);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSuggestionSelect = (suggestion: any) => {
        setSearchTerm(suggestion.value);
        setShowSuggestions(false);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setAlmacenFilter("");
        setCurrentPage(1);
        fetchTableData(1);
    };

    const handleReportTypeChange = (type: ReportType) => {
        setReportType(type);
        setCurrentPage(1);
        setAlmacenFilter("");
        setSearchTerm("");
    };

    // Preparar métricas para BentoGrid con datos actuales
    const getBentoMetrics = () => {
        const baseMetrics = [...BENTO_METRICS_CONFIG[reportType]];

        return baseMetrics.map(metric => {
            const key = metric.title.toLowerCase().replace(/\s+/g, '');
            let rawValue = 0;

            switch (key) {
                case "ventas":
                    rawValue = stats.totalVentas || 0;
                    metric.display = formatValue(rawValue, "currency");
                    break;
                case "costos":
                    rawValue = -(stats.totalCosto || 0);
                    metric.display = formatValue(stats.totalCosto, "currency");
                    break;
                case "margen":
                    rawValue = stats.margen || 0;
                    metric.display = formatValue(rawValue, "percentage");
                    break;
                case "utilidad":
                    rawValue = stats.utilidad || 0;
                    metric.display = formatValue(rawValue, "currency");
                    break;
                case "artículos":
                    rawValue = stats.totalArticulos || 0;
                    metric.display = formatValue(rawValue, "number");
                    break;
                case "costototal":
                    rawValue = -(stats.totalCosto || 0);
                    metric.display = formatValue(stats.totalCosto, "currency");
                    break;
                case "proveedores":
                    rawValue = stats.totalProveedores || 0;
                    metric.display = formatValue(rawValue, "number");
                    break;
                case "costomerma":
                    rawValue = -(stats.totalCosto || 0);
                    metric.display = formatValue(stats.totalCosto, "currency");
                    break;
            }

            metric.raw = rawValue;
            return metric;
        });
    };

    // Helpers para estilos de Bento
    function getBentoState(value: number) {
        if (value > 0) return "positive";
        if (value < 0) return "negative";
        return "neutral";
    }

    const bentoStyles: Record<any, any> = {
        positive: { bg: "bg-green-50 border-green-200", text: "text-green-600" },
        negative: { bg: "bg-red-50 border-red-200", text: "text-red-800" },
        neutral: { bg: "bg-gray-50 border-gray-200", text: "text-gray-800" }
    };

    const bentoIcons: Record<string, any> = {
        positive: TrendingUp,
        negative: TrendingDown,
        neutral: Minus
    };

    const totalPages = Math.ceil(totalRecords / CONFIG.PAGE_SIZE);
    const bentoMetrics = getBentoMetrics();

    return (
        <section className="p-4">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                Reportería - {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
            </h1>

            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <div className="text-gray-800 dark:text-gray-200">
                        <label className="mr-2 font-medium">Selecciona el tipo de reporte:</label>
                        <select
                            value={reportType}
                            onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                            className="border border-gray-300 rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="ventas">Ventas</option>
                            <option value="compras">Compras</option>
                            <option value="mermas">Mermas</option>
                            <option value="comparacion">Comparación</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={refreshStats}
                        disabled={statsLoading || refreshingStats || reportType === "comparacion"}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600"
                        title="Recargar solo estadísticas"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshingStats ? 'animate-spin' : ''}`} />
                        Stats
                    </button>

                    <button
                        onClick={refreshTable}
                        disabled={tableLoading || refreshingTable || reportType === "comparacion"}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600"
                        title="Recargar solo tabla"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshingTable ? 'animate-spin' : ''}`} />
                        Tabla
                    </button>

                    <button
                        onClick={refreshAll}
                        disabled={(tableLoading && statsLoading) || reportType === "comparacion"}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600"
                        title="Recargar todo"
                    >
                        <RefreshCw className={`w-4 h-4 ${(refreshingTable || refreshingStats) ? 'animate-spin' : ''}`} />
                        Recargar Todo
                    </button>
                </div>
            </div>

            {/* Mensajes de error */}
            {statsError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                    <div className="flex justify-between items-center">
                        <span>{statsError}</span>
                        <button
                            onClick={refreshStats}
                            className="text-sm underline hover:no-underline"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            )}

            {tableError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                    <div className="flex justify-between items-center">
                        <span>{tableError}</span>
                        <button
                            onClick={refreshTable}
                            className="text-sm underline hover:no-underline"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 items-center mb-6">
                <div className="flex gap-3">
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                            value={almacenFilter}
                            onChange={(e) => setAlmacenFilter(e.target.value)}
                            className="pl-9 pr-8 py-2 border rounded bg-white appearance-none dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        >
                            <option value="">Todos los almacenes</option>
                            {almacenes.map((almacen) => (
                                <option key={almacen} value={almacen}>
                                    {almacen}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="relative" ref={suggestionsRef}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            ref={searchInputRef}
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                            placeholder={`Buscar ${reportType === "compras" ? "proveedor" : "cliente"}, artículo...`}
                            className="pl-9 pr-3 py-2 border rounded w-64 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto dark:bg-gray-800">
                                {suggestionsLoading ? (
                                    <div className="p-3 text-center text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                        Buscando...
                                    </div>
                                ) : (
                                    suggestions.map((suggestion) => (
                                        <div
                                            key={`${suggestion.type}-${suggestion.value}`}
                                            onClick={() => handleSuggestionSelect(suggestion)}
                                            className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 dark:hover:bg-gray-700"
                                        >
                                            {suggestion.type === 'articulo' && <Package className="h-4 w-4 text-blue-500" />}
                                            {suggestion.type === 'cliente' && <Users className="h-4 w-4 text-green-500" />}
                                            {suggestion.type === 'proveedor' && <ShoppingCart className="h-4 w-4 text-orange-500" />}
                                            {suggestion.type === 'categoria' && <Filter className="h-4 w-4 text-purple-500" />}
                                            {suggestion.type === 'almacen' && <Building className="h-4 w-4 text-gray-500" />}
                                            <span>{suggestion.value}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {(searchTerm || almacenFilter) && (
                        <button
                            onClick={handleClearFilters}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2 dark:bg-gray-700 dark:text-gray-300"
                        >
                            <X className="h-4 w-4" />
                            Limpiar
                        </button>
                    )}

                    <button
                        onClick={() => setQuickMode((q) => !q)}
                        className={`px-3 py-2 rounded flex items-center gap-2 ${quickMode
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                    >
                        <Zap className="h-4 w-4" />
                        {quickMode ? "Modo rápido" : "Modo normal"}
                    </button>
                </div>
            </div>

            {/* Estadísticas */}
            {reportType !== "comparacion" && bentoMetrics.length > 0 && (
                <BentoGrid cols={5} className="mb-6" loading={statsLoading || refreshingStats}>
                    {bentoMetrics.map((item: any, index: number) => {
                        const state = getBentoState(item.raw);
                        const StateIcon = bentoIcons[state];
                        const ItemIcon = item.icon;

                        return (
                            <BentoItem
                                key={index}
                                title={item.title}
                                icon={<StateIcon className={`w-4 h-4 ${bentoStyles[state].text}`} />}
                                iconRight
                                className={`border ${bentoStyles[state].bg} dark:border-gray-600 dark:bg-gray-800`}
                                loading={statsLoading || refreshingStats}
                            >
                                <div className="flex items-center justify-between">
                                    <div className={`text-xl relative font-bold ${bentoStyles[state].text}`}>
                                        {statsLoading && !refreshingStats ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            item.display
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ItemIcon className="w-5 h-5 opacity-70 dark:text-gray-300" />
                                    </div>
                                </div>
                            </BentoItem>
                        );
                    })}
                </BentoGrid>
            )}

            {/* Tabla y paginación */}
            {reportType === "comparacion" ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <h2 className="text-xl font-semibold mb-2">Modo Comparación</h2>
                    <p>Selecciona un tipo de reporte para ver los datos de comparación</p>
                </div>
            ) : (
                <>
                    <DynamicTable data={dataTable} loading={tableLoading || refreshingTable} />
                    {totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                loading={tableLoading || refreshingTable}
                                setCurrentPage={setCurrentPage}
                            />
                        </div>
                    )}
                </>
            )}
        </section>
    );
}