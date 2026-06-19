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
    AlertTriangle,
    Warehouse,
    Filter,
    GitCompare,
} from "lucide-react";
import { DateRange } from "./types/filter";
import { Button } from "@/components/button";
import { safeCall } from "@/hooks/use-debounce";
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
        { syntheticKey: "Costo", sourceFields: ["Costo", "Total Costo"] },
    ];
const AGGREGATION_DEPENDENCIES: Record<string, string[]> = {
    "Total Costo": ["Costo"],
    "Minimo Costo": ["Costo"],
    "Maximo Costo": ["Costo"],
    "Total Ventas": ["Precio"],
    "Articulos Totales": ["Cantidad"],
    // Agrega más según tus necesidades
};
const ALMACENES_OPCIONES = [
    { value: "ALMVGPE", label: "Guadalupe" },
    { value: "ALMMAYO", label: "Mayoreo" },
    { value: "ALMTESTE", label: "Testerazo" },
    { value: "ALMPALM", label: "Palmas" },
];
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

    // Estados de UI
    const [totalPages, setTotalPages] = useState(0)
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

    // ─── Columnas visibles: mapa report → visibilidad ────────────────────────
    const [visibleColumnsByReport, setVisibleColumnsByReport] = useState<Record<string, Record<string, boolean>>>({});

    const getCurrentVisibility = useCallback(
        (report: REPORT = selectedReport): Record<string, boolean> => {
            if (visibleColumnsByReport[report]) return visibleColumnsByReport[report];
            const config = REPORT_CONFIGS[report];
            const base = visibleColumnsByReport[report] || {};

            // 1. Obtener selects originales
            const rawSelectKeys = new Set(
                (config.filtros?.selects || []).map((s: any) => s.Alias || s.Key.split(".").pop() || s.Key)
            );

            const absorbedBySynthetic = new Set<string>();
            const initial: Record<string, boolean> = {};

            // 2. Columnas sintéticas
            SYNTHETIC_COLUMNS.forEach(({ syntheticKey, sourceFields }) => {
                const hasAny = sourceFields.some((f) => rawSelectKeys.has(f));
                if (hasAny) {
                    initial[syntheticKey] = base[syntheticKey] ?? true;
                    sourceFields.forEach((f) => absorbedBySynthetic.add(f));
                }
            });

            // 3. Columnas individuales no absorbidas
            rawSelectKeys.forEach((col) => {
                if (!absorbedBySynthetic.has(col)) {
                    initial[col] = base[col] ?? true;
                }
            });

            // 4. Agregaciones con dependencias
            const aggregations = config.filtros?.agregaciones || [];
            aggregations.forEach((a: any) => {
                const alias = a.Alias || a.Key.split(".").pop() || a.Key;
                const dependencies = AGGREGATION_DEPENDENCIES[alias];
                if (dependencies && dependencies.length > 0) {
                    const userValue = base[alias] ?? true;
                    const hasVisibleDependency = dependencies.some(dep => initial[dep] !== false);
                    initial[alias] = userValue && hasVisibleDependency;
                } else {
                    initial[alias] = base[alias] ?? true;
                }
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
        const orderConfig = finalFiltros.Order ? JSON.parse(JSON.stringify(finalFiltros.Order)) : null;
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
            finalFiltros.agregaciones = finalFiltros.agregaciones.filter((ag: any) => {
                const alias = ag.Alias || ag.Key.split(".").pop() || ag.Key;
                if (visibleKeys.length === 0) return true;
                return currentVisible[alias] === true;
            });
        }
        // Incluir FechaEmision si existe Order
        if (orderConfig && orderConfig.length > 0) {
            const hasFechaEmision = finalFiltros.selects.some((sel: any) => {
                const key = sel.Key || "";
                return key.includes("FechaEmision") || key.endsWith(".FechaEmision");
            });
            if (!hasFechaEmision) {
                delete finalFiltros.Order;
            }
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
                    Precio,
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
                    Precio: [item.Precio, formatValue(item["Total Ventas"], "currency")],
                    ...rest,
                };

                if (!activeVisible) return full;
                return Object.fromEntries(
                    Object.entries(full).filter(([key]) => activeVisible.has(key))
                );
            }) || [];
            setDataTable(formattedData);
            setTotalPages(response.data?.totalPages)
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
                       
                        <Button
                            onClick={() => fetchTableData()}
                            disabled={tableLoading}
                            color="second"
                            size="small"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${tableLoading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Tabla</span>
                        </Button>
                       
                    </div>
                </div>
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