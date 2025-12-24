"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useGetWithFiltersMutation } from "../hooks/useMasivoQuery";
import { safeCall, useDebounce } from "@/hooks/use-debounce";
import DynamicTable from "@/components/table";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Pagination from "@/components/pagination";
import { formatValue } from "@/utils/constants/format-values";
import {
  DollarSign, TrendingUp, Package, Users, Minus,
  TrendingDown, RefreshCw, Building, Download, Filter,
  Loader2, RefreshCcw, Search, ShoppingCart, X, Zap,
  Calendar, ChevronDown, Menu, ChevronUp, BarChart3
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

type ReportType = "ventas" | "compras" | "mermas" | "comparacion";

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
  utilidad?: number;
  margen?: number;
}

interface QueryConfig {
  table: string;
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
    { key: "articulo", label: "Artículo", icon: Package, color: "text-blue-500", tableField: "art.Descripcion1" },
    { key: "cliente", label: "Nombre", icon: Users, color: "text-green-500", tableField: "C.Nombre" },
    { key: "categoria", label: "Categoría", icon: Filter, color: "text-purple-500", tableField: "ART.Categoria" },
    { key: "codigo", label: "Código", icon: DollarSign, color: "text-yellow-500", tableField: "ventad.Codigo" }
  ],
  compras: [
    { key: "articulo", label: "Artículo", icon: Package, color: "text-blue-500", tableField: "art.Descripcion1" },
    { key: "proveedor", label: "Proveedor", icon: ShoppingCart, color: "text-orange-500", tableField: "P.Nombre" },
    { key: "fabricante", label: "Fabricante", icon: Building, color: "text-red-500", tableField: "ART.Fabricante" },
    { key: "codigo", label: "Código", icon: DollarSign, color: "text-yellow-500", tableField: "comprad.Codigo" }
  ],
  mermas: [
    { key: "articulo", label: "Artículo", icon: Package, color: "text-blue-500", tableField: "art.Descripcion1" },
    { key: "concepto", label: "Concepto", icon: Filter, color: "text-purple-500", tableField: "inv.Concepto" },
    { key: "categoria", label: "Categoría", icon: Filter, color: "text-indigo-500", tableField: "art.Categoria" },
    { key: "codigo", label: "Código", icon: DollarSign, color: "text-yellow-500" }
  ],
  comparacion: [
    { key: "articulo", label: "Artículo", icon: Package, color: "text-blue-500" },
    { key: "descripcion", label: "Descripción", icon: Filter, color: "text-purple-500" }
  ]
};

// Configuración de consultas por tipo de reporte
const QUERY_CONFIGS: Record<ReportType, QueryConfig> = {
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
    ],
    fechaField: "compra.FechaEmision",
    searchColumns: SEARCH_COLUMNS_CONFIG.compras
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
    ],
    fechaField: "inv.FechaEmision",
    searchColumns: SEARCH_COLUMNS_CONFIG.mermas
  },
  comparacion: {
    table: "",
    selects: [],
    agregaciones: [],
    fechaField: "",
    searchColumns: SEARCH_COLUMNS_CONFIG.comparacion
  }
};

// Métricas para cada tipo de reporte
const BENTO_METRICS_CONFIG: Record<string, any[]> = {
  ventas: [
    {
      title: "Ventas",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: DollarSign
    },
    {
      title: "Costos",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: DollarSign
    },
    {
      title: "Margen",
      raw: 0,
      display: formatValue(0, "percentage"),
      type: "percent",
      icon: TrendingUp
    },
    {
      title: "Utilidad",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: TrendingUp
    },
    {
      title: "Artículos",
      raw: 0,
      display: formatValue(0, "number"),
      type: "number",
      icon: Package
    }
  ],
  compras: [
    {
      title: "Costo Total",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: DollarSign
    },
    {
      title: "Artículos",
      raw: 0,
      display: formatValue(0, "number"),
      type: "number",
      icon: Package
    },
    {
      title: "Proveedores",
      raw: 0,
      display: formatValue(0, "number"),
      type: "number",
      icon: Users
    }
  ],
  mermas: [
    {
      title: "Costo Merma",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: DollarSign
    },
    {
      title: "Artículos",
      raw: 0,
      display: formatValue(0, "number"),
      type: "number",
      icon: Package
    }
  ],
  comparacion: []
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
    if (s.totalClientes !== undefined) out.totalClientes = (out.totalClientes ?? 0) + s.totalClientes;
    if (s.totalProveedores !== undefined) out.totalProveedores = (out.totalProveedores ?? 0) + s.totalProveedores;
    if (s.totalMermas !== undefined) out.totalMermas = (out.totalMermas ?? 0) + s.totalMermas;
  });

  if (out.totalVentas !== undefined && out.totalCosto !== undefined) {
    out.utilidad = +(out.totalVentas - out.totalCosto).toFixed(2);
    out.margen = out.totalVentas > 0 ? +((out.utilidad / out.totalVentas) * 100).toFixed(2) : undefined;
  }

  return out;
};

// Helper para extraer almacenes únicos
const extractUniqueAlmacenes = (data: TableData[]): string[] => {
  if (!data.length) return [];

  const almacenes = data
    .map((item: any) => item.Almacen)
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
  const [getData] = useGetWithFiltersMutation();

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
  const [filtros, setFiltros] = useState<any[]>([]);
  const [quickMode, setQuickMode] = useState(true);

  // Nuevo estado para filtro de fechas
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)), // Últimos 30 días por defecto
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

  // Actualizar columna de búsqueda cuando cambia el tipo de reporte
  useEffect(() => {
    const columns = SEARCH_COLUMNS_CONFIG[reportType];
    if (columns && columns.length > 0) {
      setSearchColumn(columns[0]);
    }
  }, [reportType]);

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

  // Construir filtros combinados
  const buildFiltros = useCallback(() => {
    const filters: any[] = [];

    // Filtro de búsqueda con columna seleccionada
    if (searchTerm.length >= 2 && searchColumn.tableField) {
      filters.push({
        Key: searchColumn.tableField,
        Operator: "LIKE",
        Value: searchTerm
      });
    }

    // Filtro de almacén
    if (almacenFilter) {
      filters.push({
        Key: "Almacen",
        Operator: "=",
        Value: almacenFilter
      });
    }

    // Filtro de fechas
    if (dateRange.from && dateRange.to && reportType !== "comparacion") {
      const fechaField = QUERY_CONFIGS[reportType]?.fechaField;
      if (fechaField) {
        filters.push(
          { Key: fechaField, Operator: ">=", Value: formatDateToSQL(dateRange.from) },
          { Key: fechaField, Operator: "<=", Value: formatDateToSQL(dateRange.to) }
        );
      }
    }

    return filters;
  }, [searchTerm, searchColumn, almacenFilter, dateRange, reportType]);

  // Función para cargar datos de la tabla (con paginación)
  const fetchTableData = useCallback(async (page = currentPage, forceRefresh = false) => {
    if (!QUERY_CONFIGS[reportType] || reportType === "comparacion") return;

    // Cancelar peticiones pendientes de tabla
    if (tableAbortControllerRef.current) {
      tableAbortControllerRef.current.abort();
    }

    setTableLoading(!forceRefresh);
    if (forceRefresh) setRefreshingTable(true);
    setTableError(null);

    try {
      // Crear nuevo AbortController para esta petición
      const controller = new AbortController();
      tableAbortControllerRef.current = controller;

      const queryConfig = QUERY_CONFIGS[reportType];
      const currentFilters = buildFiltros();

      const response: ApiResponse = await safeCall(() => getData({
        table: queryConfig.table,
        filtros: {
          selects: queryConfig.selects,
          filtros: currentFilters.length > 0 ? currentFilters : undefined,
          Order: [{ Key: queryConfig.fechaField, Direction: "desc" }]
        },
        page: page,
        pageSize: CONFIG.PAGE_SIZE,
        signal: controller.signal
      }), "getTableData");

      // Verificar si la petición fue abortada
      if (controller.signal.aborted) {
        console.log("Petición de tabla abortada intencionalmente");
        return;
      }

      if (response.error) {
        // Verificar si es un error de aborto
        if (response.error.name === 'AbortError' ||
          response.error.message?.includes('aborted') ||
          response.error.code === 'ERR_CANCELLED') {
          console.log("Petición de tabla cancelada");
          return;
        }

        if (!controller.signal.aborted) {
          setTableError("Error al cargar los datos de la tabla");
          //console.error("Error fetching table data:", response.error);
        }
        return;
      }

      const tableData = response.data?.data || [];
      setCurrentPage(response.data?.page || 1);
      setTotalRecords(response.data?.totalRecords || 0);
      setDataTable(tableData);

      setTableError(null);
      setAlmacenes(extractUniqueAlmacenes(tableData));
    } catch (error: any) {
      // Ignorar errores de aborto
      if (error.name === 'AbortError' ||
        error.message?.includes('aborted') ||
        error.code === 'ERR_CANCELLED') {
        console.log("Petición de tabla cancelada (catch)");
        return;
      }

      // Solo mostrar error si no fue abortado
      if (!tableAbortControllerRef.current?.signal.aborted) {
        setTableError("Error al cargar los datos de la tabla");
        //console.error("Error in fetchTableData:", error);
      }
    } finally {
      // Solo limpiar estados si no fue abortado
      if (!tableAbortControllerRef.current?.signal.aborted) {
        setTableLoading(false);
        setRefreshingTable(false);
      } else {
        console.log("Petición de tabla abortada, limpiando sin estado");
      }
    }
  }, [reportType, currentPage, getData, buildFiltros]);

  // Función para cargar estadísticas (sin paginación)
  const fetchStatsData = useCallback(async (forceRefresh = false) => {
    if (!QUERY_CONFIGS[reportType] || reportType === "comparacion") return;

    // Cancelar peticiones pendientes de estadísticas
    if (statsAbortControllerRef.current) {
      statsAbortControllerRef.current.abort();
    }

    setStatsLoading(!forceRefresh);
    if (forceRefresh) setRefreshingStats(true);
    setStatsError(null);

    try {
      const controller = new AbortController();
      statsAbortControllerRef.current = controller;

      const queryConfig = QUERY_CONFIGS[reportType];
      const currentFilters = buildFiltros();

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
        console.log("Petición de estadísticas abortada intencionalmente");
        return;
      }

      if (response.error) {
        // Verificar si es un error de aborto
        if (response.error.name === 'AbortError' ||
          response.error.message?.includes('aborted') ||
          response.error.code === 'ERR_CANCELLED') {
          console.log("Petición de estadísticas cancelada");
          return;
        }

        if (!controller.signal.aborted) {
          setStatsError("Error al cargar las estadísticas");
          //console.error("Error fetching stats:", response.error);
        }
        return;
      }

      const statsData = response.data?.data || [];
      const processedStats = processStatsData(statsData);

      setStatsError(null);
      setStats(processedStats);
    } catch (error: any) {
      // Ignorar errores de aborto
      if (error.name === 'AbortError' ||
        error.message?.includes('aborted') ||
        error.code === 'ERR_CANCELLED') {
        console.log("Petición de estadísticas cancelada (catch)");
        return;
      }

      // Solo mostrar error si no fue abortado
      if (!statsAbortControllerRef.current?.signal.aborted) {
        setStatsError("Error al cargar las estadísticas");
        //console.error("Error in fetchStatsData:", error);
      }
    } finally {
      // Solo limpiar estados si no fue abortado
      if (!statsAbortControllerRef.current?.signal.aborted) {
        setStatsLoading(false);
        setRefreshingStats(false);
      } else {
        console.log("Petición de estadísticas abortada, limpiando sin estado");
      }
    }
  }, [reportType, getData, buildFiltros]);

  // Función para cancelar peticiones pendientes
  const cancelPendingRequests = () => {
    // Marcar las peticiones como abortadas antes de llamar a abort()
    if (tableAbortControllerRef.current) {
      console.log("Cancelando petición de tabla");
      tableAbortControllerRef.current.abort();
    }
    if (statsAbortControllerRef.current) {
      console.log("Cancelando petición de estadísticas");
      statsAbortControllerRef.current.abort();
    }

    // También limpiar cualquier error que pueda haberse establecido
    // por peticiones que fueron canceladas previamente
    setTableError(null);
    setStatsError(null);
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
    refreshTable();
    refreshStats();
  };

  // Cargar datos iniciales cuando cambian los filtros o el tipo de reporte
  useEffect(() => {
    cancelPendingRequests();

    if (reportType !== "comparacion") {
      fetchTableData(1);
      fetchStatsData();
    } else {
      setDataTable([]);
      setStats({});
      setAlmacenes([]);
    }

    // Cleanup
    return () => {
      cancelPendingRequests();
    };
  }, [reportType, buildFiltros]);

  // Cambiar página de la tabla
  useEffect(() => {
    if (currentPage !== 1 && reportType !== "comparacion") {
      cancelPendingRequests();
      fetchTableData(currentPage);
    }
  }, [currentPage]);

  // Handlers para búsqueda y filtros
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (value.length >= 2) {
      setShowSuggestions(true);
      setSuggestions([]);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearchColumnChange = (column: SearchColumn) => {
    setSearchColumn(column);
    setShowSearchColumnDropdown(false);

    // Limpiar búsqueda cuando se cambia la columna
    if (searchTerm) {
      setSearchTerm("");
      setCurrentPage(1);
    }
  };

  const debouncedValue = useDebounce(searchTerm, 300);

  // Efecto para búsqueda debounced
  useEffect(() => {
    if (reportType === "comparacion") return;

    // Reiniciar a página 1 cuando cambia la búsqueda
    if (currentPage !== 1) {
      setCurrentPage(1);
    }

    // Las peticiones se dispararán automáticamente por el efecto de buildFiltros
  }, [debouncedValue, searchColumn]);

  const handleSuggestionSelect = (suggestion: any) => {
    setSearchTerm(suggestion.value);
    setShowSuggestions(false);
  };

  const handleClearFilters = () => {
    cancelPendingRequests();
    setSearchTerm("");
    setSearchColumn(SEARCH_COLUMNS_CONFIG[reportType][0]);
    setAlmacenFilter("");
    setDateRange({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date()
    });
    setCurrentPage(1);
  };

  const handleReportTypeChange = (type: ReportType) => {
    cancelPendingRequests();
    setReportType(type);
    setCurrentPage(1);
    setShowMobileMenu(false);
  };

  // Handler para cambio de fecha
  const handleDateChange = (from: Date | null, to: Date | null) => {
    cancelPendingRequests();
    setDateRange({ from, to });
    setCurrentPage(1);
    setShowDatePicker(false);
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
          metric.display = formatValue(stats.totalCosto, "currency");
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
          metric.display = formatValue(stats.totalCosto, "currency");
          break;
        case "proveedores":
          rawValue = stats.totalProveedores || 0;
          metric.display = formatValue(rawValue, "number");
          break;
        case "costomerma":
          rawValue = -(stats.totalCosto || 0);
          metric.display = formatValue(stats.totalCosto, "currency");
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
    positive: { bg: "bg-green-50 border-green-200", text: "text-green-600" },
    negative: { bg: "bg-red-50 border-red-200", text: "text-red-800" },
    neutral: { bg: "bg-gray-50 border-gray-200", text: "text-gray-800" }
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

  // Configuración responsive para BentoGrid
  const getBentoGridCols = () => {
    if (reportType === "compras" || reportType === "mermas") return "md:grid-cols-3";
    return "md:grid-cols-5";
  };

  return (
    <section className="p-3 md:p-4">
      {/* Header móvil */}
      <div className="md:hidden mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Reportería
          </h1>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600"
          >
            {showMobileMenu ? <ChevronUp size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Selector de reporte en móvil */}
        <div className="mt-3">
          <select
            value={reportType}
            onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 dark:bg-gray-700 dark:border-gray-600 text-base"
          >
            <option value="ventas">Ventas</option>
            <option value="compras">Compras</option>
            <option value="mermas">Mermas</option>
            <option value="comparacion">Comparación</option>
          </select>
        </div>
      </div>

      {/* Header desktop */}
      <div className="hidden md:flex justify-between items-center mb-4">


        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Reportería - {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
          </h1>
          <div className=" text-gray-800 dark:text-gray-200">
            <label className="mr-2 font-medium">Selecciona el tipo de reporte:</label>
            <select
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value as ReportType)}
              className="border border-gray-300 rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="ventas">Ventas</option>
              <option value="compras">Compras</option>
              <option value="mermas">Mermas</option>
              <option value="comparacion">Comparación</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={refreshStats}
            disabled={statsLoading || refreshingStats || reportType === "comparacion"}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600"
            title="Recargar solo estadísticas"
          >
            <RefreshCw className={`w-4 h-4 ${refreshingStats ? 'animate-spin' : ''}`} />
            Stats
          </button>

          <button
            onClick={refreshTable}
            disabled={tableLoading || refreshingTable || reportType === "comparacion"}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600"
            title="Recargar solo tabla"
          >
            <RefreshCw className={`w-4 h-4 ${refreshingTable ? 'animate-spin' : ''}`} />
            Tabla
          </button>

          <button
            onClick={refreshAll}
            disabled={(tableLoading && statsLoading) || reportType === "comparacion"}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 dark:bg-gray-800 dark:border-gray-600"
            title="Recargar todo"
          >
            <RefreshCw className={`w-4 h-4 ${(refreshingTable && refreshingStats) ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Recargar Todo</span>
            <span className="md:hidden">Todo</span>
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {showMobileMenu && (
        <div className="md:hidden mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={refreshStats}
              disabled={statsLoading || refreshingStats || reportType === "comparacion"}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600"
              title="Recargar solo estadísticas"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingStats ? 'animate-spin' : ''}`} />
              <span className="text-sm">Stats</span>
            </button>

            <button
              onClick={refreshTable}
              disabled={tableLoading || refreshingTable || reportType === "comparacion"}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600"
              title="Recargar solo tabla"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingTable ? 'animate-spin' : ''}`} />
              <span className="text-sm">Tabla</span>
            </button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Reporte: {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
          </div>
        </div>
      )}

      {/* Mensajes de error */}
      {statsError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
          <div className="flex justify-between items-center">
            <span className="text-sm">{statsError}</span>
            <button
              onClick={refreshStats}
              className="text-sm underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {tableError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
          <div className="flex justify-between items-center">
            <span className="text-sm">{tableError}</span>
            <button
              onClick={refreshTable}
              className="text-sm underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Indicadores de carga */}
      {(tableLoading || refreshingTable || statsLoading || refreshingStats) && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">
            {refreshingTable ? "Actualizando tabla..." :
              refreshingStats ? "Actualizando estadísticas..." :
                tableLoading ? "Cargando datos..." :
                  "Cargando estadísticas..."}
          </span>
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
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => {
                        handleDateChange(
                          new Date(new Date().setDate(new Date().getDate() - 7)),
                          new Date()
                        );
                      }}
                      className="text-sm px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      7 días
                    </button>
                    <button
                      onClick={() => {
                        handleDateChange(
                          new Date(new Date().setDate(new Date().getDate() - 30)),
                          new Date()
                        );
                      }}
                      className="text-sm px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      30 días
                    </button>
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
          <div className="relative">
            <Building className="absolute size-5 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={almacenFilter}
              onChange={(e) => {
                cancelPendingRequests();
                setAlmacenFilter(e.target.value);
                setCurrentPage(1);
              }}
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

          {/* Búsqueda móvil */}
          <div className="space-y-2">
            {/* Selector de columna de búsqueda */}
            <div className="flex items-center gap-2">
              <searchColumn.icon className={`h-4 w-4 ${searchColumn.color}`} />
              <span className="text-sm font-medium">{searchColumn.label}</span>
            </div>

            {/* Input de búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                placeholder={`Buscar por ${searchColumn.label.toLowerCase()}...`}
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm"
              />

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Opciones de columna de búsqueda */}
            {searchColumns.length > 1 && (
              <div className="flex flex-wrap gap-1">
                {searchColumns.map((column) => (
                  <button
                    key={column.key}
                    type="button"
                    onClick={() => handleSearchColumnChange(column)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded border ${column.key === searchColumn.key
                      ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700'}`}
                  >
                    <column.icon className={`h-3 w-3 ${column.color}`} />
                    {column.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botones de acción móvil */}
          <div className="flex gap-2 pt-2">
            {(searchTerm || almacenFilter || dateRange.from || dateRange.to) && (
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
                <div className="flex flex-col gap-2">
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
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={() => {
                        handleDateChange(
                          new Date(new Date().setDate(new Date().getDate() - 7)),
                          new Date()
                        );
                        setShowDatePicker(false);
                      }}
                      className="text-sm px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      7 días
                    </button>
                    <button
                      onClick={() => {
                        handleDateChange(
                          new Date(new Date().setDate(new Date().getDate() - 30)),
                          new Date()
                        );
                        setShowDatePicker(false);
                      }}
                      className="text-sm px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      30 días
                    </button>
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="text-sm px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filtro de almacén */}
          <div className="relative">
            <Building className="absolute size-5 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={almacenFilter}
              onChange={(e) => {
                cancelPendingRequests();
                setAlmacenFilter(e.target.value);
                setCurrentPage(1);
              }}
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
                placeholder={`Buscar por ${searchColumn.label.toLowerCase()}...`}
                className="pl-9 pr-3 py-2 border rounded-r w-64 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
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
                        className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 dark:hover:bg-gray-700"
                      >
                        <searchColumn.icon className={`h-4 w-4 ${searchColumn.color}`} />
                        <span>{suggestion.value}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botón para limpiar filtros */}
          {(searchTerm || almacenFilter || dateRange.from || dateRange.to) && (
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
      {reportType !== "comparacion" && bentoMetrics.length > 0 && (
        <BentoGrid
          cols={5}
          className={`mb-6 grid-cols-2 ${getBentoGridCols()}`}
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
                icon={<StateIcon className={`w-4 h-4 ${bentoStyles[state].text}`} />}
                iconRight
                className={`border ${bentoStyles[state].bg} dark:text-gray-600 p-3 md:p-4`}
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
                    <ItemIcon className="w-5 h-5 opacity-70 dark:text-gray-600" />
                  </div>
                </div>
              </BentoItem>
            );
          })}
        </BentoGrid>
      )}

      {/* Tabla y paginación */}
      {reportType === "comparacion" ? (
        <div className="text-center py-8 md:py-12 text-gray-500 dark:text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h2 className="text-lg md:text-xl font-semibold mb-2">Modo Comparación</h2>
          <p className="text-sm md:text-base">Selecciona un tipo de reporte para ver los datos de comparación</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="min-w-[800px] md:min-w-0">
              <DynamicTable
                data={dataTable}
                loading={tableLoading || refreshingTable}
              />
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 md:mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                loading={tableLoading || refreshingTable}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}