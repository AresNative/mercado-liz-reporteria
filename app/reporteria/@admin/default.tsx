"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useGetMasivoWithFiltersMutation } from "@/hooks/reducers/api_int";
import { safeCall } from "@/hooks/use-debounce";
import DynamicTable from "@/components/table";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Pagination from "@/components/pagination";
import { formatValue } from "@/utils/constants/format-values";
import {
    DollarSign, TrendingUp, Package, Users, Minus,
    TrendingDown, RefreshCw, Building, Filter,
    Loader2, Search, ShoppingCart, X, Zap,
    Calendar, ChevronDown, Menu, ChevronUp,
    AlertCircle, Percent,
    GitCompare, Warehouse, Calculator
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

type ReportType = "ventas" | "compras" | "mermas" | "inventario" | "comparacion";

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
    totalCompras?: number;
    diferencia?: number;
    utilidad?: number;
    margen?: number;
}

interface QueryConfig {
    table: string;
    tableSuggestion: string;
    selects: Array<{ Key: string; Alias?: string }>;
    agregaciones: Array<{ Key: string; Alias: string; Operation: string }>;
    fechaField: string;
    searchColumns: SearchColumn[];
}

interface ApiResponse {
    data?: {
        data: any[];
        page?: number;
        totalRecords?: number;
        totalEstimated?: number;
    };
    error?: any;
}

interface DateRange {
    from: Date | null;
    to: Date | null;
}

interface SearchColumn {
    key: string;
    label: string;
    icon: any;
    color: string;
    tableField?: string; // Campo específico en la tabla
}

// Configuración de columnas de búsqueda por tipo de reporte
const SEARCH_COLUMNS_CONFIG: Record<ReportType, SearchColumn[]> = {
    ventas: [
        { key: "articulo", label: "Artículo", icon: Package, color: "text-blue-500", tableField: "ART.Descripcion1" },
        { key: "cliente", label: "Nombre", icon: Users, color: "text-green-500", tableField: "C.Nombre" },
        { key: "categoria", label: "Categoría", icon: Filter, color: "text-purple-500", tableField: "ART.Categoria" },
        { key: "codigo", label: "Código", icon: DollarSign, color: "text-yellow-500", tableField: "ventad.Codigo" }
    ],
    compras: [
        { key: "articulo", label: "Artículo", icon: Package, color: "text-blue-500", tableField: "ART.Descripcion1" },
        { key: "proveedor", label: "Proveedor", icon: ShoppingCart, color: "text-orange-500", tableField: "P.Nombre" },
        { key: "fabricante", label: "Fabricante", icon: Building, color: "text-red-500", tableField: "ART.Fabricante" },
        { key: "codigo", label: "Código", icon: DollarSign, color: "text-yellow-500", tableField: "comprad.Codigo" }
    ],
    mermas: [
        { key: "articulo", label: "Artículo", icon: Package, color: "text-blue-500", tableField: "art.Descripcion1" },
        { key: "concepto", label: "Concepto", icon: Filter, color: "text-purple-500", tableField: "inv.Concepto" },
        { key: "categoria", label: "Categoría", icon: Filter, color: "text-indigo-500", tableField: "art.Categoria" },
        { key: "codigo", label: "Código", icon: DollarSign, color: "text-yellow-500", tableField: "invd.Codigo" }
    ],
    inventario: [
        { key: "articulo", label: "Artículo", icon: Package, color: "text-blue-500", tableField: "art.Descripcion1" },
        { key: "descripcion", label: "Descripción", icon: Filter, color: "text-purple-500", tableField: "art.Descripcion1" }
    ],
    comparacion: [
        { key: "articulo", label: "Artículo", icon: Package, color: "text-blue-500", tableField: "ART.Descripcion1" },
        { key: "categoria", label: "Categoría", icon: Filter, color: "text-purple-500", tableField: "ART.Categoria" },
        { key: "fabricante", label: "Fabricante", icon: Building, color: "text-red-500", tableField: "ART.Fabricante" },
        { key: "codigo", label: "Código", icon: DollarSign, color: "text-yellow-500", tableField: "ventad.Codigo" }
    ]
};

// Configuración de consultas por tipo de reporte
const QUERY_CONFIGS: Record<ReportType, QueryConfig> = {
    ventas: {
        table: `VENTA AS venta
            INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID
            INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo
            INNER JOIN Cte AS C ON venta.Cliente = C.Cliente`,
        tableSuggestion: ``,
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
            { Key: "ventad.Precio", Alias: "Precio unitario" },
            { Key: "ventad.Costo", Alias: "Costo unitario" },
            { Key: "ventad.Codigo" }
        ],
        agregaciones: [
            { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
            { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
            { Key: "ventad.Articulo", Alias: "totalArticulos", Operation: "COUNT DISTINCT" },
            { Key: "venta.Cliente", Alias: "totalClientes", Operation: "COUNT DISTINCT" }
        ],
        fechaField: "venta.FechaEmision",
        searchColumns: SEARCH_COLUMNS_CONFIG.ventas
    },
    compras: {
        table: `COMPRA AS compra
            INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID
            INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo
            LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor`,
        tableSuggestion: ``,
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
            { Key: "comprad.Articulo", Alias: "totalArticulos", Operation: "COUNT DISTINCT" },
            { Key: "compra.Proveedor", Alias: "totalProveedores", Operation: "COUNT DISTINCT" }
        ],
        fechaField: "compra.FechaEmision",
        searchColumns: SEARCH_COLUMNS_CONFIG.compras
    },
    mermas: {
        table: `INV AS inv
            INNER JOIN INVD AS invd ON invd.ID = inv.ID
            INNER JOIN Art AS art ON art.Articulo = invd.Articulo`,
        tableSuggestion: ``,
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
            { Key: "invd.Articulo", Alias: "totalArticulos", Operation: "COUNT DISTINCT" }
        ],
        fechaField: "inv.FechaEmision",
        searchColumns: SEARCH_COLUMNS_CONFIG.mermas
    },
    inventario: {
        table: `INVD AS invd
                INNER JOIN inv AS inv ON inv.ID = invd.ID
                LEFT JOIN Art AS art ON art.Articulo = invd.Articulo`,
        tableSuggestion: ``,
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
            { Key: "inv.FechaEmision" }
        ],
        agregaciones: [
            { Key: "(invd.Costo * invd.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
            { Key: "invd.Articulo", Alias: "totalArticulos", Operation: "COUNT DISTINCT" }
        ],
        fechaField: "inv.FechaEmision",
        searchColumns: SEARCH_COLUMNS_CONFIG.inventario
    },
    comparacion: {
        table: `VENTA AS venta
        INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID
        LEFT JOIN COMPRA AS compra ON compra.FechaEmision = venta.FechaEmision
        LEFT JOIN COMPRAD AS comprad ON comprad.ID = compra.ID AND comprad.Articulo = ventad.Articulo
        INNER JOIN ART AS ART ON ART.Articulo = ventad.Articulo
        LEFT JOIN Cte AS C ON venta.Cliente = C.Cliente
        LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor`,
        tableSuggestion: ``,
        selects: [
            { Key: "venta.FechaEmision" },
            { Key: "ventad.Articulo" },
            { Key: "ART.Descripcion1", Alias: "Nombre" },
            { Key: "ART.Categoria" },
            { Key: "ART.Grupo" },
            { Key: "ART.Linea" },
            { Key: "ART.Familia" },
            { Key: "C.Nombre", Alias: "Cliente" },
            { Key: "P.Nombre", Alias: "Proveedor" },
            { Key: "ventad.Almacen", Alias: "AlmacenVenta" },
            { Key: "comprad.Almacen", Alias: "AlmacenCompra" },
            { Key: "ventad.Cantidad", Alias: "CantidadVenta" },
            { Key: "comprad.Cantidad", Alias: "CantidadCompra" },
            { Key: "ventad.Precio", Alias: "PrecioVenta" },
            { Key: "comprad.Costo", Alias: "CostoCompra" },
            { Key: "ART.Fabricante" }
        ],
        agregaciones: [
            { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
            { Key: "(comprad.Costo * comprad.Cantidad)", Alias: "totalCompras", Operation: "SUM" },
            { Key: "((ventad.Precio * ventad.Cantidad) - (ventad.Costo * ventad.Cantidad))", Alias: "diferencia", Operation: "SUM" },
            { Key: "ventad.Articulo", Alias: "totalArticulos", Operation: "COUNT DISTINCT" }
        ],
        fechaField: "venta.FechaEmision",
        searchColumns: SEARCH_COLUMNS_CONFIG.comparacion
    }
};

// Métricas para cada tipo de reporte con iconos mejorados
const BENTO_METRICS_CONFIG: Record<string, any[]> = {
    ventas: [
        {
            title: "Ventas",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: DollarSign,
            description: "Total en ventas"
        },
        {
            title: "Costos",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: Calculator,
            description: "Total de costos"
        },
        {
            title: "Margen",
            raw: 0,
            display: formatValue(0, "percentage"),
            type: "percent",
            icon: Percent,
            description: "Margen de utilidad"
        },
        {
            title: "Utilidad",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: TrendingUp,
            description: "Utilidad neta"
        },
        {
            title: "Artículos",
            raw: 0,
            display: formatValue(0, "number"),
            type: "number",
            icon: Package,
            description: "Artículos vendidos"
        }
    ],
    compras: [
        {
            title: "Costo Total",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: Calculator,
            description: "Total de compras"
        },
        {
            title: "Artículos",
            raw: 0,
            display: formatValue(0, "number"),
            type: "number",
            icon: Package,
            description: "Artículos comprados"
        },
        {
            title: "Proveedores",
            raw: 0,
            display: formatValue(0, "number"),
            type: "number",
            icon: Users,
            description: "Proveedores distintos"
        }
    ],
    mermas: [
        {
            title: "Costo Merma",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: AlertCircle,
            description: "Costo por mermas"
        },
        {
            title: "Artículos",
            raw: 0,
            display: formatValue(0, "number"),
            type: "number",
            icon: Package,
            description: "Artículos con merma"
        }
    ],
    inventario: [
        {
            title: "Costo Total",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: Warehouse,
            description: "Valor del inventario"
        },
        {
            title: "Artículos",
            raw: 0,
            display: formatValue(0, "number"),
            type: "number",
            icon: Package,
            description: "Artículos en inventario"
        }
    ],
    comparacion: [
        {
            title: "Ventas",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: DollarSign,
            description: "Total de ventas"
        },
        {
            title: "Compras",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: ShoppingCart,
            description: "Total de compras"
        },
        {
            title: "Diferencia",
            raw: 0,
            display: formatValue(0, "currency"),
            type: "currency",
            icon: GitCompare,
            description: "Diferencia venta-compra"
        },
        {
            title: "Margen",
            raw: 0,
            display: formatValue(0, "percentage"),
            type: "percent",
            icon: Percent,
            description: "Margen comparativo"
        },
        {
            title: "Artículos",
            raw: 0,
            display: formatValue(0, "number"),
            type: "number",
            icon: Package,
            description: "Artículos comparados"
        }
    ]
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
        if (s.totalCompras !== undefined) out.totalCompras = (out.totalCompras ?? 0) + s.totalCompras;
        if (s.totalCostoVenta !== undefined) out.totalCosto = (out.totalCosto ?? 0) + s.totalCostoVenta;
        if (s.diferencia !== undefined) out.diferencia = (out.diferencia ?? 0) + s.diferencia;
        if (s.totalClientes !== undefined) out.totalClientes = (out.totalClientes ?? 0) + s.totalClientes;
        if (s.totalProveedores !== undefined) out.totalProveedores = (out.totalProveedores ?? 0) + s.totalProveedores;
        if (s.totalMermas !== undefined) out.totalMermas = (out.totalMermas ?? 0) + s.totalMermas;
        if (s.totalArticulosVenta !== undefined) out.totalArticulos = (out.totalArticulos ?? 0) + s.totalArticulosVenta;
        if (s.totalArticulosCompra !== undefined) out.totalArticulos = (out.totalArticulos ?? 0) + s.totalArticulosCompra;
    });

    // Calcular utilidad y margen para ventas y comparación
    if (out.totalVentas !== undefined) {
        if (out.totalCosto !== undefined) {
            out.utilidad = +(out.totalVentas - out.totalCosto).toFixed(2);
            out.margen = out.totalVentas > 0 ? +((out.utilidad / out.totalVentas) * 100).toFixed(2) : 0;
        }
        if (out.totalCompras !== undefined) {
            out.utilidad = +(out.totalVentas - out.totalCompras).toFixed(2);
            out.margen = out.totalVentas > 0 ? +((out.utilidad / out.totalVentas) * 100).toFixed(2) : 0;
        }

        // Para comparación, calcular diferencia entre ventas y compras
        if (out.totalCompras !== undefined) {
            out.diferencia = +(out.totalVentas - out.totalCompras).toFixed(2);
        }
    }

    return out;
};

// Helper para extraer almacenes únicos
const extractUniqueAlmacenes = (data: TableData[]): string[] => {
    if (!data.length) return [];

    const almacenes = data
        .flatMap((item: any) => [item.Almacen, item.AlmacenVenta, item.AlmacenCompra])
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index);

    return almacenes as string[];
};

// Helper para formatear fecha a YYYY-MM-DD
const formatDateToSQL = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Componente principal
export default function Report() {
    const [getData] = useGetMasivoWithFiltersMutation();

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
    const [searchColumn, setSearchColumn] = useState<SearchColumn>(SEARCH_COLUMNS_CONFIG.ventas[0]);
    const [showSearchColumnDropdown, setShowSearchColumnDropdown] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [quickMode, setQuickMode] = useState(true);
    const [searchApplied, setSearchApplied] = useState(false);

    // Estado para persistir búsqueda entre reportes
    const [lastSearch, setLastSearch] = useState<{
        term: string;
        columnKey: string;
    } | null>(null);

    // Nuevo estado para filtro de fechas
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date()
    });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Estado para menú móvil
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchColumnDropdownRef = useRef<HTMLDivElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const tableAbortControllerRef = useRef<AbortController | null>(null);
    const statsAbortControllerRef = useRef<AbortController | null>(null);
    const suggestionsAbortControllerRef = useRef<AbortController | null>(null);

    // Mapeo para mantener búsquedas entre reportes compatibles
    const getCompatibleSearchColumn = (prevColumnKey: string, newReportType: ReportType): SearchColumn | null => {
        const newColumns = SEARCH_COLUMNS_CONFIG[newReportType];

        // Intentar encontrar una columna con el mismo key
        let compatibleColumn = newColumns.find(col => col.key === prevColumnKey);

        // Si no existe, buscar una columna con "articulo" como fallback
        if (!compatibleColumn) {
            compatibleColumn = newColumns.find(col => col.key === "articulo");
        }

        // Si aún no hay, usar la primera columna
        if (!compatibleColumn && newColumns.length > 0) {
            compatibleColumn = newColumns[0];
        }

        return compatibleColumn || null;
    };

    // Actualizar columna de búsqueda cuando cambia el tipo de reporte
    useEffect(() => {
        const columns = SEARCH_COLUMNS_CONFIG[reportType];

        if (lastSearch && lastSearch.term && lastSearch.columnKey) {
            // Intentar mantener la búsqueda anterior si es compatible
            const compatibleColumn = getCompatibleSearchColumn(lastSearch.columnKey, reportType);
            if (compatibleColumn) {
                setSearchColumn(compatibleColumn);
                setSearchTerm(lastSearch.term);
                setSearchApplied(true);
                return;
            }
        }

        if (columns && columns.length > 0) {
            const currentColumnExists = columns.some(col => col.key === searchColumn.key);
            if (!currentColumnExists) {
                setSearchColumn(columns[0]);
            }
        }
    }, [reportType]);

    // Inicializar columna de búsqueda
    useEffect(() => {
        const columns = SEARCH_COLUMNS_CONFIG[reportType];
        if (columns && columns.length > 0 && !searchColumn.key) {
            setSearchColumn(columns[0]);
        }
    }, []);

    // Cerrar dropdowns al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchColumnDropdownRef.current &&
                !searchColumnDropdownRef.current.contains(event.target as Node)) {
                setShowSearchColumnDropdown(false);
            }
            if (suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Limpiar errores cuando se inicia una nueva carga
    useEffect(() => {
        if (tableLoading || statsLoading) {
            setTableError(null);
            setStatsError(null);
        }
    }, [tableLoading, statsLoading]);

    // Construir filtros combinados
    const buildFiltros = useCallback((includeSearchTerm: boolean = true) => {
        const filters: any[] = [];

        // Filtro de búsqueda con columna seleccionada
        if (searchTerm.length >= 2 && searchColumn.tableField && includeSearchTerm && searchApplied) {
            filters.push({
                Key: searchColumn.tableField,
                Operator: "LIKE",
                Value: searchTerm
            });
        }

        // Filtro de almacén - manejar diferentes nombres de campo según reporte
        if (almacenFilter) {
            let almacenField = "Almacen";
            if (reportType === "comparacion") {
                almacenField = "venta.Almacen";
            }
            filters.push({
                Key: almacenField,
                Operator: "=",
                Value: almacenFilter
            });
        }

        // Filtro de fechas
        if (dateRange.from && dateRange.to) {
            const fechaField = QUERY_CONFIGS[reportType]?.fechaField;
            if (fechaField) {
                filters.push(
                    { Key: fechaField, Operator: ">=", Value: formatDateToSQL(dateRange.from) },
                    { Key: fechaField, Operator: "<=", Value: formatDateToSQL(dateRange.to) }
                );
            }
        }

        // Filtros específicos por tipo de reporte
        if (reportType === "ventas") {
            filters.push(
                { Key: "venta.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
                { Key: "venta.Mov", Operator: "IN", Value: 'Factura,Factura Credito,Nota' }
            );
        } else if (reportType === "compras") {
            filters.push(
                { Key: "compra.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
                { Key: "compra.Mov", Operator: "=", Value: "ENTRADA COMPRA" }
            );
        } else if (reportType === "mermas") {
            filters.push(
                { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
                { Key: "inv.Concepto", Operator: "LIKE", Value: "MERMAS" }
            );
        } else if (reportType === "inventario") {
            filters.push(
                { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO }
            );
        } else if (reportType === "comparacion") {
            filters.push(
                { Key: "venta.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
                { Key: "venta.Mov", Operator: "IN", Value: 'Factura,Factura Credito,Nota' },
                { Key: "compra.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
                { Key: "compra.Mov", Operator: "=", Value: "ENTRADA COMPRA" }
            );
        }
        // Para comparación, los filtros están incluidos en la consulta UNION

        return filters;
    }, [searchTerm, searchColumn, almacenFilter, dateRange, reportType, searchApplied]);

    // Función para cargar datos de la tabla (con paginación)
    const fetchTableData = useCallback(async (page = currentPage, forceRefresh = false) => {
        if (!QUERY_CONFIGS[reportType]) return;

        // Cancelar peticiones pendientes de tabla
        if (tableAbortControllerRef.current) {
            tableAbortControllerRef.current.abort();
        }

        // Limpiar errores antes de cargar
        setTableError(null);
        setTableLoading(!forceRefresh);
        if (forceRefresh) setRefreshingTable(true);

        try {
            // Crear nuevo AbortController para esta petición
            const controller = new AbortController();
            tableAbortControllerRef.current = controller;

            const queryConfig = QUERY_CONFIGS[reportType];
            const currentFilters = buildFiltros(true);

            const response: ApiResponse = await safeCall(() => getData({
                table: queryConfig.table,
                filtros: {
                    selects: queryConfig.selects,
                    filtros: currentFilters.length > 0 ? currentFilters : undefined,
                    Order: [{ Key: queryConfig.fechaField || "FechaEmision", Direction: "desc" }]
                },
                page: page,
                pageSize: CONFIG.PAGE_SIZE,
                signal: controller.signal
            }), "getTableData");

            // Verificar si la petición fue abortada
            if (controller.signal.aborted) {
                return;
            }

            if (response.error) {
                if (response.error.name === 'AbortError' ||
                    response.error.message?.includes('aborted') ||
                    response.error.code === 'ERR_CANCELLED') {
                    return;
                }

                throw new Error(response.error.message || "Error al cargar los datos de la tabla");
            }

            const tableData = response.data?.data || [];
            setCurrentPage(response.data?.page || 1);
            setTotalRecords(response.data?.totalRecords || response.data?.totalEstimated || 0);
            setDataTable(tableData);

            // Extraer almacenes únicos
            const uniqueAlmacenes = extractUniqueAlmacenes(tableData);
            setAlmacenes(uniqueAlmacenes);

            // Si hay almacén filtrado que ya no existe en los datos, limpiarlo
            if (almacenFilter && !uniqueAlmacenes.includes(almacenFilter)) {
                setAlmacenFilter("");
            }

        } catch (error: any) {
            // Ignorar errores de aborto
            if (error.name === 'AbortError' ||
                error.message?.includes('aborted') ||
                error.code === 'ERR_CANCELLED') {
                return;
            }

            // Solo mostrar error si no fue abortado
            if (!tableAbortControllerRef.current?.signal.aborted) {
                setTableError(error.message || "Error al cargar los datos de la tabla");
            }
        } finally {
            // Solo limpiar estados si no fue abortado
            if (!tableAbortControllerRef.current?.signal.aborted) {
                setTableLoading(false);
                setRefreshingTable(false);
            }
        }
    }, [reportType, currentPage, getData, buildFiltros, almacenFilter]);

    // Función para cargar sugerencias
    const fetchSuggestions = useCallback(async () => {
        if (!searchTerm || searchTerm.length < 2 || !searchColumn.tableField) {
            setSuggestions([]);
            return;
        }

        if (!QUERY_CONFIGS[reportType]) return;

        // Cancelar peticiones pendientes de sugerencias
        if (suggestionsAbortControllerRef.current) {
            suggestionsAbortControllerRef.current.abort();
        }

        setSuggestionsLoading(true);

        try {
            const controller = new AbortController();
            suggestionsAbortControllerRef.current = controller;

            const queryConfig = QUERY_CONFIGS[reportType];

            const response: ApiResponse = await safeCall(() => getData({
                table: queryConfig.table,
                filtros: {
                    filtros: [{
                        Key: searchColumn.tableField,
                        Value: searchTerm,
                        Operator: "LIKE"
                    }],
                    selects: [{ Key: searchColumn.tableField, Alias: "Suggestion" }],
                    Order: [{ Key: "Suggestion", Direction: "asc" }],
                    pageSize: 10,
                },
                signal: controller.signal
            }), "getSuggestions");

            if (response.error) {
                if (!controller.signal.aborted) {
                    console.error("Error fetching suggestions:", response.error);
                }
                setSuggestions([]);
                return;
            }

            const suggestionData = response.data?.data || [];
            const uniqueSuggestions = suggestionData
                .map((s: any) => s.Suggestion)
                .filter((value: any, index: number, self: any[]) =>
                    self.indexOf(value) === index && value
                )
                .slice(0, 10);

            setSuggestions(uniqueSuggestions.map((s: any) => ({ Suggestion: s })));
        } catch (error: any) {
            if (!suggestionsAbortControllerRef.current?.signal.aborted) {
                console.error("Error in fetchSuggestions:", error);
                setSuggestions([]);
            }
        } finally {
            if (!suggestionsAbortControllerRef.current?.signal.aborted) {
                setSuggestionsLoading(false);
            }
        }
    }, [searchTerm, searchColumn, reportType, getData]);

    // Función para cargar estadísticas
    const fetchStatsData = useCallback(async (forceRefresh = false) => {
        if (!QUERY_CONFIGS[reportType]) return;

        // Cancelar peticiones pendientes de estadísticas
        if (statsAbortControllerRef.current) {
            statsAbortControllerRef.current.abort();
        }

        // Limpiar errores antes de cargar
        setStatsError(null);
        setStatsLoading(!forceRefresh);
        if (forceRefresh) setRefreshingStats(true);

        try {
            const controller = new AbortController();
            statsAbortControllerRef.current = controller;

            const queryConfig = QUERY_CONFIGS[reportType];
            const currentFilters = buildFiltros(true);

            const response: ApiResponse = await safeCall(() => getData({
                table: queryConfig.table,
                filtros: {
                    Filtros: currentFilters.length > 0 ? currentFilters : undefined,
                    agregaciones: queryConfig.agregaciones,
                },
                signal: controller.signal
            }), "getStatsData");

            // Verificar si la petición fue abortada
            if (controller.signal.aborted) {
                return;
            }

            if (response.error) {
                if (response.error.name === 'AbortError' ||
                    response.error.message?.includes('aborted') ||
                    response.error.code === 'ERR_CANCELLED') {
                    return;
                }

                throw new Error(response.error.message || "Error al cargar las estadísticas");
            }

            const statsData = response.data?.data || [];
            const processedStats = processStatsData(statsData);
            setStats(processedStats);

        } catch (error: any) {
            // Ignorar errores de aborto
            if (error.name === 'AbortError' ||
                error.message?.includes('aborted') ||
                error.code === 'ERR_CANCELLED') {
                return;
            }

            // Solo mostrar error si no fue abortado
            if (!statsAbortControllerRef.current?.signal.aborted) {
                setStatsError(error.message || "Error al cargar las estadísticas");
            }
        } finally {
            // Solo limpiar estados si no fue abortado
            if (!statsAbortControllerRef.current?.signal.aborted) {
                setStatsLoading(false);
                setRefreshingStats(false);
            }
        }
    }, [reportType, getData, buildFiltros]);

    // Función para cargar datos del reporte actual
    const fetchCurrentReportData = useCallback(async (page = 1) => {
        cancelPendingRequests();
        setCurrentPage(page);

        // Para comparación, cargar siempre ambos
        if (reportType === "comparacion") {
            await Promise.all([
                fetchTableData(page),
                fetchStatsData()
            ]);
        } else {
            fetchTableData(page);
            fetchStatsData();
        }
    }, [reportType, fetchTableData, fetchStatsData]);

    // Función para cancelar peticiones pendientes
    const cancelPendingRequests = () => {
        if (tableAbortControllerRef.current) {
            tableAbortControllerRef.current.abort();
        }
        if (statsAbortControllerRef.current) {
            statsAbortControllerRef.current.abort();
        }
        if (suggestionsAbortControllerRef.current) {
            suggestionsAbortControllerRef.current.abort();
        }

        // No limpiar errores aquí, se limpian al iniciar nueva carga
    };

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
        cancelPendingRequests();
        setCurrentPage(1);
        fetchCurrentReportData(1);
    };

    // Nueva función para aplicar búsqueda
    const handleSearchSubmit = () => {
        if (searchTerm.length >= 2) {
            setSearchApplied(true);
            setLastSearch({
                term: searchTerm,
                columnKey: searchColumn.key
            });
            setCurrentPage(1);
            fetchCurrentReportData(1);
        }
    };

    // Cargar datos iniciales cuando cambian los filtros o el tipo de reporte
    useEffect(() => {
        // Limpiar mensajes de error previos
        setTableError(null);
        setStatsError(null);

        // Guardar búsqueda actual si existe
        if (searchApplied && searchTerm) {
            setLastSearch({
                term: searchTerm,
                columnKey: searchColumn.key
            });
        }

        fetchCurrentReportData(1);

        // Cleanup
        return () => {
            cancelPendingRequests();
        };
    }, [reportType, almacenFilter, dateRange]);

    // Cambiar página de la tabla
    useEffect(() => {
        if (currentPage !== 1) {
            cancelPendingRequests();
            fetchTableData(currentPage);
        }
    }, [currentPage]);

    // Handlers para búsqueda y filtros
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setSearchApplied(false);

        if (value.length >= 2) {
            setShowSuggestions(true);
            fetchSuggestions();
        } else {
            setShowSuggestions(false);
            setSuggestions([]);
        }
    };

    const handleSearchColumnChange = (column: SearchColumn) => {
        setSearchColumn(column);
        setShowSearchColumnDropdown(false);
        setSearchApplied(false);
        setShowSuggestions(false);
        setSuggestions([]);

        // Si hay término de búsqueda, actualizar lastSearch
        if (searchTerm) {
            setLastSearch({
                term: searchTerm,
                columnKey: column.key
            });
        }
    };

    const handleSuggestionSelect = (suggestion: any) => {
        setSearchTerm(suggestion.Suggestion);
        setShowSuggestions(false);
        setSearchApplied(true);
        setLastSearch({
            term: suggestion.Suggestion,
            columnKey: searchColumn.key
        });
        setCurrentPage(1);
        fetchCurrentReportData(1);
    };

    const handleClearFilters = () => {
        cancelPendingRequests();
        setSearchTerm("");
        setSearchApplied(false);
        setLastSearch(null);
        setSuggestions([]);
        setSearchColumn(SEARCH_COLUMNS_CONFIG[reportType][0]);
        setAlmacenFilter("");
        setDateRange({
            from: new Date(new Date().setDate(new Date().getDate() - 30)),
            to: new Date()
        });
        setCurrentPage(1);
        fetchCurrentReportData(1);
    };

    const handleReportTypeChange = (type: ReportType) => {
        cancelPendingRequests();

        // Guardar búsqueda actual si existe
        if (searchApplied && searchTerm) {
            setLastSearch({
                term: searchTerm,
                columnKey: searchColumn.key
            });
        }

        setReportType(type);
        setCurrentPage(1);
        setSearchApplied(false);
        setShowMobileMenu(false);

        // La búsqueda se restaurará en el useEffect de reportType
    };

    // Handler para cambio de fecha
    const handleDateChange = (from: Date | null, to: Date | null) => {
        cancelPendingRequests();
        setDateRange({ from, to });
        setCurrentPage(1);
        setShowDatePicker(false);
        fetchCurrentReportData(1);
    };

    // Handler para cambio de almacén
    const handleAlmacenFilterChange = (value: string) => {
        cancelPendingRequests();
        setAlmacenFilter(value);
        setCurrentPage(1);
        fetchCurrentReportData(1);
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
                    metric.display = formatValue(stats.totalCosto || 0, "currency");
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
                    metric.display = formatValue(stats.totalCosto || 0, "currency");
                    break;
                case "proveedores":
                    rawValue = stats.totalProveedores || 0;
                    metric.display = formatValue(rawValue, "number");
                    break;
                case "costomerma":
                    rawValue = -(stats.totalCosto || 0);
                    metric.display = formatValue(stats.totalCosto || 0, "currency");
                    break;
                case "compras":
                    rawValue = stats.totalCompras || 0;
                    metric.display = formatValue(rawValue, "currency");
                    break;
                case "diferencia":
                    rawValue = stats.diferencia || 0;
                    metric.display = formatValue(rawValue, "currency");
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
        positive: { bg: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800", text: "text-green-600 dark:text-green-400" },
        negative: { bg: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800", text: "text-red-600 dark:text-red-400" },
        neutral: { bg: "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700", text: "text-gray-800 dark:text-gray-300" }
    };

    const bentoIcons: Record<string, any> = {
        positive: TrendingUp,
        negative: TrendingDown,
        neutral: Minus
    };

    const totalPages = Math.ceil(totalRecords / CONFIG.PAGE_SIZE);
    const bentoMetrics = getBentoMetrics();
    const searchColumns = SEARCH_COLUMNS_CONFIG[reportType];

    // Formatear fecha para display
    const formatDateDisplay = (date: Date | null): string => {
        if (!date) return "Seleccionar";
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <>
            <section className="p-3 md:p-4 min-h-[70vh]">
                {/* Header móvil */}
                <ul className="md:hidden mb-4">
                    <li className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                            Reportería
                        </h1>
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="p-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600"
                        >
                            {showMobileMenu ? <ChevronUp size={20} /> : <Menu size={20} />}
                        </button>
                    </li>

                    {/* Selector de reporte en móvil */}
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
                    </li>

                    <li className="flex gap-2">
                        <button
                            onClick={refreshStats}
                            disabled={statsLoading || refreshingStats}
                            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600"
                            title="Recargar solo estadísticas"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshingStats ? 'animate-spin' : ''}`} />
                            Stats
                        </button>

                        <button
                            onClick={refreshTable}
                            disabled={tableLoading || refreshingTable}
                            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600"
                            title="Recargar solo tabla"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshingTable ? 'animate-spin' : ''}`} />
                            Tabla
                        </button>

                        <button
                            onClick={refreshAll}
                            disabled={(tableLoading && statsLoading)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600"
                            title="Recargar todo"
                        >
                            <RefreshCw className={`w-4 h-4 ${(refreshingTable && refreshingStats) ? 'animate-spin' : ''}`} />
                            <span className="hidden md:inline">Recargar Todo</span>
                            <span className="md:hidden">Todo</span>
                        </button>
                    </li>
                </ul>

                {/* Menú móvil */}
                {showMobileMenu && (
                    <ul className="md:hidden mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <li className="grid grid-cols-2 gap-2 mb-3">
                            <button
                                onClick={refreshStats}
                                disabled={statsLoading || refreshingStats}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600"
                                title="Recargar solo estadísticas"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshingStats ? 'animate-spin' : ''}`} />
                                <span className="text-sm">Stats</span>
                            </button>

                            <button
                                onClick={refreshTable}
                                disabled={tableLoading || refreshingTable}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600"
                                title="Recargar solo tabla"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshingTable ? 'animate-spin' : ''}`} />
                                <span className="text-sm">Tabla</span>
                            </button>
                        </li>

                        <li className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Reporte: {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
                        </li>
                    </ul>
                )}

                {/* Mensajes de error con mejor diseño */}
                {statsError && !statsLoading && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <div className="font-medium mb-1">Error en estadísticas</div>
                                <div className="text-sm">{statsError}</div>
                            </div>
                            <button
                                onClick={refreshStats}
                                className="text-sm font-medium underline hover:no-underline flex items-center gap-1"
                            >
                                <RefreshCw className="h-3 w-3" />
                                Reintentar
                            </button>
                        </div>
                    </div>
                )}

                {tableError && !tableLoading && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <div className="font-medium mb-1">Error en tabla de datos</div>
                                <div className="text-sm">{tableError}</div>
                            </div>
                            <button
                                onClick={refreshTable}
                                className="text-sm font-medium underline hover:no-underline flex items-center gap-1"
                            >
                                <RefreshCw className="h-3 w-3" />
                                Reintentar
                            </button>
                        </div>
                    </div>
                )}

                {/* Indicadores de carga con estado más claro */}
                {(tableLoading || refreshingTable || statsLoading || refreshingStats) && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                            <div className="flex-1">
                                <div className="font-medium text-blue-700 dark:text-blue-300">
                                    {refreshingTable ? "Actualizando tabla..." :
                                        refreshingStats ? "Actualizando estadísticas..." :
                                            tableLoading ? "Cargando datos..." :
                                                "Cargando estadísticas..."}
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

                {/* Filtros - Versión móvil */}
                <div className="md:hidden mb-6">
                    <div className="space-y-3">
                        {/* Filtro de fecha móvil */}
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
                                                value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleDateChange(
                                                    e.target.value ? new Date(e.target.value) : null,
                                                    dateRange.to
                                                )}
                                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Hasta:</label>
                                            <input
                                                type="date"
                                                value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleDateChange(
                                                    dateRange.from,
                                                    e.target.value ? new Date(e.target.value) : null
                                                )}
                                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div className="flex justify-between pt-2 border-t">
                                            <button
                                                onClick={() => setShowDatePicker(false)}
                                                className="text-sm px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
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

                        {/* Filtro de almacén móvil */}
                        {almacenes.length > 0 && (
                            <div className="relative">
                                <Building className="absolute size-5 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <select
                                    value={almacenFilter}
                                    onChange={(e) => handleAlmacenFilterChange(e.target.value)}
                                    className="w-full pl-10 pr-8 py-2.5 border rounded-lg bg-white appearance-none dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
                                >
                                    <option value="">Todos los almacenes</option>
                                    {almacenes.map((almacen) => (
                                        <option key={almacen} value={almacen}>
                                            {almacen}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Búsqueda móvil */}
                        <div className="space-y-2">
                            {/* Selector de columna de búsqueda */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <searchColumn.icon className={`h-4 w-4 ${searchColumn.color}`} />
                                    <span className="text-sm font-medium">{searchColumn.label}</span>
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
                                                    ? 'bg-blue-50 border border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800'
                                                    : 'bg-gray-50 border border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700'}`}
                                            >
                                                <column.icon className={`h-3 w-3 ${column.color}`} />
                                                {column.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input de búsqueda con botón */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        ref={searchInputRef}
                                        value={searchTerm}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
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

                            {/* Sugerencias */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div ref={suggestionsRef} className="border border-gray-300 rounded-lg shadow-sm dark:border-gray-700">
                                    <div className="max-h-40 overflow-y-auto">
                                        {suggestionsLoading ? (
                                            <div className="p-3 text-center text-gray-500">
                                                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                                Buscando...
                                            </div>
                                        ) : (
                                            suggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
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
                        </div>

                        {/* Botones de acción móvil */}
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

                {/* Filtros - Versión desktop */}
                <div className="hidden md:flex flex-wrap gap-3 items-center mb-6">
                    <div className="flex flex-wrap gap-3">
                        {/* Filtro de fecha */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
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
                                    <div className="flex flex-col gap-2 relative">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Desde:</label>
                                            <input
                                                type="date"
                                                value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleDateChange(
                                                    e.target.value ? new Date(e.target.value) : null,
                                                    dateRange.to
                                                )}
                                                className="border rounded px-2 py-1 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Hasta:</label>
                                            <input
                                                type="date"
                                                value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleDateChange(
                                                    dateRange.from,
                                                    e.target.value ? new Date(e.target.value) : null
                                                )}
                                                className="border rounded px-2 py-1 text-sm"
                                            />
                                        </div>
                                        <div className="flex relative mt-2 h-6">
                                            <button
                                                onClick={() => setShowDatePicker(false)}
                                                className="text-sm px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 absolute right-0"
                                            >
                                                Aplicar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filtro de almacén */}
                        {almacenes.length > 0 && (
                            <div className="relative">
                                <Building className="absolute size-5 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <select
                                    value={almacenFilter}
                                    onChange={(e) => handleAlmacenFilterChange(e.target.value)}
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
                        )}

                        {/* Búsqueda con selector de columna */}
                        <div className="relative flex" ref={suggestionsRef}>
                            {/* Selector de columna de búsqueda */}
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
                                                className={`flex items-center gap-2 w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${column.key === searchColumn.key ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                                                    }`}
                                            >
                                                <column.icon className={`h-4 w-4 ${column.color}`} />
                                                <span className="text-sm">{column.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Input de búsqueda */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                                    placeholder={`Buscar por ${searchColumn.label.toLowerCase()}...`}
                                    className="pl-9 pr-3 py-2 border rounded-r w-64 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                />

                                {searchTerm && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
                                            setSearchApplied(false);
                                            setLastSearch(null);
                                        }}
                                        className="absolute right-10 top-1/2 -translate-y-1/2"
                                    >
                                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                    </button>
                                )}
                            </div>

                            {/* Botón de buscar */}
                            <button
                                onClick={handleSearchSubmit}
                                disabled={searchTerm.length < 2 || tableLoading}
                                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                title="Buscar"
                            >
                                <Search className="h-4 w-4" />
                                <span>Buscar</span>
                            </button>

                            {/* Sugerencias */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-10 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                                    {suggestionsLoading ? (
                                        <div className="p-3 text-center text-gray-500">
                                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                            Buscando...
                                        </div>
                                    ) : (
                                        suggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
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

                        {/* Botón para limpiar filtros */}
                        {(searchApplied || almacenFilter || dateRange.from || dateRange.to) && (
                            <button
                                onClick={handleClearFilters}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                            >
                                <X className="h-4 w-4" />
                                Limpiar filtros
                            </button>
                        )}

                        {/* Modo rápido */}
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
                {reportType && bentoMetrics.length > 0 && (
                    <div className="mb-6">
                        <BentoGrid
                            cols={5}
                            loading={statsLoading || refreshingStats}
                        >
                            {bentoMetrics.map((item: any, index: number) => {
                                const state = getBentoState(item.raw);
                                const StateIcon = bentoIcons[state];
                                const ItemIcon = item.icon;

                                return (
                                    <BentoItem
                                        key={index}
                                        title={item.title}
                                        description={item.description}
                                        icon={<StateIcon className={`w-4 h-4 ${bentoStyles[state].text}`} />}
                                        iconRight
                                        className={`border ${bentoStyles[state].bg} dark:text-gray-200 p-3 md:p-4`}
                                        loading={statsLoading || refreshingStats}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className={`text-lg md:text-xl relative font-bold ${bentoStyles[state].text} truncate`}>
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
                        </BentoGrid>

                        {/* Mensaje especial para comparación */}
                        {reportType === "comparacion" && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                <GitCompare className="h-3 w-3 inline mr-1" />
                                Comparando ventas vs compras del mismo período
                            </div>
                        )}
                    </div>
                )}

                {/* Tabla y paginación */}
                {reportType && (
                    <article className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
                        <div className="overflow-x-auto -mx-3 md:mx-0">
                            <DynamicTable
                                data={dataTable}
                                loading={tableLoading || refreshingTable}
                            />
                        </div>

                        {totalPages > 1 && !tableLoading && !refreshingTable && (
                            <div className="mt-4 md:mt-6">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    loading={tableLoading || refreshingTable}
                                    setCurrentPage={setCurrentPage}
                                />
                            </div>
                        )}

                        {/* Información sobre comparación */}
                        {reportType === "comparacion" && dataTable.length > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                    <GitCompare className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                                    <div className="text-sm text-blue-700 dark:text-blue-300">
                                        <div className="font-medium">Información del reporte comparativo:</div>
                                        <div className="mt-1">
                                            Este reporte muestra tanto ventas como compras en una sola vista.
                                            Los artículos aparecerán duplicados si tienen movimientos en ambos tipos.
                                            Use los filtros para analizar datos específicos.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </article>
                )}
            </section>
        </>
    );
}