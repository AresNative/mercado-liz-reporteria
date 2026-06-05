"use client";

import Footer from "@/template/footer";
import Header from "@/template/header";
import { StatsData } from "./types/consultas";
import { RequestPayload, useManagmentRead, useManagmentSearch } from "@/hooks/classes/api";
import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
    useDeferredValue,
} from "react";
import { CONFIG } from "./utils/config-constants";
import DynamicTable from "@/components/table";
import Pagination from "@/components/pagination";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { formatDateDisplay, formatValue } from "@/utils/constants/format-values";
import {
    RefreshCw,
    Building,
    Loader2,
    Search,
    X,
    Zap,
    Calendar,
    ChevronDown,
    Eye,
    EyeOff,
    Package,
    Truck,
} from "lucide-react";
import { SearchColumn } from "./types/config";
import { v4 as uuidv4 } from "uuid";
import { FilterGroup, FilterRule } from "@/utils/types/consultas";
import { AppliedFilters, DateRange } from "./types/filter";
import { DATE_PERIODS, OPERATORS } from "./utils/consultas-constants";
import { Button } from "@/components/button";
import { usePedidosSignalR } from "../pick-up/utils/singalr-pedidos";
import { safeCall, useDebounce } from "@/hooks/use-debounce";
import MainForm from "@/components/form/main-form";

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
                { Key: "ventad.Articulo", Alias: "Articulo" },
                { Key: "ART.Descripcion1", Alias: "Nombre" },
                { Key: "venta.FechaEmision" },
                { Key: "ventad.Almacen" },
                { Key: "ART.Categoria" },
                { Key: "ART.Grupo" },
                { Key: "ART.Familia" },
                { Key: "ventad.Precio", Alias: "Precio unitario" },
                { Key: "ventad.Costo", Alias: "Costo unitario" },
                { Key: "ventad.Unidad",Alias:"Unidad" },
                { Key: "ventad.Factor",Alias:"Factor" },
            ],
            agregaciones: [
                { Key: "ventad.Cantidad", Alias: "Cantidad", Operation: "SUM" },
                { Key: "(ventad.Cantidad * ventad.Factor)", Alias: "Cantidad Total", Operation: "SUM" },
                { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "Total Ventas", Operation: "SUM" },
                { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "Total Costo", Operation: "SUM" },
                { Key: "venta.Cliente", Alias: "Total Clientes", Operation: "COUNT DISTINCT" },
                { Key: "venta.ID", Alias: "Total Tikets", Operation: "COUNT DISTINCT" },
            ],
            Filtros: [
                { Key: "venta.Estatus", Operator: "IN", Value: "CONCLUIDO,PROCESAR" },
                { Key: "venta.Mov", Operator: "IN", Value: "Factura,Factura Credito,Nota" },
            ],
            Order: [
                { Key: "FechaEmision", Direction: "DESC" },
            ]
        },
    },
    compra: {
        table: `COMPRA AS compra INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo LEFT JOIN CB AS cb ON cb.Cuenta = art.Articulo AND cb.Codigo = comprad.Codigo LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor`,
        filtros: {
            selects: [
                { Key: "CB.Codigo" },
                { Key: "P.Nombre", Alias: "Proveedor" },
                { Key: "ART.Fabricante" },
                { Key: "comprad.Articulo", Alias: "Articulo" },
                { Key: "ART.Descripcion1", Alias: "Nombre" },
                { Key: "compra.FechaEmision" },
                { Key: "comprad.Almacen" },
                { Key: "ART.Categoria" },
                { Key: "ART.Grupo" },
                { Key: "ART.Familia" },
                { Key: "comprad.Unidad" },
                { Key: "comprad.Factor" },
                { Key: "comprad.DescuentoLinea", Alias: "Descuento" },
                { Key: "comprad.Costo", Alias: "Costo Unitario" },
            ],
            agregaciones: [
                { Key: "comprad.Costo", Alias: "Minimo Costo", Operation: "MIN" },
                { Key: "comprad.Costo", Alias: "Maximo Costo", Operation: "MAX" },
                { Key: "comprad.Cantidad", Alias: "Cantidad", Operation: "SUM" },
                { Key: "(comprad.Costo * comprad.Cantidad)", Alias: "Total Compras", Operation: "SUM" },
                { Key: "comprad.CantidadInventario", Alias: "Articulos Comprados", Operation: "SUM" },
                { Key: "compra.Proveedor", Alias: "Total Proveedores", Operation: "COUNT DISTINCT" },
            ],
            Filtros: [
                { Key: "compra.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
                { Key: "compra.Mov", Operator: "=", Value: "ENTRADA COMPRA" },
            ],
            Order: [
                { Key: "FechaEmision", Direction: "DESC" },
            ]
        },
    },
    merma: {
        table: `INV AS inv INNER JOIN INVD AS invd ON invd.ID = inv.ID INNER JOIN Art AS art ON art.Articulo = invd.Articulo`,
        filtros: {
            selects: [
                { Key: "art.Articulo" },
                { Key: "art.Descripcion1", Alias: "Nombre" },
                { Key: "inv.FechaEmision" },
                { Key: "inv.Sucursal" },
                { Key: "art.Categoria" },
                { Key: "art.Grupo" },
                { Key: "art.Linea" },
                { Key: "art.Familia" },
                { Key: "invd.Costo" },
                { Key: "invd.Unidad" },
            ],
            agregaciones: [
                { Key: "invd.Cantidad", Alias: "Cantidad", Operation: "SUM" },
                { Key: "(invd.Costo * invd.Cantidad)", Alias: "Total Mermas", Operation: "SUM" },
                { Key: "invd.Cantidad", Alias: "Total Articulos Mermados", Operation: "SUM" },
            ],
            Filtros: [
                { Key: "inv.Mov", Operator: "=", Value: 'SALIDA DIVERSA' },
                { Key: "inv.Concepto", Operator: "=", Value: 'SALIDA POR MERMAS' },
                { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
            ],
            Order: [
                { Key: "FechaEmision", Direction: "DESC" },
            ]
        },
    },
    inventario: {
        table: `INVD AS invd INNER JOIN inv AS inv ON inv.ID = invd.ID INNER JOIN Art AS art ON art.Articulo = invd.Articulo`,
        filtros: {
            selects: [
                { Key: "art.Articulo" },
                { Key: "art.Descripcion1", Alias: "Nombre" },
                { Key: "inv.FechaEmision" },
                { Key: "inv.Sucursal" },
                { Key: "art.Categoria" },
                { Key: "art.Grupo" },
                { Key: "art.Linea" },
                { Key: "art.Familia" },
                { Key: "inv.Concepto" },
                { Key: "invd.Costo" },
                { Key: "invd.Unidad" },
            ],
            agregaciones: [
                { Key: "invd.Cantidad", Alias: "Cantidad", Operation: "SUM" },
                { Key: "(invd.Costo * invd.Cantidad)", Alias: "Total Costo Inventario", Operation: "SUM" },
                { Key: "invd.Cantidad", Alias: "Total Articulos Inventario", Operation: "SUM" },
            ],
            Filtros: [
                { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
                { Key: "inv.Mov", Operator: "<>", Value: 'SALIDA DIVERSA' },
            ],
            Order: [
                { Key: "FechaEmision", Direction: "DESC" },
            ]
        },
    },
    clientes: { table: "Cte", filtros: {} },
    proveedores: {
        table: "Prov",
        filtros: {
            Filtros: [
                {
                    Key: "ProvCuenta",
                    Operator: "IS NULL"
                }
            ],
        }
    },
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
            Order: [
                { Key: "FechaEmision", Direction: "DESC" },
            ]
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

    const [tableVisibleColumns, setTableVisibleColumns] = useState<Record<string, boolean>>({});
    const handleVisibleColumnsChange = useCallback((cols: Record<string, boolean>) => {
        setTableVisibleColumns(cols);
        buildVisibleColumns();
    }, []);

    const buildVisibleColumns = useCallback(() => {
        const config = REPORT_CONFIGS[selectedReport];
        if (!config) return
        const allColumns = [
            ...(config.filtros?.selects || []).map((s: any) => s.Alias || s.Key),
            ...(config.filtros?.agregaciones || []).map((a: any) => a.Alias || a.Key),
        ];
        if (Object.keys(tableVisibleColumns).length === 0) {
            const initialVisibility: Record<string, boolean> = {};
            allColumns.forEach(col => initialVisibility[col] = true);
            setTableVisibleColumns(initialVisibility);
            return initialVisibility;
        }
        console.log("Columns loading ->  ", tableVisibleColumns);
        
        return tableVisibleColumns;
    }, [setTableVisibleColumns]);

    const fetchTableData = useCallback(async () => {
        setTableError(null);
        setTableLoading(true);
        const config = REPORT_CONFIGS[selectedReport];
        if (!config) {
            setTableLoading(false);
            return;
        }        

        let finalFiltros: any = config.filtros ? { ...config.filtros } : { selects: [] };
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
    
    const loadingState = useMemo(() => {
        const entries = REPORT_KEYS.map((k) => ({ key: k, status: deferredReports[k].status }));
        return {
            isAnyLoading: entries.some(e => e.status === "loading" || e.status === "idle" || e.status === "retrying"),
            resolvedCount: entries.filter(e => e.status === "success" || e.status === "error").length,
        };
    }, [deferredReports]);

    const loadProgress = Math.round((loadingState.resolvedCount / REPORT_KEYS.length) * 100);

    const totalPages = Math.ceil(totalRecords / pageSize);

    return (
        <>
            <Header />
            <section className="p-3 md:p-4 min-h-[70vh]">
                <div className="hidden md:flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">Análisis</h1>
                        <button onClick={() => setShowStats(!showStats)} className="flex items-center gap-1 text-sm">
                            {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} Estadisticas
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => refreshAllData()} disabled={loadingState.isAnyLoading} color="second">
                            <RefreshCw className={`w-4 h-4 ${loadingState.isAnyLoading ? "animate-spin" : ""}`} /> Estadisticas
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
                            <Button
                                key={report}
                                disabled={status === "loading" || status === "idle" || status === "retrying"}
                                color={status === "loading" && "second" || status === "idle" && "completed" || status === "retrying" && "warning" || selectedReport === report && "completed" || "success"}
                                size="small"
                                onClick={() => { setSelectedReport(report); setCurrentPage(1); }}
                            >
                                {report.charAt(0).toUpperCase() + report.slice(1)}
                            </Button>
                        );
                    })}
                </div>

                {/* Tabla */}
                <dt className="flex flex-col rounded-xl border gap-2 border-gray-200 bg-white shadow-sm p-4">
                    <dl>

                        {/* Filtros rápidos */}
                        <MainForm
                            actionType=""
                            dataForm={[
                                {
                                    require: false,
                                    type: "Flex",
                                    elements: [
                                        {
                                            require: false,
                                            type: "DATE_RANGE",
                                            name: "dateRange",
                                            label: "Rango de fechas",
                                            icon: <></>,
                                            options: ALMACENES_OPCIONES,
                                        },
                                        {
                                            require: false,
                                            type: "SELECT",
                                            name: "almacen",
                                            label: "Almacén",
                                            options: ALMACENES_OPCIONES,
                                        },
                                        {
                                            require: false,
                                            type: "SEARCH",
                                            name: "search",
                                            placeholder: "Artículo, código, proveedor, etc.",
                                            label: "Búsqueda rápida",
                                            options: ALMACENES_OPCIONES,
                                        },/* 
                                        {
                                            require: false,
                                            type: "SELECT",
                                            name: "categoria",
                                            label: "Categoría",
                                            options: CATEGORIAS_OPCIONES,
                                        }, */
                                    ]
                                },
                            ]}
                            message_button="Aplicar filtros"
                            onSuccess={() => { setCurrentPage(1); fetchTableData(); }}
                        />
                    </dl>
                    <dl className="flex flex-col gap-2">
                        <DynamicTable
                            data={dataTable}
                            loading={tableLoading || refreshingTable}
                            onVisibleColumnsChange={handleVisibleColumnsChange}
                        />
                    {!tableLoading && (
                            <Pagination currentPage={currentPage} totalPages={totalPages} loading={tableLoading} setCurrentPage={setCurrentPage} totalItems={totalRecords} itemsPerPage={pageSize} onPageSizeChange={setPageSize} pageSizeOptions={CONFIG.PAGE_SIZE_OPTIONS} currentPageSize={pageSize} />
                        )}
                    </dl>
                </dt>
            </section>
            <Footer />
        </>
    );
}