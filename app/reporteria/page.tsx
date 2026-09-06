// app/analisis/page.tsx
"use client";

import Footer from "@/template/footer";
import Header from "@/template/header";
import { RequestPayload } from "@/hooks/classes/api";
import { useGetWithFiltersIntelisisMutation } from "@/hooks/api/api_int";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import DynamicTable from "@/components/table";
import Pagination from "@/components/pagination";
import { formatValue } from "@/utils/constants/format-values";
import {
    RefreshCw,
    Search,
    Calendar,
    Eye,
    EyeOff,
    Package,
    AlertTriangle,
    Filter,
} from "lucide-react";
import { Button } from "@/components/button";
import MainForm from "@/components/form/main-form";
import { ArrayColumnDisplay } from "@/components/table/toggle-view";
import KardexStats from "./components/kardex-stats";
import { Field } from "@/utils/types/interfaces";
import dynamic from "next/dynamic";
import { useModalTrigger } from "@/hooks/use-modal-trigger";
import {
    type REPORT,
    type Filtro,
    type ActiveFilters,
    REPORT_CONFIGS,
    REPORT_KEYS,
    SYNTHETIC_COLUMNS,
    ALMACEN_FIELD_MAP,
    SEARCH_FIELDS_MAP,
    ALMACENES_OPCIONES,
    getDefaultDateRangeValue,
    getHiddenAggregations,
    buildFiltrosAnd,
    SUGGESTIONS_LIMIT,
} from "./utils/report-utils";
import { useForm } from "react-hook-form";
import { safeCall, useDebounce } from "@/hooks/use-debounce";
import { ApiResponse } from "@/utils/types/consultas";

const ScoreCard = dynamic(() => import("./components/modal-scorecard"), {
    ssr: false,
});
const ModalReporting = dynamic(
    () => import("./components/modal-reporting").then((m) => m.ModalReporting),
    { ssr: false }
);

export default function Analisis() {
    const [getData] = useGetWithFiltersIntelisisMutation();
    const { watch } = useForm();

    const scoreCardModal = useModalTrigger("scorecard");
    const reportingModal = useModalTrigger("reporting");

    // Estados de UI
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [showStats, setShowStats] = useState(true);
    const [selectedReport, setSelectedReport] = useState<REPORT>("venta");
    const [tableLoading, setTableLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [dataTable, setDataTable] = useState<any[]>([]);
    const [dataStats, setDataStats] = useState<any[]>([]);
    const [tableError, setTableError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [],
        FiltrosOther: [
            {
                Key: "FechaEmision",
                Value: getDefaultDateRangeValue(),
                Operator: "BETWEEN",
            },
        ],
        Selects: [],
        OrderBy: [
            {
                Key: "FechaEmision",
                Direction: "DESC",
            },
        ],
    });

    const formRef = useRef<{
        getFormData: () => any;
        submitForm: () => Promise<any>;
        getLiveValues: () => any;
    }>(null);

    const [formValues, setFormValues] = useState<{
        dateRange: string;
        almacen: string;
        search: string;
    }>({
        dateRange: getDefaultDateRangeValue(),
        almacen: "",
        search: "",
    });

    const [arrayDisplayModesByReport, setArrayDisplayModesByReport] = useState<
        Record<string, Record<string, ArrayColumnDisplay>>
    >({});

    // Controladores para abortar peticiones en curso
    const abortControllerRef = useRef<AbortController | null>(null);
    const suggestionsAbortRef = useRef<AbortController | null>(null);

    // --- Sugerencias locales (reemplazo de useSuggestions) ---
    const searchValue = watch("search") || "";
    const debouncedSearch = useDebounce(searchValue, 300);

    const fetchSuggestions = useCallback(async () => {
        const trimmed = debouncedSearch.trim();
        if (!trimmed) {
            setSuggestions([]);
            return;
        }

        // Cancelar petición anterior
        suggestionsAbortRef.current?.abort();
        const controller = new AbortController();
        suggestionsAbortRef.current = controller;

        setSuggestionsLoading(true);
        try {
            const config = REPORT_CONFIGS[selectedReport];
            const searchFields = SEARCH_FIELDS_MAP[selectedReport] || [];
            if (!config || searchFields.length === 0) {
                setSuggestions([]);
                return;
            }

            const baseFiltros = config.filtros?.Filtros || [];
            const filtrosAnd = buildFiltrosAnd(baseFiltros, activeFilters);

            const agregaciones = searchFields.map((field) => ({
                Key: field,
                Operation: "DISTINCT",
                Alias: field.split(".").pop() || field,
            }));

            const payload = {
                table: config.table,
                filtros: {
                    agregaciones,
                    FiltrosAnd: filtrosAnd,
                },
                page: 1,
                pageSize: SUGGESTIONS_LIMIT,
                signal: controller.signal,
            };

            const response = (await getData(payload).unwrap()) as ApiResponse;
            if (controller.signal.aborted) return;

            // Extraer valores únicos de todas las columnas devueltas
            const values = new Set<string>();
            (response.data?.data || []).forEach((row: any) => {
                Object.values(row).forEach((val: any) => {
                    if (typeof val === "string" && val.trim() !== "") {
                        values.add(val.trim());
                    }
                });
            });

            setSuggestions(Array.from(values));
        } catch (err: any) {
            if (err?.name === "AbortError") return;
            // Silenciar otros errores
        } finally {
            if (!controller.signal.aborted) {
                setSuggestionsLoading(false);
            }
        }
    }, [selectedReport, debouncedSearch, activeFilters, getData]);

    useEffect(() => {
        fetchSuggestions();
        return () => {
            suggestionsAbortRef.current?.abort();
        };
    }, [fetchSuggestions]);

    // --- Funciones de acceso y mutación para modos de visualización ---
    const getCurrentArrayDisplayModes = useCallback(
        (report: REPORT = selectedReport): Record<string, ArrayColumnDisplay> => {
            return arrayDisplayModesByReport[report] || {};
        },
        [arrayDisplayModesByReport, selectedReport]
    );

    const handleArrayDisplayChange = useCallback(
        (column: string, mode: ArrayColumnDisplay) => {
            setArrayDisplayModesByReport((prev) => ({
                ...prev,
                [selectedReport]: {
                    ...(prev[selectedReport] || {}),
                    [column]: mode,
                },
            }));
        },
        [selectedReport]
    );

    // --- Columnas visibles ---
    const [visibleColumnsByReport, setVisibleColumnsByReport] = useState<
        Record<string, Record<string, boolean>>
    >({});

    const getCurrentVisibility = useCallback(
        (report: REPORT = selectedReport): Record<string, boolean> => {
            const config = REPORT_CONFIGS[report];
            if (!config) return {};

            const stored = visibleColumnsByReport[report] || {};
            if (visibleColumnsByReport[report]) {
                return stored;
            }

            const allKeys = new Set<string>();
            (config.filtros?.selects || []).forEach((s: any) => {
                const alias = s.Alias || s.Key.split(".").pop() || s.Key;
                allKeys.add(alias);
            });
            (config.filtros?.agregaciones || []).forEach((a: any) => {
                const alias = a.Alias;
                if (alias) allKeys.add(alias);
            });
            SYNTHETIC_COLUMNS.forEach(({ syntheticKey, sourceFields }) => {
                allKeys.add(syntheticKey);
                sourceFields.forEach((sf) => allKeys.add(sf));
            });

            const result: Record<string, boolean> = {};
            allKeys.forEach((key) => {
                result[key] = stored[key] ?? true;
            });
            return result;
        },
        [visibleColumnsByReport, selectedReport]
    );

    const handleVisibleColumnsChange = useCallback(
        (cols: Record<string, boolean>) => {
            setVisibleColumnsByReport((prev) => ({ ...prev, [selectedReport]: cols }));
            setCurrentPage(1);
        },
        [selectedReport]
    );

    // --- Fetch de tabla ---
    const fetchTableData = useCallback(async () => {
        // Cancelar petición anterior
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setTableError(null);
        setTableLoading(true);

        const config = REPORT_CONFIGS[selectedReport];
        if (!config) {
            setTableLoading(false);
            return;
        }

        const currentVisible = getCurrentVisibility(selectedReport);
        const visibleKeys = Object.entries(currentVisible)
            .filter(([, visible]) => visible)
            .map(([key]) => key);

        const currentModes = getCurrentArrayDisplayModes(selectedReport);

        let finalFiltros: any = config.filtros
            ? JSON.parse(JSON.stringify(config.filtros))
            : {};
        const orderConfig = finalFiltros.Order
            ? JSON.parse(JSON.stringify(finalFiltros.Order))
            : null;

        // Calcular campos requeridos
        const allSelectAliases = new Set<string>();
        (config.filtros?.selects || []).forEach((sel: any) => {
            const alias = sel.Alias || sel.Key.split(".").pop() || sel.Key;
            allSelectAliases.add(alias);
        });
        const allAggAliases = new Set<string>();
        (config.filtros?.agregaciones || []).forEach((agg: any) => {
            const alias = agg.Alias || agg.Key.split(".").pop() || agg.Key;
            allAggAliases.add(alias);
        });

        const requiredFields = new Set<string>();
        if (visibleKeys.length === 0) {
            allSelectAliases.forEach((a) => requiredFields.add(a));
            allAggAliases.forEach((a) => requiredFields.add(a));
        } else {
            visibleKeys.forEach((k) => {
                if (allSelectAliases.has(k) || allAggAliases.has(k)) {
                    requiredFields.add(k);
                }
            });
        }

        const baseFiltros: Filtro[] = finalFiltros.Filtros || [];
        finalFiltros.FiltrosAnd = buildFiltrosAnd(baseFiltros, activeFilters);
        delete finalFiltros.Filtros;

        // Ajustar columnas sintéticas
        for (const { syntheticKey, sourceFields } of SYNTHETIC_COLUMNS) {
            const isVisible =
                visibleKeys.length === 0 || visibleKeys.includes(syntheticKey);
            if (!isVisible) {
                sourceFields.forEach((f) => requiredFields.delete(f));
            } else {
                const mode = currentModes[syntheticKey] || "both";
                let fieldsToKeep: string[] = [];
                if (mode === "first") fieldsToKeep = sourceFields.slice(0, 1);
                else if (mode === "second") fieldsToKeep = sourceFields.slice(1, 2);
                else if (mode === "third") fieldsToKeep = sourceFields.slice(2, 3);
                else if (mode === "both") fieldsToKeep = sourceFields;

                sourceFields.forEach((f) => requiredFields.delete(f));
                fieldsToKeep.forEach((f) => requiredFields.add(f));
            }
        }

        if (finalFiltros.selects) {
            finalFiltros.selects = finalFiltros.selects.filter((sel: any) => {
                const alias = sel.Alias || sel.Key.split(".").pop() || sel.Key;
                return requiredFields.has(alias);
            });
        }

        if (finalFiltros.agregaciones) {
            const hiddenAggregations = getHiddenAggregations(
                visibleKeys,
                finalFiltros.agregaciones
            );
            finalFiltros.agregaciones = finalFiltros.agregaciones.filter((ag: any) => {
                const alias = ag.Alias || ag.Key.split(".").pop() || ag.Key;
                if (visibleKeys.length === 0) return true;
                if (hiddenAggregations.has(alias)) return false;
                return currentVisible[alias] === true;
            });
        }

        if (orderConfig && orderConfig.length > 0) {
            const hasFechaEmision = (finalFiltros.selects || []).some((sel: any) => {
                const key = sel.Key || "";
                return key.includes("FechaEmision") || key.endsWith(".FechaEmision");
            });
            if (!hasFechaEmision) {
                delete finalFiltros.Order;
            }
        }

        const payload: RequestPayload = {
            table: config.table,
            filtros: finalFiltros,
            page: currentPage,
            pageSize,
            signal: controller.signal,
        };
        console.log(payload);
        
        try {
            const response:any = (await getData(payload).unwrap()) as ApiResponse;
            if (controller.signal.aborted) return;

            const activeVisible = visibleKeys.length > 0 ? new Set(visibleKeys) : null;

            const formattedData =
                response.data.data.map((item: any) => {
                    const {
                        ["Nombre Sucursal"]: NombreSucursal,
                        Sucursal,
                        Almacen,
                        Proveedor,
                        Fabricante,
                        Articulo,
                        Nombre,
                        Codigo,
                        Categoria,
                        Grupo,
                        Linea,
                        Familia,
                        Unidad,
                        Factor,
                        Cantidad,
                        Articulos,
                        ["Clientes Distintos"]: TotalClientes,
                        ["Total Tikets"]: TotalTikets,
                        Costo,
                        ["Total Costo"]: TotalCosto,
                        ["Total Ventas"]: TotalVentas,
                        Precio,
                        ["Total Proveedores"]: TotalProveedores,
                        ["Proveedor Nombre"]: ProveedorNombre,
                        ["Maximo Costo"]: CostoMaximo,
                        ["Minimo Costo"]: CostoMinimo,
                        ["Total Mermas"]: TotalMermas,
                        ...rest
                    } = item;

                    const isEmptyValue = (value: any): boolean => {
                        if (value === null || value === undefined) return true;
                        if (Array.isArray(value)) {
                            if (value.length === 0) return true;
                            return value.every(
                                (v) => v === null || v === undefined || v === ""
                            );
                        }
                        if (typeof value === "string") {
                            return value.trim() === "";
                        }
                        return false;
                    };

                    const full: Record<string, any> = {
                        FechaEmision: item.FechaEmision,
                        Articulo: [item.Nombre, item.Articulo, item.Codigo],
                        Proveedor: [
                            item["Proveedor Nombre"],
                            item.Proveedor,
                            item.Fabricante,
                        ],
                        Sucursal: [item["Nombre Sucursal"], item.Almacen, item.Sucursal],
                        Categoria: [item.Categoria, item.Grupo, item.Linea, item.Familia],
                        Unidad: [
                            item.Unidad,
                            ...(item.Factor > 1 ? [`x${item.Factor}`] : []),
                        ],
                        Cantidad: [
                            item.Cantidad,
                            ...(item.Factor > 1 ? [`=${item["Articulos"]}`] : []),
                        ],
                        Costo: [
                            item.Costo,
                            item.Cantidad > 1
                                ? item["Total Costo"]
                                    ? [`=${formatValue(item["Total Costo"], "currency")}`]
                                    : [`=${formatValue(item["Total Mermas"], "currency")}`]
                                : "",
                        ],
                        Precio: [
                            item.Precio,
                            item.Cantidad > 1
                                ? [`=${formatValue(item["Total Ventas"], "currency")}`]
                                : "",
                        ],
                        ...rest,
                    };

                    const nonEmptyFull = Object.fromEntries(
                        Object.entries(full).filter(([key, value]) => !isEmptyValue(value))
                    );

                    if (!activeVisible) return nonEmptyFull;
                    return Object.fromEntries(
                        Object.entries(nonEmptyFull).filter(([key]) => activeVisible.has(key))
                    );
                }) || [];
            console.log(formattedData);
                
            setDataTable(formattedData);
            setTotalPages(response.data?.totalPages);
            setTotalRecords(
                response.data?.totalRecords || response.data?.totalEstimated || 0
            );
        } catch (err: any) {
            if (err?.name === "AbortError") return;
            setTableError(err?.message || "Error al cargar los datos");
        } finally {
            if (!controller.signal.aborted) {
                setTableLoading(false);
            }
        }
    }, [
        selectedReport,
        currentPage,
        pageSize,
        getData,
        activeFilters,
        getCurrentVisibility,
        getCurrentArrayDisplayModes,
    ]);

    // --- Fetch de estadísticas ---
    const fetchStatsData = useCallback(async () => {
        // Cancelar petición anterior (usamos el mismo controller que fetchTableData o uno nuevo)
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setStatsLoading(true);
        const config = REPORT_CONFIGS[selectedReport];
        if (!config) {
            setStatsLoading(false);
            return;
        }

        let finalFiltros: any = config.filtros
            ? JSON.parse(JSON.stringify(config.filtros))
            : {};
        const { selects, Order, Filtros: baseFiltros, ...others } = finalFiltros;
        others.FiltrosAnd = buildFiltrosAnd(baseFiltros || [], activeFilters);

        const payload: RequestPayload = {
            table: config.table,
            filtros: others,
            page: currentPage,
            pageSize,
            signal: controller.signal,
        };

        try {
            const response:any = (await getData(payload).unwrap()) as ApiResponse;
            if (controller.signal.aborted) return;

            const formattedData = response.data.data.map((out: any) => {
                const totalVentas = out["Total Ventas"];
                const totalCosto = out["Total Costo"];
                const data: any = { ...out };
                if (
                    totalVentas !== undefined &&
                    totalVentas !== null &&
                    !isNaN(totalVentas) &&
                    totalVentas !== 0
                ) {
                    const utilidadRaw = totalVentas - (totalCosto ?? 0);
                    data.Utilidad = formatValue(utilidadRaw, "currency");
                    data.Margen = "% " + formatValue((utilidadRaw / totalVentas) * 100, "number");
                }
                return data;
            });
            setDataStats(formattedData);
        } catch (err: any) {
            if (err?.name === "AbortError") return;
            // Silenciar errores de stats (no críticos)
        } finally {
            if (!controller.signal.aborted) {
                setStatsLoading(false);
            }
        }
    }, [selectedReport, currentPage, pageSize, activeFilters, getData]);

    // Efectos para cargar datos al cambiar dependencias
    useEffect(() => {
        fetchTableData();
    }, [fetchTableData]);

    useEffect(() => {
        fetchStatsData();
    }, [fetchStatsData]);

    // --- Configuración del formulario ---
    const dataFormConfig: Field[] = useMemo(
        () => [
            {
                require: false,
                type: "Flex",
                elements: [
                    {
                        require: false,
                        type: "DATE_RANGE",
                        name: "dateRange",
                        label: "Rango de fechas",
                        icon: <Calendar className="size-4" />,
                        valueDefined: formValues.dateRange,
                    },
                    {
                        require: false,
                        type: "SELECT",
                        name: "almacen",
                        label: "Almacén",
                        placeholder: "Selecciona un almacén",
                        icon: <Package className="size-4" />,
                        options: ALMACENES_OPCIONES,
                        valueDefined: formValues.almacen || undefined,
                    },
                    {
                        require: false,
                        type: "SEARCH",
                        name: "search",
                        placeholder:
                            "Escribe y presiona Enter para agregar (Artículo, código, proveedor, etc.)",
                        label: "Búsqueda rápida (acumulable)",
                        icon: <Search className="size-4" />,
                        options: suggestions,
                        saveData: true,
                        valueDefined: formValues.search,
                        loading: suggestionsLoading,
                    },
                ],
            },
        ],
        [formValues, suggestions, suggestionsLoading]
    );

    // --- Cambio de reporte con refetch ---
    const handleReportChange = useCallback(
        (report: REPORT) => {
            setSelectedReport(report);
            setCurrentPage(1);
            setFormValues((prev) => ({ ...prev, search: "" }));
            // Los efectos se encargarán de recargar
        },
        []
    );

    // --- Render ---
    return (
        <>
            <Header />
            <section className="p-3 md:p-4 min-h-[70vh]">
                <dt className="flex justify-between items-center mb-4">
                    <dl className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold dark:text-white">Análisis</h1>
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            {showStats ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">Estadísticas</span>
                        </button>
                    </dl>
                    <dl className="flex gap-2">
                        <Button
                            onClick={() => {
                                fetchTableData();
                                fetchStatsData();
                            }}
                            disabled={tableLoading || statsLoading}
                            color="second"
                            size="small"
                        >
                            <RefreshCw
                                className={`w-3.5 h-3.5 ${tableLoading || statsLoading ? "animate-spin" : ""
                                    }`}
                            />
                            <span className="hidden sm:inline">Recargar</span>
                        </Button>
                    </dl>
                </dt>

                <ul className="mb-4 flex items-center justify-between">
                    <li className="flex flex-wrap gap-2">
                        {REPORT_KEYS.map((report) => (
                            <Button
                                key={report}
                                color={selectedReport === report ? "completed" : "success"}
                                size="small"
                                onClick={() => handleReportChange(report)}
                            >
                                {report.charAt(0).toUpperCase() + report.slice(1)}
                            </Button>
                        ))}
                    </li>
                    <li className="flex flex-wrap gap-2">
                        <Button color="success" size="small" onClick={reportingModal.open}>
                            Desglose
                        </Button>
                        <Button color="success" size="small" onClick={scoreCardModal.open}>
                            Score Card
                        </Button>
                    </li>
                </ul>

                <KardexStats
                    dataStats={dataStats}
                    isLoading={statsLoading}
                    show={showStats}
                />

                <div className="relative flex flex-col rounded-xl border gap-3 border-gray-200 bg-white shadow-sm p-4 dark:bg-gray-800 dark:border-gray-700">
                    <MainForm
                        actionType=""
                        ref={formRef}
                        flexDirection="flex-row"
                        dataForm={dataFormConfig}
                        message_button="Filtrar"
                        iconButton={<Filter className="mr-1 h-4 w-4" />}
                        onSuccess={(rows: any) => {
                            const { almacen, search, dateRange } = rows;
                            const effectiveDateRange =
                                dateRange || formValues.dateRange || getDefaultDateRangeValue();

                            const filtrosAnd: Filtro[] = [
                                {
                                    Key: "FechaEmision",
                                    Operator: "BETWEEN",
                                    Value: effectiveDateRange,
                                },
                            ];
                            const almacenField = ALMACEN_FIELD_MAP[selectedReport];
                            if (almacen && almacenField) {
                                filtrosAnd.push({
                                    Key: almacenField,
                                    Operator: "=",
                                    Value: almacen,
                                });
                            }

                            const filtrosOr: Filtro[] = [];
                            if (search) {
                                const searchFields = SEARCH_FIELDS_MAP[selectedReport] || [];
                                const searchTerms = search
                                    .split(",")
                                    .map((term: string) => term.trim())
                                    .filter(Boolean);
                                searchTerms.forEach((term: string) => {
                                    searchFields.forEach((field) => {
                                        filtrosOr.push({
                                            Key: field,
                                            Operator: "LIKE",
                                            Value: term,
                                        });
                                    });
                                });
                            }

                            setActiveFilters((prev) => ({
                                ...prev,
                                Filtros: filtrosOr,
                                FiltrosOther: filtrosAnd,
                            }));

                            setFormValues({
                                dateRange: effectiveDateRange,
                                almacen: almacen || "",
                                search: search || "",
                            });

                            setCurrentPage(1);
                        }}
                    />

                    {tableError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>{tableError}</span>
                            <Button color="second" onClick={() => fetchTableData()}>
                                Reintentar
                            </Button>
                        </div>
                    )}

                    <DynamicTable
                        data={dataTable}
                        loading={tableLoading}
                        visibleColumns={getCurrentVisibility(selectedReport)}
                        onVisibleColumnsChange={handleVisibleColumnsChange}
                        arrayDisplayModes={getCurrentArrayDisplayModes(selectedReport)}
                        onArrayDisplayChange={handleArrayDisplayChange}
                    />

                    {!tableLoading && totalRecords > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            loading={tableLoading}
                            setCurrentPage={setCurrentPage}
                            totalItems={totalRecords}
                            itemsPerPage={pageSize}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setCurrentPage(1);
                            }}
                            pageSizeOptions={[10, 25, 50, 100]}
                            currentPageSize={pageSize}
                        />
                    )}
                </div>
            </section>

            {scoreCardModal.mounted && <ScoreCard />}
            {reportingModal.mounted && <ModalReporting reportType={selectedReport} />}
            <Footer />
        </>
    );
}