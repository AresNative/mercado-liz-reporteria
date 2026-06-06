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
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Users,
    DollarSign,
    BarChart2,
    AlertTriangle,
    Warehouse,
    Filter,
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
            return { ...state, [action.report]: { ...state[action.report], status: "loading", error: null } };
        case "RETRYING":
            return { ...state, [action.report]: { ...state[action.report], status: "retrying", error: null, attempt: action.attempt } };
        case "SUCCESS":
            return { ...state, [action.report]: { status: "success", data: action.data, error: null, lastUpdated: Date.now(), attempt: 0 } };
        case "ERROR":
            return { ...state, [action.report]: { ...state[action.report], status: "error", error: action.error } };
        case "RESET_ALL":
            return makeInitialState();
        default:
            return state;
    }
}

// ─── Configuración de reportes ─────────────────────────────────────────────────
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
                { Key: "ventad.Unidad", Alias: "Unidad" },
                { Key: "ventad.Factor", Alias: "Factor" },
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
            /* Order: [{ Key: "FechaEmision", Direction: "DESC" }], */
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
            /* Order: [{ Key: "FechaEmision", Direction: "DESC" }], */
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
                { Key: "inv.Mov", Operator: "=", Value: "SALIDA DIVERSA" },
                { Key: "inv.Concepto", Operator: "=", Value: "SALIDA POR MERMAS" },
                { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
            ],
            /* Order: [{ Key: "FechaEmision", Direction: "DESC" }], */
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
                { Key: "inv.Mov", Operator: "<>", Value: "SALIDA DIVERSA" },
            ],
            /* Order: [{ Key: "FechaEmision", Direction: "DESC" }], */
        },
    },
    clientes: { table: "Cte", filtros: {} },
    proveedores: {
        table: "Prov",
        filtros: {
            Filtros: [{ Key: "ProvCuenta", Operator: "IS NULL" }],
        },
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
            /* Order: [{ Key: "FechaEmision", Direction: "DESC" }], */
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

// ─── Función pura de procesamiento de stats ──────────────────────────────────
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
    } else {
        out.promedio = 0;
    }

    return out;
}

// ─── Helpers para derivar StatsData de los datos crudos de cada reporte ──────
function deriveStatsFromReports(reports: Record<REPORT, ReportState>): StatsData {
    const raw: any = {};

    // Venta
    const ventaData = reports.venta?.data;
    if (Array.isArray(ventaData) && ventaData.length > 0) {
        const row = ventaData[0];
        raw.totalVentas = Number(row["Total Ventas"] ?? row.totalVentas ?? 0);
        raw.totalCosto = Number(row["Total Costo"] ?? row.totalCosto ?? 0);
        raw.totalTikets = Number(row["Total Tikets"] ?? row.totalTikets ?? 0);
        raw.totalClientes = Number(row["Total Clientes"] ?? row.totalClientes ?? 0);
    } else if (ventaData && !Array.isArray(ventaData)) {
        raw.totalVentas = Number(ventaData["Total Ventas"] ?? ventaData.totalVentas ?? 0);
        raw.totalCosto = Number(ventaData["Total Costo"] ?? ventaData.totalCosto ?? 0);
        raw.totalTikets = Number(ventaData["Total Tikets"] ?? ventaData.totalTikets ?? 0);
        raw.totalClientes = Number(ventaData["Total Clientes"] ?? ventaData.totalClientes ?? 0);
    }

    // Compra
    const compraData = reports.compra?.data;
    if (Array.isArray(compraData) && compraData.length > 0) {
        const row = compraData[0];
        raw.totalCompras = Number(row["Total Compras"] ?? row.totalCompras ?? 0);
        raw.totalProveedores = Number(row["Total Proveedores"] ?? row.totalProveedores ?? 0);
        raw.minimoCosto = Number(row["Minimo Costo"] ?? row.minimoCosto ?? 0);
        raw.maximoCosto = Number(row["Maximo Costo"] ?? row.maximoCosto ?? 0);
    } else if (compraData && !Array.isArray(compraData)) {
        raw.totalCompras = Number(compraData["Total Compras"] ?? compraData.totalCompras ?? 0);
        raw.totalProveedores = Number(compraData["Total Proveedores"] ?? compraData.totalProveedores ?? 0);
    }

    // Merma
    const mermaData = reports.merma?.data;
    if (Array.isArray(mermaData) && mermaData.length > 0) {
        const row = mermaData[0];
        raw.totalMermas = Number(row["Total Mermas"] ?? row.totalMermas ?? 0);
        raw.totalArticulosMerma = Number(row["Total Articulos Mermados"] ?? row.totalArticulosMerma ?? 0);
    } else if (mermaData && !Array.isArray(mermaData)) {
        raw.totalMermas = Number(mermaData["Total Mermas"] ?? mermaData.totalMermas ?? 0);
    }

    return processStatsData(raw);
}

// ─── Hook para fetching individual con reintentos ────────────────────────────
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

            if (attempt === 1) dispatch({ type: "LOADING", report });
            else dispatch({ type: "RETRYING", report, attempt });

            const { promise } = manager.execute({ ...payload, signal: controller.signal } as RequestPayload);

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

// ─── Inyección de filtro de fecha ─────────────────────────────────────────────
const getDateNDaysAgo = (n: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - n);
    return date.toISOString().split("T")[0];
};

const injectDateFilter = (
    report: REPORT,
    filtrosOriginal: any,
    from?: Date,
    to?: Date
): any => {
    if (report === "clientes" || report === "proveedores") return filtrosOriginal;

    const dateFieldMap: Partial<Record<REPORT, string>> = {
        venta: "venta.FechaEmision",
        compra: "compra.FechaEmision",
        merma: "inv.FechaEmision",
        inventario: "inv.FechaEmision",
        gastos: "G.FechaEmision",
    };

    const dateFieldKey = dateFieldMap[report];
    if (!dateFieldKey) return filtrosOriginal;

    const newFiltros = JSON.parse(JSON.stringify(filtrosOriginal));
    if (!newFiltros.Filtros) newFiltros.Filtros = [];

    const fromStr = from ? from.toISOString().split("T")[0] : getDateNDaysAgo(30);
    const toStr = to ? to.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

    newFiltros.Filtros.push({ Key: dateFieldKey, Operator: ">=", Value: fromStr });
    newFiltros.Filtros.push({ Key: dateFieldKey, Operator: "<=", Value: toStr });

    return newFiltros;
};

// ─── Componente de tarjeta de estadística ────────────────────────────────────
interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    colorClass?: string;
    loading?: boolean;
    subtitle?: string;
}

function StatCard({ label, value, icon, colorClass = "text-blue-600", loading, subtitle }: StatCardProps) {
    return (
        <div className="flex flex-col justify-between bg-white rounded-xl border border-gray-200 shadow-sm p-4 min-w-0">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{label}</span>
                <span className={`${colorClass} flex-shrink-0 ml-2`}>{icon}</span>
            </div>
            {loading ? (
                <div className="flex items-center gap-2 mt-1">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-400">Cargando...</span>
                </div>
            ) : (
                <>
                    <span className="text-xl font-bold text-gray-900 truncate">{value}</span>
                    {subtitle && <span className="text-xs text-gray-400 mt-0.5">{subtitle}</span>}
                </>
            )}
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Analisis() {
    const [manager] = useManagmentRead();
    const [managerSearch] = useManagmentSearch();

    // Estado de reportes (agregaciones/stats)
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

    // Filtros
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
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionsAll, setSuggestionsAll] = useState<any[]>([]);
    const [suggestionsPage, setSuggestionsPage] = useState(1);
    const [suggestionsTotalPages, setSuggestionsTotalPages] = useState(1);
    const [suggestionsLoadingMore, setSuggestionsLoadingMore] = useState(false);
    const suggestionsAbortRef = useRef<AbortController | null>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // ─── Columnas visibles: mapa report → visibilidad ────────────────────────
    // FIX: Se mantiene un mapa por reporte para evitar mezcla de columnas entre reportes
    const [visibleColumnsByReport, setVisibleColumnsByReport] = useState<Record<string, Record<string, boolean>>>({});

    // Devuelve la visibilidad actual para el reporte seleccionado (inicializa todas en true si no existe)
    const getCurrentVisibility = useCallback(
        (report: REPORT = selectedReport): Record<string, boolean> => {
            if (visibleColumnsByReport[report]) return visibleColumnsByReport[report];
            const config = REPORT_CONFIGS[report];
            const initial: Record<string, boolean> = {};
            [
                ...(config.filtros?.selects || []).map((s: any) => s.Alias || s.Key.split(".").pop() || s.Key),
                ...(config.filtros?.agregaciones || []).map((a: any) => a.Alias || a.Key.split(".").pop() || a.Key),
            ].forEach((col) => (initial[col] = true));
            return initial;
        },
        [visibleColumnsByReport, selectedReport]
    );

    // ─── Callback desde DynamicTable cuando el usuario cambia visibilidad ────
    // FIX: Ya no llama a fetchTableData directamente; el useEffect lo dispara al detectar el cambio
    const handleVisibleColumnsChange = useCallback(
        (cols: Record<string, boolean>) => {
            setVisibleColumnsByReport((prev) => ({ ...prev, [selectedReport]: cols }));
            // Resetear a página 1 al cambiar columnas para evitar paginación huérfana
            setCurrentPage(1);
        },
        [selectedReport]
    );

    // ─── Lógica de fetching (stats y tabla) ──────────────────────────────────
    const { fetchReport, cancelAll } = useSingleReportFetch(manager, dispatchReports);

    // ─── Fetch de tabla: construye payload respetando columnas visibles ───────
    const tableAbortRef = useRef<AbortController | null>(null);

    const fetchTableData = useCallback(async () => {
        // Cancelar petición anterior si existe
        tableAbortRef.current?.abort();
        tableAbortRef.current = new AbortController();

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

        // Clonar filtros base
        let finalFiltros: any = config.filtros ? JSON.parse(JSON.stringify(config.filtros)) : {};

        // Filtrar selects y agregaciones según visibilidad
        if (finalFiltros.selects) {
            finalFiltros.selects = finalFiltros.selects.filter((sel: any) => {
                const alias = sel.Alias || sel.Key.split(".").pop() || sel.Key;
                return visibleKeys.length === 0 || visibleKeys.includes(alias);
            });
        }
        if (finalFiltros.agregaciones) {
            finalFiltros.agregaciones = finalFiltros.agregaciones.filter((agg: any) => {
                const alias = agg.Alias || agg.Key.split(".").pop() || agg.Key;
                return visibleKeys.length === 0 || visibleKeys.includes(alias);
            });
        }

        // Inyectar filtro de rango de fechas
        finalFiltros = injectDateFilter(selectedReport, finalFiltros, dateRange.from || undefined, dateRange.to || undefined);

        // Filtro de almacén
        if (almacenFilter && config.table.toLowerCase().includes("almacen")) {
            if (!finalFiltros.Filtros) finalFiltros.Filtros = [];
            const almacenKey =
                selectedReport === "venta" ? "ventad.Almacen"
                    : selectedReport === "compra" ? "comprad.Almacen"
                        : "invd.Almacen";
            finalFiltros.Filtros.push({ Key: almacenKey, Operator: "=", Value: almacenFilter });
        }

        // Filtro de búsqueda por texto
        if (searchApplied && searchTerm && searchColumn.tableField) {
            if (!finalFiltros.Filtros) finalFiltros.Filtros = [];
            finalFiltros.Filtros.push({ Key: searchColumn.tableField, Operator: "LIKE", Value: `%${searchTerm}%` });
        }

        const payload: RequestPayload = {
            table: config.table,
            filtros: finalFiltros,
            page: currentPage,
            pageSize,
            signal: tableAbortRef.current.signal,
        };

        try {
            const { promise } = manager.execute(payload);
            const response = await safeCall(() => promise, `fetchTable/${selectedReport}`);
            if (tableAbortRef.current.signal.aborted) return;
            setDataTable(response.data?.data || []);
            setTotalRecords(response.data?.totalRecords || response.data?.totalEstimated || 0);
        } catch (err: any) {
            if (err?.name === "AbortError") return;
            setTableError(err.message ?? "Error al cargar datos");
        } finally {
            if (!tableAbortRef.current.signal.aborted) setTableLoading(false);
        }
    }, [
        selectedReport,
        almacenFilter,
        searchApplied,
        searchTerm,
        searchColumn,
        currentPage,
        pageSize,
        manager,
        dateRange,
        getCurrentVisibility,
    ]);

    // ─── Refrescar todo (stats + tabla) ──────────────────────────────────────
    const refreshStats = useCallback(() => {
        cancelAll();
        REPORT_KEYS.forEach((report) => {
            const baseConfig = REPORT_CONFIGS[report];
            const filtrosConFecha = injectDateFilter(report, baseConfig.filtros, dateRange.from || undefined, dateRange.to || undefined);
            fetchReport(report, { table: baseConfig.table, filtros: filtrosConFecha, page: 1, pageSize: 1 });
        });
    }, [cancelAll, fetchReport, dateRange]);

    const refreshAllData = useCallback(() => {
        refreshStats();
        fetchTableData();
    }, [refreshStats, fetchTableData]);

    // ─── SignalR ──────────────────────────────────────────────────────────────
    const onPedidoActualizado = useCallback(() => refreshAllData(), [refreshAllData]);
    const onNuevoPedido = useCallback(() => refreshAllData(), [refreshAllData]);
    const onPedidoEliminado = useCallback(() => refreshAllData(), [refreshAllData]);
    const onRefrescarDatos = useCallback(() => refreshAllData(), [refreshAllData]);

    const { isConnected } = usePedidosSignalR(
        onPedidoActualizado,
        onNuevoPedido,
        onPedidoEliminado,
        onRefrescarDatos
    );

    // ─── Carga inicial ────────────────────────────────────────────────────────
    useEffect(() => {
        refreshStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Recarga de tabla al cambiar reporte, página, pageSize o visibilidad ─
    // FIX: Este useEffect centraliza todos los disparadores de fetchTableData
    useEffect(() => {
        fetchTableData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedReport, currentPage, pageSize, visibleColumnsByReport, almacenFilter, searchApplied, dateRange]);

    // ─── Al cambiar de reporte, volver a página 1 ─────────────────────────────
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedReport]);

    // ─── Sugerencias de búsqueda ──────────────────────────────────────────────
    const fetchSuggestions = useCallback(
        async (reset = false) => {
            if (!searchTerm || searchTerm.length < 2 || !searchColumn.tableField || !searchColumn.table) {
                setSuggestionsAll([]);
                setShowSuggestions(false);
                return;
            }
            suggestionsAbortRef.current?.abort();
            const nextPage = reset ? 1 : suggestionsPage + 1;
            if (!reset && nextPage > suggestionsTotalPages) return;
            if (!reset) setSuggestionsLoadingMore(true);
            setShowSuggestions(true);
            const controller = new AbortController();
            suggestionsAbortRef.current = controller;
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
                    setSuggestionsAll((prev) => [...prev, ...data]);
                    setSuggestionsPage(nextPage);
                }
                setSuggestionsTotalPages(totalPages);
            } catch (err: any) {
                if (err?.name !== "AbortError") console.error(err);
            } finally {
                if (!controller.signal.aborted) setSuggestionsLoadingMore(false);
            }
        },
        [searchTerm, searchColumn, managerSearch, suggestionsPage, suggestionsTotalPages]
    );

    useEffect(() => {
        if (debouncedSearchTerm.length >= 2) fetchSuggestions(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchTerm, searchColumn]);

    const handleSuggestionSelect = (suggestion: string) => {
        setSearchTerm(suggestion);
        setSearchApplied(true);
        setShowSuggestions(false);
        setCurrentPage(1);
    };
    //DIENERO @TABLA
    // MOV ESPEJO - PAGO
    // POLIZA DE EGRESO - GASTO
    // ─── Stats derivadas de los reportes cargados ────────────────────────────
    const statsData = useMemo(() => deriveStatsFromReports(deferredReports), [deferredReports]);

    const loadingState = useMemo(() => {
        const entries = REPORT_KEYS.map((k) => ({ key: k, status: deferredReports[k].status }));
        return {
            isAnyLoading: entries.some((e) => ["loading", "idle", "retrying"].includes(e.status)),
            resolvedCount: entries.filter((e) => e.status === "success" || e.status === "error").length,
        };
    }, [deferredReports]);

    const loadProgress = Math.round((loadingState.resolvedCount / REPORT_KEYS.length) * 100);
    const totalPages = Math.ceil(totalRecords / pageSize);

    // ─── Tarjetas de stats para renderizar ───────────────────────────────────
    const statsCards = useMemo<StatCardProps[]>(() => {
        const isLoading = loadingState.isAnyLoading;
        return [
            {
                label: "Total Ventas",
                value: statsData.totalVentas != null ? formatValue(statsData.totalVentas, "currency") : "—",
                icon: <TrendingUp className="h-5 w-5" />,
                colorClass: "text-emerald-500",
                loading: isLoading && deferredReports.venta.status !== "success",
                subtitle: statsData.totalTikets ? `${statsData.totalTikets} tickets` : undefined,
            },
            {
                label: "Total Compras",
                value: statsData.totalCompras != null ? formatValue(statsData.totalCompras, "currency") : "—",
                icon: <ShoppingCart className="h-5 w-5" />,
                colorClass: "text-blue-500",
                loading: isLoading && deferredReports.compra.status !== "success",
                subtitle: statsData.totalProveedores ? `${statsData.totalProveedores} proveedores` : undefined,
            },
            {
                label: "Utilidad",
                value: statsData.utilidad != null ? formatValue(statsData.utilidad, "currency") : "—",
                icon: <DollarSign className="h-5 w-5" />,
                colorClass: (statsData.utilidad ?? 0) >= 0 ? "text-emerald-500" : "text-red-500",
                loading: isLoading && (deferredReports.venta.status !== "success" || deferredReports.compra.status !== "success"),
                subtitle: statsData.margen != null ? `Margen: ${statsData.margen}%` : undefined,
            },
            {
                label: "Margen",
                value: statsData.margen != null ? `${statsData.margen}%` : "—",
                icon: <BarChart2 className="h-5 w-5" />,
                colorClass: (statsData.margen ?? 0) >= 30 ? "text-emerald-500" : "text-amber-500",
                loading: isLoading,
                subtitle: "Margen sobre ventas",
            },
            {
                label: "Total Mermas",
                value: statsData.totalMermas != null ? formatValue(statsData.totalMermas, "currency") : "—",
                icon: <AlertTriangle className="h-5 w-5" />,
                colorClass: "text-rose-500",
                loading: isLoading && deferredReports.merma.status !== "success",
                subtitle: statsData.totalArticulosMerma ? `${statsData.totalArticulosMerma} artículos` : undefined,
            },
            {
                label: "Clientes",
                value: statsData.totalClientes != null ? String(statsData.totalClientes) : "—",
                icon: <Users className="h-5 w-5" />,
                colorClass: "text-violet-500",
                loading: isLoading && deferredReports.venta.status !== "success",
            },
            {
                label: "Ticket Promedio",
                value: statsData.promedio != null ? formatValue(statsData.promedio, "currency") : "—",
                icon: <Zap className="h-5 w-5" />,
                colorClass: "text-amber-500",
                loading: isLoading,
            },
            {
                label: "Proveedores",
                value: statsData.totalProveedores != null ? String(statsData.totalProveedores) : "—",
                icon: <Truck className="h-5 w-5" />,
                colorClass: "text-cyan-500",
                loading: isLoading && deferredReports.compra.status !== "success",
            },
        ];
    }, [statsData, loadingState.isAnyLoading, deferredReports]);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <Header />
            <section className="p-3 md:p-4 min-h-[70vh]">

                {/* Header de página */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">Análisis</h1>
                        {/* Indicador de conexión SignalR */}
                        <span
                            className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${isConnected
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-gray-100 border-gray-200 text-gray-500"
                                }`}
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-gray-400"}`} />
                            {isConnected ? "En vivo" : "Desconectado"}
                        </span>
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="hidden sm:inline">Estadísticas</span>
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={refreshStats} disabled={loadingState.isAnyLoading} color="second" size="small">
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingState.isAnyLoading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Stats</span>
                        </Button>
                        <Button
                            onClick={() => fetchTableData()}
                            disabled={tableLoading}
                            color="second"
                            size="small"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${tableLoading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Tabla</span>
                        </Button>
                        <Button
                            onClick={refreshAllData}
                            disabled={loadingState.isAnyLoading || tableLoading}
                            color="second"
                            size="small"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingState.isAnyLoading || tableLoading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Todo</span>
                        </Button>
                    </div>
                </div>

                {/* Barra de progreso de carga de stats */}
                {loadingState.isAnyLoading && (
                    <div className="w-full h-1 bg-gray-100 rounded mb-4 overflow-hidden">
                        <div
                            className="h-1 bg-blue-500 rounded transition-all duration-500 ease-out"
                            style={{ width: `${loadProgress}%` }}
                        />
                    </div>
                )}

                {/* ─── Stats Cards ───────────────────────────────────────── */}
                {showStats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 mb-5">
                        {statsCards.map((card) => (
                            <StatCard key={card.label} {...card} />
                        ))}
                    </div>
                )}

                {/* ─── Selector de reporte ───────────────────────────────── */}
                <div className="mb-4 flex flex-wrap gap-2">
                    {REPORT_KEYS.map((report) => {
                        const status = deferredReports[report].status;
                        const isDisabled = ["loading", "idle", "retrying"].includes(status);
                        return (
                            <Button
                                key={report}
                                disabled={isDisabled}
                                color={
                                    isDisabled
                                        ? "second"
                                        : selectedReport === report
                                            ? "completed"
                                            : "success"
                                }
                                size="small"
                                onClick={() => setSelectedReport(report)}
                            >
                                {isDisabled && <Loader2 className="h-3 w-3 animate-spin" />}
                                {report.charAt(0).toUpperCase() + report.slice(1)}
                            </Button>
                        );
                    })}
                </div>

                {/* ─── Tabla + filtros ───────────────────────────────────── */}
                <div className="relative flex flex-col rounded-xl border gap-3 border-gray-200 bg-white shadow-sm p-4">

                    {/* Filtros */}
                    <MainForm
                        actionType=""
                        flexDirection="flex-row"
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
                                        icon: <Calendar className="size-4" />,
                                        valueDefined: dateRange,
                                    },
                                    {
                                        require: false,
                                        type: "SELECT",
                                        name: "almacen",
                                        label: "Almacén",
                                        placeholder: "Selecciona un almacén",
                                        icon: <Package className="size-4" />,
                                        options: ALMACENES_OPCIONES,
                                    },
                                    {
                                        require: false,
                                        type: "SEARCH",
                                        name: "search",
                                        placeholder: "Artículo, código, proveedor, etc.",
                                        label: "Búsqueda rápida",
                                        icon: <Search className="size-4" />,
                                        options: [],
                                        valueDefined: searchTerm,
                                    },
                                ],
                            },
                        ]}
                        message_button={"Filtrar"}
                        iconButton={<Filter className="mr-1 h-4 w-4" />}
                        onSuccess={(rows: any) => {
                            console.log(rows);
                            
                            setSearchApplied(true); setCurrentPage(1); fetchTableData();
                        }}
                    />

                    {/* Error de tabla */}
                    {tableError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                            <span>{tableError}</span>
                            <button
                                className="ml-auto underline hover:no-underline"
                                onClick={() => fetchTableData()}
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {/* Tabla */}
                    <DynamicTable
                        data={dataTable}
                        loading={tableLoading}
                        visibleColumns={getCurrentVisibility(selectedReport)}
                        onVisibleColumnsChange={handleVisibleColumnsChange}
                    />

                    {/* Paginación */}
                    {!tableLoading && totalRecords > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            loading={tableLoading}
                            setCurrentPage={setCurrentPage}
                            totalItems={totalRecords}
                            itemsPerPage={pageSize}
                            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                            pageSizeOptions={CONFIG.PAGE_SIZE_OPTIONS}
                            currentPageSize={pageSize}
                        />
                    )}
                </div>
            </section>
            <Footer />
        </>
    );
}