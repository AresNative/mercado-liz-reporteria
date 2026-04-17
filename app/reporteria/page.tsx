"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import DynamicTable from "@/components/table";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Pagination from "@/components/pagination";
import {
    formatDateDisplay,
    formatValue,
} from "@/utils/constants/format-values";
import {
    DollarSign,
    RefreshCw,
    Building,
    Loader2,
    Search,
    X,
    Zap,
    Calendar,
    ChevronDown,
    AlertCircle,
    GitCompare,
    Eye,
    EyeOff,
    Package,
} from "lucide-react";
import Header from "@/template/header";
import Footer from "@/template/footer";
import { BENTO_METRICS_CONFIG } from "./utils/stats";
import { SearchColumn } from "./types/config";
import { v4 as uuidv4 } from "uuid";
import { RequestPayload, useManagmentRead, useManagmentSearch } from "@/hooks/classes/api";
import { ReportType, StatsData } from "./types/consultas";
import { CONFIG, QUERY_CONFIGS, SEARCH_COLUMNS_CONFIG, COMPARISON_QUERY_CONFIGS } from "./utils/config-constants";
import { FilterGroup, FilterRule } from "@/utils/types/consultas";
import { AppliedFilters, DateRange } from "./types/filter";
import { FilterBuilder } from "./utils/filter-class";
import { DATE_PERIODS, OPERATORS } from "./utils/consultas-constants";
import { ModalReporting } from "./components/modal-reporting";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import { useAppDispatch } from "@/hooks/selector";
import { Button } from "@/components/button";
import ScoreCard from "./components/modal-scorecard";

// Interfaz para datos de tabla
export interface TableData {
    [key: string]: any;
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
        if (s.minimoCosto !== undefined) out.minimoCosto = (out.minimoCosto ?? 0) + s.minimoCosto;
        if (s.maximoCosto !== undefined) out.maximoCosto = (out.maximoCosto ?? 0) + s.maximoCosto;
    });

    // Calcular utilidad y margen
    if (out.totalVentas !== undefined) {
        if (out.totalCosto !== undefined) {
            out.utilidad = +(out.totalVentas - out.totalCosto - (out.totalMermas || 0)).toFixed(2);
            out.margen = out.totalVentas > 0 ? +((out.utilidad / out.totalVentas) * 100).toFixed(2) : 0;
        }
        if (out.totalCompras !== undefined) {
            out.utilidad = +(out.totalVentas - out.totalCompras - (out.totalMermas || 0)).toFixed(2);
            out.margen = out.totalVentas > 0 ? +((out.utilidad / out.totalVentas) * 100).toFixed(2) : 0;
            out.diferencia = out.utilidad;
            out.promedio = out.totalCompras > 0 ? +(out.totalVentas / out.totalCompras).toFixed(2) : 0;
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
    { value: "ALMTESTE", label: "Testerazo" },
    { value: "ALMPALM", label: "Palmas" },
];

export default function Report() {
    const manager = useManagmentRead();
    const managerSearch = useManagmentSearch();
    const dispatch = useAppDispatch();

    // Estados principales (borradores)
    const [pageSize, setPageSize] = useState<number>(CONFIG.PAGE_SIZE);

    const [reportType, setReportType] = useState<ReportType>("ventas");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [tableLoading, setTableLoading] = useState(false);
    const [dataTable, setDataTable] = useState<TableData[]>([]);
    const [tableError, setTableError] = useState<string | null>(null);

    const [stats, setStats] = useState<StatsData>({});
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);

    // Stats independientes para modo comparación
    const [comparisonStats, setComparisonStats] = useState<{
        ventas: StatsData & { totalCostoVentas?: number; totalArticulosVendidos?: number };
        compras: StatsData & { totalCompras?: number; totalArticulosComprados?: number };
        mermas: StatsData & { totalMermas?: number; totalArticulosMerma?: number };
    }>({ ventas: {}, compras: {}, mermas: {} });
    const [comparisonLoading, setComparisonLoading] = useState(false);
    // Tab activa en la vista de tabla de comparación
    const [comparisonTab, setComparisonTab] = useState<"ventas" | "compras" | "mermas">("ventas");

    const [refreshingTable, setRefreshingTable] = useState(false);
    const [refreshingStats, setRefreshingStats] = useState(false);
    const [showStats, setShowStats] = useState(true); // Control de visibilidad del bento grid

    // Filtros borrador
    const [almacenFilter, setAlmacenFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [searchColumn, setSearchColumn] = useState<SearchColumn>(
        SEARCH_COLUMNS_CONFIG.ventas[0]
        || {
        key: "articulo",
        label: "Artículo",
        icon: Package,
        color: "text-blue-500",
        tableField: "Descripcion1",
        prefix: "ART.",
        table: "ART",
    });
    const [showSearchColumnDropdown, setShowSearchColumnDropdown] = useState(false);

    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionsPage, setSuggestionsPage] = useState(1);
    const [suggestionsTotalPages, setSuggestionsTotalPages] = useState(1);
    const [suggestionsAll, setSuggestionsAll] = useState<any[]>([]);
    const [suggestionsHasMore, setSuggestionsHasMore] = useState(false);
    const [suggestionsLoadingMore, setSuggestionsLoadingMore] = useState(false);

    const [quickMode, setQuickMode] = useState(true);
    const [searchApplied, setSearchApplied] = useState(false);
    const [lastSearch, setLastSearch] = useState<{ term: string; columnKey: string } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showModal2, setShowModal2] = useState(false);
    // Filtros avanzados borrador
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

    const suggestionsContainerRef = useRef<HTMLDivElement>(null);
    // Fechas borrador
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Filtros aplicados (los que realmente se usan para consultar)
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
        reportType: "ventas" as ReportType,
        almacenFilter: "",
        searchTerm: "",
        searchColumn: SEARCH_COLUMNS_CONFIG.ventas[0],
        searchApplied: false,
        dateRange: {
            from: new Date(new Date().setDate(new Date().getDate() - 30)),
            to: new Date(),
        },
        filterGroups: [
            {
                id: uuidv4(),
                filters: [{ column: "", operator: "=", value: "", groupId: "" }],
                logicalOperator: "AND",
                name: "Grupo 1",
            },
        ],
        sortRules: [{ column: QUERY_CONFIGS.ventas.fechaField, direction: "desc" }],
        quickMode: true,
    });

    // Refs
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
        fetchCurrentReportData();
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

    // Construir filtros para el payload basado en appliedFilters
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

    // Deriva los alias válidos directamente del string `table` de QUERY_CONFIGS,
    // leyendo todos los "... AS alias" que aparecen. Así nunca se desincroniza con config-constants.
    const getValidAliasesFromTable = (tableStr: string): string[] => {
        const matches = tableStr.matchAll(/\bAS\s+(\w+)/gi);
        return Array.from(matches, m => m[1]);
    };

    // Alias válidos por sub-query de comparación — derivados del config real
    const COMPARISON_VALID_ALIASES = {
        ventas: getValidAliasesFromTable(QUERY_CONFIGS.ventas.table),
        compras: getValidAliasesFromTable(QUERY_CONFIGS.compras.table),
        mermas: getValidAliasesFromTable(QUERY_CONFIGS.mermas.table),
    };

    // Cargar datos de tabla
    const fetchTableData = useCallback(async () => {
        setTableError(null);
        setTableLoading(true);
        const { filtrosAnd, filtrosOr } = buildFiltros(true);

        let tableConfig: { table: string; selects: any[]; fechaField: string };
        let cleanFiltrosAnd = filtrosAnd;
        let cleanFiltrosOr = filtrosOr;

        if (appliedFilters.reportType === "comparacion") {
            // Usar el config de la sub-query correspondiente al tab activo
            const tabCfg = COMPARISON_QUERY_CONFIGS[comparisonTab];
            const validAliases = COMPARISON_VALID_ALIASES[comparisonTab];
            console.log(tabCfg, validAliases);
            
            // Selects del QUERY_CONFIGS base pero mapeados al tab activo
            const tabQueryConfig = {
                ventas: QUERY_CONFIGS.ventas,
                compras: QUERY_CONFIGS.compras,
                mermas: QUERY_CONFIGS.mermas,
            }[comparisonTab];

            tableConfig = {
                table: tabQueryConfig.table,
                selects: tabQueryConfig.selects ?? [],
                fechaField: tabCfg.fechaField,
            };

            // Limpiar filtros de tablas ajenas
            cleanFiltrosAnd = filtrosAnd
                .map((group: any) => {
                    const cleaned = (group.Filtros ?? [])
                        .map((f: any) => {
                            if (!f?.Key) return null;
                            if (f.Key.includes("FechaEmision")) return { ...f, Key: tabCfg.fechaField };
                            const alias = f.Key.split(".")[0];
                            return validAliases.includes(alias as any) ? f : null;
                        })
                        .filter(Boolean);
                    return cleaned.length > 0 ? { ...group, Filtros: cleaned } : null;
                })
                .filter(Boolean);
        } else {
            const config = QUERY_CONFIGS[appliedFilters.reportType];
            tableConfig = {
                table: config.table,
                selects: config.selects ?? [],
                fechaField: config.fechaField,
            };
        }

        const orderRules = appliedFilters.quickMode
            ? [{ Key: tableConfig.fechaField, Direction: "desc" }]
            : appliedFilters.sortRules.filter((s) => s.column).map((s) => ({ Key: s.column, Direction: s.direction.toUpperCase() }));

        const payload: RequestPayload = {
            table: tableConfig.table,
            filtros: {
                selects: tableConfig.selects,
                ...(cleanFiltrosAnd.length > 0 && { FiltrosAnd: cleanFiltrosAnd }),
                ...(cleanFiltrosOr.length > 0 && { FiltrosOr: cleanFiltrosOr }),
                ...(orderRules.length > 0 && { Order: orderRules }),
            },
            page: currentPage,
            pageSize: pageSize,
        };

        const { promise } = manager.execute(payload);
        const response = await promise;
        setTableLoading(false);
        if (response.error) {
            console.log(response);
            if (response.error.name === "AbortError") return;
            setTableError(response.error.message || "Error al cargar datos");
        } else {
            setDataTable(response.data?.data || []);
            setTotalRecords(response.data?.totalRecords || response.data?.totalEstimated || 0);
            setCurrentPage(response.data?.page || 1);
        }
    }, [reportType, pageSize, currentPage, buildFiltros, sortRules, manager, comparisonTab]);

    // Cargar sugerencias de búsqueda (basadas en borrador, no en applied)
    const fetchSuggestions = useCallback(async (reset = false) => {
        if (!searchTerm || searchTerm.length < 2 || !searchColumn.tableField) {
            setSuggestionsAll([]);
            setShowSuggestions(false);
            return;
        }
        if (!QUERY_CONFIGS[reportType]) return;

        // Cancelar petición anterior
        if (suggestionsAbortControllerRef.current) {
            suggestionsAbortControllerRef.current.abort();
        }

        const nextPage = reset ? 1 : suggestionsPage + 1;
        if (!reset && nextPage > suggestionsTotalPages) return; // No hay más páginas
        if (!reset) setSuggestionsLoadingMore(true);
        setShowSuggestions(true);

        const controller = new AbortController();
        suggestionsAbortControllerRef.current = controller;

        try {
            // Construir payload correcto con filtros (sin WHERE en table)
            const payload: RequestPayload = {
                table: `${searchColumn.table} WHERE ${searchColumn.tableField} LIKE '%${searchTerm}%'`,
                filtros: {
                    agregaciones: [{ Key:  searchColumn.tableField, Alias: "Suggestion", Operation: "DISTINCT" }],
                   /*  Filtros:[{ Key: searchColumn.tableField, Operator: "LIKE", Value: `` }], */
                    //Order: [{ Key: searchColumn.tableField, Direction: "ASC" }],
                },
                page: nextPage,
                pageSize: 10,
                signal: controller.signal,
            };

            const { promise } = managerSearch.execute(payload);
            const response = await promise;

            if (response.error) {
                if (!controller.signal.aborted) console.error("Error en sugerencias:", response.error);
                return;
            }

            const data = response.data?.data || [];
            const totalRecords = response.data?.totalRecords || response.data?.totalEstimated || 0;
            const totalPages = Math.ceil(totalRecords / pageSize);

            if (reset) {
                setSuggestionsAll(data);
                setSuggestionsPage(1);
            } else {
                setSuggestionsAll(prev => [...prev, ...data]);
                setSuggestionsPage(nextPage);
            }
            setSuggestionsTotalPages(totalPages);
            setSuggestionsHasMore(nextPage < totalPages);
        } catch (error: any) {
            if (error.name !== "AbortError" && !controller.signal.aborted) {
                console.error("Error en fetchSuggestions:", error);
            }
        } finally {
            if (!controller.signal.aborted) {
                setSuggestionsLoadingMore(false);
            }
        }
    }, [searchTerm, searchColumn, reportType, managerSearch, suggestionsPage, suggestionsTotalPages]);

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

    // Cargar las tres consultas independientes de comparación en paralelo
    const fetchComparisonStats = useCallback(
        async (forceRefresh = false) => {
            if (!showStats) return;
            setStatsError(null);
            setComparisonLoading(true);
            if (forceRefresh) setRefreshingStats(true);

            const { filtrosAnd } = buildFiltros(true);

            const VALID_ALIASES: Record<keyof typeof COMPARISON_QUERY_CONFIGS, string[]> = {
                ventas: getValidAliasesFromTable(QUERY_CONFIGS.ventas.table),
                compras: getValidAliasesFromTable(QUERY_CONFIGS.compras.table),
                mermas: getValidAliasesFromTable(QUERY_CONFIGS.mermas.table),
            };

            const makePayload = (key: keyof typeof COMPARISON_QUERY_CONFIGS): RequestPayload => {
                const cfg = COMPARISON_QUERY_CONFIGS[key];
                const validAliases = VALID_ALIASES[key];

                const adjustedFiltrosAnd = filtrosAnd
                    .map((group: any) => {
                        const cleanedFiltros = (group.Filtros ?? [])
                            .map((f: any) => {
                                if (!f?.Key) return null;
                                // Redirigir filtros de fecha al fechaField correcto de esta sub-query
                                if (f.Key.includes("FechaEmision")) {
                                    return { ...f, Key: cfg.fechaField };
                                }
                                // Descartar filtros que referencian tablas ajenas (e.g. venta.Estatus en compras)
                                const alias = f.Key.split(".")[0];
                                if (!validAliases.includes(alias)) return null;
                                return f;
                            })
                            .filter(Boolean);

                        return cleanedFiltros.length > 0
                            ? { ...group, Filtros: cleanedFiltros }
                            : null;
                    })
                    .filter(Boolean);

                return {
                    table: cfg.table,
                    filtros: {
                        agregaciones: cfg.agregaciones as any,
                        ...(adjustedFiltrosAnd.length > 0 && { FiltrosAnd: adjustedFiltrosAnd }),
                    },
                    page: 1,
                    pageSize: 1,
                };
            };

            try {
                // Secuencial — el backend usa tablas temporales (#Tmp_) por sesión;
                // Promise.all causa que una query referencie la temp de otra (error 208).
                const resVentas = await manager.execute(makePayload("ventas")).promise;
                if (resVentas.error) {
                    if (resVentas.error.name !== "AbortError")
                        setStatsError(resVentas.error.message || "Error en ventas");
                    return;
                }
                const resCompras = await manager.execute(makePayload("compras")).promise;
                if (resCompras.error) {
                    if (resCompras.error.name !== "AbortError")
                        setStatsError(resCompras.error.message || "Error en compras");
                    return;
                }
                const resMermas = await manager.execute(makePayload("mermas")).promise;
                if (resMermas.error) {
                    if (resMermas.error.name !== "AbortError")
                        setStatsError(resMermas.error.message || "Error en mermas");
                    return;
                }

                // Leer el row crudo — los aliases vienen exactamente como los define COMPARISON_QUERY_CONFIGS
                const v = resVentas.data?.data?.[0] ?? {};
                const c = resCompras.data?.data?.[0] ?? {};
                const m = resMermas.data?.data?.[0] ?? {};

                const ventasData: StatsData & Record<string, any> = {
                    totalVentas: +v.totalVentas || 0,
                    totalCostoVentas: +v.totalCostoVentas || 0,
                    totalTikets: +v.totalTikets || 0,
                    totalArticulosVendidos: +v.totalArticulosVendidos || 0,
                };

                const comprasData: StatsData & Record<string, any> = {
                    totalCompras: +c.totalCompras || 0,
                    totalProveedores: +c.totalProveedores || 0,
                    totalArticulosComprados: +c.totalArticulosComprados || 0,
                };

                const mermasData: StatsData & Record<string, any> = {
                    totalMermas: +m.totalMermas || 0,
                    totalArticulosMerma: +m.totalArticulosMerma || 0,
                };

                setComparisonStats({ ventas: ventasData, compras: comprasData, mermas: mermasData });

                // Fusionar en stats global para que los BentoItems existentes sigan funcionando
                const totalVentas = ventasData.totalVentas ?? 0;
                const totalCompras = comprasData.totalCompras ?? 0;

                const merged: StatsData = {
                    totalVentas,
                    totalCosto: ventasData.totalCostoVentas,
                    totalTikets: ventasData.totalTikets,
                    totalCompras,
                    totalProveedores: comprasData.totalProveedores,
                    totalArticulos: ventasData.totalArticulosVendidos,
                };
                merged.utilidad = +(totalVentas - totalCompras).toFixed(2);
                merged.margen = totalVentas > 0
                    ? +((merged.utilidad / totalVentas) * 100).toFixed(2)
                    : 0;
                merged.diferencia = merged.utilidad;
                setStats(merged);
            } catch (err: any) {
                if (err?.name !== "AbortError") {
                    setStatsError("Error al cargar comparación");
                }
            } finally {
                setComparisonLoading(false);
                setRefreshingStats(false);
            }
        },
        [buildFiltros, manager, showStats]
    );

    // Cargar estadísticas agregadas (usando appliedFilters)
    const fetchStatsData = useCallback(
        async (forceRefresh = false) => {
            if (!showStats) return;
            // En modo comparación, delegar a fetchComparisonStats
            if (reportType === "comparacion") {
                return fetchComparisonStats(forceRefresh);
            }
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
                pageSize: pageSize,
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
        [reportType, buildFiltros, manager, showStats, fetchComparisonStats]
    );

    // Cargar todo (tabla + estadísticas)
    const fetchCurrentReportData = useCallback(
        async () => {
            fetchTableData();
            fetchStatsData()
        },
        [fetchTableData, fetchStatsData, showStats]
    );

    // Efecto principal: cuando cambian los filtros aplicados o la página, cargar datos
    useEffect(() => {
        setTableError(null);
        fetchCurrentReportData();
        return () => {
            manager.cancelAll();
        };
    }, [reportType, almacenFilter, dateRange, /* searchApplied, searchColumn, */ showStats, currentPage, pageSize, comparisonTab]);

    // Handlers para aplicar filtros
    const applyAllFilters = () => {
        setAppliedFilters({
            reportType,
            almacenFilter,
            searchTerm,
            searchColumn,
            searchApplied: searchTerm ? true : false,
            dateRange,
            filterGroups,
            sortRules,
            quickMode,
        });
        setCurrentPage(1);
    };

    const applyDateRange = (from: Date | null, to: Date | null) => {
        setAppliedFilters((prev) => ({
            ...prev,
            dateRange: { from, to },
        }));
        setCurrentPage(1);
    };

    // Handlers de búsqueda
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setSearchApplied(false);
        // Reiniciar paginación de sugerencias
        setSuggestionsPage(1);
        setSuggestionsAll([]);
        setSuggestionsHasMore(false);
        fetchSuggestions(true); // reset = true
    };

    const handleSearchColumnChange = (column: SearchColumn) => {
        setSearchColumn(column);
        setShowSearchColumnDropdown(false);
        setSearchApplied(false);
        setShowSuggestions(false);
        suggestionsAbortControllerRef.current?.abort();
        if (searchTerm) {
            setLastSearch({ term: searchTerm, columnKey: column.key });
        }
    };

    const handleSuggestionSelect = async (suggestion: string) => {
        setShowSuggestions(false);
        console.log(searchColumn.prefix + suggestion);
        
        // Actualizar estados locales
        setSearchTerm(suggestion);
        setSearchApplied(true);
        setLastSearch({ term: suggestion, columnKey: searchColumn.key });

        // Construir los nuevos appliedFilters
        const newAppliedFilters = {
            reportType,
            almacenFilter,
            searchTerm: suggestion,
            searchColumn,
            searchApplied: true,
            dateRange,
            filterGroups,
            sortRules,
            quickMode,
        };

        // Actualizar appliedFilters
        setAppliedFilters(newAppliedFilters);

        // Esperar a que se actualice el estado
        await new Promise(resolve => setTimeout(resolve, 50));

        // Llamar directamente a la función que carga los datos
        setTableLoading(true);
        setCurrentPage(1);

        try {
            // En comparación usar el config del tab activo, no QUERY_CONFIGS.comparacion
            const config = reportType === "comparacion"
                ? QUERY_CONFIGS[comparisonTab]
                : QUERY_CONFIGS[reportType];
            const builder = new FilterBuilder({
                quickMode,
                filterGroups: newAppliedFilters.filterGroups,
                searchTerm: suggestion,
                searchColumn,
                almacenFilter,
                dateRange,
                reportType,
                searchApplied: true,
                includeSearchTerm: true,
            });

            const { filtrosAnd, filtrosOr } = builder.build();

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
                page: 1,
                pageSize: pageSize,
            };

            const { promise } = manager.execute(payload);
            const response = await promise;

            if (response.error) {
                if (response.error.name !== "AbortError") {
                    setTableError(response.error.message || "Error al cargar datos");
                }
            } else {
                setDataTable(response.data?.data || []);
                setTotalRecords(response.data?.totalRecords || response.data?.totalEstimated || 0);
            }
        } catch (error: any) {
            if (error.name !== "AbortError") {
                setTableError(error.message || "Error al cargar datos");
            }
        } finally {
            setTableLoading(false);
        }
    };

    const handleSearchSubmit = () => {
        setSearchApplied(true);
        applyAllFilters();
    };

    const handleClearFilters = () => {
        const defaultFrom = new Date(new Date().setDate(new Date().getDate() - 30));
        const defaultTo = new Date();
        setSearchTerm("");
        setSearchApplied(false);
        setLastSearch(null);
        setSearchColumn(SEARCH_COLUMNS_CONFIG[reportType][0]);
        setAlmacenFilter("");
        setDateRange({ from: defaultFrom, to: defaultTo });
        setFilterGroups([
            {
                id: uuidv4(),
                filters: [{ column: "", operator: "=", value: "", groupId: "" }],
                logicalOperator: "AND",
                name: "Grupo 1",
            },
        ]);
        setSortRules([{ column: QUERY_CONFIGS[reportType]?.fechaField, direction: "desc" }]);
        // Aplicar inmediatamente
        setAppliedFilters({
            reportType,
            almacenFilter: "",
            searchTerm: "",
            searchColumn: SEARCH_COLUMNS_CONFIG[reportType][0],
            searchApplied: false,
            dateRange: { from: defaultFrom, to: defaultTo },
            filterGroups: [
                {
                    id: uuidv4(),
                    filters: [{ column: "", operator: "=", value: "", groupId: "" }],
                    logicalOperator: "AND",
                    name: "Grupo 1",
                },
            ],
            sortRules: [{ column: QUERY_CONFIGS[reportType]?.fechaField, direction: "desc" }],
            quickMode,
        });
        setCurrentPage(1);
    };

    const handleReportTypeChange = (type: ReportType) => {
        if (searchApplied && searchTerm) {
            setLastSearch({ term: searchTerm, columnKey: searchColumn.key });
        }
        setReportType(type);
        if (type === "comparacion") setComparisonTab("ventas");
        setAppliedFilters((prev) => ({
            ...prev,
            reportType: type,
        }));
        setCurrentPage(1);
        setSearchApplied(false);
    };

    const handleDateChange = (from: Date | null, to: Date | null) => {
        setDateRange({ from, to });
        // No aplicar todavía
    };

    const handleAlmacenFilterChange = (value: string) => {
        setAlmacenFilter(value);
        // No aplicar todavía
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
        // Actualizar borrador y luego aplicar solo el rango de fechas
        setDateRange({ from, to });
        applyDateRange(from, to);
        setShowDatePicker(false);
    };

    // Obtener métricas para bento grid
    const getBentoMetrics = () => {
        const baseMetrics = [...BENTO_METRICS_CONFIG[reportType]];

        // Filtrar métricas de costo mínimo y máximo si no hay searchTerm
        const filteredMetrics = !appliedFilters.searchApplied
            ? baseMetrics.filter(metric => {
                const key = metric.title.toLowerCase().replace(/\s+/g, "");
                return key !== "costomínimo" && key !== "costomáximo";
            })
            : baseMetrics;

        return filteredMetrics.map((metricRaw) => {
            const metric = { ...metricRaw }; // clonar para no mutar BENTO_METRICS_CONFIG
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
                case "costomínimo":
                    raw = stats.minimoCosto || 0;
                    metric.display = formatValue(raw, "currency");
                    break;
                case "costomáximo":
                    raw = stats.maximoCosto || 0;
                    metric.display = formatValue(raw, "currency");
                    break;
                case "costos":
                case "costototal":
                case "costomerma":
                    raw = stats.totalCosto || 0;
                    metric.display = formatValue(raw, "currency");
                    break;
                default:
                    raw = 0;
            }
            metric.raw = raw;
            return metric;
        });
    };

    const totalPages = Math.ceil(totalRecords / pageSize);
    const bentoMetrics = getBentoMetrics();
    const searchColumns = SEARCH_COLUMNS_CONFIG[reportType];

    const getAvailableColumns = () => {
        const config = reportType === "comparacion"
            ? QUERY_CONFIGS[comparisonTab]
            : QUERY_CONFIGS[reportType];
        if (!config?.selects) return [];
        return config.selects.map((select: any) => ({
            value: select.Key,
            label: `${select.Key.split(".")[0]}.${select.Alias || select.Key.split(".")[1] || select.Key}`,
        }));
    };

    useEffect(() => {
        const container = suggestionsContainerRef.current;
        if (!container || !showSuggestions || !suggestionsHasMore || suggestionsLoadingMore) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollTop + clientHeight >= scrollHeight - 20) { // Umbral de 20px
                fetchSuggestions(false); // reset = false (siguiente página)
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [showSuggestions, suggestionsHasMore, suggestionsLoadingMore, fetchSuggestions]);

    // Handlers para filtros avanzados (actualizan borrador)
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
        applyAllFilters();
    };

    const getActiveFiltersSummary = () => {
        const summary: string[] = [];
        const { almacenFilter, searchApplied, searchTerm, searchColumn, dateRange, filterGroups, quickMode } = appliedFilters;

        // Mostrar rango de fechas si está definido
        if (dateRange.from && dateRange.to) {
            summary.push(`Fechas: ${formatDateDisplay(dateRange.from)} - ${formatDateDisplay(dateRange.to)}`);
        }

        if (almacenFilter) {
            const almacenLabel = ALMACENES_OPCIONES.find(opt => opt.value === almacenFilter)?.label || almacenFilter;
            summary.push(`Almacén: ${almacenLabel}`);
        }

        if (searchApplied && searchTerm) {
            summary.push(`Búsqueda: ${searchColumn.label} contiene "${searchTerm}"`);
        }

        if (!quickMode) {
            filterGroups.forEach((g, idx) => {
                const active = g.filters.filter((f) => f.column && (f.value || f.operator.includes("NULL")));
                if (active.length) {
                    const desc = active
                        .map((f) => `${f.column.split('.')[1] || f.column} ${f.operator} ${f.value || '(nulo)'}`)
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
                                onClick={() => setShowStats(!showStats)}
                                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                                title={showStats ? "Ocultar estadísticas" : "Mostrar estadísticas"}
                            >
                                {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                Stats
                            </button>
                        </div>
                        <div className="sticky top-10 mt-2 p-2 bg-gray-50/70 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
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
                    </li>
                    
                    <li className="flex gap-2">
                        {(reportType === "ventas" || reportType === "comparacion") && (
                            <>
                                <Button
                                    label="Venta desglosada" color="success" size="small"
                                    onClick={() => { setShowModal(true); dispatch(openModalReducer({ modalName: "reporting" })) }} />
                                <Button
                                    label="tarjeta de puntuación" color="success" size="small"
                                    onClick={() => { setShowModal2(true); dispatch(openModalReducer({ modalName: "scorecard" })) }} />
                            </>
                        )}
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
                                fetchCurrentReportData();
                            }}
                            disabled={tableLoading || statsLoading || comparisonLoading}
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
                {(tableLoading || refreshingTable || statsLoading || refreshingStats || comparisonLoading) && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                            <div className="flex-1">
                                <div className="font-medium text-blue-700 dark:text-blue-300">
                                    {refreshingTable
                                        ? "Actualizando tabla..."
                                        : refreshingStats || comparisonLoading
                                            ? "Actualizando estadísticas..."
                                            : tableLoading
                                                ? "Cargando datos..."
                                                : "Cargando estadísticas..."}
                                </div>
                                {appliedFilters.reportType === "comparacion" && (
                                    <div className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
                                        Ejecutando 3 consultas independientes (ventas → compras → mermas)...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* BentoGrid (estadísticas) - Solo se renderiza si showStats = true */}
                {showStats && reportType && bentoMetrics.length > 0 && (
                    <div className="mb-2">
                        <BentoGrid cols={bentoMetrics.length} loading={statsLoading || refreshingStats}>
                            {bentoMetrics.map((item: any, index: number) => {
                                const ItemIcon = item.icon;
                                const styles = item.styles || {};

                                return (
                                    <BentoItem
                                        key={index}
                                        title={item.title}
                                        description={item.description}
                                        iconRight
                                        className={`border dark:text-gray-200 p-3 md:p-4`}
                                        loading={statsLoading || refreshingStats}
                                    >
                                        <article className={`flex items-center justify-between`}>
                                            <label className={`text-lg relative font-bold truncate`}>
                                                {statsLoading && !refreshingStats ? (
                                                    <Loader2 className="size-4 animate-spin" />
                                                ) : (
                                                    <span className="truncate">{item.display}</span>
                                                )}
                                            </label>
                                            <section className="flex items-center gap-2">
                                                <ItemIcon className={`size-4 opacity-70 ${styles.icon || 'text-gray-600 dark:text-gray-400'}`} />
                                            </section>
                                        </article>
                                    </BentoItem>
                                );
                            })}
                        </BentoGrid>

                        {reportType === "comparacion" && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                <GitCompare className="h-3 w-3 inline mr-1" />
                                Comparando ventas vs compras del mismo período
                            </div>
                        )}
                    </div>
                )}

                {/* ── Panel de comparativa detallada ───────────────────────────────── */}
                {reportType === "comparacion" && showStats && (
                    <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                        {/* Cabecera */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <GitCompare className="h-4 w-4 text-indigo-500" />
                            <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                                Comparativa del período
                            </span>
                            {comparisonLoading && (
                                <Loader2 className="h-3 w-3 animate-spin text-indigo-400 ml-1" />
                            )}
                        </div>

                        {/* Tres columnas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">

                            {/* Ventas */}
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Ventas</span>
                                </div>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500 dark:text-gray-400">Total vendido</dt>
                                        <dd className="font-medium text-green-600 dark:text-green-400">
                                            {comparisonLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue(comparisonStats.ventas.totalVentas ?? 0, "currency")}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500 dark:text-gray-400">Costo de venta</dt>
                                        <dd className="font-medium text-gray-700 dark:text-gray-300">
                                            {comparisonLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue((comparisonStats.ventas as any).totalCostoVentas ?? 0, "currency")}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500 dark:text-gray-400">Tickets</dt>
                                        <dd className="font-medium text-gray-700 dark:text-gray-300">
                                            {comparisonLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue(comparisonStats.ventas.totalTikets ?? 0, "number")}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500 dark:text-gray-400">Artículos distintos</dt>
                                        <dd className="font-medium text-gray-700 dark:text-gray-300">
                                            {comparisonLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue((comparisonStats.ventas as any).totalArticulosVendidos ?? 0, "number")}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Compras */}
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Compras</span>
                                </div>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500 dark:text-gray-400">Total comprado</dt>
                                        <dd className="font-medium text-blue-600 dark:text-blue-400">
                                            {comparisonLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue((comparisonStats.compras as any).totalCompras ?? 0, "currency")}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500 dark:text-gray-400">Proveedores</dt>
                                        <dd className="font-medium text-gray-700 dark:text-gray-300">
                                            {comparisonLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue(comparisonStats.compras.totalProveedores ?? 0, "number")}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500 dark:text-gray-400">Artículos distintos</dt>
                                        <dd className="font-medium text-gray-700 dark:text-gray-300">
                                            {comparisonLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue((comparisonStats.compras as any).totalArticulosComprados ?? 0, "number")}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Mermas + resumen */}
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mermas</span>
                                </div>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500 dark:text-gray-400">Total merma</dt>
                                        <dd className="font-medium text-orange-600 dark:text-orange-400">
                                            {comparisonLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue((comparisonStats.mermas as any).totalMermas ?? 0, "currency")}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500 dark:text-gray-400">Artículos afectados</dt>
                                        <dd className="font-medium text-gray-700 dark:text-gray-300">
                                            {comparisonLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue((comparisonStats.mermas as any).totalArticulosMerma ?? 0, "number")}
                                        </dd>
                                    </div>
                                </dl>

                                {/* Separador y resumen de utilidad */}
                                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500 dark:text-gray-400 font-medium">Utilidad bruta</dt>
                                        <dd className={`font-bold ${(stats.utilidad ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                            {comparisonLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue(stats.utilidad ?? 0, "currency")}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500 dark:text-gray-400 font-medium">Margen</dt>
                                        <dd className={`font-bold ${(stats.margen ?? 0) >= 20 ? "text-green-600 dark:text-green-400" : (stats.margen ?? 0) >= 10 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>
                                            {comparisonLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : formatValue(stats.margen ?? 0, "percentage")}
                                        </dd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Tabla */}
                {reportType && (
                    <article className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">

                        {/* Tabs de sub-consulta para comparación */}
                        {reportType === "comparacion" && (
                            <div className="flex gap-1 mb-5 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg w-fit">
                                {(["ventas", "compras", "mermas"] as const).map((tab) => {
                                    const labels = { ventas: "Ventas", compras: "Compras", mermas: "Mermas" };
                                    const colors = {
                                        ventas: "bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm",
                                        compras: "bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-sm",
                                        mermas: "bg-white dark:bg-gray-700 text-orange-700 dark:text-orange-400 shadow-sm",
                                    };
                                    const dots = { ventas: "bg-green-500", compras: "bg-blue-500", mermas: "bg-orange-500" };
                                    const isActive = comparisonTab === tab;
                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => { setComparisonTab(tab); setCurrentPage(1); }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive
                                                ? colors[tab]
                                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                                }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${dots[tab]}`} />
                                            {labels[tab]}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Filtros desktop */}
                        <div className="md:flex flex-col gap-3 mb-6">
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
                                                                                        className="w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm border-b border-gray-300 last:border-b-0 whitespace-normal break-words overflow-wrap-break-word"
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
                                                                    handleDateChange(new Date(e.target.value), dateRange.to)
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
                                                                    handleDateChange(dateRange.from, new Date(e.target.value))
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
                                                                onClick={() => {
                                                                    applyDateRange(dateRange.from, dateRange.to);
                                                                    setShowDatePicker(false);
                                                                }}
                                                                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                                            <section className="flex flex-col md:flex-row gap-2">
                                                <ul className="flex items-center gap-0">
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
                                                    <div className="relative flex items-center">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <input
                                                            ref={searchInputRef}
                                                            value={searchTerm}
                                                            onChange={(e) => handleSearchChange(e.target.value)}
                                                            onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                                                            placeholder={`Buscar por ${searchColumn.label.toLowerCase()}...`}
                                                            className="pl-9 pr-3 py-2 w-52 border rounded-r  dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                                        />
                                                        {searchTerm && (
                                                            <button
                                                                onClick={() => {
                                                                    setSearchTerm("");
                                                                    setSearchApplied(false);
                                                                    setLastSearch(null);
                                                                    setShowSuggestions(false);
                                                                    setAppliedFilters({
                                                                        reportType,
                                                                        almacenFilter: "",
                                                                        searchTerm: "",
                                                                        searchColumn: SEARCH_COLUMNS_CONFIG[reportType][0],
                                                                        searchApplied: false,
                                                                        dateRange: dateRange,
                                                                        filterGroups: [
                                                                            {
                                                                                id: uuidv4(),
                                                                                filters: [{ column: "", operator: "=", value: "", groupId: "" }],
                                                                                logicalOperator: "AND",
                                                                                name: "Grupo 1",
                                                                            },
                                                                        ],
                                                                        sortRules: [{ column: QUERY_CONFIGS[reportType]?.fechaField, direction: "desc" }],
                                                                        quickMode,
                                                                    });
                                                                }}
                                                                className="bg-white/80 size-10 mx-2 absolute right-2 md:right-0 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600"
                                                            >
                                                                <X className="size-4 text-red-500 hover:text-red-600" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </ul>
                                                <button
                                                    onClick={handleSearchSubmit}
                                                    className="ml-2 px-3 py-2 w-fit h-fit bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                >
                                                    <Search className="size-4" />
                                                    <span>Buscar</span>
                                                </button>
                                            </section>

                                            {showSuggestions && suggestionsAll.length > 0 && (
                                                <section
                                                    ref={suggestionsContainerRef}
                                                    className="absolute z-50 w-full mt-10 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto dark:bg-gray-800 dark:border-gray-700"
                                                >
                                                    {suggestionsAll.map((suggestion, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => handleSuggestionSelect(suggestion.Suggestion)}
                                                            className="w-full p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                                        >
                                                            <searchColumn.icon className={`size-4 ${searchColumn.color}`} />
                                                            <span className="text-xs whitespace-normal wrap-break-words flex-1 text-left">
                                                                {suggestion.Suggestion}
                                                            </span>
                                                        </button>
                                                    ))}
                                                    {suggestionsLoadingMore && (
                                                        <div className="p-2 text-center text-gray-500">
                                                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                                            Cargando más...
                                                        </div>
                                                    )}
                                                </section>
                                            )}
                                        </div>

                                        {(searchApplied || almacenFilter || dateRange.from || dateRange.to) && (
                                            <button
                                                onClick={handleClearFilters}
                                                className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                                            >
                                                <X className="size-4" />
                                                Limpiar filtros
                                            </button>
                                        )}
                                    </>
                                )}

                                <button
                                    onClick={() => setQuickMode((q) => !q)}
                                    className={`px-3 py-2 rounded flex items-center gap-2 ${quickMode
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                        }`}
                                >
                                    <Zap className="size-4" />
                                    {quickMode ? "Modo rápido" : "Modo normal"}
                                </button>
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="overflow-x-auto -mx-3 md:mx-0">
                            <DynamicTable data={dataTable} loading={tableLoading || refreshingTable} />
                        </div>

                        {!tableLoading && (
                            <div className="mt-4 md:mt-6">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    loading={tableLoading}
                                    setCurrentPage={setCurrentPage}
                                    totalItems={totalRecords}
                                    itemsPerPage={pageSize}
                                    onPageSizeChange={(newSize: number) => {
                                        setPageSize(newSize);
                                    }}
                                    pageSizeOptions={CONFIG.PAGE_SIZE_OPTIONS}
                                    currentPageSize={pageSize}
                                />
                            </div>
                        )}
                    </article>
                )}
            </section>
            <ModalReporting open={showModal} reportType={reportType} />
            <ScoreCard open={showModal2} />
            <Footer />
        </>
    );
}