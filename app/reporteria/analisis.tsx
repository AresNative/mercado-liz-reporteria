"use client";

import Footer from "@/template/footer";
import Header from "@/template/header";
import { RequestPayload, useManagmentRead } from "@/hooks/classes/api";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
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
import { ArrayColumnDisplay } from "@/components/table/toggle-view";
import KardexStats from "./components/kardex-stats";
import ScoreCard from "./components/modal-scorecard";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import { Field } from "@/utils/types/interfaces";
// ─── Types ────────────────────────────────────────────────────────────────────
type REPORT =
    | "venta"
    | "compra"
    | "merma"
    | "mermanoconocida"
    | "inventario"
    /*   | "clientes"
    | "proveedores"
  | "gastos" */;

interface Filtro {
    Key: string;
    Value: any;
    Operator: string;
}
// Grupo de filtros con su propio operador lógico, tal como lo espera
// el backend en la propiedad `FiltrosAnd`: [{ Filtros, OperadorLogico }, ...]
interface FiltroGrupo {
    Filtros: Filtro[];
    OperadorLogico: "AND" | "OR";
}
interface ActiveFilters {
    // Grupo OR: filtros que deben combinarse con "o" (p.ej. búsqueda de texto
    // sobre varios campos: Articulo LIKE x OR Descripcion1 LIKE x OR ...).
    Filtros: Filtro[];
    // Grupo AND: filtros que deben combinarse con "y" (p.ej. rango de fechas,
    // almacén). Se combinan además con los filtros base de cada reporte.
    FiltrosOther: Filtro[];
    Selects: any[];
    OrderBy: any | null;
}
// ─── Configuración de reportes ─────────────────────────────────────────────────
const REPORT_CONFIGS: Record<REPORT, Pick<RequestPayload, "table" | "filtros">> = {
    venta: {
        table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo INNER JOIN Sucursal ON ventad.Sucursal = Sucursal.Sucursal`,
        filtros: {
            selects: [
                /* { Key: "ventad.Codigo" }, */
                { Key: "ventad.Articulo" },
                { Key: "ART.Descripcion1", Alias: "Nombre" },
                { Key: "venta.FechaEmision" },
                { Key: "ventad.Almacen" },
                { Key: "ventad.Sucursal" },
                { Key: "Sucursal.Nombre", Alias: "Nombre Sucursal" },
                { Key: "ART.Categoria" },
                { Key: "ART.Grupo" },
                { Key: "ART.Linea" },
                { Key: "ART.Familia" },
                { Key: "ventad.Precio" },
                { Key: "ventad.Costo" },
                { Key: "ventad.Unidad", Alias: "Unidad" },
                { Key: "ventad.Factor", Alias: "Factor" },
            ],
            agregaciones: [
                { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "Total Ventas", Operation: "SUM" },
                { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "Total Costo", Operation: "SUM" },
                { Key: "ventad.Cantidad", Alias: "Cantidad", Operation: "SUM" },
                { Key: "(ventad.Cantidad * ventad.Factor)", Alias: "Articulos", Operation: "SUM" },
                { Key: "venta.Cliente", Alias: "Clientes Distintos", Operation: "COUNT DISTINCT" },
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
        table: `COMPRA AS compra INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor INNER JOIN Sucursal ON comprad.Sucursal = Sucursal.Sucursal`,
        filtros: {
            selects: [
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
                { Key: "ART.Linea" },
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
                { Key: "comprad.CantidadInventario", Alias: "Articulos", Operation: "SUM" },
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
        table: `INV AS inv INNER JOIN INVD AS invd ON inv.Mov = 'SALIDA DIVERSA' AND invd.ID = inv.ID AND inv.Concepto = 'SALIDA POR MERMAS' OR inv.Mov = 'MERMAS' AND invd.ID = inv.ID INNER JOIN Art AS art ON art.Articulo = invd.Articulo  INNER JOIN Sucursal ON invd.Sucursal = Sucursal.Sucursal`,
        filtros: {
            selects: [
                { Key: "art.Articulo" },
                { Key: "art.Descripcion1", Alias: "Nombre" },
                { Key: "inv.FechaEmision" },
                { Key: "invd.Almacen" },
                { Key: "inv.Sucursal" },
                { Key: "Sucursal.Nombre", Alias: "Nombre Sucursal" },
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
            ],
            Filtros: [
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
    mermanoconocida: {
        table: `INV AS inv INNER JOIN INVD AS invd ON inv.Mov = 'AJUSTE' AND invd.ID = inv.ID AND inv.Concepto = 'REPROCESO' INNER JOIN Art AS art ON art.Articulo = invd.Articulo  INNER JOIN Sucursal ON invd.Sucursal = Sucursal.Sucursal`,
        filtros: {
            selects: [
                { Key: "art.Articulo" },
                { Key: "art.Descripcion1", Alias: "Nombre" },
                { Key: "inv.FechaEmision" },
                { Key: "invd.Almacen" },
                { Key: "inv.Sucursal" },
                { Key: "Sucursal.Nombre", Alias: "Nombre Sucursal" },
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
            ],
            Filtros: [
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
        table: `INVD AS invd INNER JOIN inv AS inv ON inv.ID = invd.ID INNER JOIN Art AS art ON art.Articulo = invd.Articulo  INNER JOIN Sucursal ON invd.Sucursal = Sucursal.Sucursal`,
        filtros: {
            selects: [
                { Key: "art.Articulo" },
                { Key: "art.Descripcion1", Alias: "Nombre" },
                { Key: "inv.FechaEmision" },
                { Key: "invd.Almacen" },
                { Key: "inv.Sucursal" },
                { Key: "Sucursal.Nombre", Alias: "Nombre Sucursal" },
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
                { Key: "(invd.Costo * invd.Cantidad)", Alias: "Total Costo", Operation: "SUM" },
            ],
            Filtros: [
                { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
                { Key: "inv.Mov", Operator: "NOT IN", Value: "SALIDA DIVERSA, MERMAS" },
            ],
            Order: [
                {
                    Key: "FechaEmision",
                    Direction: "DESC"
                }
            ],
        },
    },
    /* clientes: { table: "Cte", filtros: {} },
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
        { syntheticKey: "Cantidad", sourceFields: ["Cantidad", "Articulos"] },
        { syntheticKey: "Costo", sourceFields: ["Costo", "Total Costo"] },
        { syntheticKey: "Sucursal", sourceFields: ["Sucursal", "Nombre Sucursal", "Almacen"] },
    ];
const AGGREGATION_DEPENDENCIES: Record<string, string[]> = {
    "Total Costo": ["Costo"],
    "Total Ventas": ["Precio"],
    "Total Costo Inventario": ["Costo"],
    "Total Mermas": ["Costo"],
    "Minimo Costo": ["Costo"],
    "Maximo Costo": ["Costo"],
    "Articulos": ["Cantidad"],
    "Total Articulos Mermados": ["Cantidad"],
    "Total Articulos Inventario": ["Cantidad"],
    // Agrega más según tus necesidades
};
// Mapeo del campo Almacén según reporte
const ALMACEN_FIELD_MAP: Record<REPORT, string> = {
    venta: "Sucursal.Nombre",
    compra: "Sucursal.Nombre",
    merma: "Sucursal.Nombre",
    mermanoconocida: "Sucursal.Nombre",
    inventario: "Sucursal.Nombre",
    /* clientes: "",        // no aplica
    proveedores: "",     // no aplica */
};

// Mapeo de campos para búsqueda (se usará con LIKE)
const SEARCH_FIELDS_MAP: Record<REPORT, string[]> = {
    venta: ["ART.Descripcion1", "ART.Articulo"],
    compra: ["ART.Descripcion1", "ART.Articulo", "P.Nombre"],
    merma: ["art.Descripcion1", "art.Articulo"],
    mermanoconocida: ["art.Descripcion1", "art.Articulo"],
    inventario: ["art.Descripcion1", "art.Articulo"],
    /* clientes: ["Cte.Nombre", "Cte.Codigo"],
    proveedores: ["Prov.Nombre", "Prov.Proveedor"], */
};
// Cantidad máxima de sugerencias a mostrar en el campo de búsqueda
const SUGGESTIONS_LIMIT = 50;
const ALMACENES_OPCIONES = [
    { value: "Valle de Guadalupe", label: "Valle de Guadalupe" },
    { value: "Mayoreo", label: "Mayoreo" },
    { value: "Testerazo", label: "Testerazo" },
    { value: "Valle de las Palmas", label: "Valle de las Palmas" },
];

// Valor por defecto del rango de fechas: últimos 30 días.
// Se usa tanto para el filtro inicial como para el valueDefined del formulario,
// de forma que ambos permanezcan sincronizados.
const getDefaultDateRangeValue = (): string => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return `${start.toISOString().split("T")[0]} AND ${end.toISOString().split("T")[0]}`;
};

const getHiddenAggregations = (visibleKeys: string[], aggregations: any[] = []): Set<string> => {
    const hiddenAggregations = new Set<string>();

    aggregations.forEach((agg: any) => {
        const alias = agg.Alias || agg.Key.split(".").pop() || agg.Key;

        // Obtener las dependencias de esta agregación
        const dependencies = AGGREGATION_DEPENDENCIES[alias] || [];

        // Si alguna de sus dependencias está oculta, ocultar esta agregación
        const hasHiddenDependency = dependencies.some(
            dep => !visibleKeys.includes(dep)
        );

        if (hasHiddenDependency) {
            hiddenAggregations.add(alias);
        }
    });

    return hiddenAggregations;
};

const buildFiltrosAnd = (baseFiltros: Filtro[] = [], activeFilters: ActiveFilters): FiltroGrupo[] => {
    const grupoAnd: Filtro[] = [...baseFiltros, ...(activeFilters.FiltrosOther || [])];
    const grupoOr: Filtro[] = activeFilters.Filtros || [];

    const grupos: FiltroGrupo[] = [];
    if (grupoAnd.length > 0) {
        grupos.push({ Filtros: grupoAnd, OperadorLogico: "AND" });
    }
    if (grupoOr.length > 0) {
        grupos.push({ Filtros: grupoOr, OperadorLogico: "OR" });
    }
    return grupos;
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Analisis() {
    const [manager] = useManagmentRead();
    const dispatch = useAppDispatch();

    const [showScoreCard, setShowScoreCard] = useState(false);
    // Estados de UI
    const [totalPages, setTotalPages] = useState(0)
    const [pageSize, setPageSize] = useState<number>(CONFIG.PAGE_SIZE);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [showStats, setShowStats] = useState(true);
    const [selectedReport, setSelectedReport] = useState<REPORT>("venta");
    const [tableLoading, setTableLoading] = useState(false);
    const [dataTable, setDataTable] = useState<any[]>([]);
    const [dataStats, setDataStats] = useState<any[]>([])
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
    const [tableError, setTableError] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        // Grupo OR: se llena solo cuando el usuario busca texto.
        Filtros: [],
        // Grupo AND: fecha (por defecto últimos 30 días) + almacén cuando aplique.
        FiltrosOther: [
            {
                Key: "FechaEmision",
                Value: getDefaultDateRangeValue(),
                Operator: "BETWEEN"
            },
        ],
        Selects: [],
        OrderBy: [
            {
                Key: "FechaEmision",
                Direction: "DESC"
            }
        ],
    });
    const formRef = useRef<{
        getFormData: () => any;
        submitForm: () => Promise<any>;
        getLiveValues: () => any;
    }>(null);
    const [liveFormValues, setLiveFormValues] = useState<{
        dateRange?: string;
        almacen?: string;
        search?: string;
    }>({});
    useEffect(() => {
        const interval = setInterval(() => {
            const live = formRef.current?.getFormData?.() || {};
            setLiveFormValues(prev => (
                prev.dateRange === live.dateRange &&
                    prev.almacen === live.almacen &&
                    prev.search === live.search
                    ? prev
                    : { dateRange: live.dateRange, almacen: live.almacen, search: live.search }
            ));
        }, 250);
        return () => clearInterval(interval);
    }, []);

    // Debounce del snapshot en vivo antes de disparar la consulta de
    // sugerencias, para no golpear el backend en cada tecla/cambio.
    const [debouncedFormValues, setDebouncedFormValues] = useState<{
        dateRange?: string;
        almacen?: string;
        search?: string;
    }>({});
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedFormValues(liveFormValues);
        }, 300);
        return () => clearTimeout(timeout);
    }, [liveFormValues]);

    const [formValues, setFormValues] = useState<{
        dateRange: string;
        almacen: string;
        search: string;
    }>({
        dateRange: getDefaultDateRangeValue(),
        almacen: "",
        search: "",
    });
    const [arrayDisplayModesByReport, setArrayDisplayModesByReport] = useState<Record<string, Record<string, ArrayColumnDisplay>>>({});

    // Funciones de acceso y mutación
    const getCurrentArrayDisplayModes = useCallback((report: REPORT = selectedReport): Record<string, ArrayColumnDisplay> => {
        return arrayDisplayModesByReport[report] || {};
    }, [arrayDisplayModesByReport, selectedReport]);

    const handleArrayDisplayChange = useCallback((column: string, mode: ArrayColumnDisplay) => {
        setArrayDisplayModesByReport(prev => ({
            ...prev,
            [selectedReport]: {
                ...(prev[selectedReport] || {}),
                [column]: mode,
            }
        }));
    }, [selectedReport]);
    // ─── Columnas visibles: mapa report → visibilidad ────────────────────────
    const [visibleColumnsByReport, setVisibleColumnsByReport] = useState<Record<string, Record<string, boolean>>>({});

    const getCurrentVisibility = useCallback(
        (report: REPORT = selectedReport): Record<string, boolean> => {
            const config = REPORT_CONFIGS[report];
            if (!config) return {};

            const stored = visibleColumnsByReport[report] || {};
            // Si ya existe un estado guardado para este reporte, devolverlo
            if (visibleColumnsByReport[report]) {
                return stored;
            }

            // Construir todas las claves posibles
            const allKeys = new Set<string>();

            // Selects
            (config.filtros?.selects || []).forEach((s: any) => {
                const alias = s.Alias || s.Key.split(".").pop() || s.Key;
                allKeys.add(alias);
            });
            // Agregaciones
            (config.filtros?.agregaciones || []).forEach((a: any) => {
                const alias = a.Alias;
                if (alias) allKeys.add(alias);
            });
            // Columnas sintéticas y sus sourceFields
            SYNTHETIC_COLUMNS.forEach(({ syntheticKey, sourceFields }) => {
                allKeys.add(syntheticKey);
                sourceFields.forEach(sf => allKeys.add(sf));
            });

            // Objeto con todas visibles por defecto
            const result: Record<string, boolean> = {};
            allKeys.forEach(key => {
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

    const tableAbortRef = useRef<AbortController | null>(null);
    const statsAbortRef = useRef<AbortController | null>(null);

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

        const currentModes = getCurrentArrayDisplayModes(selectedReport);

        let finalFiltros: any = config.filtros ? JSON.parse(JSON.stringify(config.filtros)) : {};
        const orderConfig = finalFiltros.Order ? JSON.parse(JSON.stringify(finalFiltros.Order)) : null;

        // ── Calcular campos requeridos según visibilidad y modos ──────────────
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
            // Sin filtro: incluir todos los campos
            allSelectAliases.forEach(a => requiredFields.add(a));
            allAggAliases.forEach(a => requiredFields.add(a));
        } else {
            // Solo campos explícitamente visibles
            visibleKeys.forEach(k => {
                if (allSelectAliases.has(k) || allAggAliases.has(k)) {
                    requiredFields.add(k);
                }
            });
        }
        // ── Construir FiltrosAnd (grupo AND: base + fecha/almacén, grupo OR: búsqueda) ──
        const baseFiltros: Filtro[] = finalFiltros.Filtros || [];
        finalFiltros.FiltrosAnd = buildFiltrosAnd(baseFiltros, activeFilters);
        delete finalFiltros.Filtros;

        // Ajustar según columnas sintéticas y sus modos
        for (const { syntheticKey, sourceFields } of SYNTHETIC_COLUMNS) {
            const isVisible = visibleKeys.length === 0 || visibleKeys.includes(syntheticKey);
            if (!isVisible) {
                // Eliminar todos los sourceFields de esta columna sintética
                sourceFields.forEach(f => requiredFields.delete(f));
            } else {
                const mode = currentModes[syntheticKey] || "both";
                let fieldsToKeep: string[] = [];
                if (mode === "first") fieldsToKeep = sourceFields.slice(0, 1);
                else if (mode === "second") fieldsToKeep = sourceFields.slice(1, 2);
                else if (mode === "third") fieldsToKeep = sourceFields.slice(2, 3);
                else if (mode === "both") fieldsToKeep = sourceFields;

                // Eliminar todos y agregar solo los que corresponden al modo
                sourceFields.forEach(f => requiredFields.delete(f));
                fieldsToKeep.forEach(f => requiredFields.add(f));
            }
        }

        // ── Filtrar selects ──────────────────────────────────────────────────
        if (finalFiltros.selects) {
            finalFiltros.selects = finalFiltros.selects.filter((sel: any) => {
                const alias = sel.Alias || sel.Key.split(".").pop() || sel.Key;
                return requiredFields.has(alias);
            });
        }

        // ── Filtrar agregaciones ─────────────────────────────────────────────
        if (finalFiltros.agregaciones) {
            // Ocultar agregaciones que dependen de campos no requeridos
            const hiddenAggregations = getHiddenAggregations(visibleKeys, finalFiltros.agregaciones);

            finalFiltros.agregaciones = finalFiltros.agregaciones.filter((ag: any) => {
                const alias = ag.Alias || ag.Key.split(".").pop() || ag.Key;

                if (visibleKeys.length === 0) return true;

                // Si está en las agregaciones ocultas por dependencia, excluir
                if (hiddenAggregations.has(alias)) return false;

                // Si está explícitamente marcado como visible, incluir
                return currentVisible[alias] === true;
            });
        }

        // ── Asegurar FechaEmision si hay Order ──────────────────────────────
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
            signal: tableAbortRef.current.signal,
        };

        try {
            const { promise } = await manager.execute(payload);
            const response: any = await safeCall(() => promise, `fetchTable/${selectedReport}`);
            if (tableAbortRef.current.signal.aborted) return;

            const activeVisible = visibleKeys.length > 0 ? new Set(visibleKeys) : null;

            // ── Construir datos formateados dinámicamente ──────────────────
            const formattedData = response.data.data.map((item: any) => {
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

                // ── Helper para determinar si un valor está vacío ──
                const isEmptyValue = (value: any): boolean => {
                    if (value === null || value === undefined) return true;
                    if (Array.isArray(value)) {
                        // Si el arreglo está vacío o todos sus elementos son vacíos
                        if (value.length === 0) return true;
                        return value.every(v => v === null || v === undefined || v === '');
                    }
                    if (typeof value === 'string') {
                        return value.trim() === '';
                    }
                    return false;
                };

                const full: Record<string, any> = {
                    FechaEmision: item.FechaEmision,
                    Articulo: [item.Nombre, item.Articulo, item.Codigo],
                    Proveedor: [item["Proveedor Nombre"], item.Proveedor, item.Fabricante],
                    Sucursal: [item['Nombre Sucursal'], item.Sucursal, item.Almacen],
                    Categoria: [item.Categoria, item.Grupo, item.Linea, item.Familia],
                    Unidad: [item.Unidad, ...(item.Factor > 1 ? [`x${item.Factor}`] : [])],
                    Cantidad: [item.Cantidad, ...(item.Factor > 1 ? [`=${item["Articulos"]}`] : [])],
                    Costo: [item.Costo, (item.Cantidad > 1) ? item["Total Costo"] ? [`=${formatValue(item["Total Costo"], "currency")}`] : [`=${formatValue(item["Total Mermas"], "currency")}`] : ""],
                    Precio: [item.Precio, (item.Cantidad > 1) ? [`=${formatValue(item["Total Ventas"], "currency")}`] : ""],
                    ...rest,
                };

                // Filtrar las columnas vacías (por fila)
                const nonEmptyFull = Object.fromEntries(
                    Object.entries(full).filter(([key, value]) => !isEmptyValue(value))
                );

                // Aplicar filtro de visibilidad si existe
                if (!activeVisible) return nonEmptyFull;
                return Object.fromEntries(
                    Object.entries(nonEmptyFull).filter(([key]) => activeVisible.has(key))
                );
            }) || [];

            setDataTable(formattedData);
            setTotalPages(response.data?.totalPages)
            setTotalRecords(response.data?.totalRecords || response.data?.totalEstimated || 0);
        } catch (err: any) {
            if (err?.name === "AbortError") return;
        } finally {
            if (!tableAbortRef.current.signal.aborted) setTableLoading(false);
        }
    }, [
        selectedReport,
        currentPage,
        pageSize,
        manager,
        activeFilters,
        getCurrentVisibility,
        getCurrentArrayDisplayModes,
    ]);

    const fetchStatsData = useCallback(async () => {
        statsAbortRef.current?.abort();
        statsAbortRef.current = new AbortController();

        const config = REPORT_CONFIGS[selectedReport];
        if (!config) {
            return;
        }
        let finalFiltros: any = config.filtros ? JSON.parse(JSON.stringify(config.filtros)) : {};
        const { selects, Order, Filtros: baseFiltros, ...others } = finalFiltros;
        // ── Construir FiltrosAnd (grupo AND: base + fecha/almacén, grupo OR: búsqueda) ──
        others.FiltrosAnd = buildFiltrosAnd(baseFiltros || [], activeFilters);
        const payload: RequestPayload = {
            table: config.table,
            filtros: others,
            page: currentPage,
            pageSize,
            signal: statsAbortRef.current.signal,
        };

        try {
            const { promise } = await manager.execute(payload);
            const response: any = await safeCall(() => promise, `fetchStats/${selectedReport}`);
            if (statsAbortRef.current.signal.aborted) return;

            const formattedData = response.data.data.map((out: any) => {
                const totalVentas = out["Total Ventas"];
                const totalCosto = out["Total Costo"];

                const data: any = { ...out };

                if (totalVentas !== undefined && totalVentas !== null && !isNaN(totalVentas) && totalVentas !== 0) {
                    const utilidadRaw = totalVentas - (totalCosto ?? 0);
                    data.Utilidad = formatValue(utilidadRaw, "currency");
                    data.Margen = "% " + formatValue((utilidadRaw / totalVentas) * 100, "number");
                }

                return data;
            });
            setDataStats(formattedData)
        } catch (err: any) {
            if (err?.name === "AbortError") return;
        }
    }, [
        selectedReport,
        currentPage,
        pageSize,
        manager,
        activeFilters,
    ]);

    useEffect(() => {
        fetchTableData();
    }, [fetchTableData]);

    useEffect(() => {
        fetchStatsData();
    }, [fetchStatsData]);

    // ─── Sugerencias de búsqueda ─────────────────────────────────────────────
    const suggestionsAbortRef = useRef<AbortController | null>(null);

    const fetchSuggestions = useCallback(async () => {
        suggestionsAbortRef.current?.abort();
        suggestionsAbortRef.current = new AbortController();

        const config = REPORT_CONFIGS[selectedReport];
        const searchFields = SEARCH_FIELDS_MAP[selectedReport] || [];
        if (!config || searchFields.length === 0) {
            setSearchSuggestions([]);
            return;
        }

        let finalFiltros: any = config.filtros ? JSON.parse(JSON.stringify(config.filtros)) : {};
        const { agregaciones, Order, Filtros: baseFiltros, selects, ...others } = finalFiltros;

        // Solo pedimos los campos usados para búsqueda, para mantener el payload liviano.
        others.agregaciones = (selects || [])
            .filter((sel: any) => searchFields.includes(sel.Key))
            .map((sel: any) => ({ ...sel, Operation: 'DISTINCT' }));

        const searchQueryTerm = (debouncedFormValues.search || "").split(",").pop()?.trim() || "";
        const liveOrFiltros: Filtro[] = searchQueryTerm
            ? [{ Key: "ART.Descripcion1", Operator: "LIKE", Value: searchQueryTerm }]
            : [];
        others.Filtros =   liveOrFiltros ;
        others.distinct = true;

        const payload: RequestPayload = {
            table: config.table,
            filtros: others,
            page: 1,
            pageSize: SUGGESTIONS_LIMIT,
            signal: suggestionsAbortRef.current.signal,
        };

        try {
            const { promise } = await manager.execute(payload);
            const response: any = await safeCall(() => promise, `fetchSuggestions/${selectedReport}`);
            if (suggestionsAbortRef.current.signal.aborted) return;

            const valores = new Set<string>();
            (response.data?.data || []).forEach((row: any) => {
                Object.values(row).forEach((val: any) => {
                    if (typeof val === "string" && val.trim() !== "") {
                        valores.add(val.trim());
                    }
                });
            });

            setSearchSuggestions(Array.from(valores).sort().slice(0, SUGGESTIONS_LIMIT));
        } catch (err: any) {
            if (err?.name === "AbortError") return;
        }
    }, [selectedReport, debouncedFormValues, formValues.dateRange, manager]);

    useEffect(() => {
        fetchSuggestions();
    }, [fetchSuggestions]);

    const dataFormConfig: Field[] = useMemo(() => ([
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
                    valueDefined: formValues.almacen ? formValues.almacen : undefined,
                },
                {
                    require: false,
                    type: "SEARCH",
                    name: "search",
                    placeholder: "Escribe y presiona Enter para agregar (Artículo, código, proveedor, etc.)",
                    label: "Búsqueda rápida (acumulable)",
                    icon: <Search className="size-4" />,
                    options: searchSuggestions,
                    saveData: true,
                    valueDefined: formValues.search,
                },
            ],
        },
    ]), [formValues, searchSuggestions]);
    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <Header />
            <section className="p-3 md:p-4 min-h-[70vh]">

                {/* Header de página */}
                <dt className="flex justify-between items-center mb-4">
                    <dl className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold dark:text-white">Análisis</h1>
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="hidden sm:inline">Estadísticas</span>
                        </button>
                    </dl>
                    <dl className="flex gap-2">
                        <Button
                            onClick={() => { fetchTableData(); fetchStatsData(); }}
                            disabled={tableLoading}
                            color="second"
                            size="small">
                            <RefreshCw className={`w-3.5 h-3.5 ${tableLoading ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Recargar</span>
                        </Button>
                    </dl>
                </dt>
                {/* ─── Selector de reporte ───────────────────────────────── */}
                <ul className="mb-4 flex items-center justify-between">
                    <li className="flex flex-wrap gap-2">
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
                    </li>
                    <li className="flex flex-wrap gap-2">
                        <Button
                            color="success"
                            size="small"
                            onClick={() => { setShowScoreCard(true); dispatch(openModalReducer({ modalName: "scorecard" })) }}
                        >
                            Score Card
                        </Button>
                    </li>
                </ul>
                <KardexStats dataStats={dataStats} show={showStats} />

                <div className="relative flex flex-col rounded-xl border gap-3 border-gray-200 bg-white shadow-sm p-4 dark:bg-gray-800 dark:border-gray-700">

                    <MainForm
                        actionType=""
                        ref={formRef}
                        flexDirection="flex-row"
                        dataForm={dataFormConfig}
                        message_button={"Filtrar"}
                        iconButton={<Filter className="mr-1 h-4 w-4" />}
                        valueAssign={(row: any) => console.log(row)}
                        onSuccess={(rows: any) => {
                            const { almacen, search, dateRange } = rows;

                            const effectiveDateRange = dateRange || formValues.dateRange || getDefaultDateRangeValue();

                            // Grupo AND: fecha (siempre) + almacén (si se seleccionó),
                            // usando el campo correcto según el reporte activo.
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
                                // Con `saveData` en el campo SEARCH, el usuario puede
                                // acumular varios términos (tags) que llegan aquí como
                                // un solo string separado por comas. Se generan filtros
                                // OR para cada combinación campo × término, de forma
                                // que el resultado incluya coincidencias con cualquiera
                                // de los términos acumulados en cualquiera de los campos.
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

                            setActiveFilters(prev => ({
                                ...prev,
                                Filtros: filtrosOr,
                                FiltrosOther: filtrosAnd,
                                // Podríamos limpiar también Selects/OrderBy si se usaran, pero los dejamos como estaban
                            }));

                            setFormValues({
                                dateRange: effectiveDateRange,
                                almacen: almacen || "",
                                search: search || "",
                            });

                            // Reiniciar a la primera página y recargar
                            setCurrentPage(1);
                        }}
                    />

                    {/* Error de tabla */}
                    {tableError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>{tableError}</span>
                            <Button
                                color="second"
                                onClick={() => fetchTableData()}
                            >
                                Reintentar
                            </Button>
                        </div>
                    )}

                    {/* Tabla */}
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
                            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                            pageSizeOptions={CONFIG.PAGE_SIZE_OPTIONS}
                            currentPageSize={pageSize}
                        />
                    )}
                </div>
            </section>
            <ScoreCard open={showScoreCard} />
            <Footer />
        </>
    );
}