import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGetWithFiltersMutation } from "../hooks/useMasivoQuery";
import {
    BarChart3,
    Calendar,
    Download,
    FileText,
    Info,
    Loader2,
    RefreshCcw,
    Search,
    Zap,
    DollarSign,
    Package,
    Users,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    BarChart,
    ShoppingCart,
    AlertTriangle,
    GitCompare,
    Building,
    Filter,
    X
} from "lucide-react";
import { LoadingBlock } from "@/components/loaders/block";
import { StatCard } from "../@all/components/stat-card";
import { formatValue } from "@/utils/constants/format-values";

interface SalesData {
    Codigo: string;
    Cliente: string;
    Proveedor?: string;
    Tipo?: 'VENTA' | 'COMPRA' | 'MERMA';
    Movimiento?: string;
    Articulo: string;
    Nombre: string;
    Categoria: string;
    Grupo?: string;
    Linea?: string;
    Familia?: string;
    ImporteTotal: number;
    CostoTotal: number;
    Cantidad: number;
    FechaEmision?: string;
    Almacen?: string;
    MargenArticulo?: number;
    Utilidad?: number;
    Mes?: string;
    Año?: number;
}

interface Stats {
    totalVentas?: number;
    totalCosto?: number;
    utilidad?: number;
    margen?: number;
    totalArticulos?: number;
    totalClientes?: number;
    totalProveedores?: number;
    totalMermas?: number;
    promedioMargen?: number;
    articulosConMargenBajo?: number;
}

interface Suggestion {
    value: string;
    type: 'articulo' | 'cliente' | 'proveedor' | 'categoria' | 'almacen';
}

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

type ReportType = typeof CONFIG.REPORT_TYPES[keyof typeof CONFIG.REPORT_TYPES];


const safeNumber = (v: any): number => {
    if (v == null) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const extractArrayFromResponse = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.result)) return res.result;
    return [];
};

const normalizeItem = (item: any, idx: number, reportType: ReportType): SalesData => {
    const cantidad = safeNumber(item.Cantidad ?? item.cantidad ?? 0);
    const precioUnit = safeNumber(item.PrecioUnitario ?? item.Precio ?? item.PrecioTotal ?? 0);
    const costoUnit = safeNumber(item.CostoUnitario ?? item.Costo ?? 0);
    const importe = precioUnit * cantidad;
    const costoTotal = costoUnit * cantidad;
    const margen = importe > 0 ? +(((importe - costoTotal) / importe) * 100).toFixed(2) : 0;

    const baseItem: SalesData = {
        Codigo: item.Codigo ?? `${item.Articulo ?? "NA"}-${Date.now()}-${idx}`,
        Cliente: item.Cliente ?? item.NombreCliente ?? item.Proveedor ?? "",
        Articulo: item.Articulo ?? item.articulo ?? "",
        Nombre: item.Nombre ?? item.Descripcion1 ?? item.descripcion ?? "",
        Categoria: item.Categoria ?? item.categoria ?? "",
        ImporteTotal: +importe.toFixed(2),
        CostoTotal: +costoTotal.toFixed(2),
        Cantidad: cantidad,
        FechaEmision: item.FechaEmision ?? item.fecha,
        Almacen: item.Almacen ?? item.almacen ?? "",
        MargenArticulo: margen,
        Utilidad: +(importe - costoTotal).toFixed(2),
        Mes: item.Mes,
        Año: item.Año,
        Grupo: item.Grupo,
        Linea: item.Linea,
        Familia: item.Familia
    };

    if (reportType === CONFIG.REPORT_TYPES.COMPRAS) {
        baseItem.Proveedor = item.Proveedor ?? item.NombreProveedor ?? item.proveedor ?? "";
        baseItem.Tipo = "COMPRA";
    } else if (reportType === CONFIG.REPORT_TYPES.MERMAS) {
        baseItem.Tipo = "MERMA";
        baseItem.MargenArticulo = -100;
    } else {
        baseItem.Tipo = "VENTA";
    }

    return baseItem;
};

const normalizeArray = (raw: any[], reportType: ReportType): SalesData[] => {
    return raw.map((r, i) => normalizeItem(r, i, reportType));
};

const computeStats = (data: SalesData[], reportType: ReportType): Stats => {
    const ventasData = data.filter((d) => d.Tipo !== "COMPRA" && d.Tipo !== "MERMA");
    const comprasData = data.filter((d) => d.Tipo === "COMPRA");
    const mermasData = data.filter((d) => d.Tipo === "MERMA");

    const totalVentas = ventasData.reduce((s, d) => s + (d.ImporteTotal || 0), 0);
    const totalCosto =
        ventasData.reduce((s, d) => s + (d.CostoTotal || 0), 0) + mermasData.reduce((s, d) => s + (d.CostoTotal || 0), 0);
    const utilidad = totalVentas - totalCosto;
    const margen = totalVentas > 0 ? (utilidad / totalVentas) * 100 : undefined;

    const margenes = ventasData.map((d) => d.MargenArticulo || 0).filter((m) => m > 0);
    const promedioMargen = margenes.length > 0 ? margenes.reduce((a, b) => a + b, 0) / margenes.length : undefined;

    return {
        totalVentas: isFinite(totalVentas) && totalVentas !== 0 ? +totalVentas.toFixed(2) : undefined,
        totalCosto: isFinite(totalCosto) && totalCosto !== 0 ? +totalCosto.toFixed(2) : undefined,
        utilidad: isFinite(utilidad) && (totalVentas !== 0 || totalCosto !== 0) ? +utilidad.toFixed(2) : undefined,
        margen: margen !== undefined && isFinite(margen) ? +margen.toFixed(2) : undefined,
        totalArticulos: new Set(data.map((d) => d.Articulo)).size || undefined,
        totalClientes: new Set(ventasData.map((d) => d.Cliente)).size || undefined,
        totalProveedores: reportType === CONFIG.REPORT_TYPES.COMPRAS ? new Set(comprasData.map((d) => d.Proveedor)).size || undefined : undefined,
        totalMermas: reportType === CONFIG.REPORT_TYPES.MERMAS ? mermasData.length || undefined : undefined,
        promedioMargen: promedioMargen !== undefined ? +promedioMargen.toFixed(2) : undefined,
        articulosConMargenBajo: ventasData.filter((d) => (d.MargenArticulo || 0) < CONFIG.MARGIN_WARNING).length || undefined
    };
};

const computeStatsFromAggregated = (aggregatedData: any[], reportType: ReportType): Stats => {
    if (!aggregatedData || aggregatedData.length === 0) {
        return {};
    }

    const data = aggregatedData[0];
    const has = (k: string) => Object.prototype.hasOwnProperty.call(data, k);

    const totalVentas = has("totalVentas") ? safeNumber(data.totalVentas) : undefined;
    const totalCosto = has("totalCosto") ? safeNumber(data.totalCosto) : undefined;
    const totalArticulos = has("totalArticulos") ? safeNumber(data.totalArticulos) : undefined;
    const totalClientes = has("totalClientes") ? safeNumber(data.totalClientes) : undefined;
    const totalProveedores = has("totalProveedores") ? safeNumber(data.totalProveedores) : undefined;
    const totalMermas = has("totalMermas") ? safeNumber(data.totalMermas) : undefined;

    const utilidad =
        totalVentas !== undefined && totalCosto !== undefined ? totalVentas - totalCosto : undefined;
    const margen = totalVentas !== undefined && totalCosto !== undefined && totalVentas > 0 ? (utilidad! / totalVentas) * 100 : undefined;

    const out: Stats = {};

    if (totalVentas !== undefined) out.totalVentas = +totalVentas.toFixed(2);
    if (totalCosto !== undefined) out.totalCosto = +totalCosto.toFixed(2);
    if (utilidad !== undefined) out.utilidad = +utilidad.toFixed(2);
    if (margen !== undefined) out.margen = +margen.toFixed(2);
    if (totalArticulos !== undefined) out.totalArticulos = safeNumber(totalArticulos);
    if (totalClientes !== undefined) out.totalClientes = safeNumber(totalClientes);
    if (totalProveedores !== undefined) out.totalProveedores = safeNumber(totalProveedores);
    if (totalMermas !== undefined) out.totalMermas = safeNumber(totalMermas);

    return out;
};

const mergeStatsSafely = (...statsList: (Stats | undefined)[]): Stats => {
    const out: Stats = {};

    statsList.forEach((s) => {
        if (!s) return;

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

    // Limpiar valores cero
    Object.keys(out).forEach((key) => {
        if (out[key as keyof Stats] === 0) {
            delete out[key as keyof Stats];
        }
    });

    return out;
};

const getReportQuery = (
    reportType: ReportType,
    fechaInicio: string,
    fechaFin: string,
    searchTerm?: string,
    almacenFilter?: string
) => {
    const baseQueries: Record<string, any> = {
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
            ]
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
            ]
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
            ]
        }
    };

    const config: any = baseQueries[reportType] || baseQueries.ventas;
    const filtros: Array<{ Key: string; Operator: string; Value: string }> = [];

    // Filtros por tipo de reporte
    if (reportType === "ventas") {
        filtros.push(
            { Key: "venta.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
            { Key: "venta.Mov", Operator: "IN", Value: 'Factura,Factura Credito,Nota' }
        );
    } else if (reportType === "compras") {
        filtros.push(
            { Key: "compra.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
            { Key: "compra.Mov", Operator: "=", Value: "ENTRADA COMPRA" }
        );
    } else if (reportType === "mermas") {
        filtros.push(
            { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
            { Key: "inv.Concepto", Operator: "LIKE", Value: "MERMAS" }
        );
    }

    // Filtros de fechas
    if (fechaInicio && fechaFin) {
        const fechaKey = reportType === "ventas" ? "venta.FechaEmision" :
            reportType === "compras" ? "compra.FechaEmision" :
                "inv.FechaEmision";
        filtros.push(
            { Key: fechaKey, Operator: ">=", Value: fechaInicio },
            { Key: fechaKey, Operator: "<=", Value: fechaFin }
        );
    }

    // Filtro de almacén
    if (almacenFilter) {
        const almacenKey = reportType === "ventas" ? "ventad.Almacen" :
            reportType === "compras" ? "comprad.Almacen" :
                "inv.Sucursal";
        filtros.push({
            Key: almacenKey,
            Operator: "=",
            Value: almacenFilter
        });
    }

    // Filtro de búsqueda
    if (searchTerm?.trim()) {
        const term = searchTerm.trim();
        const searchKey = reportType === "ventas" ? "ART.Descripcion1" :
            reportType === "compras" ? "ART.Descripcion1" :
                "art.Descripcion1";

        filtros.push({
            Key: searchKey,
            Operator: "LIKE",
            Value: `%${term}%`
        });
    }

    return {
        tableQuery: {
            table: config.table.trim(),
            Filtros: {
                selects: config.selects,
                Filtros: filtros,
                groupBy: [],
                order: [{
                    Key: reportType === "ventas" ? "venta.FechaEmision" :
                        reportType === "compras" ? "compra.FechaEmision" :
                            "inv.FechaEmision",
                    Direction: "desc"
                }]
            }
        },
        statsQuery: {
            table: config.table.trim(),
            Filtros: {
                Agregaciones: config.agregaciones,
                Filtros: filtros,
                groupBy: []
            }
        }
    };
};

const getSuggestionsQuery = (reportType: ReportType, searchTerm: string) => {
    const baseTable = reportType === "ventas"
        ? `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo INNER JOIN Cte AS C ON venta.Cliente = C.Cliente`
        : reportType === "compras"
            ? `COMPRA AS compra INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor`
            : `INV AS inv INNER JOIN INVD AS invd ON invd.ID = inv.ID INNER JOIN Art AS art ON art.Articulo = invd.Articulo`;

    const selects = [];

    if (reportType === "ventas") {
        selects.push(
            { Key: "ART.Descripcion1", Alias: "articulo" },
            { Key: "C.Nombre", Alias: "cliente" },
            { Key: "ART.Categoria", Alias: "categoria" },
            { Key: "ventad.Almacen", Alias: "almacen" }
        );
    } else if (reportType === "compras") {
        selects.push(
            { Key: "ART.Descripcion1", Alias: "articulo" },
            { Key: "P.Nombre", Alias: "proveedor" },
            { Key: "ART.Categoria", Alias: "categoria" },
            { Key: "comprad.Almacen", Alias: "almacen" }
        );
    } else {
        selects.push(
            { Key: "art.Descripcion1", Alias: "articulo" },
            { Key: "art.Categoria", Alias: "categoria" },
            { Key: "inv.Sucursal", Alias: "almacen" }
        );
    }

    const filtros = [];

    if (searchTerm.trim()) {
        filtros.push({
            Key: `ART.Descripcion1`,
            Operator: "LIKE",
            Value: searchTerm
        });
    }

    return {
        table: baseTable,
        Filtros: {
            selects,
            Filtros: filtros,
            groupBy: selects.map(s => s.Key),
            order: [{ Key: selects[0].Key, Direction: "asc" }]
        }
    };
};

export const EnhancedSalesReport: React.FC<{
    fechaInicio: string;
    fechaFin: string;
    initialReportType?: ReportType;
    showComparison?: boolean;
}> = ({ fechaInicio, fechaFin, initialReportType = CONFIG.REPORT_TYPES.VENTAS, showComparison = false }) => {
    const [postData, { error: mutationError, isLoading: mutationLoading }] = useGetWithFiltersMutation();

    // Estados principales
    const [activeReport, setActiveReport] = useState<ReportType>(initialReportType);
    const [salesData, setSalesData] = useState<SalesData[]>([]);
    const [mergedAllData, setMergedAllData] = useState<SalesData[] | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [comparisonStats, setComparisonStats] = useState<Stats | null>(null);
    const [fullComparisonStats, setFullComparisonStats] = useState<{ ventas?: Stats; compras?: Stats; mermas?: Stats } | null>(null);
    const [consolidatedStats, setConsolidatedStats] = useState<Stats | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [almacenFilter, setAlmacenFilter] = useState<string>("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [almacenes, setAlmacenes] = useState<string[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [quickMode, setQuickMode] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);

    // Errores
    const [apiError, setApiError] = useState<string | null>(null);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [comparisonError, setComparisonError] = useState<string | null>(null);

    // Refs
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFetchingTableRef = useRef(false);
    const isFetchingStatsRef = useRef(false);
    const isFetchingComparisonRef = useRef(false);
    const mountedRef = useRef(true);

    // Cleanup
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    // Cargar almacenes
    const loadAlmacenes = useCallback(async () => {
        try {
            const table = activeReport === "ventas"
                ? "VENTAD"
                : activeReport === "compras"
                    ? "COMPRAD"
                    : "INV";
            const campoAlmacen = activeReport === "mermas" ? "Sucursal" : "Almacen";

            const res = await postData({
                table: `${table}`,
                filtros: {
                    selects: [],
                    Filtros: [],
                    Agregaciones: [{ Key: campoAlmacen, Alias: "almacen", Operation: "DISTINCT" }],
                    //groupBy: [campoAlmacen],
                    order: [{ Key: campoAlmacen, Direction: "asc" }]
                },
                page: 1,
                pageSize: 100,
                tag: "almacenes"
            }).unwrap();

            const raw = extractArrayFromResponse(res);
            const almacenesList = raw
                .map((item: any) => item.almacen)
                .filter((almacen: string) => almacen && almacen.trim() !== "")
                .sort();

            if (mountedRef.current) {
                setAlmacenes(Array.from(new Set(almacenesList)));
            }
        } catch (error) {
            console.error("Error al cargar almacenes:", error);
        }
    }, [activeReport, postData]);

    // Cargar sugerencias
    const loadSuggestions = useCallback(async (term: string) => {
        if (term.length < 2) {
            setSuggestions([]);
            return;
        }

        setSuggestionsLoading(true);
        try {
            const query = getSuggestionsQuery(activeReport, term);

            const res = await postData({
                table: query.table,
                filtros: query.Filtros,
                page: 1,
                pageSize: 10,
                tag: "suggestions"
            }).unwrap();

            const raw = extractArrayFromResponse(res);
            const suggestionsList: Suggestion[] = [];

            raw.forEach((item: any) => {
                if (item.articulo) {
                    suggestionsList.push({ value: item.articulo, type: 'articulo' });
                }
                if (item.cliente) {
                    suggestionsList.push({ value: item.cliente, type: 'cliente' });
                }
                if (item.proveedor) {
                    suggestionsList.push({ value: item.proveedor, type: 'proveedor' });
                }
                if (item.categoria) {
                    suggestionsList.push({ value: item.categoria, type: 'categoria' });
                }
                if (item.almacen) {
                    suggestionsList.push({ value: item.almacen, type: 'almacen' });
                }
            });

            // Eliminar duplicados
            const uniqueSuggestions = suggestionsList.reduce((acc: Suggestion[], current) => {
                const exists = acc.find(item => item.value === current.value && item.type === current.type);
                if (!exists) {
                    acc.push(current);
                }
                return acc;
            }, []);

            if (mountedRef.current) {
                setSuggestions(uniqueSuggestions.slice(0, 10));
            }
        } catch (error) {
            console.error("Error al cargar sugerencias:", error);
        } finally {
            setSuggestionsLoading(false);
        }
    }, [activeReport, postData]);

    // Debounce para búsqueda
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            if (value.length >= 2) {
                loadSuggestions(value);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);
    }, [loadSuggestions]);

    // Clic fuera para cerrar sugerencias
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
                searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Generar queries
    const { tableQuery, statsQuery } = useMemo(
        () => getReportQuery(activeReport, fechaInicio, fechaFin, searchTerm, almacenFilter),
        [activeReport, fechaInicio, fechaFin, searchTerm, almacenFilter]
    );

    // Cargar estadísticas
    const loadStats = useCallback(async () => {
        if (!fechaInicio || !fechaFin || isFetchingStatsRef.current) return;
        if (activeReport === CONFIG.REPORT_TYPES.COMPARACION) return;

        isFetchingStatsRef.current = true;
        setStatsLoading(true);
        setStatsError(null);

        try {
            const { statsQuery: sq } = getReportQuery(activeReport, fechaInicio, fechaFin, searchTerm, almacenFilter);

            const res = await postData({
                table: sq.table,
                filtros: sq.Filtros,
                page: 1,
                pageSize: 1,
                tag: `${activeReport}-stats`
            }).unwrap();

            const raw = extractArrayFromResponse(res);
            const statsData = computeStatsFromAggregated(raw, activeReport);
            if (mountedRef.current) setStats(statsData);
        } catch (err: any) {
            const msg = err?.data?.details ?? err?.details ?? "Error al cargar estadísticas";
            if (mountedRef.current) {
                setStatsError(String(msg));
                setStats(null);
            }
        } finally {
            isFetchingStatsRef.current = false;
            if (mountedRef.current) setStatsLoading(false);
        }
    }, [fechaInicio, fechaFin, activeReport, postData, searchTerm, almacenFilter]);

    // Cargar tabla por tipo
    const loadTableData = useCallback(async () => {
        if (!fechaInicio || !fechaFin || isFetchingTableRef.current) return;
        if (activeReport === CONFIG.REPORT_TYPES.COMPARACION) return;

        isFetchingTableRef.current = true;
        setTableLoading(true);
        setApiError(null);

        try {
            const { tableQuery: tq } = getReportQuery(activeReport, fechaInicio, fechaFin, searchTerm, almacenFilter);

            const res = await postData({
                table: tq.table,
                filtros: tq.Filtros,
                page: currentPage,
                pageSize: CONFIG.PAGE_SIZE,
                tag: `${activeReport}-table`
            }).unwrap();

            const raw = extractArrayFromResponse(res);
            const normalized = normalizeArray(raw, activeReport);

            const pages = res?.totalPages ?? Math.max(1, Math.ceil((raw?.length ?? normalized.length) / CONFIG.PAGE_SIZE));

            if (mountedRef.current) {
                setSalesData(normalized);
                setTotalPages(pages);
                if (!statsLoading && !stats) {
                    const calculatedStats = computeStats(normalized, activeReport);
                    setStats(calculatedStats);
                }
            }
        } catch (err: any) {
            const msg = err?.data?.details ?? err?.details ?? "Error al cargar tabla";
            if (mountedRef.current) {
                setApiError(String(msg));
                setSalesData([]);
                setCurrentPage(1);
            }
        } finally {
            isFetchingTableRef.current = false;
            if (mountedRef.current) setTableLoading(false);
        }
    }, [fechaInicio, fechaFin, currentPage, activeReport, postData, statsLoading, stats, searchTerm, almacenFilter]);

    // Cargar datos comparativos
    const loadComparisonData = useCallback(async () => {
        if (!fechaInicio || !fechaFin || isFetchingComparisonRef.current) return;

        isFetchingComparisonRef.current = true;
        setComparisonLoading(true);
        setComparisonError(null);

        try {
            const types: ReportType[] = [CONFIG.REPORT_TYPES.VENTAS, CONFIG.REPORT_TYPES.COMPRAS, CONFIG.REPORT_TYPES.MERMAS];
            const queries = types.map((t) => {
                const { statsQuery: sq } = getReportQuery(t, fechaInicio, fechaFin,
                    activeReport === CONFIG.REPORT_TYPES.COMPARACION ? searchTerm : undefined,
                    activeReport === CONFIG.REPORT_TYPES.COMPARACION ? almacenFilter : undefined
                );
                return postData({
                    table: sq.table,
                    filtros: sq.Filtros,
                    page: 1,
                    pageSize: 1,
                    tag: `${t}-comparison`
                })
                    .unwrap()
                    .then((res: any) => ({ type: t, res }));
            });

            const results = await Promise.all(queries);

            const statsByType: { [k in ReportType]?: Stats } = {};

            for (const r of results) {
                const raw = extractArrayFromResponse(r.res);
                statsByType[r.type] = computeStatsFromAggregated(raw, r.type);
            }

            const comparisonType = activeReport === CONFIG.REPORT_TYPES.VENTAS ? CONFIG.REPORT_TYPES.COMPRAS : CONFIG.REPORT_TYPES.VENTAS;
            const comparison = statsByType[comparisonType] ?? null;

            if (mountedRef.current) {
                setComparisonStats(comparison || null);
                setFullComparisonStats({
                    ventas: statsByType[CONFIG.REPORT_TYPES.VENTAS],
                    compras: statsByType[CONFIG.REPORT_TYPES.COMPRAS],
                    mermas: statsByType[CONFIG.REPORT_TYPES.MERMAS]
                });

                const consolidated = mergeStatsSafely(
                    statsByType[CONFIG.REPORT_TYPES.VENTAS],
                    statsByType[CONFIG.REPORT_TYPES.COMPRAS],
                    statsByType[CONFIG.REPORT_TYPES.MERMAS]
                );
                setConsolidatedStats(consolidated);
            }
        } catch (err: any) {
            const msg = err?.data?.message ?? err?.message ?? "Error al cargar comparación";
            if (mountedRef.current) {
                setComparisonError(String(msg));
                setComparisonStats(null);
                setFullComparisonStats(null);
                setConsolidatedStats(null);
            }
        } finally {
            isFetchingComparisonRef.current = false;
            if (mountedRef.current) setComparisonLoading(false);
        }
    }, [fechaInicio, fechaFin, activeReport, postData, searchTerm, almacenFilter]);

    // Cargar tabla fusionada para comparación
    const loadMergedTableData = useCallback(async () => {
        if (!fechaInicio || !fechaFin || isFetchingTableRef.current) return;

        isFetchingTableRef.current = true;
        setTableLoading(true);
        setApiError(null);

        try {
            const types: ReportType[] = [CONFIG.REPORT_TYPES.VENTAS, CONFIG.REPORT_TYPES.COMPRAS, CONFIG.REPORT_TYPES.MERMAS];

            const pageSizeForMerge = quickMode ? 500 : 2000;
            const queries = types.map((t) => {
                const { tableQuery: tq } = getReportQuery(t, fechaInicio, fechaFin, searchTerm, almacenFilter);
                return postData({
                    table: tq.table,
                    filtros: tq.Filtros,
                    page: 1,
                    pageSize: pageSizeForMerge,
                    tag: `${t}-merged-table`
                })
                    .unwrap()
                    .then((res: any) => ({ type: t, res }));
            });

            const results = await Promise.all(queries);

            let merged: SalesData[] = [];
            for (const r of results) {
                const raw = extractArrayFromResponse(r.res);
                const normalized = normalizeArray(raw, r.type);
                const marked: any = normalized.map((n) => ({
                    ...n,
                    Tipo: r.type === CONFIG.REPORT_TYPES.COMPRAS ? "COMPRA" :
                        r.type === CONFIG.REPORT_TYPES.MERMAS ? "MERMA" : "VENTA"
                }));
                merged = merged.concat(marked);
            }

            merged.sort((a, b) => {
                if (!a.FechaEmision && !b.FechaEmision) return 0;
                if (!a.FechaEmision) return 1;
                if (!b.FechaEmision) return -1;
                return new Date(b.FechaEmision).getTime() - new Date(a.FechaEmision).getTime();
            });

            if (mountedRef.current) {
                setMergedAllData(merged);
                const pages = Math.max(1, Math.ceil(merged.length / CONFIG.PAGE_SIZE));
                setTotalPages(pages);
                setCurrentPage(1);
                setSalesData(merged.slice(0, CONFIG.PAGE_SIZE));
                const calc = computeStats(merged, CONFIG.REPORT_TYPES.COMPARACION);
                setStats(calc);
            }
        } catch (err: any) {
            const msg = err?.data?.message ?? err?.message ?? "Error al cargar tabla fusionada";
            if (mountedRef.current) {
                setApiError(String(msg));
                setMergedAllData(null);
                setSalesData([]);
                setCurrentPage(1);
            }
        } finally {
            isFetchingTableRef.current = false;
            if (mountedRef.current) setTableLoading(false);
        }
    }, [fechaInicio, fechaFin, postData, quickMode, searchTerm, almacenFilter]);

    // Efecto principal
    useEffect(() => {
        if (!fechaInicio || !fechaFin) return;

        setApiError(null);
        setStatsError(null);
        setComparisonError(null);

        loadAlmacenes();

        if (activeReport === CONFIG.REPORT_TYPES.COMPARACION) {
            loadComparisonData();
            loadMergedTableData();
            return;
        }

        loadStats();
        loadTableData();
        if (showComparison) {
            loadComparisonData();
        }
    }, [fechaInicio, fechaFin, activeReport, currentPage, showComparison, quickMode, searchTerm, almacenFilter]);

    // Paginación para datos fusionados
    useEffect(() => {
        if (activeReport !== CONFIG.REPORT_TYPES.COMPARACION) return;
        if (!mergedAllData) return;

        const pages = Math.max(1, Math.ceil(mergedAllData.length / CONFIG.PAGE_SIZE));
        setTotalPages(pages);
        const start = (currentPage - 1) * CONFIG.PAGE_SIZE;
        const pageSlice = mergedAllData.slice(start, start + CONFIG.PAGE_SIZE);
        setSalesData(pageSlice);
    }, [activeReport, mergedAllData, currentPage]);

    // Handlers
    const handleSuggestionSelect = (suggestion: Suggestion) => {
        setSearchTerm(suggestion.value);
        setShowSuggestions(false);

        if (suggestion.type === 'almacen') {
            setAlmacenFilter(suggestion.value);
            setSearchTerm("");
        }
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setAlmacenFilter("");
        setCurrentPage(1);
    };

    const handleRefresh = useCallback(() => {
        if (activeReport === CONFIG.REPORT_TYPES.COMPARACION) {
            loadComparisonData();
            loadMergedTableData();
        } else {
            loadStats();
            loadTableData();
            if (showComparison) loadComparisonData();
        }
    }, [activeReport, loadComparisonData, loadMergedTableData, loadStats, loadTableData, showComparison]);

    const handleReportChange = useCallback((reportType: ReportType) => {
        setActiveReport(reportType);
        setCurrentPage(1);
        setSalesData([]);
        setMergedAllData(null);
        setStats(null);
        setComparisonStats(null);
        setFullComparisonStats(null);
        setConsolidatedStats(null);
        setSearchTerm("");
    }, []);

    // Helper functions
    const getReportTitle = () => {
        const titles: Record<ReportType, string> = {
            ventas: "Reporte de Ventas",
            compras: "Reporte de Compras",
            mermas: "Reporte de Mermas",
            comparacion: "Comparación: Ventas / Compras / Mermas"
        };
        return titles[activeReport] || "Reporte";
    };

    const getReportIcon = () => {
        const icons: Record<ReportType, React.ReactNode> = {
            ventas: <BarChart3 className="h-6 w-6 text-blue-600" />,
            compras: <ShoppingCart className="h-6 w-6 text-green-600" />,
            mermas: <AlertTriangle className="h-6 w-6 text-red-600" />,
            comparacion: <GitCompare className="h-6 w-6 text-purple-600" />
        };
        return icons[activeReport] || <BarChart3 className="h-6 w-6 text-blue-600" />;
    };

    const areStatsLoading = useMemo(() => {
        if (activeReport === CONFIG.REPORT_TYPES.COMPARACION) {
            return comparisonLoading || mutationLoading;
        }
        return statsLoading || mutationLoading;
    }, [activeReport, statsLoading, comparisonLoading, mutationLoading]);

    // Render comparación
    const renderComparisonGrid = () => {
        if (!fullComparisonStats) return null;

        const diffBlock = (label: string, a?: number, b?: number) => {
            if (a === undefined || b === undefined) return null;
            const diff = a - b;
            const positive = diff > 0;
            return (
                <div className="text-sm">
                    <div className="text-gray-600">{label}:</div>
                    <div className={`font-semibold ${positive ? "text-green-600" : "text-red-600"}`}>
                        ${Math.abs(diff).toLocaleString()}
                    </div>
                </div>
            );
        };

        const v = fullComparisonStats.ventas;
        const c = fullComparisonStats.compras;
        const m = fullComparisonStats.mermas;

        return (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <div className="flex items-center gap-2 mb-3">
                    <GitCompare className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Comparación (Ventas / Compras / Mermas)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded border">
                        <div className="text-sm font-medium mb-2">Ventas vs Compras</div>
                        {diffBlock("Diferencia en Ventas", v?.totalVentas, c?.totalVentas)}
                        {diffBlock("Diferencia en Utilidad", v?.utilidad, c?.utilidad)}
                        {v?.margen !== undefined && c?.margen !== undefined && (
                            <div className="text-sm">
                                <div className="text-gray-600">Diferencia en Margen:</div>
                                <div className={`font-semibold ${v.margen > c.margen ? "text-green-600" : "text-red-600"}`}>
                                    {Math.abs(v.margen - c.margen).toFixed(2)}%
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-white rounded border">
                        <div className="text-sm font-medium mb-2">Ventas vs Mermas</div>
                        {diffBlock("Diferencia en Ventas", v?.totalVentas, m?.totalVentas)}
                        {diffBlock("Diferencia en Utilidad", v?.utilidad, m?.utilidad)}
                        {v?.margen !== undefined && m?.margen !== undefined && (
                            <div className="text-sm">
                                <div className="text-gray-600">Diferencia en Margen:</div>
                                <div className={`font-semibold ${v.margen > m.margen ? "text-green-600" : "text-red-600"}`}>
                                    {Math.abs(v.margen - m.margen).toFixed(2)}%
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-white rounded border">
                        <div className="text-sm font-medium mb-2">Compras vs Mermas</div>
                        {diffBlock("Diferencia en Ventas", c?.totalVentas, m?.totalVentas)}
                        {diffBlock("Diferencia en Utilidad", c?.utilidad, m?.utilidad)}
                        {c?.margen !== undefined && m?.margen !== undefined && (
                            <div className="text-sm">
                                <div className="text-gray-600">Diferencia en Margen:</div>
                                <div className={`font-semibold ${c.margen > m.margen ? "text-green-600" : "text-red-600"}`}>
                                    {Math.abs(c.margen - m.margen).toFixed(2)}%
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {consolidatedStats && (
                    <div className="mt-4 p-3 bg-white rounded border">
                        <div className="text-sm font-medium mb-2">Consolidado (suma segura)</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {consolidatedStats.totalVentas !== undefined && <div>Ventas: <b>${consolidatedStats.totalVentas.toLocaleString()}</b></div>}
                            {consolidatedStats.totalCosto !== undefined && <div>Costo: <b>${consolidatedStats.totalCosto.toLocaleString()}</b></div>}
                            {consolidatedStats.utilidad !== undefined && <div>Utilidad: <b>${consolidatedStats.utilidad.toLocaleString()}</b></div>}
                            {consolidatedStats.margen !== undefined && <div>Margen: <b>{consolidatedStats.margen.toFixed(2)}%</b></div>}
                            {consolidatedStats.totalArticulos !== undefined && <div>Artículos: <b>{consolidatedStats.totalArticulos}</b></div>}
                            {consolidatedStats.totalClientes !== undefined && <div>Clientes: <b>{consolidatedStats.totalClientes}</b></div>}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        {getReportIcon()}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">{getReportTitle()}</h3>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{fechaInicio || "—"} {fechaInicio && fechaFin ? `— ${fechaFin}` : ""}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    {/* Selector de tipo de reporte */}
                    <div className="flex gap-2">
                        {Object.values(CONFIG.REPORT_TYPES).map((type) => {
                            const label = type === CONFIG.REPORT_TYPES.COMPARACION ? "Comparación" :
                                type.charAt(0).toUpperCase() + type.slice(1);
                            return (
                                <button
                                    key={type}
                                    onClick={() => handleReportChange(type)}
                                    className={`px-3 py-2 rounded text-sm font-medium ${activeReport === type ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex gap-3">
                        {/* Filtro de almacén */}
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                                value={almacenFilter}
                                onChange={(e) => setAlmacenFilter(e.target.value)}
                                className="pl-9 pr-8 py-2 border rounded bg-white appearance-none"
                            >
                                <option value="">Todos los almacenes</option>
                                {almacenes.map((almacen) => (
                                    <option key={almacen} value={almacen}>
                                        {almacen}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Búsqueda con autocompletado */}
                        <div className="relative" ref={suggestionsRef}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                                placeholder={`Buscar ${activeReport === CONFIG.REPORT_TYPES.COMPRAS ? "proveedor" : "cliente"}, artículo...`}
                                className="pl-9 pr-3 py-2 border rounded w-64"
                            />

                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
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
                                                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
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
                                className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Limpiar
                            </button>
                        )}

                        <button
                            onClick={() => setQuickMode((q) => !q)}
                            className={`px-3 py-2 rounded flex items-center gap-2 ${quickMode ? "bg-blue-600 text-white" : "bg-gray-100"}`}
                        >
                            <Zap className="h-4 w-4" />
                            {quickMode ? "Modo rápido" : "Modo normal"}
                        </button>

                        <button
                            onClick={handleRefresh}
                            disabled={tableLoading || areStatsLoading || comparisonLoading}
                            className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-60 flex items-center gap-2"
                        >
                            {(tableLoading || areStatsLoading || comparisonLoading) ?
                                <Loader2 className="h-4 w-4 animate-spin" /> :
                                <RefreshCcw className="h-4 w-4" />
                            }
                            Actualizar
                        </button>

                        <button
                            onClick={() => { /* export */ }}
                            disabled={!(salesData.length || consolidatedStats)}
                            className="px-3 py-2 bg-purple-600 text-white rounded disabled:opacity-60 flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Exportar
                        </button>
                    </div>
                </div>
            </div>

            {/* Mostrar filtros activos */}
            {(searchTerm || almacenFilter) && (
                <div className="flex flex-wrap gap-2 items-center text-sm">
                    <span className="text-gray-600">Filtros activos:</span>
                    {almacenFilter && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            Almacén: {almacenFilter}
                            <button onClick={() => setAlmacenFilter("")} className="ml-1 hover:text-blue-600">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {searchTerm && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded flex items-center gap-1">
                            <Search className="h-3 w-3" />
                            Búsqueda: {searchTerm}
                            <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-green-600">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* Errores */}
            {apiError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-1" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                            <div className="font-semibold text-red-700">Error en Datos</div>
                            <div className="flex gap-2">
                                <button onClick={() => setApiError(null)} className="px-2 py-1 bg-white border rounded text-sm text-gray-700">Cerrar</button>
                                <button onClick={handleRefresh} disabled={tableLoading} className="px-2 py-1 bg-red-600 text-white rounded text-sm disabled:opacity-60">Reintentar</button>
                            </div>
                        </div>
                        <div className="text-sm text-red-600 mt-1">{apiError}</div>
                    </div>
                </div>
            )}

            {statsError && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-1" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                            <div className="font-semibold text-yellow-700">Error en Estadísticas</div>
                            <div className="flex gap-2">
                                <button onClick={() => setStatsError(null)} className="px-2 py-1 bg-white border rounded text-sm text-gray-700">Cerrar</button>
                                <button onClick={loadStats} disabled={statsLoading} className="px-2 py-1 bg-yellow-600 text-white rounded text-sm disabled:opacity-60">Reintentar</button>
                            </div>
                        </div>
                        <div className="text-sm text-yellow-600 mt-1">{statsError}</div>
                    </div>
                </div>
            )}

            {/* Validación de fechas */}
            {(!fechaInicio || !fechaFin) && (
                <div className="p-2 bg-yellow-50 border border-yellow-100 rounded text-sm text-yellow-800">
                    Por favor selecciona fecha de inicio y fecha fin para consultar el reporte.
                </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {activeReport === CONFIG.REPORT_TYPES.COMPARACION ? (
                    consolidatedStats ? (
                        <>
                            {consolidatedStats.totalVentas !== undefined && (
                                <StatCard
                                    title="Total Ventas (Consolidado)"
                                    value={`$ ${consolidatedStats.totalVentas.toLocaleString()}`}
                                    icon={<DollarSign className="h-4 w-4" />}
                                    subtext="Ventas brutas"
                                    isLoading={areStatsLoading}
                                    variant="success"
                                />
                            )}
                            {consolidatedStats.totalCosto !== undefined && (
                                <StatCard
                                    title="Total Costo (Consolidado)"
                                    value={`$ ${consolidatedStats.totalCosto.toLocaleString()}`}
                                    icon={<Package className="h-4 w-4" />}
                                    subtext="Costos asociados"
                                    isLoading={areStatsLoading}
                                    variant="default"
                                />
                            )}
                            {consolidatedStats.utilidad !== undefined && (
                                <StatCard
                                    title="Utilidad (Consolidado)"
                                    value={`$ ${consolidatedStats.utilidad.toLocaleString()}`}
                                    icon={<TrendingUp className="h-4 w-4" />}
                                    subtext="Ventas - Costos"
                                    isLoading={areStatsLoading}
                                    variant={consolidatedStats.utilidad >= 0 ? "success" : "danger"}
                                />
                            )}
                            {consolidatedStats.margen !== undefined && (
                                <StatCard
                                    title="Margen (Consolidado)"
                                    value={`${consolidatedStats.margen.toFixed(2)}%`}
                                    icon={<BarChart className="h-4 w-4" />}
                                    subtext="(Utilidad / Ventas)"
                                    isLoading={areStatsLoading}
                                    variant={consolidatedStats.margen >= 20 ? "success" : consolidatedStats.margen >= 10 ? "warning" : "danger"}
                                />
                            )}
                            {consolidatedStats.totalArticulos !== undefined && (
                                <StatCard
                                    title="Artículos (Consolidado)"
                                    value={formatValue(consolidatedStats.totalArticulos, 'number')}
                                    icon={<Package className="h-4 w-4" />}
                                    subtext="Productos únicos"
                                    isLoading={areStatsLoading}
                                    variant="info"
                                />
                            )}
                            {consolidatedStats.totalClientes !== undefined && (
                                <StatCard
                                    title="Clientes (Consolidado)"
                                    value={consolidatedStats.totalClientes}
                                    icon={<Users className="h-4 w-4" />}
                                    subtext="Clientes únicos"
                                    isLoading={areStatsLoading}
                                    variant="info"
                                />
                            )}
                        </>
                    ) : areStatsLoading ? (
                        <>
                            {[...Array(6)].map((_, i) => (
                                <StatCard key={i} title="Cargando..." value="—" isLoading={true} />
                            ))}
                        </>
                    ) : (
                        <div className="col-span-6 p-3 bg-yellow-50 border rounded text-sm text-yellow-800">
                            No hay datos consolidados disponibles para las fechas seleccionadas.
                        </div>
                    )
                ) : (
                    <>
                        {stats?.totalVentas !== undefined && (
                            <StatCard
                                title={activeReport === CONFIG.REPORT_TYPES.COMPRAS ? "Total Compras" : "Total Ventas"}
                                value={`$ ${stats.totalVentas.toLocaleString()}`}
                                icon={<DollarSign className="h-4 w-4" />}
                                subtext={activeReport === CONFIG.REPORT_TYPES.COMPRAS ? "Costos totales" : "Ventas brutas"}
                                isLoading={areStatsLoading}
                                variant={activeReport === CONFIG.REPORT_TYPES.COMPRAS ? "info" : "success"}
                            />
                        )}

                        {stats?.totalCosto !== undefined && (
                            <StatCard
                                title="Total Costo"
                                value={`$ ${stats.totalCosto.toLocaleString()}`}
                                icon={<Package className="h-4 w-4" />}
                                subtext="Costos asociados"
                                isLoading={areStatsLoading}
                                variant="default"
                            />
                        )}

                        {stats?.utilidad !== undefined && (
                            <StatCard
                                title="Utilidad"
                                value={`$ ${stats.utilidad.toLocaleString()}`}
                                icon={<TrendingUp className="h-4 w-4" />}
                                subtext="Ventas - Costos"
                                isLoading={areStatsLoading}
                                variant={stats.utilidad >= 0 ? "success" : "danger"}
                                trend={stats?.utilidad !== undefined && comparisonStats?.utilidad !== undefined ?
                                    (stats.utilidad > comparisonStats.utilidad! ? "up" : "down") : undefined}
                                trendValue={stats?.utilidad !== undefined && comparisonStats?.utilidad !== undefined && comparisonStats.utilidad! !== 0 ?
                                    ((stats.utilidad - comparisonStats.utilidad!) / Math.abs(comparisonStats.utilidad!)) * 100 : undefined}
                            />
                        )}

                        {stats?.margen !== undefined && (
                            <StatCard
                                title="Margen"
                                value={`${stats.margen.toFixed(2)}%`}
                                icon={<BarChart className="h-4 w-4" />}
                                subtext="(Utilidad / Ventas)"
                                isLoading={areStatsLoading}
                                variant={stats.margen >= 20 ? "success" : stats.margen >= 10 ? "warning" : "danger"}
                            />
                        )}

                        {stats?.totalArticulos !== undefined && (
                            <StatCard
                                title="Artículos"
                                value={formatValue(stats.totalArticulos, 'number')}
                                icon={<Package className="h-4 w-4" />}
                                subtext="Productos únicos"
                                isLoading={areStatsLoading}
                                variant="info"
                            />
                        )}

                        {(stats?.totalProveedores !== undefined || stats?.totalClientes !== undefined) && (
                            <StatCard
                                title={activeReport === CONFIG.REPORT_TYPES.COMPRAS ? "Proveedores" : "Clientes"}
                                value={activeReport === CONFIG.REPORT_TYPES.COMPRAS ?
                                    (formatValue(stats.totalProveedores, 'number') || 0) :
                                    (formatValue(stats.totalClientes, 'number') || 0)}
                                icon={<Users className="h-4 w-4" />}
                                subtext={activeReport === CONFIG.REPORT_TYPES.COMPRAS ? "Proveedores únicos" : "Clientes únicos"}
                                isLoading={areStatsLoading}
                                variant="info"
                            />
                        )}
                    </>
                )}
            </div>

            {/* Comparación */}
            {(showComparison || activeReport === CONFIG.REPORT_TYPES.COMPARACION) && fullComparisonStats && renderComparisonGrid()}

            {/* Tabla */}
            <div className="bg-white rounded shadow-sm border overflow-hidden">
                {tableLoading && salesData.length === 0 ? (
                    <LoadingBlock message={activeReport === CONFIG.REPORT_TYPES.COMPARACION ? "Cargando tabla fusionada..." : "Cargando datos de tabla..."} />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-4 py-3">Tipo</th>
                                        <th className="text-left px-4 py-3">Artículo</th>
                                        <th className="text-left px-4 py-3">{activeReport === CONFIG.REPORT_TYPES.COMPRAS ? "Proveedor" : "Cliente"}</th>
                                        <th className="text-center px-4 py-3">Cantidad</th>
                                        <th className="text-right px-4 py-3">Importe</th>
                                        <th className="text-center px-4 py-3">Margen</th>
                                        <th className="text-left px-4 py-3">Fecha</th>
                                        <th className="text-left px-4 py-3">Almacén</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {salesData.map((item) => (
                                        <tr key={item.Codigo} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${item.Tipo === "VENTA" ? "bg-blue-100 text-blue-700" : item.Tipo === "COMPRA" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                    {item.Tipo}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="font-medium">{item.Articulo}</div>
                                                <div className="text-xs text-gray-500">{item.Nombre}</div>
                                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Info className="h-3 w-3" />
                                                    {item.Categoria}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                {item.Tipo === "COMPRA" ? item.Proveedor : item.Cliente}
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                {item.Cantidad.toLocaleString()}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                ${item.ImporteTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                <div className="text-xs text-gray-400">Costo: ${item.CostoTotal.toFixed(2)}</div>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                <span className={
                                                    (item.MargenArticulo ?? -999) > CONFIG.MARGIN_WARNING ? "text-green-600" :
                                                        (item.MargenArticulo ?? -999) > CONFIG.MARGIN_CRITICAL ? "text-yellow-600" :
                                                            "text-red-600"
                                                }>
                                                    {item.MargenArticulo?.toFixed(2)}%
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                {item.FechaEmision ? new Date(item.FechaEmision).toLocaleDateString("es-ES") : "N/A"}
                                            </td>

                                            <td className="px-4 py-3">
                                                {item.Almacen || "N/A"}
                                            </td>
                                        </tr>
                                    ))}

                                    {salesData.length === 0 && !tableLoading && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-6 text-gray-500">
                                                {searchTerm ? "No se encontraron resultados para la búsqueda" : "No hay datos disponibles para el período seleccionado"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        <div className="px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-sm text-gray-600 flex items-center gap-3">
                                <FileText className="h-4 w-4" />
                                Mostrando {salesData.length} de {
                                    activeReport === CONFIG.REPORT_TYPES.COMPARACION
                                        ? (mergedAllData?.length ?? salesData.length)
                                        : (salesData.length)
                                } registros
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || tableLoading}
                                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                                >
                                    Anterior
                                </button>

                                <span className="text-sm">Página {currentPage} de {totalPages}</span>

                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || tableLoading}
                                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EnhancedSalesReport;