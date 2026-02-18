"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import DynamicTable from "@/components/table";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Pagination from "@/components/pagination";
import {
    formatDateDisplay,
    formatDateISOString,
    formatValue,
} from "@/utils/constants/format-values";
import {
    DollarSign,
    TrendingUp,
    Minus,
    TrendingDown,
    RefreshCw,
    Building,
    Loader2,
    Search,
    X,
    Zap,
    Calendar,
    ChevronDown,
    Menu,
    ChevronUp,
    AlertCircle,
    GitCompare,
    Eye,
    EyeOff,
} from "lucide-react";
import Header from "@/template/header";
import Footer from "@/template/footer";
import { RequestPayload, useManagmentRead } from "./class/api";
import { FilterGroup, FilterRule, ReportType } from "./types/consultas";
import { CONFIG, QUERY_CONFIGS, SEARCH_COLUMNS_CONFIG } from "./utils/config";
import { DATE_PERIODS, OPERATORS } from "./utils/consultas";
import { BENTO_METRICS_CONFIG } from "./utils/stats";
import { DateRange } from "./types/sample";
import { SearchColumn } from "./types/config";
import { v4 as uuidv4 } from "uuid";
import { FilterBuilder } from "./class/filter";

// Interfaz para datos de tabla
export interface TableData {
    [key: string]: any;
}

// Interfaz para estadísticas procesadas
export interface StatsData {
    totalVentas?: number;
    totalTikets?: number;
    totalCosto?: number;
    totalArticulos?: number;
    totalClientes?: number;
    totalProveedores?: number;
    totalCompras?: number;
    diferencia?: number;
    utilidad?: number;
    margen?: number;
    promedio?: number;
}

export interface SortRule {
    column: string;
    direction: "asc" | "desc";
}

// Procesa datos agregados para estadísticas
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

    // Calcular utilidad y margen
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

// Opciones fijas de almacenes
const ALMACENES_OPCIONES = [
    { value: "ALMVGPE", label: "Guadalupe" },
    { value: "ALMMAYO", label: "Mayoreo" },
    { value: "ALMTEST", label: "Testerazo" },
    { value: "ALMPALM", label: "Palmas" },
];

export default function Report() {
    const manager = useManagmentRead();

    // Estados principales
    const [reportType, setReportType] = useState<ReportType>("ventas");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [tableLoading, setTableLoading] = useState(false);
    const [dataTable, setDataTable] = useState<TableData[]>([]);
    const [tableError, setTableError] = useState<string | null>(null);

    const [stats, setStats] = useState<StatsData>({});
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [statsForHour, setStatsForHour] = useState<any[]>([]);

    const [refreshingTable, setRefreshingTable] = useState(false);
    const [refreshingStats, setRefreshingStats] = useState(false);
    const [showStats, setShowStats] = useState(true); // Control de visibilidad del bento grid

    // Filtros
    const [almacenFilter, setAlmacenFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchColumn, setSearchColumn] = useState<SearchColumn>(SEARCH_COLUMNS_CONFIG.ventas[0]);
    const [showSearchColumnDropdown, setShowSearchColumnDropdown] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [quickMode, setQuickMode] = useState(true);
    const [searchApplied, setSearchApplied] = useState(false);
    const [lastSearch, setLastSearch] = useState<{ term: string; columnKey: string } | null>(null);

    // Filtros avanzados
    const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
        {
            id: uuidv4(),
            filters: [{ column: "", operator: "=", value: "", groupId: "" }],
            logicalOperator: "AND",
            name: "Grupo 1",
        },
    ]);
    const [sortRules, setSortRules] = useState<SortRule[]>([
        { column: QUERY_CONFIGS.ventas.fechaField, direction: "desc" },
    ]);
    const [columnSuggestions, setColumnSuggestions] = useState<Record<string, string[]>>({});
    const [activeSuggestionsInput, setActiveSuggestionsInput] = useState<string | null>(null);
    const [showActiveFilters, setShowActiveFilters] = useState(false);

    // Fechas
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Refs para manejo de dropdowns y abortos
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchColumnDropdownRef = useRef<HTMLDivElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const suggestionsAbortControllerRef = useRef<AbortController | null>(null);
    const columnSuggestionsAbortControllerRef = useRef<AbortController | null>(null);

    // Actualizar columna de búsqueda al cambiar reporte, manteniendo compatibilidad
    useEffect(() => {
        const columns = SEARCH_COLUMNS_CONFIG[reportType];
        if (lastSearch?.term && lastSearch?.columnKey) {
            const compatible = columns.find((col) => col.key === lastSearch.columnKey) || columns.find((col) => col.key === "articulo") || columns[0];
            if (compatible) {
                setSearchColumn(compatible);
                setSearchTerm(lastSearch.term);
                setSearchApplied(true);
                return;
            }
        }
        // Si no hay búsqueda previa, usar primera columna
        if (columns.length > 0 && !searchColumn.key) {
            setSearchColumn(columns[0]);
        } else if (columns.length > 0 && !columns.some((c) => c.key === searchColumn.key)) {
            setSearchColumn(columns[0]);
        }
    }, [reportType, lastSearch]);

    // Cerrar dropdowns al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchColumnDropdownRef.current && !searchColumnDropdownRef.current.contains(e.target as Node)) {
                setShowSearchColumnDropdown(false);
            }
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) && !searchInputRef.current?.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Construir filtros para el payload
    const buildFiltros = useCallback(
        (includeSearchTerm = true) => {
            const builder = new FilterBuilder({
                quickMode,
                filterGroups,
                searchTerm,
                searchColumn,
                almacenFilter,
                dateRange,
                reportType,
                searchApplied,
                includeSearchTerm,
            });
            return builder.build();
        },
        [quickMode, filterGroups, searchTerm, searchColumn, almacenFilter, dateRange, reportType, searchApplied]
    );

    // Cargar datos de tabla
    const fetchTableData = useCallback(async () => {
        setTableError(null);
        setTableLoading(true);
        const config = QUERY_CONFIGS[reportType];
        const { filtrosAnd, filtrosOr } = buildFiltros(true);

        const orderRules = quickMode
            ? [{ Key: config.fechaField, Direction: "desc" }]
            : sortRules.filter((s) => s.column).map((s) => ({ Key: s.column, Direction: s.direction.toUpperCase() }));

        const payload: RequestPayload = {
            table: config.table,
            filtros: {
                selects: config.selects,
                ...(filtrosAnd.length > 0 && { FiltrosAnd: filtrosAnd }),
                ...(filtrosOr.length > 0 && { FiltrosOr: filtrosOr }),
                ...(orderRules.length > 0 && { Order: orderRules }),
            },
            page: currentPage,
            pageSize: CONFIG.PAGE_SIZE,
        };

        const { promise } = manager.execute(payload);
        const response = await promise;
        setTableLoading(false);
        if (response.error) {
            if (response.error.name === "AbortError") return;
            setTableError(response.error.message || "Error al cargar datos");
        } else {
            setDataTable(response.data?.data || []);
            setTotalRecords(response.data?.totalRecords || response.data?.totalEstimated || 0);
            setCurrentPage(response.data?.page || 1);
        }
    }, [reportType, currentPage, buildFiltros, quickMode, sortRules, manager]);

    // Cargar sugerencias de búsqueda
    const fetchSuggestions = useCallback(async () => {
        if (!searchTerm || searchTerm.length < 2 || !searchColumn.tableField) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        if (!QUERY_CONFIGS[reportType]) return;

        if (suggestionsAbortControllerRef.current) {
            suggestionsAbortControllerRef.current.abort();
        }

        setSuggestionsLoading(true);
        setShowSuggestions(true);

        const controller = new AbortController();
        suggestionsAbortControllerRef.current = controller;

        try {
            const config = QUERY_CONFIGS[reportType];
            const basicFilters: any[] = [
                { Key: searchColumn.tableField, Value: searchTerm, Operator: "LIKE" },
            ];

            if (reportType === "ventas") {
                basicFilters.push(
                    { Key: "venta.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
                    { Key: "venta.Mov", Operator: "IN", Value: "Factura,Factura Credito,Nota" }
                );
            }
            if (dateRange.from && dateRange.to && config.fechaField) {
                basicFilters.push(
                    { Key: config.fechaField, Operator: ">=", Value: formatDateISOString(dateRange.from) },
                    { Key: config.fechaField, Operator: "<=", Value: formatDateISOString(dateRange.to) }
                );
            }

            const payload: RequestPayload = {
                table: config.table,
                filtros: {
                    selects: [{ Key: searchColumn.tableField, Alias: "Suggestion" }],
                    agregaciones: [
                        {
                            Key: searchColumn.tableField,
                            Operation: "DISTINCT",
                            Alias: "Suggestion",
                        },
                    ],
                    FiltrosAnd: basicFilters.length > 0 ? [{ Filtros: basicFilters, OperadorLogico: "AND" }] : undefined,
                    Order: [{ Key: "Suggestion", Direction: "ASC" }],
                },
                pageSize: 10,
                signal: controller.signal,
            };

            const { promise } = manager.execute(payload);
            const response = await promise;
            if (response.error) {
                if (!controller.signal.aborted) console.error("Error en sugerencias:", response.error);
                setSuggestions([]);
                return;
            }

            const data = response.data?.data || [];
            const unique = data
                .map((s: any) => s.Suggestion)
                .filter((v: any, i: number, a: any[]) => a.indexOf(v) === i && v)
                .slice(0, 10);
            setSuggestions(unique.map((s: any) => ({ Suggestion: s })));
        } catch (error: any) {
            if (!controller.signal.aborted) console.error("Error en fetchSuggestions:", error);
        } finally {
            if (!controller.signal.aborted) setSuggestionsLoading(false);
        }
    }, [searchTerm, searchColumn, reportType, dateRange, manager]);

    // Cargar sugerencias para filtros avanzados
    const fetchColumnSuggestions = useCallback(
        async (columnName: string, searchValue: string) => {
            if (!columnName || !searchValue || searchValue.length < 2) {
                setActiveSuggestionsInput(null);
                return;
            }

            if (columnSuggestionsAbortControllerRef.current) {
                columnSuggestionsAbortControllerRef.current.abort();
            }

            setActiveSuggestionsInput(columnName);
            const controller = new AbortController();
            columnSuggestionsAbortControllerRef.current = controller;

            try {
                const config = QUERY_CONFIGS[reportType];
                const payload: RequestPayload = {
                    table: config.table,
                    filtros: {
                        selects: [{ Key: columnName, Alias: "value" }],
                        FiltrosAnd: [
                            {
                                Filtros: [{ Key: columnName, Operator: "LIKE", Value: searchValue }],
                                OperadorLogico: "AND",
                            },
                        ],
                    },
                    pageSize: 10,
                    signal: controller.signal,
                };

                const { promise } = manager.execute(payload);
                const response = await promise;
                if (response.error) {
                    if (!controller.signal.aborted) console.error("Error en sugerencias de columna:", response.error);
                    return;
                }

                const data = response.data?.data || [];
                const suggestions = data.map((item: any) => item.value).filter(Boolean);
                setColumnSuggestions((prev) => ({ ...prev, [columnName]: suggestions }));
            } catch (error: any) {
                if (error.name !== "AbortError" && !controller.signal.aborted) {
                    console.error("Error en fetchColumnSuggestions:", error);
                }
            }
        },
        [reportType, manager]
    );

    // Cargar estadísticas agregadas
    const fetchStatsData = useCallback(
        async (forceRefresh = false) => {
            if (!showStats) return; // No cargar si está oculto
            setStatsError(null);
            setStatsLoading(true);
            if (forceRefresh) setRefreshingStats(true);

            const config = QUERY_CONFIGS[reportType];
            const { filtrosAnd, filtrosOr } = buildFiltros(true);

            const payload: RequestPayload = {
                table: config.table,
                filtros: {
                    agregaciones: config.agregaciones,
                    ...(filtrosAnd.length > 0 && { FiltrosAnd: filtrosAnd }),
                    ...(filtrosOr.length > 0 && { FiltrosOr: filtrosOr }),
                },
                page: 1,
                pageSize: CONFIG.PAGE_SIZE,
            };

            const { promise } = manager.execute(payload);
            const response = await promise;
            setStatsLoading(false);
            setRefreshingStats(false);
            if (response.error) {
                if (response.error.name === "AbortError") return;
                setStatsError(response.error.message || "Error al cargar estadísticas");
            } else {
                const processed = processStatsData(response.data?.data);
                setStats(processed);
            }
        },
        [reportType, buildFiltros, manager, showStats]
    );

    // Cargar estadísticas por hora (solo ventas)
    const fetchStatsForHourData = useCallback(
        async (forceRefresh = false) => {
            if (!showStats || reportType !== "ventas") return;
            setStatsError(null);
            setStatsLoading(true);
            if (forceRefresh) setRefreshingStats(true);

            const config = QUERY_CONFIGS[reportType];
            const { filtrosAnd: baseFiltrosAnd, filtrosOr } = buildFiltros(true);

            const rangos = [
                { hora: "07:00-08:00", value: "09:00:00 AND 10:00:00" },
                { hora: "08:00-09:00", value: "10:00:00 AND 11:00:00" },
                { hora: "09:00-10:00", value: "11:00:00 AND 12:00:00" },
                { hora: "10:00-11:00", value: "12:00:00 AND 13:00:00" },
                { hora: "11:00-12:00", value: "13:00:00 AND 14:00:00" },
                { hora: "12:00-13:00", value: "14:00:00 AND 15:00:00" },
                { hora: "13:00-14:00", value: "15:00:00 AND 16:00:00" },
                { hora: "14:00-15:00", value: "16:00:00 AND 17:00:00" },
                { hora: "15:00-16:00", value: "17:00:00 AND 18:00:00" },
                { hora: "16:00-17:00", value: "18:00:00 AND 19:00:00" },
                { hora: "17:00-18:00", value: "19:00:00 AND 20:00:00" },
                { hora: "18:00-19:00", value: "20:00:00 AND 21:00:00" },
                { hora: "19:00-20:00", value: "21:00:00 AND 22:00:00" },
                { hora: "20:00-21:00", value: "22:00:00 AND 23:00:00" },
                { hora: "21:00-22:00", value: "23:00:00 AND 23:59:59" },
                { hora: "22:00-23:00", value: "01:00:00 AND 02:00:00" },
            ];

            const promesas = rangos.map(async (rango) => {
                const payload: RequestPayload = {
                    table: config.table,
                    filtros: {
                        agregaciones: [
                            { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
                            { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
                            { Key: "venta.ID", Alias: "totalTikets", Operation: "COUNT DISTINCT" },
                        ],
                        FiltrosAnd: [
                            ...baseFiltrosAnd,
                            {
                                Filtros: [{ Key: "venta.FechaRegistro", Operator: "TIME_BETWEEN", Value: rango.value }],
                                OperadorLogico: "AND",
                            },
                        ],
                        ...(filtrosOr.length > 0 && { FiltrosOr: filtrosOr }),
                    },
                };

                const { promise } = manager.execute(payload);
                const response = await promise;
                if (response.error) return null;
                const statsData = response.data?.data?.[0] || {};
                return {
                    hora: rango.hora,
                    totalVentas: statsData.totalVentas || 0,
                    totalCosto: statsData.totalCosto || 0,
                    totalTikets: statsData.totalTikets || 0,
                    utilidad: (statsData.totalVentas || 0) - (statsData.totalCosto || 0),
                    margen: statsData.totalVentas ? ((statsData.totalVentas - (statsData.totalCosto || 0)) / statsData.totalVentas) * 100 : 0,
                };
            });

            const resultados = await Promise.all(promesas);
            setStatsForHour(resultados.filter(Boolean));
            setStatsLoading(false);
            setRefreshingStats(false);
        },
        [reportType, buildFiltros, manager, showStats]
    );

    // Cargar todo (tabla + estadísticas)
    const fetchCurrentReportData = useCallback(
        async (page = 1) => {
            setCurrentPage(page);
            fetchTableData();
            if (showStats) {
                await Promise.all([fetchStatsData(), fetchStatsForHourData()]);
            }
        },
        [fetchTableData, fetchStatsData, fetchStatsForHourData, showStats]
    );

    // Efecto principal: cambiar reporte o filtros dispara carga
    useEffect(() => {
        setTableError(null);
        setStatsError(null);
        fetchCurrentReportData(1);
        return () => {
            // Limpieza de peticiones pendientes al desmontar o cambiar dependencias
            manager.cancelAll();
        };
    }, [reportType, almacenFilter, dateRange, quickMode, searchApplied, searchTerm, searchColumn, showStats]);

    // Efecto para cambio de página
    useEffect(() => {
        if (currentPage !== 1) fetchTableData();
    }, [currentPage]);

    // Handlers
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setSearchApplied(false);
        if (value.length >= 2) {
            fetchSuggestions();
        } else {
            setShowSuggestions(false);
            setSuggestions([]);
            suggestionsAbortControllerRef.current?.abort();
        }
    };

    const handleSearchColumnChange = (column: SearchColumn) => {
        setSearchColumn(column);
        setShowSearchColumnDropdown(false);
        setSearchApplied(false);
        setShowSuggestions(false);
        setSuggestions([]);
        suggestionsAbortControllerRef.current?.abort();
        if (searchTerm) {
            setLastSearch({ term: searchTerm, columnKey: column.key });
        }
    };

    const handleSuggestionSelect = (suggestion: any) => {
        setSearchTerm(suggestion.Suggestion);
        setShowSuggestions(false);
        setSearchApplied(true);
        setLastSearch({ term: suggestion.Suggestion, columnKey: searchColumn.key });
        setCurrentPage(1);
        fetchCurrentReportData(1);
    };

    const handleSearchSubmit = () => {
        if (searchTerm.length >= 2) {
            setSearchApplied(true);
            setLastSearch({ term: searchTerm, columnKey: searchColumn.key });
            setCurrentPage(1);
            fetchCurrentReportData(1);
        }
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setSearchApplied(false);
        setLastSearch(null);
        setSuggestions([]);
        setSearchColumn(SEARCH_COLUMNS_CONFIG[reportType][0]);
        setAlmacenFilter("");
        setDateRange({
            from: new Date(new Date().setDate(new Date().getDate() - 30)),
            to: new Date(),
        });
        setFilterGroups([
            {
                id: uuidv4(),
                filters: [{ column: "", operator: "=", value: "", groupId: "" }],
                logicalOperator: "AND",
                name: "Grupo 1",
            },
        ]);
        setCurrentPage(1);
        fetchCurrentReportData(1);
    };

    const handleReportTypeChange = (type: ReportType) => {
        if (searchApplied && searchTerm) {
            setLastSearch({ term: searchTerm, columnKey: searchColumn.key });
        }
        setReportType(type);
        setCurrentPage(1);
        setSearchApplied(false);
    };

    const handleDateChange = (from: Date | null, to: Date | null) => {
        setDateRange({ from, to });
        setCurrentPage(1);
        setShowDatePicker(false);
        fetchCurrentReportData(1);
    };
    const handleAlmacenFilterChange = (value: string) => {
        setAlmacenFilter(value);
        setCurrentPage(1);
        fetchCurrentReportData(1);
    };
    const applyDatePeriod = (period: (typeof DATE_PERIODS)[0]) => {
        const today = new Date();
        let from: Date | null = null;
        let to: Date | null = today;
        if (period.days) {
            from = new Date(today);
            from.setDate(today.getDate() - period.days);
        } else if (period.label === "Este mes") {
            from = new Date(today.getFullYear(), today.getMonth(), 1);
            to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else if (period.label === "Mes anterior") {
            from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            to = new Date(today.getFullYear(), today.getMonth(), 0);
        } else if (period.label === "Este año") {
            from = new Date(today.getFullYear(), 0, 1);
            to = new Date(today.getFullYear(), 11, 31);
        }
        handleDateChange(from, to);
    };

    // Obtener métricas para bento grid
    const getBentoMetrics = () => {
        const baseMetrics = [...BENTO_METRICS_CONFIG[reportType]];
        return baseMetrics.map((metric) => {
            const key = metric.title.toLowerCase().replace(/\s+/g, "");
            let raw = 0;
            switch (key) {
                case "ventas":
                    raw = stats.totalVentas || 0;
                    metric.display = formatValue(raw, "currency");
                    break;
                case "tikets":
                    raw = stats.totalTikets || 0;
                    metric.display = formatValue(raw, "number");
                    break;
                case "promedio":
                    raw = stats.promedio || 0;
                    metric.display = formatValue(raw, "currency");
                    break;
                case "costos":
                case "costototal":
                case "costomerma":
                    raw = stats.totalCosto || 0;
                    metric.display = formatValue(raw, "currency");
                    break;
                case "margen":
                    raw = stats.margen || 0;
                    metric.display = formatValue(raw, "percentage");
                    break;
                case "utilidad":
                    raw = stats.utilidad || 0;
                    metric.display = formatValue(raw, "currency");
                    break;
                case "artículos":
                    raw = stats.totalArticulos || 0;
                    metric.display = formatValue(raw, "number");
                    break;
                case "proveedores":
                    raw = stats.totalProveedores || 0;
                    metric.display = formatValue(raw, "number");
                    break;
                case "compras":
                    raw = stats.totalCompras || 0;
                    metric.display = formatValue(raw, "currency");
                    break;
                case "diferencia":
                    raw = stats.diferencia || 0;
                    metric.display = formatValue(raw, "currency");
                    break;
                default:
                    raw = 0;
            }
            metric.raw = raw;
            return metric;
        });
    };

    const totalPages = Math.ceil(totalRecords / CONFIG.PAGE_SIZE);
    const bentoMetrics = getBentoMetrics();
    const searchColumns = SEARCH_COLUMNS_CONFIG[reportType];

    const getAvailableColumns = () => {
        const config = QUERY_CONFIGS[reportType];
        if (!config) return [];
        return config.selects.map((select: any) => ({
            value: select.Key,
            label: `${select.Key.split(".")[0]}.${select.Alias || select.Key.split(".")[1] || select.Key}`,
        }));
    };

    // Handlers para filtros avanzados (se mantienen igual)
    const handleAdvancedFilterChange = (groupId: string, filterIndex: number, field: keyof FilterRule, value: any) => {
        setFilterGroups((prev) =>
            prev.map((group) => {
                if (group.id === groupId) {
                    const newFilters = [...group.filters];
                    if (field === "value" && value?.length >= 2 && newFilters[filterIndex].column) {
                        setTimeout(() => fetchColumnSuggestions(newFilters[filterIndex].column, value), 300);
                    }
                    if (field === "operator" && (value === "IS NULL" || value === "IS NOT NULL")) {
                        newFilters[filterIndex] = { ...newFilters[filterIndex], [field]: value, value: "" };
                    } else {
                        newFilters[filterIndex] = { ...newFilters[filterIndex], [field]: value };
                    }
                    return { ...group, filters: newFilters };
                }
                return group;
            })
        );
    };

    const addAdvancedFilter = (groupId: string) => {
        setFilterGroups((prev) =>
            prev.map((group) =>
                group.id === groupId
                    ? { ...group, filters: [...group.filters, { column: "", operator: "=", value: "", groupId }] }
                    : group
            )
        );
    };

    const removeAdvancedFilter = (groupId: string, filterIndex: number) => {
        setFilterGroups((prev) =>
            prev.map((group) => {
                if (group.id === groupId && group.filters.length > 1) {
                    return { ...group, filters: group.filters.filter((_, i) => i !== filterIndex) };
                }
                return group;
            })
        );
    };

    const addFilterGroup = () => {
        const newId = uuidv4();
        setFilterGroups((prev) => [
            ...prev,
            {
                id: newId,
                filters: [{ column: "", operator: "=", value: "", groupId: newId }],
                logicalOperator: "AND",
                name: `Grupo ${prev.length + 1}`,
            },
        ]);
    };

    const removeFilterGroup = (groupId: string) => {
        if (filterGroups.length > 1) {
            setFilterGroups((prev) => prev.filter((g) => g.id !== groupId));
        }
    };

    const handleGroupLogicalOperatorChange = (groupId: string, operator: "AND" | "OR") => {
        setFilterGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, logicalOperator: operator } : g)));
    };

    const handleGroupNameChange = (groupId: string, name: string) => {
        setFilterGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name } : g)));
    };

    const handleSortChange = (index: number, field: keyof SortRule, value: any) => {
        const newSorts = [...sortRules];
        newSorts[index] = { ...newSorts[index], [field]: value };
        setSortRules(newSorts);
    };

    const addSortRule = () => setSortRules([...sortRules, { column: "", direction: "asc" }]);
    const removeSortRule = (index: number) => {
        if (sortRules.length > 1) setSortRules(sortRules.filter((_, i) => i !== index));
    };

    const applyAdvancedFilters = () => {
        setCurrentPage(1);
        fetchCurrentReportData(1);
    };

    const getActiveFiltersSummary = () => {
        const summary: string[] = [];
        if (almacenFilter) summary.push(`Almacén: ${almacenFilter}`);
        if (searchApplied && searchTerm) summary.push(`Búsqueda: ${searchColumn.label} contiene "${searchTerm}"`);
        if (!quickMode) {
            filterGroups.forEach((g, idx) => {
                const active = g.filters.filter((f) => f.column && (f.value || f.operator.includes("NULL")));
                if (active.length) {
                    const desc = active
                        .map((f) => `${f.column.split(".")[1] || f.column} ${f.operator} ${f.value || "(nulo)"}`)
                        .join(` ${g.logicalOperator} `);
                    summary.push(`${g.name || `Grupo ${idx + 1}`}: ${desc}`);
                }
            });
        }
        return summary;
    };

    return (
        <>
            <Header />
            <section className="p-3 md:p-4 min-h-[70vh]">
                {/* Header móvil */}
                <ul className="md:hidden mb-4">
                    <li className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Reportería</h1>
                    </li>
                    <li className="mt-3">
                        <select
                            value={reportType}
                            onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 dark:bg-gray-700 dark:border-gray-600 text-base"
                        >
                            <option value="ventas">Ventas</option>
                            <option value="compras">Compras</option>
                            <option value="mermas">Mermas</option>
                            <option value="inventario">Inventario</option>
                            <option value="comparacion">Comparación</option>
                        </select>
                    </li>
                </ul>

                {/* Header desktop */}
                <ul className="hidden md:flex justify-between items-center mb-4">
                    <li className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            Reportería - {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
                        </h1>
                        <div className="flex items-center gap-4">
                            <section className="text-gray-800 dark:text-gray-200">
                                <label className="mr-2 font-medium">Selecciona el tipo de reporte:</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
                                    className="border border-gray-300 rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="ventas">Ventas</option>
                                    <option value="compras">Compras</option>
                                    <option value="mermas">Mermas</option>
                                    <option value="inventario">Inventario</option>
                                    <option value="comparacion">Comparación</option>
                                </select>
                            </section>
                            <button
                                onClick={() => setShowActiveFilters(!showActiveFilters)}
                                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                                title={showActiveFilters ? "Ocultar filtros activos" : "Ver filtros activos"}
                            >
                                {showActiveFilters ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                Filtros
                            </button>
                            <button
                                onClick={() => setShowStats(!showStats)}
                                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                                title={showStats ? "Ocultar estadísticas" : "Mostrar estadísticas"}
                            >
                                {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                Stats
                            </button>
                        </div>
                        {showActiveFilters && getActiveFiltersSummary().length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtros activos:</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    {getActiveFiltersSummary().map((f, i) => (
                                        <div key={i} className="flex items-center">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </li>
                    <li className="flex gap-2">
                        <button
                            onClick={() => fetchStatsData(true)}
                            disabled={statsLoading || refreshingStats}
                            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600"
                            title="Recargar solo estadísticas"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshingStats ? "animate-spin" : ""}`} />
                            Stats
                        </button>
                        <button
                            onClick={() => {
                                setRefreshingTable(true);
                                fetchTableData().finally(() => setRefreshingTable(false));
                            }}
                            disabled={tableLoading || refreshingTable}
                            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600"
                            title="Recargar solo tabla"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshingTable ? "animate-spin" : ""}`} />
                            Tabla
                        </button>
                        <button
                            onClick={() => {
                                setCurrentPage(1);
                                fetchCurrentReportData(1);
                            }}
                            disabled={tableLoading || statsLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600"
                            title="Recargar todo"
                        >
                            <RefreshCw className={`w-4 h-4 ${tableLoading || statsLoading ? "animate-spin" : ""}`} />
                            <span className="hidden md:inline">Recargar Todo</span>
                            <span className="md:hidden">Todo</span>
                        </button>
                    </li>
                </ul>

                {/* Mensajes de error */}
                {statsError && !statsLoading && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 mt-0.5" />
                            <div className="flex-1">
                                <div className="font-medium mb-1">Error en estadísticas</div>
                                <div className="text-sm">{statsError}</div>
                            </div>
                            <button onClick={() => fetchStatsData(true)} className="text-sm font-medium underline hover:no-underline flex items-center gap-1">
                                <RefreshCw className="h-3 w-3" />
                                Reintentar
                            </button>
                        </div>
                    </div>
                )}
                {tableError && !tableLoading && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 mt-0.5" />
                            <div className="flex-1">
                                <div className="font-medium mb-1">Error en tabla</div>
                                <div className="text-sm">{tableError}</div>
                            </div>
                            <button
                                onClick={() => {
                                    setRefreshingTable(true);
                                    fetchTableData().finally(() => setRefreshingTable(false));
                                }}
                                className="text-sm font-medium underline hover:no-underline flex items-center gap-1"
                            >
                                <RefreshCw className="h-3 w-3" />
                                Reintentar
                            </button>
                        </div>
                    </div>
                )}

                {/* Indicador de carga global */}
                {(tableLoading || refreshingTable || statsLoading || refreshingStats) && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                            <div className="flex-1">
                                <div className="font-medium text-blue-700 dark:text-blue-300">
                                    {refreshingTable
                                        ? "Actualizando tabla..."
                                        : refreshingStats
                                            ? "Actualizando estadísticas..."
                                            : tableLoading
                                                ? "Cargando datos..."
                                                : "Cargando estadísticas..."}
                                </div>
                                {reportType === "comparacion" && (
                                    <div className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
                                        Este reporte combina datos de ventas y compras, puede tardar un momento...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* BentoGrid (estadísticas) - Solo se renderiza si showStats = true */}
                {showStats && reportType && bentoMetrics.length > 0 && (
                    <div className="mb-6">
                        <BentoGrid cols={4} loading={statsLoading || refreshingStats}>
                            {bentoMetrics.map((item: any, index: number) => {
                                const ItemIcon = item.icon;
                                return (
                                    <BentoItem
                                        key={index}
                                        title={item.title}
                                        description={item.description}
                                        iconRight
                                        className="border dark:text-gray-200 p-3 md:p-4"
                                        loading={statsLoading || refreshingStats}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-lg md:text-xl relative font-bold truncate">
                                                {statsLoading && !refreshingStats ? (
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                ) : (
                                                    <span className="truncate">{item.display}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ItemIcon className="w-5 h-5 opacity-70 text-gray-600 dark:text-gray-400" />
                                            </div>
                                        </div>
                                    </BentoItem>
                                );
                            })}

                            {reportType === "ventas" && (
                                <BentoItem
                                    title="Por hora"
                                    icon={<DollarSign className="w-4 h-4 text-white" />}
                                    iconRight
                                    className="border text-white bg-green-600 border-green-700 dark:text-gray-200 p-3 md:p-4"
                                    loading={statsLoading || refreshingStats}
                                >
                                    <div className="flex flex-col gap-2 overflow-visible">
                                        {statsForHour.length > 0 ? (
                                            <div className="space-y-1 max-h-30 overflow-y-auto pr-1">
                                                <div className="flex gap-2 justify-between text-xs sticky top-0 bg-green-600/90 px-1 py-1 border-b border-green-700">
                                                    <span className="font-medium text-white/90 w-16">HORA</span>
                                                    <span className="font-bold text-white/90 flex-1 text-right">VENTAS</span>
                                                    <span className="font-bold text-white/90 flex-1 text-right">TICKETS</span>
                                                    <span className="font-bold text-white/90 flex-1 text-right">UTILIDAD</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {statsForHour.map((item) => (
                                                        <div
                                                            key={item.hora}
                                                            className="flex gap-2 justify-between text-xs hover:bg-white/5 rounded px-1 py-1 transition-colors cursor-pointer"
                                                        >
                                                            <span className="font-medium text-white/80 w-16">{item.hora}</span>
                                                            <span className="font-semibold text-white/90 flex-1 text-right">
                                                                {formatValue(item.totalVentas, "currency")}
                                                            </span>
                                                            <span className="font-semibold text-white/90 flex-1 text-right">
                                                                {formatValue(item.totalTikets, "number")}
                                                            </span>
                                                            <span
                                                                className={`font-semibold flex-1 text-right ${item.utilidad >= 0 ? "text-yellow-400" : "text-red-400"
                                                                    }`}
                                                            >
                                                                {formatValue(item.utilidad, "currency")}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-sm text-white/60">No hay datos disponibles</div>
                                        )}
                                    </div>
                                </BentoItem>
                            )}
                        </BentoGrid>

                        {reportType === "comparacion" && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                <GitCompare className="h-3 w-3 inline mr-1" />
                                Comparando ventas vs compras del mismo período
                            </div>
                        )}
                    </div>
                )}

                {/* Tabla */}
                {reportType && (
                    <article className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
                        {/* Filtros móvil */}
                        <div className="md:hidden mb-6 space-y-3">
                            {/* Selector de fecha móvil */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDatePicker(!showDatePicker)}
                                    className="flex items-center justify-between w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm">
                                            {dateRange.from && dateRange.to
                                                ? `${formatDateDisplay(dateRange.from)} - ${formatDateDisplay(dateRange.to)}`
                                                : "Rango de fechas"}
                                        </span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                </button>
                                {showDatePicker && (
                                    <div className="absolute z-50 mt-1 w-full p-3 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Desde:</label>
                                                <input
                                                    type="date"
                                                    value={dateRange.from ? dateRange.from.toISOString().split("T")[0] : ""}
                                                    onChange={(e) =>
                                                        handleDateChange(e.target.value ? new Date(e.target.value) : null, dateRange.to)
                                                    }
                                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Hasta:</label>
                                                <input
                                                    type="date"
                                                    value={dateRange.to ? dateRange.to.toISOString().split("T")[0] : ""}
                                                    onChange={(e) =>
                                                        handleDateChange(dateRange.from, e.target.value ? new Date(e.target.value) : null)
                                                    }
                                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-2 border-t">
                                                {DATE_PERIODS.map((p) => (
                                                    <button
                                                        key={p.label}
                                                        onClick={() => applyDatePeriod(p)}
                                                        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700"
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex justify-between">
                                                <button
                                                    onClick={() => setShowDatePicker(false)}
                                                    className="text-sm px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => setShowDatePicker(false)}
                                                    className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    Aplicar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Almacén móvil */}
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <select
                                    value={almacenFilter}
                                    onChange={(e) => handleAlmacenFilterChange(e.target.value)}
                                    className="w-full pl-10 pr-8 py-2.5 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
                                >
                                    <option value="">Todos los almacenes</option>
                                    {ALMACENES_OPCIONES.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Búsqueda móvil */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <searchColumn.icon className={`h-4 w-4 ${searchColumn.color}`} />
                                        <span className="text-sm font-medium">{searchColumn.label}</span>
                                        {searchColumn.prefix && <span className="text-xs text-gray-500">({searchColumn.prefix})</span>}
                                    </div>
                                    {searchColumns.length > 1 && (
                                        <button
                                            onClick={() => setShowSearchColumnDropdown(!showSearchColumnDropdown)}
                                            className="p-1 rounded border border-gray-300"
                                        >
                                            <ChevronDown className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>

                                {showSearchColumnDropdown && searchColumns.length > 1 && (
                                    <div className="border border-gray-300 rounded-lg p-2 bg-white dark:bg-gray-800">
                                        <div className="grid grid-cols-2 gap-1">
                                            {searchColumns.map((column) => (
                                                <button
                                                    key={column.key}
                                                    type="button"
                                                    onClick={() => handleSearchColumnChange(column)}
                                                    className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded ${column.key === searchColumn.key
                                                        ? "bg-blue-50 border border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800"
                                                        : "bg-gray-50 border border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700"
                                                        }`}
                                                >
                                                    <column.icon className={`h-3 w-3 ${column.color}`} />
                                                    {column.label}
                                                    {column.prefix && <span className="text-xs text-gray-500">({column.prefix})</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            ref={searchInputRef}
                                            value={searchTerm}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                                            placeholder={`Buscar por ${searchColumn.label.toLowerCase()}...`}
                                            className="w-full pl-10 pr-3 py-2.5 border rounded-lg dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setSearchApplied(false);
                                                    setLastSearch(null);
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                            >
                                                <X className="h-4 w-4 text-gray-400" />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSearchSubmit}
                                        disabled={searchTerm.length < 2 || tableLoading}
                                        className="px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        <Search className="h-4 w-4" />
                                    </button>
                                </div>

                                {showSuggestions && suggestions.length > 0 && (
                                    <div ref={suggestionsRef} className="border border-gray-300 rounded-lg shadow-sm dark:border-gray-700">
                                        <div className="max-h-40 overflow-y-auto">
                                            {suggestionsLoading ? (
                                                <div className="p-3 text-center text-gray-500">
                                                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                                    Buscando...
                                                </div>
                                            ) : (
                                                suggestions.map((suggestion, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => handleSuggestionSelect(suggestion)}
                                                        className="w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                                    >
                                                        <searchColumn.icon className={`size-4 ${searchColumn.color}`} />
                                                        <span className="text-xs truncate">{suggestion.Suggestion}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    {(searchApplied || almacenFilter || dateRange.from || dateRange.to) && (
                                        <button
                                            onClick={handleClearFilters}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 text-sm"
                                        >
                                            <X className="h-4 w-4" />
                                            Limpiar filtros
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setQuickMode((q) => !q)}
                                        className={`flex-1 px-3 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm ${quickMode
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                            }`}
                                    >
                                        <Zap className="h-4 w-4" />
                                        {quickMode ? "Rápido" : "Normal"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filtros desktop */}
                        <div className="hidden md:flex flex-col gap-3 mb-6">
                            <div className="flex flex-wrap gap-3 items-center">
                                {!quickMode ? (
                                    <section className="w-full">
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={addFilterGroup}
                                                        className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300"
                                                    >
                                                        + Nuevo Grupo
                                                    </button>
                                                    <button
                                                        onClick={applyAdvancedFilters}
                                                        className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300"
                                                    >
                                                        Aplicar Filtros
                                                    </button>
                                                </div>
                                            </div>

                                            {filterGroups.map((group, groupIdx) => (
                                                <div key={group.id} className="mb-4 p-3 bg-white dark:bg-gray-900 rounded border border-gray-300">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={group.name || `Grupo ${groupIdx + 1}`}
                                                                onChange={(e) => handleGroupNameChange(group.id, e.target.value)}
                                                                className="text-sm font-medium border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                                                            />
                                                            <select
                                                                value={group.logicalOperator}
                                                                onChange={(e) =>
                                                                    handleGroupLogicalOperatorChange(group.id, e.target.value as "AND" | "OR")
                                                                }
                                                                className="text-xs border rounded px-2 py-1"
                                                            >
                                                                <option value="AND">AND</option>
                                                                <option value="OR">OR</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => addAdvancedFilter(group.id)}
                                                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                            >
                                                                + Filtro
                                                            </button>
                                                            {filterGroups.length > 1 && (
                                                                <button
                                                                    onClick={() => removeFilterGroup(group.id)}
                                                                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                                >
                                                                    ✕ Grupo
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {group.filters.map((filter, filterIdx) => (
                                                        <div
                                                            key={filterIdx}
                                                            className="flex flex-col md:flex-row gap-2 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded"
                                                        >
                                                            <div className="flex-1">
                                                                <label className="block text-xs font-medium mb-1">Columna</label>
                                                                <select
                                                                    value={filter.column}
                                                                    onChange={(e) =>
                                                                        handleAdvancedFilterChange(group.id, filterIdx, "column", e.target.value)
                                                                    }
                                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm dark:bg-gray-900"
                                                                >
                                                                    <option value="">Seleccionar columna</option>
                                                                    {getAvailableColumns().map((col) => (
                                                                        <option key={col.value} value={col.value}>
                                                                            {col.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="w-32">
                                                                <label className="block text-xs font-medium mb-1">Operador</label>
                                                                <select
                                                                    value={filter.operator}
                                                                    onChange={(e) =>
                                                                        handleAdvancedFilterChange(group.id, filterIdx, "operator", e.target.value)
                                                                    }
                                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm dark:bg-gray-900"
                                                                >
                                                                    {OPERATORS.map((op) => (
                                                                        <option key={op.value} value={op.value}>
                                                                            {op.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="flex-1 relative">
                                                                <label className="block text-xs font-medium mb-1">Valor</label>
                                                                <input
                                                                    type="text"
                                                                    value={filter.value}
                                                                    onChange={(e) =>
                                                                        handleAdvancedFilterChange(group.id, filterIdx, "value", e.target.value)
                                                                    }
                                                                    onFocus={() => setActiveSuggestionsInput(filter.column)}
                                                                    onBlur={() => setTimeout(() => setActiveSuggestionsInput(null), 200)}
                                                                    disabled={filter.operator.includes("NULL")}
                                                                    placeholder={filter.operator.includes("NULL") ? "No aplica" : "Ingrese valor..."}
                                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm dark:bg-gray-900 disabled:opacity-50"
                                                                />
                                                                {activeSuggestionsInput === filter.column &&
                                                                    columnSuggestions[filter.column] &&
                                                                    filter.value && (
                                                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto">
                                                                            {columnSuggestionsAbortControllerRef.current &&
                                                                                !columnSuggestionsAbortControllerRef.current.signal.aborted ? (
                                                                                <div className="p-2 text-center text-sm">
                                                                                    <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                                                                                    Cargando...
                                                                                </div>
                                                                            ) : (
                                                                                columnSuggestions[filter.column].map((sugg, idx) => (
                                                                                    <button
                                                                                        key={idx}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            handleAdvancedFilterChange(group.id, filterIdx, "value", sugg);
                                                                                            setActiveSuggestionsInput(null);
                                                                                        }}
                                                                                        className="w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm border-b border-gray-300 last:border-b-0"
                                                                                    >
                                                                                        {sugg}
                                                                                    </button>
                                                                                ))
                                                                            )}
                                                                        </div>
                                                                    )}
                                                            </div>

                                                            <div className="flex items-end">
                                                                <button
                                                                    onClick={() => removeAdvancedFilter(group.id, filterIdx)}
                                                                    disabled={group.filters.length <= 1}
                                                                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 dark:text-red-400"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}

                                            <div className="mb-4">
                                                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                                    Períodos de Fecha Rápidos
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {DATE_PERIODS.map((period) => (
                                                        <button
                                                            key={period.label}
                                                            onClick={() => applyDatePeriod(period)}
                                                            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded dark:bg-gray-700 dark:hover:bg-gray-600"
                                                        >
                                                            {period.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-300 pt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="font-medium text-gray-700 dark:text-gray-300">Ordenamiento</h3>
                                                    <button
                                                        onClick={addSortRule}
                                                        className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300"
                                                    >
                                                        + Agregar Orden
                                                    </button>
                                                </div>

                                                {sortRules.map((sort, idx) => (
                                                    <div key={idx} className="flex gap-2 mb-3">
                                                        <div className="flex-1">
                                                            <select
                                                                value={sort.column}
                                                                onChange={(e) => handleSortChange(idx, "column", e.target.value)}
                                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm dark:bg-gray-900"
                                                            >
                                                                <option value="">Seleccionar columna</option>
                                                                {getAvailableColumns().map((col) => (
                                                                    <option key={col.value} value={col.value}>
                                                                        {col.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="w-32">
                                                            <select
                                                                value={sort.direction}
                                                                onChange={(e) => handleSortChange(idx, "direction", e.target.value)}
                                                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm dark:bg-gray-900"
                                                            >
                                                                <option value="asc">Ascendente</option>
                                                                <option value="desc">Descendente</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <button
                                                                onClick={() => removeSortRule(idx)}
                                                                disabled={sortRules.length <= 1}
                                                                className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 dark:text-red-400"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between gap-2 mt-4 pt-4 border-t border-gray-300">
                                                <button
                                                    onClick={() => {
                                                        setFilterGroups([
                                                            {
                                                                id: uuidv4(),
                                                                filters: [{ column: "", operator: "=", value: "", groupId: "" }],
                                                                logicalOperator: "AND",
                                                                name: "Grupo 1",
                                                            },
                                                        ]);
                                                        setSortRules([{ column: QUERY_CONFIGS[reportType]?.fechaField, direction: "desc" }]);
                                                    }}
                                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                                                >
                                                    Limpiar Todo
                                                </button>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={applyAdvancedFilters}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        Aplicar Filtros
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                ) : (
                                    <>
                                        {/* Modo rápido: filtros básicos */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowDatePicker(!showDatePicker)}
                                                className="flex items-center gap-2 h-full px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                            >
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                <span className="text-sm">
                                                    {dateRange.from && dateRange.to
                                                        ? `${formatDateDisplay(dateRange.from)} - ${formatDateDisplay(dateRange.to)}`
                                                        : "Rango de fechas"}
                                                </span>
                                            </button>
                                            {showDatePicker && (
                                                <div className="absolute z-50 mt-1 p-3 bg-white border border-gray-300 rounded shadow-lg dark:bg-gray-800 dark:border-gray-700">
                                                    <div className="flex flex-col gap-2">
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">Desde:</label>
                                                            <input
                                                                type="date"
                                                                value={dateRange.from ? dateRange.from.toISOString().split("T")[0] : ""}
                                                                onChange={(e) =>
                                                                    handleDateChange(e.target.value ? new Date(e.target.value) : null, dateRange.to)
                                                                }
                                                                className="w-full border rounded px-3 py-2 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">Hasta:</label>
                                                            <input
                                                                type="date"
                                                                value={dateRange.to ? dateRange.to.toISOString().split("T")[0] : ""}
                                                                onChange={(e) =>
                                                                    handleDateChange(dateRange.from, e.target.value ? new Date(e.target.value) : null)
                                                                }
                                                                className="w-full border rounded px-3 py-2 text-sm"
                                                            />
                                                        </div>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {DATE_PERIODS.map((p) => (
                                                                <button
                                                                    key={p.label}
                                                                    onClick={() => applyDatePeriod(p)}
                                                                    className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700"
                                                                >
                                                                    {p.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-end mt-2">
                                                            <button
                                                                onClick={() => setShowDatePicker(false)}
                                                                className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                                                            >
                                                                Aplicar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <select
                                                value={almacenFilter}
                                                onChange={(e) => handleAlmacenFilterChange(e.target.value)}
                                                className="pl-9 pr-8 py-2 border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                            >
                                                <option value="">Todos los almacenes</option>
                                                {ALMACENES_OPCIONES.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="relative flex" ref={suggestionsRef}>
                                            <div className="relative" ref={searchColumnDropdownRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSearchColumnDropdown(!showSearchColumnDropdown)}
                                                    className="flex items-center gap-1 px-3 py-2 border border-r-0 border-gray-300 rounded-l bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600"
                                                >
                                                    <searchColumn.icon className={`h-4 w-4 ${searchColumn.color}`} />
                                                    <ChevronDown className="h-3 w-3 text-gray-500" />
                                                </button>
                                                {showSearchColumnDropdown && searchColumns.length > 1 && (
                                                    <div className="absolute z-20 mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                                                        {searchColumns.map((column) => (
                                                            <button
                                                                key={column.key}
                                                                type="button"
                                                                onClick={() => handleSearchColumnChange(column)}
                                                                className={`flex items-center gap-2 w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${column.key === searchColumn.key ? "bg-blue-50 dark:bg-blue-900/30" : ""
                                                                    }`}
                                                            >
                                                                <column.icon className={`h-4 w-4 ${column.color}`} />
                                                                <span className="text-sm">{column.label}</span>
                                                                {column.prefix && (
                                                                    <span className="text-xs text-gray-500 ml-auto">({column.prefix})</span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    ref={searchInputRef}
                                                    value={searchTerm}
                                                    onChange={(e) => handleSearchChange(e.target.value)}
                                                    onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                                                    placeholder={`Buscar por ${searchColumn.label.toLowerCase()}...`}
                                                    className="pl-9 pr-3 py-2 border rounded-r w-64 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                                />
                                                {searchTerm && (
                                                    <button
                                                        onClick={() => {
                                                            setSearchTerm("");
                                                            setSearchApplied(false);
                                                            setLastSearch(null);
                                                            setShowSuggestions(false);
                                                        }}
                                                        className="absolute right-10 top-1/2 -translate-y-1/2"
                                                    >
                                                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                onClick={handleSearchSubmit}
                                                disabled={searchTerm.length < 2 || tableLoading}
                                                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <Search className="h-4 w-4" />
                                                <span>Buscar</span>
                                            </button>

                                            {showSuggestions && suggestions.length > 0 && (
                                                <div className="absolute z-10 w-full mt-10 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                                                    {suggestionsLoading ? (
                                                        <div className="p-3 text-center text-gray-500">
                                                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                                            Buscando...
                                                        </div>
                                                    ) : (
                                                        suggestions.map((suggestion, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => handleSuggestionSelect(suggestion)}
                                                                className="w-full p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                                            >
                                                                <searchColumn.icon className={`size-4 ${searchColumn.color}`} />
                                                                <span className="text-xs truncate">{suggestion.Suggestion}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {(searchApplied || almacenFilter || dateRange.from || dateRange.to) && (
                                            <button
                                                onClick={handleClearFilters}
                                                className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                                            >
                                                <X className="h-4 w-4" />
                                                Limpiar filtros
                                            </button>
                                        )}
                                    </>
                                )}

                                <button
                                    onClick={() => setQuickMode((q) => !q)}
                                    className={`px-3 py-2 rounded flex items-center gap-1 h-fit ${quickMode
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                        }`}
                                >
                                    <Zap className="h-4 w-4" />
                                    {quickMode ? "Modo rápido" : "Modo normal"}
                                </button>
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto -mx-3 md:mx-0">
                            <DynamicTable data={dataTable} loading={tableLoading || refreshingTable} />
                        </div>

                        {totalPages > 1 && !tableLoading && (
                            <div className="mt-4 md:mt-6">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    loading={tableLoading}
                                    setCurrentPage={setCurrentPage}
                                />
                            </div>
                        )}
                    </article>
                )}
            </section>
            <Footer />
        </>
    );
}