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
import { formatValue } from "@/utils/constants/format-values";
import {
    RefreshCw,
    Loader2,
    Search,
    Zap,
    Calendar,
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
    GitCompare,
} from "lucide-react";
import { SearchColumn } from "./types/config";
import { DateRange } from "./types/filter";
import { Button } from "@/components/button";
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
   /*  | "gastos" */;

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
        table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo INNER JOIN Sucursal ON ventad.Sucursal = Sucursal.Sucursal INNER JOIN CB ON ventad.Articulo = CB.Cuenta`,
        filtros: {
            selects: [
                { Key: "CB.Codigo" },
                { Key: "ventad.Articulo" },
                { Key: "ART.Descripcion1", Alias: "Nombre" },
                { Key: "venta.FechaEmision" },
                { Key: "ventad.Almacen" },
                { Key: "ventad.Sucursal" },
                { Key: "Sucursal.Nombre", Alias: "Nombre Sucursal" },
                { Key: "ART.Categoria" },
                { Key: "ART.Grupo" },
                { Key: "ART.Familia" },
                { Key: "ventad.Precio" },
                { Key: "ventad.Costo" },
                { Key: "ventad.Unidad", Alias: "Unidad" },
                { Key: "ventad.Factor", Alias: "Factor" },
            ],
            agregaciones: [
                { Key: "ventad.Cantidad", Alias: "Cantidad", Operation: "SUM" },
                { Key: "(ventad.Cantidad * ventad.Factor)", Alias: "Articulos Totales", Operation: "SUM" },
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
                {
                    Key: "FechaEmision",
                    Direction: "DESC"
                }
            ],
        },
    },
    compra: {
        table: `COMPRA AS compra INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo LEFT JOIN CB AS cb ON cb.Cuenta = art.Articulo LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor INNER JOIN Sucursal ON comprad.Sucursal = Sucursal.Sucursal`,
        filtros: {
            selects: [
                { Key: "CB.Codigo" },
                { Key: "P.Nombre", Alias: "Proveedor Nombre" },
                { Key: "P.Proveedor" },
                { Key: "ART.Fabricante" },
                { Key: "comprad.Articulo", Alias: "Articulo" },
                { Key: "ART.Descripcion1", Alias: "Nombre" },
                { Key: "compra.FechaEmision" },
                { Key: "comprad.Almacen" },
                { Key: "comprad.Sucursal" },
                { Key: "Sucursal.Nombre", Alias: "Nombre Sucursal" },
                { Key: "ART.Categoria" },
                { Key: "ART.Grupo" },
                { Key: "ART.Familia" },
                { Key: "comprad.Unidad" },
                { Key: "comprad.Factor" },
                { Key: "comprad.DescuentoLinea", Alias: "Descuento" },
                { Key: "comprad.Costo" },
            ],
            agregaciones: [
                { Key: "comprad.Costo", Alias: "Minimo Costo", Operation: "MIN" },
                { Key: "comprad.Costo", Alias: "Maximo Costo", Operation: "MAX" },
                { Key: "comprad.Cantidad", Alias: "Cantidad", Operation: "SUM" },
                { Key: "(comprad.Costo * comprad.Cantidad)", Alias: "Total Costo", Operation: "SUM" },
                { Key: "comprad.CantidadInventario", Alias: "Articulos Totales", Operation: "SUM" },
                { Key: "compra.Proveedor", Alias: "Total Proveedores", Operation: "COUNT DISTINCT" },
            ],
            Filtros: [
                { Key: "compra.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
                { Key: "compra.Mov", Operator: "=", Value: "ENTRADA COMPRA" },
            ],
            Order: [
                {
                    Key: "FechaEmision",
                    Direction: "DESC"
                }
            ],
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
            Order: [
                {
                    Key: "FechaEmision",
                    Direction: "DESC"
                }
            ],
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
            Order: [
                {
                    Key: "FechaEmision",
                    Direction: "DESC"
                }
            ],
        },
    },
    clientes: { table: "Cte", filtros: {} },
    proveedores: {
        table: "Prov",
        filtros: {
            Filtros: [{ Key: "ProvCuenta", Operator: "IS NULL" }], 
            Order: [
                {
                    Key: "FechaEmision",
                    Direction: "DESC"
                }
            ],
        },
    },
    /* gastos: {
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
    }, */
};

// ─── Constantes estables ─────────────────────────────────────────────────────
const REPORT_KEYS = Object.keys(REPORT_CONFIGS) as REPORT[];

const SYNTHETIC_COLUMNS: {
    syntheticKey: string;
    sourceFields: string[];
}[] = [
        { syntheticKey: "Articulo", sourceFields: ["Nombre", "Articulo", "Codigo"] },
        { syntheticKey: "Proveedor", sourceFields: ["Proveedor", "Fabricante"] },
        { syntheticKey: "Categoria", sourceFields: ["Categoria", "Grupo", "Familia"] },
        { syntheticKey: "Unidad", sourceFields: ["Unidad", "Factor"] },
        { syntheticKey: "Cantidad", sourceFields: ["Cantidad", "Articulos Totales"] },
    ];

const ALMACENES_OPCIONES = [
    { value: "ALMVGPE", label: "Guadalupe" },
    { value: "ALMMAYO", label: "Mayoreo" },
    { value: "ALMTESTE", label: "Testerazo" },
    { value: "ALMPALM", label: "Palmas" },
];

// ─── Métricas para mostrar en el desglose ────────────────────────────────────
interface MetricDefinition {
    key: string;
    label: string;
    icon: React.ElementType;
    color: string;
    format: "currency" | "number" | "percentage";
    description?: string;
    getValue: (stats: StatsData) => number | null;
}

const METRICS_CONFIG: Record<REPORT, MetricDefinition[]> = {
    venta: [
        {
            key: "ventas",
            label: "Total Ventas",
            icon: TrendingUp,
            color: "text-emerald-500",
            format: "currency",
            getValue: (s) => s.totalVentas ?? null,
        },
        {
            key: "tikets",
            label: "Tickets",
            icon: ShoppingCart,
            color: "text-blue-500",
            format: "number",
            getValue: (s) => s.totalTikets ?? null,
        },
        {
            key: "promedio",
            label: "Ticket Promedio",
            icon: Zap,
            color: "text-amber-500",
            format: "currency",
            getValue: (s) => s.promedio ?? null,
        },
        {
            key: "clientes",
            label: "Clientes",
            icon: Users,
            color: "text-violet-500",
            format: "number",
            getValue: (s) => s.totalClientes ?? null,
        },
        {
            key: "utilidad",
            label: "Utilidad",
            icon: DollarSign,
            color: "text-emerald-500",
            format: "currency",
            getValue: (s) => s.utilidad ?? null,
        },
        {
            key: "margen",
            label: "Margen",
            icon: BarChart2,
            color: "text-amber-500",
            format: "percentage",
            getValue: (s) => s.margen ?? null,
        },
        {
            key: "articulos",
            label: "Artículos Vendidos",
            icon: Package,
            color: "text-indigo-500",
            format: "number",
            getValue: (s) => s.totalArticulos ?? null,
        },
    ],
    compra: [
        {
            key: "compras",
            label: "Total Compras",
            icon: ShoppingCart,
            color: "text-blue-500",
            format: "currency",
            getValue: (s) => s.totalCompras ?? null,
        },
        {
            key: "proveedores",
            label: "Proveedores",
            icon: Truck,
            color: "text-cyan-500",
            format: "number",
            getValue: (s) => s.totalProveedores ?? null,
        },
        {
            key: "articulos",
            label: "Artículos Comprados",
            icon: Package,
            color: "text-indigo-500",
            format: "number",
            getValue: (s) => s.totalArticulos ?? null,
        },
        {
            key: "minimo",
            label: "Costo Mínimo",
            icon: TrendingDown,
            color: "text-green-500",
            format: "currency",
            getValue: (s) => s.minimoCosto ?? null,
        },
        {
            key: "maximo",
            label: "Costo Máximo",
            icon: TrendingUp,
            color: "text-red-500",
            format: "currency",
            getValue: (s) => s.maximoCosto ?? null,
        },
    ],
    merma: [
        {
            key: "mermas",
            label: "Total Mermas",
            icon: AlertTriangle,
            color: "text-rose-500",
            format: "currency",
            getValue: (s) => s.totalMermas ?? null,
        },
        {
            key: "articulos",
            label: "Artículos Mermados",
            icon: Package,
            color: "text-orange-500",
            format: "number",
            getValue: (s) => s.totalArticulosMerma ?? null,
        },
    ],
    inventario: [
        {
            key: "inventario",
            label: "Costo Inventario",
            icon: Warehouse,
            color: "text-purple-500",
            format: "currency",
            getValue: (s) => s.totalCosto ?? null,
        },
        {
            key: "articulos",
            label: "Artículos en Inventario",
            icon: Package,
            color: "text-indigo-500",
            format: "number",
            getValue: (s) => s.totalArticulos ?? null,
        },
    ],
    clientes: [
        {
            key: "clientes",
            label: "Total Clientes",
            icon: Users,
            color: "text-violet-500",
            format: "number",
            getValue: (s) => s.totalClientes ?? null,
        },
    ],
    proveedores: [
        {
            key: "proveedores",
            label: "Total Proveedores",
            icon: Truck,
            color: "text-cyan-500",
            format: "number",
            getValue: (s) => s.totalProveedores ?? null,
        },
    ],
    /*  gastos: [
        {
             key: "gastos",
             label: "Total Gastos",
             icon: DollarSign,
             color: "text-red-500",
             format: "currency",
             getValue: (s) => s.totalGastos ?? null,
         },
    ], */
};

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
        /* if (s.totalGastos != null) out.totalGastos = (out.totalGastos ?? 0) + Number(s.totalGastos); */
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
        /* gastos: "G.FechaEmision", */
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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Analisis() {
    const [manager] = useManagmentRead();
    const [managerSearch] = useManagmentSearch();

    const [reports] = useReducer(reportsReducer, undefined, makeInitialState);
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
    const [visibleColumnsByReport, setVisibleColumnsByReport] = useState<Record<string, Record<string, boolean>>>({});

    const getCurrentVisibility = useCallback(
        (report: REPORT = selectedReport): Record<string, boolean> => {
            if (visibleColumnsByReport[report]) return visibleColumnsByReport[report];
            const config = REPORT_CONFIGS[report];

            const rawSelectKeys = new Set(
                (config.filtros?.selects || []).map((s: any) => s.Alias || s.Key.split(".").pop() || s.Key)
            );

            const absorbedBySynthetic = new Set<string>();
            const initial: Record<string, boolean> = {};

            SYNTHETIC_COLUMNS.forEach(({ syntheticKey, sourceFields }) => {
                const hasAny = sourceFields.some((f) => rawSelectKeys.has(f));
                if (hasAny) {
                    initial[syntheticKey] = true;
                    sourceFields.forEach((f) => absorbedBySynthetic.add(f));
                }
            });

            rawSelectKeys.forEach((col) => {
                if (!absorbedBySynthetic.has(col)) initial[col] = true;
            });

            (config.filtros?.agregaciones || []).forEach((a: any) => {
                const alias = a.Alias || a.Key.split(".").pop() || a.Key;
                initial[alias] = true;
            });

            return initial;
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

    // ─── Fetch de tabla ──────────────────────────────────────────────────────
    const tableAbortRef = useRef<AbortController | null>(null);

    const fetchTableData = useCallback(async () => {
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

        let finalFiltros: any = config.filtros ? JSON.parse(JSON.stringify(config.filtros)) : {};

        if (finalFiltros.selects) {
            const requiredSourceFields = new Set<string>();
            SYNTHETIC_COLUMNS.forEach(({ syntheticKey, sourceFields }) => {
                if (visibleKeys.length === 0 || visibleKeys.includes(syntheticKey)) {
                    sourceFields.forEach((f) => requiredSourceFields.add(f));
                }
            });

            finalFiltros.selects = finalFiltros.selects.filter((sel: any) => {
                const alias = sel.Alias || sel.Key.split(".").pop() || sel.Key;
                return (
                    visibleKeys.length === 0 ||
                    requiredSourceFields.has(alias) ||
                    visibleKeys.includes(alias)
                );
            });
        }
        if (finalFiltros.agregaciones) {
            finalFiltros.agregaciones = finalFiltros.agregaciones.filter((agg: any) => {
                const alias = agg.Alias || agg.Key.split(".").pop() || agg.Key;
                return visibleKeys.length === 0 || visibleKeys.includes(alias);
            });
        }

        finalFiltros = injectDateFilter(selectedReport, finalFiltros, dateRange.from || undefined, dateRange.to || undefined);

        if (almacenFilter && config.table.toLowerCase().includes("almacen")) {
            if (!finalFiltros.Filtros) finalFiltros.Filtros = [];
            const almacenKey =
                selectedReport === "venta" ? "ventad.Almacen"
                    : selectedReport === "compra" ? "comprad.Almacen"
                        : "invd.Almacen";
            finalFiltros.Filtros.push({ Key: almacenKey, Operator: "=", Value: almacenFilter });
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
            signal: tableAbortRef.current.signal,
        };

        try {
            const { promise } = await manager.execute(payload);
            const response: any = await safeCall(() => promise, `fetchTable/${selectedReport}`);
            if (tableAbortRef.current.signal.aborted) return;

            const activeVisible = visibleKeys.length > 0 ? new Set(visibleKeys) : null;

            const formattedData = response.data && response.data.data.map((item: any) => {
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
                    Familia,
                    Unidad,
                    Factor,
                    Cantidad,
                    ["Articulos Totales"]: ArticulosTotales,
                    ["Total Clientes"]: TotalClientes,
                    ["Total Tikets"]: TotalTikets,
                    Costo,
                    ["Total Costo"]: TotalCosto,
                    ["Total Ventas"]: TotalVentas,
                    ["Precio Unitario"]: PrecioUnitario,
                    ["Total Proveedores"]: TotalProveedores,
                    ["Proveedor Nombre"]: ProveedorNombre,
                    ["Maximo Costo"]: CostoMaximo,
                    ["Minimo Costo"]: CostoMinimo,
                    ...rest
                } = item;

                const full: Record<string, any> = {
                    FechaEmision: item.FechaEmision,
                    Articulo: [item.Nombre, item.Articulo, item.Codigo],
                    Proveedor: [item["Proveedor Nombre"], item.Proveedor, item.Fabricante],
                    Sucursal: [item['Nombre Sucursal'], item.Sucursal, item.Almacen],
                    Categoria: [item.Categoria, item.Grupo, item.Familia],
                    Unidad: [item.Unidad, ...(item.Factor > 1 ? [`x${item.Factor}`] : [])],
                    Cantidad: [item.Cantidad, ...(item.Factor > 1 ? [`=${item["Articulos Totales"]}`] : [])],
                    Costo: [item.Costo, formatValue(item["Total Costo"], "currency")],
                    Precio: [item.Precio, item["Total Ventas"]],
                    ...rest,
                };

                if (!activeVisible) return full;
                return Object.fromEntries(
                    Object.entries(full).filter(([key]) => activeVisible.has(key))
                );
            }) || [];
            setDataTable(formattedData);
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

    // ─── Refrescar stats ──────────────────────────────────────────────────────
    const refreshStats = useCallback(() => {
        REPORT_KEYS.forEach((report) => {
        });
    }, [ dateRange]);

    const refreshAllData = useCallback(() => {
        refreshStats();
        fetchTableData();
    }, [refreshStats, fetchTableData]);

    // ─── Carga inicial ────────────────────────────────────────────────────────
    useEffect(() => {
        refreshStats();
    }, []);

    useEffect(() => {
        fetchTableData();
    }, [selectedReport, currentPage, pageSize, visibleColumnsByReport, almacenFilter, searchApplied, dateRange]);

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

    // ─── Stats derivadas de los reportes cargados (por reporte independiente) ──
    const statsDataByReport = useMemo(() => {
        return Object.fromEntries(
            REPORT_KEYS.map((report) => {
                const r = deferredReports[report];
                if (r.status === "success" && r.data) {
                    const items = Array.isArray(r.data) ? r.data : [r.data];
                    return [report, processStatsData(items)];
                }
                return [report, {}];
            })
        ) as Record<REPORT, StatsData>;
    }, [deferredReports]);

    const loadingState = useMemo(() => {
        const entries = REPORT_KEYS.map((k) => ({ key: k, status: deferredReports[k].status }));
        return {
            isAnyLoading: entries.some((e) => ["loading", "idle", "retrying"].includes(e.status)),
            resolvedCount: entries.filter((e) => e.status === "success" || e.status === "error").length,
        };
    }, [deferredReports]);

    const loadProgress = Math.round((loadingState.resolvedCount / REPORT_KEYS.length) * 100);
    const totalPages = Math.ceil(totalRecords / pageSize);

    // ─── Métricas para el reporte seleccionado (datos propios del reporte) ────
    const metrics = useMemo(() => {
        const config = METRICS_CONFIG[selectedReport] || [];
        const reportStatus = deferredReports[selectedReport]?.status;
        const isLoading = ["loading", "idle", "retrying"].includes(reportStatus);
        // Usar solo los stats del reporte activo, no el combinado
        const reportStats = statsDataByReport[selectedReport] ?? {};

        return config.map((metric) => {
            const value = metric.getValue(reportStats);
            const display = value !== null ? formatValue(value, metric.format) : "—";

            return {
                ...metric,
                display,
                raw: value,
                loading: isLoading,
            };
        });
    }, [selectedReport, statsDataByReport, deferredReports]);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <Header />
            <section className="p-3 md:p-4 min-h-[70vh]">

                {/* Header de página */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">Análisis</h1>
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

                {/* ─── Stats en desglose (legibilidad mejorada) ──────────── */}
                {showStats && metrics.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 dark:bg-gray-800 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
                            Resumen de métricas - {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)}
                            {selectedReport === "venta" && " (utilidad vs compras + mermas)"}
                            {selectedReport === "compra" && " (costo mínimo y máximo)"}
                            {selectedReport === "inventario" && " (costo total)"}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {metrics.map((metric) => (
                                <div
                                    key={metric.key}
                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow"
                                >
                                    <div className={`p-2 rounded-full ${metric.color} bg-opacity-10 dark:bg-opacity-20`}>
                                        <metric.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{metric.label}</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                                            {metric.loading ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-gray-400 inline" />
                                            ) : (
                                                metric.display
                                            )}
                                        </p>
                                        {metric.description && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{metric.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── Panel de comparación venta / compra / merma / inventario ── */}
                {showStats && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 dark:bg-gray-800 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <GitCompare className="h-5 w-5 text-indigo-500" />
                            Comparación general
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                            {/* Ventas */}
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800">
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <TrendingUp className="h-3.5 w-3.5" /> Ventas
                                </span>
                                {["loading", "idle", "retrying"].includes(deferredReports["venta"].status) ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                                ) : (
                                    <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                                        {statsDataByReport["venta"]?.totalVentas != null
                                            ? formatValue(statsDataByReport["venta"].totalVentas!, "currency")
                                            : "—"}
                                    </span>
                                )}
                                <span className="text-xs text-emerald-500">
                                    {statsDataByReport["venta"]?.totalTikets != null
                                        ? `${statsDataByReport["venta"].totalTikets} tickets`
                                        : ""}
                                </span>
                            </div>

                            {/* Compras */}
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <ShoppingCart className="h-3.5 w-3.5" /> Compras
                                </span>
                                {["loading", "idle", "retrying"].includes(deferredReports["compra"].status) ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                                ) : (
                                    <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                        {statsDataByReport["compra"]?.totalCompras != null
                                            ? formatValue(statsDataByReport["compra"].totalCompras!, "currency")
                                            : "—"}
                                    </span>
                                )}
                                <span className="text-xs text-blue-500">
                                    {statsDataByReport["compra"]?.totalProveedores != null
                                        ? `${statsDataByReport["compra"].totalProveedores} proveedores`
                                        : ""}
                                </span>
                            </div>

                            {/* Mermas */}
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-rose-50 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800">
                                <span className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Mermas
                                </span>
                                {["loading", "idle", "retrying"].includes(deferredReports["merma"].status) ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                                ) : (
                                    <span className="text-xl font-bold text-rose-700 dark:text-rose-300">
                                        {statsDataByReport["merma"]?.totalMermas != null
                                            ? formatValue(statsDataByReport["merma"].totalMermas!, "currency")
                                            : "—"}
                                    </span>
                                )}
                                <span className="text-xs text-rose-500">
                                    {statsDataByReport["merma"]?.totalArticulosMerma != null
                                        ? `${statsDataByReport["merma"].totalArticulosMerma} artículos`
                                        : ""}
                                </span>
                            </div>

                            {/* Inventario */}
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-purple-50 border border-purple-100 dark:bg-purple-900/20 dark:border-purple-800">
                                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                    <Warehouse className="h-3.5 w-3.5" /> Inventario
                                </span>
                                {["loading", "idle", "retrying"].includes(deferredReports["inventario"].status) ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                                ) : (
                                    <span className="text-xl font-bold text-purple-700 dark:text-purple-300">
                                        {statsDataByReport["inventario"]?.totalCosto != null
                                            ? formatValue(statsDataByReport["inventario"].totalCosto!, "currency")
                                            : "—"}
                                    </span>
                                )}
                                <span className="text-xs text-purple-500">costo total</span>
                            </div>
                        </div>

                        {/* Utilidad neta calculada */}
                        {(() => {
                            const ventas = statsDataByReport["venta"]?.totalVentas;
                            const compras = statsDataByReport["compra"]?.totalCompras ?? statsDataByReport["venta"]?.totalCosto;
                            const mermas = statsDataByReport["merma"]?.totalMermas ?? 0;
                            if (ventas == null || compras == null) return null;
                            const utilidad = ventas - compras - mermas;
                            const margen = ventas > 0 ? (utilidad / ventas) * 100 : 0;
                            const positivo = utilidad >= 0;
                            return (
                                <div className={`flex items-center justify-between rounded-lg px-4 py-2.5 border ${positivo ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700" : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700"}`}>
                                    <span className={`text-sm font-medium flex items-center gap-1.5 ${positivo ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                                        {positivo ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                        Utilidad neta (Ventas − Compras − Mermas)
                                    </span>
                                    <span className={`text-lg font-bold ${positivo ? "text-emerald-700 dark:text-emerald-200" : "text-red-700 dark:text-red-200"}`}>
                                        {formatValue(utilidad, "currency")}
                                        <span className="ml-2 text-sm font-normal opacity-70">{margen.toFixed(1)}%</span>
                                    </span>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* ─── Selector de reporte ───────────────────────────────── */}
                <div className="mb-4 flex flex-wrap gap-2">
                    {REPORT_KEYS.map((report) => {
                        return (
                            <Button
                                key={report}
                                color={selectedReport === report
                                            ? "completed"
                                            : "success"
                                }
                                size="small"
                                onClick={() => setSelectedReport(report)}
                            >
                                {report.charAt(0).toUpperCase() + report.slice(1)}
                            </Button>
                        );
                    })}
                </div>

                {/* ─── Tabla + filtros ───────────────────────────────────── */}
                <div className="relative flex flex-col rounded-xl border gap-3 border-gray-200 bg-white shadow-sm p-4 dark:bg-gray-800 dark:border-gray-700">

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
                            setSearchApplied(true);
                            setCurrentPage(1);
                            fetchTableData();
                        }}
                    />

                    {/* Error de tabla */}
                    {tableError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
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