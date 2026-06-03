"use client";

import Footer from "@/template/footer";
import Header from "@/template/header";
import { StatsData } from "./types/consultas";
import { RequestPayload, useManagmentRead, useManagmentSearch } from "@/hooks/classes/api";
import { useAppDispatch } from "@/hooks/selector";
import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
    useTransition,
    useDeferredValue,
    useId,
} from "react";
import { CONFIG } from "./utils/config-constants";
import DynamicTable from "@/components/table";
import Pagination from "@/components/pagination";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { formatDateDisplay, formatValue } from "@/utils/constants/format-values";
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
    TrendingUp,
    Ticket,
    ShoppingCart,
    Truck,
    Landmark,
} from "lucide-react";
import { SearchColumn } from "./types/config";
import { v4 as uuidv4 } from "uuid";
import { FilterGroup, FilterRule } from "@/utils/types/consultas";
import { AppliedFilters, DateRange } from "./types/filter";
import { FilterBuilder } from "./utils/filter-class";
import { DATE_PERIODS, OPERATORS } from "./utils/consultas-constants";
import { Button } from "@/components/button";
import { SortRule } from "./page";
import { usePedidosSignalR } from "../pick-up/utils/singalr-pedidos";
import { safeCall, useDebounce } from "@/hooks/use-debounce";

// ─── Types ────────────────────────────────────────────────────────────────────
type REPORT =
    | "venta"
    | "compra"
    | "merma"
    | "inventario"
    | "clientes"
    | "proveedores"
    | "gastos";

type ReportStatus = "idle" | "loading" | "success" | "error" | "retrying";

interface ReportState {
    status: ReportStatus;
    data: any;
    error: string | null;
    lastUpdated: number | null;
    attempt: number;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
type ReportAction =
    | { type: "LOADING"; report: REPORT }
    | { type: "RETRYING"; report: REPORT; attempt: number }
    | { type: "SUCCESS"; report: REPORT; data: any }
    | { type: "ERROR"; report: REPORT; error: string }
    | { type: "RESET_ALL" };

function reportsReducer(
    state: Record<REPORT, ReportState>,
    action: ReportAction
): Record<REPORT, ReportState> {
    switch (action.type) {
        case "LOADING":
            return {
                ...state,
                [action.report]: {
                    ...state[action.report],
                    status: "loading",
                    error: null,
                },
            };
        case "RETRYING":
            return {
                ...state,
                [action.report]: {
                    ...state[action.report],
                    status: "retrying",
                    error: null,
                    attempt: action.attempt,
                },
            };
        case "SUCCESS":
            return {
                ...state,
                [action.report]: {
                    status: "success",
                    data: action.data,
                    error: null,
                    lastUpdated: Date.now(),
                    attempt: 0,
                },
            };
        case "ERROR":
            return {
                ...state,
                [action.report]: {
                    ...state[action.report],
                    status: "error",
                    error: action.error,
                },
            };
        case "RESET_ALL":
            return makeInitialState();
        default:
            return state;
    }
}

// ─── Configuración de reportes (original) ─────────────────────────────────────
const REPORT_CONFIGS: Record<REPORT, Pick<RequestPayload, "table" | "filtros">> = {
    venta: {
        table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo`,
        filtros: {
            selects: [
                { Key: "ventad.Codigo" },
                { Key: "ventad.Articulo" },
                { Key: "ART.Descripcion1", Alias: "Nombre" },
                { Key: "ART.Categoria" },
                { Key: "ART.Grupo" },
                { Key: "ventad.Cantidad" },
                { Key: "ventad.Unidad" },
                { Key: "ventad.Factor" },
                { Key: "ventad.Precio", Alias: "Precio unitario" },
                { Key: "ventad.Costo", Alias: "Costo unitario" },
                { Key: "ventad.Almacen" },
                { Key: "venta.FechaEmision" },
            ],
            agregaciones: [
                { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
                { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
                { Key: "(ventad.Cantidad * ART.Factor)", Alias: "ArticulosVendidos", Operation: "SUM" },
                { Key: "venta.Cliente", Alias: "totalClientes", Operation: "COUNT DISTINCT" },
                { Key: "venta.ID", Alias: "totalTikets", Operation: "COUNT DISTINCT" },
            ],
            Filtros: [
                { Key: "venta.Estatus", Operator: "IN", Value: "CONCLUIDO,PROCESAR" },
                { Key: "venta.Mov", Operator: "IN", Value: "Factura,Factura Credito,Nota" },
            ],
        },
    },
    compra: {
        table: `COMPRA AS compra INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo LEFT JOIN CB AS cb ON cb.Cuenta = art.Articulo AND cb.Codigo = comprad.Codigo LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor`,
        filtros: {
            selects: [
                { Key: "CB.Codigo" },
                { Key: "P.Nombre", Alias: "Proveedor" },
                { Key: "ART.Fabricante" },
                { Key: "comprad.Articulo" },
                { Key: "ART.Descripcion1", Alias: "Nombre" },
                { Key: "ART.Categoria" },
                { Key: "ART.Grupo" },
                { Key: "comprad.Cantidad" },
                { Key: "comprad.Unidad" },
                { Key: "comprad.Factor" },
                { Key: "comprad.CantidadInventario" },
                { Key: "comprad.DescuentoLinea", Alias: "Descuento" },
                { Key: "comprad.Costo", Alias: "CostoUnitario" },
                { Key: "comprad.Almacen" },
                { Key: "compra.FechaEmision" },
            ],
            agregaciones: [
                { Key: "(comprad.Costo * comprad.Cantidad)", Alias: "totalCompras", Operation: "SUM" },
                { Key: "comprad.CantidadInventario", Alias: "ArticulosComprados", Operation: "SUM" },
                { Key: "compra.Proveedor", Alias: "totalProveedores", Operation: "COUNT DISTINCT" },
                { Key: "comprad.Costo", Alias: "minimoCosto", Operation: "MIN" },
                { Key: "comprad.Costo", Alias: "maximoCosto", Operation: "MAX" },
            ],
            Filtros: [
                { Key: "compra.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
                { Key: "compra.Mov", Operator: "=", Value: "ENTRADA COMPRA" },
            ],
        },
    },
    merma: {
        table: `INV AS inv INNER JOIN INVD AS invd ON invd.ID = inv.ID INNER JOIN Art AS art ON art.Articulo = invd.Articulo`,
        filtros: {
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
                { Key: "inv.FechaEmision" },
            ],
            agregaciones: [
                { Key: "(invd.Costo * invd.Cantidad)", Alias: "totalMermas", Operation: "SUM" },
                { Key: "invd.Cantidad", Alias: "totalArticulosMerma", Operation: "SUM" },
            ],
            Filtros: [
                { Key: "inv.Mov", Operator: "=", Value: 'SALIDA DIVERSA' },
                { Key: "inv.Concepto", Operator: "=", Value: 'SALIDA POR MERMAS' },
                { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
            ],
        },
    },
    inventario: {
        table: `INVD AS invd INNER JOIN inv AS inv ON inv.ID = invd.ID INNER JOIN Art AS art ON art.Articulo = invd.Articulo`,
        filtros: {
            selects: [
                { Key: "art.Articulo" },
                { Key: "art.Descripcion1", Alias: "Nombre" },
                { Key: "art.Categoria" },
                { Key: "art.Grupo" },
                { Key: "art.Linea" },
                { Key: "art.Familia" },
                { Key: "inv.Concepto" },
                { Key: "invd.Costo" },
                { Key: "invd.Unidad" },
                { Key: "invd.Cantidad" },
                { Key: "inv.Sucursal" },
                { Key: "inv.movid" },
                { Key: "inv.estatus" },
                { Key: "inv.FechaEmision" },
            ],
            agregaciones: [
                { Key: "(invd.Costo * invd.Cantidad)", Alias: "totalCostoInventario", Operation: "SUM" },
                { Key: "invd.Cantidad", Alias: "totalArticulosInventario", Operation: "SUM" },
            ],
            Filtros: [
                { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
                { Key: "inv.Mov", Operator: "<>", Value: 'SALIDA DIVERSA' },
            ],
        },
    },
    clientes: { table: "Cte", filtros: {} },
    proveedores: { table: "ArtProv", filtros: {} },
    gastos: {
        table: `gasto G INNER JOIN ( SELECT GD.ID AS GastoID, MAX(GD.Concepto) AS Concepto, SUM(GD.Precio * GD.Cantidad) AS TotalPrecio, SUM(GD.Cantidad) AS TotalCantidad, SUM(GD.Importe) AS TotalImporte, SUM(GD.Impuestos) AS TotalImpuestos FROM gastod GD GROUP BY GD.ID ) GD_Concepto ON G.ID = GD_Concepto.GastoID LEFT JOIN Prov P ON P.Proveedor = G.Acreedor LEFT JOIN ( SELECT CFDL.ModuloID, MIN(CFDL.UUID) AS MinUUID FROM CFDValidoMovLista CFDL WHERE CFDL.ModuloD = 'GAS' GROUP BY CFDL.ModuloID ) CFDL ON G.ID = CFDL.ModuloID LEFT JOIN CFDEgreso E ON E.UUID = CFDL.MinUUID`,
        filtros: {
            selects: [
                { Key: "G.ID" },
                { Key: "G.MovID" },
                { Key: "G.FechaEmision" },
                { Key: "G.CLASE" },
                { Key: "G.Subclase" },
                { Key: "GD_Concepto.Concepto" },
                { Key: "P.Nombre", Alias: "Proveedor" },
                { Key: "G.Acreedor" },
                { Key: "GD_Concepto.TotalImporte" },
                { Key: "GD_Concepto.TotalImpuestos" },
                { Key: "G.Estatus" },
                { Key: "G.Ejercicio" },
                { Key: "E.Documento", Alias: "DocumentoFiscal" },
                { Key: "E.FechaTimbrado", Alias: "FechaTimbrado" },
                { Key: "CFDL.MinUUID", Alias: "UUID" },
                { Key: "GD_Concepto.TotalPrecio" },
                { Key: "GD_Concepto.TotalCantidad" },
            ],
            Filtros: [
                { Key: "G.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
            ],
        },
    },
};

// ─── Constantes estables ─────────────────────────────────────────────────────
const REPORT_KEYS = Object.keys(REPORT_CONFIGS) as REPORT[];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 30_000;

const ALMACENES_OPCIONES = [
    { value: "ALMVGPE", label: "Guadalupe" },
    { value: "ALMMAYO", label: "Mayoreo" },
    { value: "ALMTESTE", label: "Testerazo" },
    { value: "ALMPALM", label: "Palmas" },
];

function makeInitialState(): Record<REPORT, ReportState> {
    return Object.fromEntries(
        REPORT_KEYS.map((k) => [
            k,
            { status: "idle", data: null, error: null, lastUpdated: null, attempt: 0 },
        ])
    ) as Record<REPORT, ReportState>;
}

// ─── Función pura de procesamiento (con promedio corregido) ──────────────────
function processStatsData(statsData: any[] | any): StatsData {
    const out: StatsData = {};
    const items = Array.isArray(statsData) ? statsData : [statsData].filter(Boolean);

    items.forEach((s: any) => {
        if (!s || typeof s !== "object") return;
        if (s.totalVentas != null) out.totalVentas = (out.totalVentas ?? 0) + Number(s.totalVentas);
        if (s.totalTikets != null) out.totalTikets = (out.totalTikets ?? 0) + Number(s.totalTikets);
        if (s.totalCosto != null) out.totalCosto = (out.totalCosto ?? 0) + Number(s.totalCosto);
        if (s.ArticulosVendidos != null) out.totalArticulos = (out.totalArticulos ?? 0) + Number(s.ArticulosVendidos);
        if (s.totalCompras != null) out.totalCompras = (out.totalCompras ?? 0) + Number(s.totalCompras);
        if (s.totalMermas != null) out.totalMermas = (out.totalMermas ?? 0) + Number(s.totalMermas);
        if (s.totalClientes != null) out.totalClientes = (out.totalClientes ?? 0) + Number(s.totalClientes);
        if (s.totalProveedores != null) out.totalProveedores = (out.totalProveedores ?? 0) + Number(s.totalProveedores);
        if (s.minimoCosto != null) out.minimoCosto = (out.minimoCosto ?? 0) + Number(s.minimoCosto);
        if (s.maximoCosto != null) out.maximoCosto = (out.maximoCosto ?? 0) + Number(s.maximoCosto);
        if (s.totalArticulosMerma != null) out.totalArticulosMerma = (out.totalArticulosMerma ?? 0) + Number(s.totalArticulosMerma);
    });

    if (out.totalVentas != null && out.totalCosto != null) {
        out.utilidad = +(out.totalVentas - out.totalCosto - (out.totalMermas ?? 0)).toFixed(2);
        out.margen = out.totalVentas > 0 ? +((out.utilidad / out.totalVentas) * 100).toFixed(2) : 0;
    } else if (out.totalVentas != null && out.totalCompras != null) {
        out.utilidad = +(out.totalVentas - out.totalCompras - (out.totalMermas ?? 0)).toFixed(2);
        out.margen = out.totalVentas > 0 ? +((out.utilidad / out.totalVentas) * 100).toFixed(2) : 0;
        out.diferencia = out.utilidad;
    }

    if (out.totalVentas != null && out.totalTikets && out.totalTikets > 0) {
        out.promedio = +(out.totalVentas / out.totalTikets).toFixed(2);
    } else if (out.totalVentas != null && out.totalCompras && out.totalCompras > 0) {
        out.promedio = +(out.totalVentas / out.totalCompras).toFixed(2);
    } else {
        out.promedio = 0;
    }
    return out;
}

// ─── Hook para fetching individual con safeCall y reintentos ─────────────────
function useSingleReportFetch(
    manager: ReturnType<typeof useManagmentRead>[0],
    dispatch: (action: ReportAction) => void
) {
    const abortMapRef = useRef<Map<REPORT, AbortController>>(new Map());
    const retryTimersRef = useRef<Map<REPORT, ReturnType<typeof setTimeout>>>(new Map());

    const cancelReport = useCallback((report: REPORT) => {
        abortMapRef.current.get(report)?.abort();
        abortMapRef.current.delete(report);
        const timer = retryTimersRef.current.get(report);
        if (timer) {
            clearTimeout(timer);
            retryTimersRef.current.delete(report);
        }
    }, []);

    const cancelAll = useCallback(() => {
        REPORT_KEYS.forEach(cancelReport);
    }, [cancelReport]);

    const fetchReport = useCallback(
        (report: REPORT, payload: Omit<RequestPayload, "signal">, attempt = 1) => {
            cancelReport(report);
            const controller = new AbortController();
            abortMapRef.current.set(report, controller);

            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            if (attempt === 1) {
                dispatch({ type: "LOADING", report });
            } else {
                dispatch({ type: "RETRYING", report, attempt });
            }

            const { promise } = manager.execute({
                ...payload,
                signal: controller.signal,
            } as RequestPayload);

            safeCall(() => promise, `fetchReport/${report}`)
                .then((res: any) => {
                    clearTimeout(timeoutId);
                    if (controller.signal.aborted) return;

                    const safeData = res?.data?.data ?? res?.data ?? null;
                    dispatch({ type: "SUCCESS", report, data: safeData });
                })
                .catch((err: any) => {
                    clearTimeout(timeoutId);
                    if (controller.signal.aborted || err?.name === "AbortError") return;

                    if (attempt < MAX_RETRIES) {
                        const delay = RETRY_DELAY_MS * 2 ** (attempt - 1);
                        const timer = setTimeout(() => fetchReport(report, payload, attempt + 1), delay);
                        retryTimersRef.current.set(report, timer);
                        return;
                    }

                    dispatch({ type: "ERROR", report, error: err?.message ?? "Error inesperado" });
                });
        },
        [manager, cancelReport, dispatch]
    );

    useEffect(() => cancelAll, [cancelAll]);
    return { fetchReport, cancelReport, cancelAll };
}

// ─── Inyección de fecha dinámica ─────────────────────────────────────────────
const getDate30DaysAgo = (): string => {
    const date = new Date();
    date.setDate(date.getDate() - 10);
    return date.toISOString().split('T')[0];
};

const injectDateFilter = (report: REPORT, filtrosOriginal: any): any => {
    if (report === "clientes" || report === "proveedores") return filtrosOriginal;

    let dateFieldKey = "";
    switch (report) {
        case "venta": dateFieldKey = "venta.FechaEmision"; break;
        case "compra": dateFieldKey = "compra.FechaEmision"; break;
        case "merma": dateFieldKey = "inv.FechaEmision"; break;
        case "inventario": dateFieldKey = "inv.FechaEmision"; break;
        case "gastos": dateFieldKey = "G.FechaEmision"; break;
        default: return filtrosOriginal;
    }

    const newFiltros = JSON.parse(JSON.stringify(filtrosOriginal));
    if (!newFiltros.Filtros) newFiltros.Filtros = [];
    newFiltros.Filtros.push({
        Key: dateFieldKey,
        Operator: ">=",
        Value: getDate30DaysAgo(),
    });
    return newFiltros;
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Analisis() {
    const [manager] = useManagmentRead();
    const [managerSearch] = useManagmentSearch();
    const dispatch = useAppDispatch();

    // Estados de reportes (agregaciones)
    const [reports, dispatchReports] = useReducer(reportsReducer, undefined, makeInitialState);
    const deferredReports = useDeferredValue(reports);

    // Estados de UI
    const [pageSize, setPageSize] = useState<number>(CONFIG.PAGE_SIZE);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [showStats, setShowStats] = useState(true);
    const [selectedReport, setSelectedReport] = useState<REPORT>("venta");
    const [tableLoading, setTableLoading] = useState(false);
    const [dataTable, setDataTable] = useState<any[]>([]);
    const [tableError, setTableError] = useState<string | null>(null);
    const [refreshingTable, setRefreshingTable] = useState(false);

    // Filtros
    const [quickMode, setQuickMode] = useState(true);
    const [almacenFilter, setAlmacenFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchApplied, setSearchApplied] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
        { id: uuidv4(), filters: [{ column: "", operator: "=", value: "", groupId: "" }], logicalOperator: "AND", name: "Grupo 1" },
    ]);

    // Búsqueda por columna
    const [searchColumn, setSearchColumn] = useState<SearchColumn>({
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
    const [suggestionsAll, setSuggestionsAll] = useState<any[]>([]);
    const [suggestionsPage, setSuggestionsPage] = useState(1);
    const [suggestionsTotalPages, setSuggestionsTotalPages] = useState(1);
    const [suggestionsLoadingMore, setSuggestionsLoadingMore] = useState(false);
    const suggestionsAbortControllerRef = useRef<AbortController | null>(null);
    const suggestionsContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchColumnDropdownRef = useRef<HTMLDivElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // ─── Integración de SignalR ─────────────────────────────────────────────
    const refreshAllData = useCallback(async () => {
        console.log("🔄 SignalR: Refrescando datos globales");
        // Recargar agregaciones (reportes)
        cancelAll();
        REPORT_KEYS.forEach((report) => {
            const baseConfig = REPORT_CONFIGS[report];
            const filtrosConFecha = injectDateFilter(report, baseConfig.filtros);
            const payload: Omit<RequestPayload, "signal"> = {
                table: baseConfig.table,
                filtros: filtrosConFecha,
                page: 1,
                pageSize: 1,
            };
            fetchReport(report, payload);
        });
        // Recargar tabla actual
        await fetchTableData();
    }, []);

    // Callbacks de SignalR
    const onPedidoActualizado = useCallback((pedido: any) => {
        console.log("📦 Pedido actualizado por SignalR:", pedido);
        refreshAllData();
    }, [refreshAllData]);

    const onNuevoPedido = useCallback((pedido: any) => {
        console.log("🆕 Nuevo pedido por SignalR:", pedido);
        refreshAllData();
    }, [refreshAllData]);

    const onPedidoEliminado = useCallback((pedidoId: number) => {
        console.log("🗑️ Pedido eliminado por SignalR:", pedidoId);
        refreshAllData();
    }, [refreshAllData]);

    const onRefrescarDatos = useCallback(() => {
        console.log("🔄 SignalR: Evento genérico de refresco");
        refreshAllData();
    }, [refreshAllData]);

    // Usar el hook de SignalR
    const { isConnected } = usePedidosSignalR(
        onPedidoActualizado,
        onNuevoPedido,
        onPedidoEliminado,
        onRefrescarDatos
    );

    // ─── Lógica de fetching (stats y tabla) ──────────────────────────────────
    const { fetchReport, cancelAll } = useSingleReportFetch(manager, dispatchReports);

    // Obtener todos los reportes (agregaciones) al montar
    useEffect(() => {
        refreshAllData();
    }, []); // Solo al montar, pero refreshAllData ya incluye todo

    const fetchTableData = useCallback(async () => {
        setTableError(null);
        setTableLoading(true);
        const config = REPORT_CONFIGS[selectedReport];
        if (!config) {
            setTableLoading(false);
            return;
        }

        let finalFiltros:any = config.filtros ? { ...config.filtros } : { selects: [] };
        finalFiltros = injectDateFilter(selectedReport, finalFiltros);
        if (almacenFilter && config.table.includes("Almacen")) {
            if (!finalFiltros.Filtros) finalFiltros.Filtros = [];
            finalFiltros.Filtros.push({ Key: `${selectedReport === "venta" ? "ventad" : selectedReport === "compra" ? "comprad" : "invd"}.Almacen`, Operator: "=", Value: almacenFilter });
        }
        if (searchApplied && searchTerm && searchColumn.tableField) {
            if (!finalFiltros.Filtros) finalFiltros.Filtros = [];
            finalFiltros.Filtros.push({ Key: searchColumn.tableField, Operator: "LIKE", Value: `%${searchTerm}%` });
        }
        

        const payload: RequestPayload = {
            table: config.table,
            filtros: finalFiltros,
            page: currentPage,
            pageSize,
        };

        try {
            const { promise } = manager.execute(payload);
            const response = await safeCall(() => promise, `fetchTable/${selectedReport}`);
            setDataTable(response.data?.data || []);
            setTotalRecords(response.data?.totalRecords || response.data?.totalEstimated || 0);
        } catch (err: any) {
            setTableError(err.message);
        } finally {
            setTableLoading(false);
        }
    }, [selectedReport, quickMode, almacenFilter, searchApplied, searchTerm, searchColumn, currentPage, pageSize, manager]);

    useEffect(() => {
        fetchTableData();
    }, [selectedReport, currentPage, pageSize, almacenFilter, dateRange, searchApplied, searchTerm, fetchTableData]);

    // Sugerencias de búsqueda (con safeCall y abort)
    const fetchSuggestions = useCallback(async (reset = false) => {
        if (!searchTerm || searchTerm.length < 2 || !searchColumn.tableField || !searchColumn.table) {
            setSuggestionsAll([]);
            setShowSuggestions(false);
            return;
        }
        if (suggestionsAbortControllerRef.current) suggestionsAbortControllerRef.current.abort();
        const nextPage = reset ? 1 : suggestionsPage + 1;
        if (!reset && nextPage > suggestionsTotalPages) return;
        if (!reset) setSuggestionsLoadingMore(true);
        setShowSuggestions(true);
        const controller = new AbortController();
        suggestionsAbortControllerRef.current = controller;
        try {
            const payload: RequestPayload = {
                table: `${searchColumn.table} WHERE ${searchColumn.tableField} LIKE '%${searchTerm}%'`,
                filtros: { agregaciones: [{ Key: searchColumn.tableField, Alias: "Suggestion", Operation: "DISTINCT" }] },
                page: nextPage,
                pageSize: 10,
                signal: controller.signal,
            };
            const { promise } = managerSearch.execute(payload);
            const response = await safeCall(() => promise, "fetchSuggestions");
            const data = response.data?.data || [];
            const totalRecords = response.data?.totalRecords || 0;
            const totalPages = Math.ceil(totalRecords / 10);
            if (reset) {
                setSuggestionsAll(data);
                setSuggestionsPage(1);
            } else {
                setSuggestionsAll(prev => [...prev, ...data]);
                setSuggestionsPage(nextPage);
            }
            setSuggestionsTotalPages(totalPages);
        } catch (err: any) {
            if (err?.name !== "AbortError") console.error(err);
        } finally {
            if (!controller.signal.aborted) setSuggestionsLoadingMore(false);
        }
    }, [searchTerm, searchColumn, managerSearch, suggestionsPage, suggestionsTotalPages]);

    useEffect(() => {
        if (debouncedSearchTerm.length >= 2) fetchSuggestions(true);
    }, [debouncedSearchTerm, searchColumn]);

    const handleSuggestionSelect = (suggestion: string) => {
        setSearchTerm(suggestion);
        setSearchApplied(true);
        setShowSuggestions(false);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setSearchApplied(false);
        setAlmacenFilter("");
        const defaultFrom = new Date(new Date().setDate(new Date().getDate() - 30));
        setDateRange({ from: defaultFrom, to: new Date() });
        setCurrentPage(1);
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
        setDateRange({ from, to });
        setShowDatePicker(false);
    };

    const loadingState = useMemo(() => {
        const entries = REPORT_KEYS.map((k) => ({ key: k, status: deferredReports[k].status }));
        return {
            isAnyLoading: entries.some(e => e.status === "loading" || e.status === "idle" || e.status === "retrying"),
            resolvedCount: entries.filter(e => e.status === "success" || e.status === "error").length,
        };
    }, [deferredReports]);

    const loadProgress = Math.round((loadingState.resolvedCount / REPORT_KEYS.length) * 100);

    const totalPages = Math.ceil(totalRecords / pageSize);
    const searchColumns = [
        { key: "articulo", label: "Artículo", icon: Package, color: "text-blue-500", tableField: "Descripcion1", table: "ART" },
        { key: "codigo", label: "Código", icon: Package, color: "text-green-500", tableField: "Codigo", table: "ART" },
        { key: "proveedor", label: "Proveedor", icon: Truck, color: "text-purple-500", tableField: "Nombre", table: "PROV" },
    ];

    return (
        <>
            <Header />
            <section className="p-3 md:p-4 min-h-[70vh]">
                <div className="hidden md:flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">Análisis</h1>
                        <button onClick={() => setShowStats(!showStats)} className="flex items-center gap-1 text-sm">
                            {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} Stats
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => refreshAllData()} disabled={loadingState.isAnyLoading} color="second">
                            <RefreshCw className={`w-4 h-4 ${loadingState.isAnyLoading ? "animate-spin" : ""}`} /> Stats
                        </Button>
                        <Button onClick={() => { setRefreshingTable(true); fetchTableData().finally(() => setRefreshingTable(false)); }} disabled={tableLoading} color="second">
                            <RefreshCw className={`w-4 h-4 ${tableLoading ? "animate-spin" : ""}`} /> Tabla
                        </Button>
                        <Button onClick={refreshAllData} disabled={loadingState.isAnyLoading || tableLoading} color="second">
                            <RefreshCw className={`w-4 h-4 ${loadingState.isAnyLoading || tableLoading ? "animate-spin" : ""}`} /> Todo
                        </Button>
                    </div>
                </div>

                {/* Barra de progreso */}
                {loadingState.isAnyLoading && (
                    <div className="w-full h-1 bg-gray-200 rounded mb-4">
                        <div className="h-1 bg-blue-500 rounded transition-all duration-300" style={{ width: `${loadProgress}%` }} />
                    </div>
                )}

                {/* Selector de reporte */}
                <div className="mb-4 flex flex-wrap gap-2">
                    {REPORT_KEYS.map(report => {
                        const status = deferredReports[report].status;
                        return (
                            <button
                                key={report}
                                disabled={status === "loading" || status === "idle" || status === "retrying"}
                                onClick={() => { setSelectedReport(report); setCurrentPage(1); }}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-all cursor-pointer text-white
                                    ${status === "success" ? "border-green-300 bg-green-800" : status === "error" ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 animate-pulse"}
                                    ${selectedReport === report ? "bg-blue-600!" : "bg-gray-100 hover:opacity-80"}`}
                            >
                                {report.charAt(0).toUpperCase() + report.slice(1)}
                            </button>
                        );
                    })}
                </div>

                {/* Filtros rápidos */}
                <ul className="flex flex-wrap gap-3 items-center mb-6">
                    <li className="relative">
                        <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white">
                            <Calendar className="h-4 w-4" />
                            <span>{dateRange.from && dateRange.to ? `${formatDateDisplay(dateRange.from)} - ${formatDateDisplay(dateRange.to)}` : "Rango de fechas"}</span>
                        </button>
                        {showDatePicker && (
                            <div className="absolute z-50 mt-1 p-3 bg-white border border-gray-300 rounded shadow-lg">
                                <div><label>Desde:</label><input type="date" value={dateRange.from?.toISOString().split("T")[0]} onChange={e => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))} className="w-full border border-gray-300 rounded p-1" /></div>
                                <div><label>Hasta:</label><input type="date" value={dateRange.to?.toISOString().split("T")[0]} onChange={e => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))} className="w-full border border-gray-300 rounded p-1" /></div>
                                <div className="flex flex-wrap gap-1 mt-2">{DATE_PERIODS.map(p => <button key={p.label} onClick={() => applyDatePeriod(p)} className="text-xs px-2 py-1 bg-gray-100 rounded">{p.label}</button>)}</div>
                                <div className="flex justify-end mt-2"><button onClick={() => setShowDatePicker(false)} className="px-3 py-1 bg-blue-600 text-white rounded">Aplicar</button></div>
                            </div>
                        )}
                    </li>
                    <li className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select value={almacenFilter} onChange={e => setAlmacenFilter(e.target.value)} className="pl-9 pr-8 py-2 border border-gray-300 rounded">
                            <option value="">Todos los almacenes</option>
                            {ALMACENES_OPCIONES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </li>
                    <li className="relative flex gap-2">
                        <div className="relative" ref={searchColumnDropdownRef}>
                            <button onClick={() => setShowSearchColumnDropdown(!showSearchColumnDropdown)} className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-l bg-gray-50">
                                <searchColumn.icon className={`h-4 w-4 ${searchColumn.color}`} />
                                <ChevronDown className="h-3 w-3" />
                            </button>
                            {showSearchColumnDropdown && (
                                <div className="absolute z-20 mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg">
                                    {searchColumns.map(col => (
                                        <button key={col.key} onClick={() => { setSearchColumn(col); setShowSearchColumnDropdown(false); }} className={`flex items-center gap-2 w-full p-2 hover:bg-gray-100 ${col.key === searchColumn.key ? "bg-blue-50" : ""}`}>
                                            <col.icon className={`h-4 w-4 ${col.color}`} />
                                            <span>{col.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input ref={searchInputRef} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)} placeholder={`Buscar por ${searchColumn.label}...`} className="pl-9 pr-3 py-2 w-52 border border-gray-300 rounded-r" />
                        </div>
                        {showSuggestions && suggestionsAll.length > 0 && (
                            <div ref={suggestionsContainerRef} className="absolute z-50 w-full mt-10 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-auto">
                                {suggestionsAll.map((s, i) => (
                                    <button key={i} onClick={() => handleSuggestionSelect(s.Suggestion)} className="w-full p-2 text-left hover:bg-gray-100 flex items-center gap-2">
                                        <searchColumn.icon className={`h-4 w-4 ${searchColumn.color}`} />
                                        <span>{s.Suggestion}</span>
                                    </button>
                                ))}
                                {suggestionsLoadingMore && <div className="p-2 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /> Cargando...</div>}
                            </div>
                        )}
                        <button onClick={() => { setSearchApplied(true); fetchTableData(); }} className="px-3 py-2 bg-blue-600 text-white rounded">Buscar</button>
                    </li>
                    {(searchApplied || almacenFilter || dateRange.from) && (
                        <button onClick={handleClearFilters} className="flex items-center gap-2 px-3 py-2 bg-gray-200 rounded"><X className="h-4 w-4" />Limpiar</button>
                    )}
                    <button onClick={() => setQuickMode(!quickMode)} className={`px-3 py-2 rounded flex items-center gap-2 ${quickMode ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
                        <Zap className="h-4 w-4" />{quickMode ? "Modo rápido" : "Modo normal"}
                    </button>
                </ul>

                {/* Tabla */}
                <dt className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                    <DynamicTable data={dataTable} loading={tableLoading || refreshingTable} />
                    {!tableLoading && (
                        <div className="mt-4">
                            <Pagination currentPage={currentPage} totalPages={totalPages} loading={tableLoading} setCurrentPage={setCurrentPage} totalItems={totalRecords} itemsPerPage={pageSize} onPageSizeChange={setPageSize} pageSizeOptions={CONFIG.PAGE_SIZE_OPTIONS} currentPageSize={pageSize} />
                        </div>
                    )}
                </dt>
            </section>
            <Footer />
        </>
    );
}