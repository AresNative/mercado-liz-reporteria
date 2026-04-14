import { QueryConfig } from "../types/config";

export const QUERY_CONFIGS: Record<string, QueryConfig> = {
  PERIODOS_SEMANA: {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo INNER JOIN Cte AS C ON venta.Cliente = C.Cliente`,
    selects: [
      { Key: "ventad.Articulo" },
      { Key: "ART.Descripcion1", Alias: "Nombre" },
      { Key: "ART.Categoria" },
      { Key: "ART.Grupo" },
    ],
    agregaciones: [
      {
        Key: "(ventad.Precio * ventad.Cantidad)",
        Alias: "totalVentas",
        Operation: "SUM",
      },
      {
        Key: "(ventad.Costo * ventad.Cantidad)",
        Alias: "totalCosto",
        Operation: "SUM",
      },
      {
        Key: "venta.Cliente",
        Alias: "totalClientes",
        Operation: "COUNT DISTINCT",
      },
      { Key: "venta.ID", Alias: "totalTickets", Operation: "COUNT DISTINCT" },
    ],
    fechaField: "venta.FechaEmision",
    searchColumns: [],
    Order: [{ Key: "totalVentas", Direction: "DESC" }],
  },

  PERIODOS_MES: {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo INNER JOIN Cte AS C ON venta.Cliente = C.Cliente`,
    selects: [
      { Key: "DATEPART(month, venta.FechaEmision)", Alias: "Mes" },
      { Key: "DATEPART(year, venta.FechaEmision)", Alias: "Anio" },
      { Key: "ART.Categoria", Alias: "Categoria" },
    ],
    agregaciones: [
      {
        Key: "(ventad.Precio * ventad.Cantidad)",
        Alias: "totalVentas",
        Operation: "SUM",
      },
      {
        Key: "(ventad.Costo * ventad.Cantidad)",
        Alias: "totalCosto",
        Operation: "SUM",
      },
      {
        Key: "(ventad.Cantidad * ART.Factor)",
        Alias: "totalArticulos",
        Operation: "SUM",
      },
      {
        Key: "venta.Cliente",
        Alias: "totalClientes",
        Operation: "COUNT DISTINCT",
      },
      { Key: "venta.ID", Alias: "totalTickets", Operation: "COUNT DISTINCT" },
    ],
    fechaField: "venta.FechaEmision",
    searchColumns: [],
    Order: [
      { Key: "Anio", Direction: "ASC" },
      { Key: "Mes", Direction: "ASC" },
    ],
  },

  PERIODOS_CATEGORIA: {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo INNER JOIN Cte AS C ON venta.Cliente = C.Cliente`,
    selects: [{ Key: `ART.Categoria` }],
    agregaciones: [
      {
        Key: "(ventad.Precio * ventad.Cantidad)",
        Alias: "totalVentas",
        Operation: "SUM",
      },
      { Key: "venta.ID", Alias: "totalTickets", Operation: "COUNT DISTINCT" },
      { Key: "ventad.Cantidad", Alias: "totalUnidades", Operation: "SUM" },
    ],
    fechaField: "venta.FechaEmision",
    searchColumns: [],
    Order: [{ Key: "totalVentas", Direction: "DESC" }],
  },

  "80-20": {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo INNER JOIN Cte AS C ON venta.Cliente = C.Cliente`,
    selects: [
      { Key: "ventad.Articulo" },
      { Key: "ART.Descripcion1", Alias: "Nombre" },
      { Key: "ART.Categoria" },
      { Key: "ART.Grupo" },
    ],
    agregaciones: [
      {
        Key: "(ventad.Precio * ventad.Cantidad)",
        Alias: "totalVentas",
        Operation: "SUM",
      },
      {
        Key: "(ventad.Costo * ventad.Cantidad)",
        Alias: "totalCosto",
        Operation: "SUM",
      },
      { Key: "ventad.Cantidad", Alias: "totalUnidades", Operation: "SUM" },
      { Key: "venta.ID", Alias: "totalTickets", Operation: "COUNT DISTINCT" },
    ],
    fechaField: "venta.FechaEmision",
    searchColumns: [],
    Order: [{ Key: "totalVentas", Direction: "DESC" }],
  },

  PROVEEDORES_RESUMEN: {
    table: `COMPRA AS compra INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor`,
    selects: [
      { Key: "compra.Proveedor" },
      { Key: "P.Nombre", Alias: "NombreProveedor" },
    ],
    agregaciones: [
      {
        Key: "(comprad.Costo * comprad.CantidadInventario)",
        Alias: "totalComprado",
        Operation: "SUM",
      },
      {
        Key: "comprad.CantidadInventario",
        Alias: "totalUnidades",
        Operation: "SUM",
      },
      {
        Key: "comprad.Articulo",
        Alias: "totalArticulosDistintos",
        Operation: "COUNT DISTINCT",
      },
      { Key: "compra.ID", Alias: "totalOrdenes", Operation: "COUNT DISTINCT" },
      { Key: "comprad.Costo", Alias: "costoPromedio", Operation: "AVG" },
    ],
    fechaField: "compra.FechaEmision",
    searchColumns: [],
    Order: [{ Key: "totalComprado", Direction: "DESC" }],
  },

  PROVEEDORES_DETALLE: {
    table: `COMPRA AS compra INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor`,
    selects: [
      { Key: "compra.Proveedor" },
      { Key: "P.Nombre", Alias: "NombreProveedor" },
      { Key: "comprad.Articulo" },
      { Key: "ART.Descripcion1", Alias: "NombreArticulo" },
      { Key: "ART.Categoria" },
      { Key: "ART.Grupo" },
      { Key: "comprad.Unidad" },
    ],
    agregaciones: [
      {
        Key: "(comprad.Costo * comprad.CantidadInventario)",
        Alias: "totalComprado",
        Operation: "SUM",
      },
      {
        Key: "comprad.CantidadInventario",
        Alias: "totalUnidades",
        Operation: "SUM",
      },
      { Key: "compra.ID", Alias: "totalOrdenes", Operation: "COUNT DISTINCT" },
      { Key: "comprad.Costo", Alias: "costoMinimo", Operation: "MIN" },
      { Key: "comprad.Costo", Alias: "costoMaximo", Operation: "MAX" },
      { Key: "comprad.Costo", Alias: "costoPromedio", Operation: "AVG" },
    ],
    fechaField: "compra.FechaEmision",
    searchColumns: [],
    Order: [{ Key: "totalComprado", Direction: "DESC" }],
  },

  PERIODOS_DIA: {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo`,
    selects: [
      { Key: "CONVERT(date, venta.FechaEmision)", Alias: "Fecha" },
      { Key: "DATEPART(weekday, venta.FechaEmision)", Alias: "DiaSemana" },
      { Key: "DATENAME(weekday, venta.FechaEmision)", Alias: "NombreDia" },
    ],
    agregaciones: [
      {
        Key: "(ventad.Precio * ventad.Cantidad)",
        Alias: "totalVentas",
        Operation: "SUM",
      },
      { Key: "venta.ID", Alias: "totalTickets", Operation: "COUNT DISTINCT" },
    ],
    fechaField: "venta.FechaEmision",
    searchColumns: [],
    Order: [{ Key: "Fecha", Direction: "ASC" }],
  },

  PERIODOS_HORA: {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo`,
    selects: [
      { Key: "DATEPART(hour, venta.FechaEmision)", Alias: "Hora" },
      {
        Key: `CASE 
                WHEN DATEPART(hour, venta.FechaEmision) BETWEEN 6 AND 11 THEN 'Mañana'
                WHEN DATEPART(hour, venta.FechaEmision) BETWEEN 12 AND 17 THEN 'Tarde'
                WHEN DATEPART(hour, venta.FechaEmision) BETWEEN 18 AND 23 THEN 'Noche'
                ELSE 'Madrugada'
              END`,
        Alias: "FranjaHoraria",
      },
    ],
    agregaciones: [
      {
        Key: "(ventad.Precio * ventad.Cantidad)",
        Alias: "totalVentas",
        Operation: "SUM",
      },
      { Key: "venta.ID", Alias: "totalTickets", Operation: "COUNT DISTINCT" },
    ],
    fechaField: "venta.FechaEmision",
    searchColumns: [],
    Order: [{ Key: "Hora", Direction: "ASC" }],
  },

  TOP_CLIENTES: {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN Cte AS C ON venta.Cliente = C.Cliente`,
    selects: [
      { Key: "venta.Cliente" },
      { Key: "C.Nombre", Alias: "NombreCliente" },
      { Key: "C.RFC" },
    ],
    agregaciones: [
      {
        Key: "(ventad.Precio * ventad.Cantidad)",
        Alias: "totalVentas",
        Operation: "SUM",
      },
      { Key: "venta.ID", Alias: "totalTickets", Operation: "COUNT DISTINCT" },
      { Key: "ventad.Cantidad", Alias: "totalUnidades", Operation: "SUM" },
    ],
    fechaField: "venta.FechaEmision",
    searchColumns: [],
    Order: [{ Key: "totalVentas", Direction: "DESC" }],
  },

  TOP_CATEGORIAS: {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo`,
    selects: [{ Key: "ART.Categoria" }, { Key: "ART.Grupo", Alias: "Grupo" }],
    agregaciones: [
      {
        Key: "(ventad.Precio * ventad.Cantidad)",
        Alias: "totalVentas",
        Operation: "SUM",
      },
      { Key: "ventad.Cantidad", Alias: "totalUnidades", Operation: "SUM" },
    ],
    fechaField: "venta.FechaEmision",
    searchColumns: [],
    Order: [{ Key: "totalVentas", Direction: "DESC" }],
  },

  MARGEN_ARTICULO: {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo`,
    selects: [
      { Key: "ventad.Articulo" },
      { Key: "ART.Descripcion1", Alias: "Nombre" },
      { Key: "ART.Categoria" },
    ],
    agregaciones: [
      {
        Key: "(ventad.Precio * ventad.Cantidad)",
        Alias: "totalVentas",
        Operation: "SUM",
      },
      {
        Key: "(ventad.Costo * ventad.Cantidad)",
        Alias: "totalCosto",
        Operation: "SUM",
      },
      { Key: "ventad.Cantidad", Alias: "totalUnidades", Operation: "SUM" },
    ],
    fechaField: "venta.FechaEmision",
    searchColumns: [],
    Order: [{ Key: "totalVentas", Direction: "DESC" }],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CHART FIELD DEFINITIONS POR QUERY
// Describe qué campos pueden usarse como eje X / eje Y para la gráfica
// ─────────────────────────────────────────────────────────────────────────────

export type SupportedChartType = "bar" | "line" | "area" | "pie" | "treemap";

export interface ChartFieldOption {
  key: string; // nombre del campo en el dato
  label: string; // etiqueta legible
  type: "dimension" | "metric"; // dimension = categoría/eje X; metric = valor/eje Y
}

export interface QueryChartMeta {
  /** Tipos de gráfica disponibles para esta query */
  availableChartTypes: SupportedChartType[];
  /** Tipo de gráfica por defecto */
  defaultChartType: SupportedChartType;
  /** Campos que pueden usarse como eje X (dimensión) */
  xFieldOptions: ChartFieldOption[];
  /** Campos que pueden usarse como eje Y (métrica) */
  yFieldOptions: ChartFieldOption[];
  /** Eje X por defecto */
  defaultXKey: string;
  /** Eje Y por defecto */
  defaultYKey: string;
  /** Campo de agrupación de series (opcional) */
  nameKey?: string;
}

export const QUERY_CHART_META: Partial<
  Record<keyof typeof QUERY_CONFIGS, QueryChartMeta>
> = {
  PERIODOS_SEMANA: {
    availableChartTypes: ["bar", "line", "area"],
    defaultChartType: "bar",
    defaultXKey: "Nombre",
    defaultYKey: "totalVentas",
    xFieldOptions: [
      { key: "Nombre", label: "Artículo", type: "dimension" },
      { key: "Categoria", label: "Categoría", type: "dimension" },
      { key: "Grupo", label: "Grupo", type: "dimension" },
    ],
    yFieldOptions: [
      { key: "totalVentas", label: "Total Ventas", type: "metric" },
      { key: "totalCosto", label: "Total Costo", type: "metric" },
      { key: "totalClientes", label: "Clientes", type: "metric" },
      { key: "totalTickets", label: "Tickets", type: "metric" },
    ],
  },

  PERIODOS_CATEGORIA: {
    availableChartTypes: ["pie", "bar", "line"],
    defaultChartType: "pie",
    defaultXKey: "Categoria",
    defaultYKey: "totalVentas",
    xFieldOptions: [
      { key: "Categoria", label: "Categoría", type: "dimension" },
    ],
    yFieldOptions: [
      { key: "totalVentas", label: "Total Ventas", type: "metric" },
      { key: "totalTickets", label: "Tickets", type: "metric" },
      { key: "totalUnidades", label: "Unidades", type: "metric" },
    ],
  },

  "80-20": {
    availableChartTypes: ["treemap", "bar", "pie"],
    defaultChartType: "treemap",
    defaultXKey: "Nombre",
    defaultYKey: "totalVentas",
    xFieldOptions: [
      { key: "Nombre", label: "Artículo", type: "dimension" },
      { key: "Categoria", label: "Categoría", type: "dimension" },
      { key: "Grupo", label: "Grupo", type: "dimension" },
    ],
    yFieldOptions: [
      { key: "totalVentas", label: "Total Ventas", type: "metric" },
      { key: "totalCosto", label: "Total Costo", type: "metric" },
      { key: "totalUnidades", label: "Unidades", type: "metric" },
      { key: "totalTickets", label: "Tickets", type: "metric" },
    ],
  },

  PROVEEDORES_RESUMEN: {
    availableChartTypes: ["bar", "line", "pie"],
    defaultChartType: "bar",
    defaultXKey: "NombreProveedor",
    defaultYKey: "totalComprado",
    xFieldOptions: [
      { key: "NombreProveedor", label: "Proveedor", type: "dimension" },
    ],
    yFieldOptions: [
      { key: "totalComprado", label: "Total Comprado", type: "metric" },
      { key: "totalUnidades", label: "Unidades", type: "metric" },
      {
        key: "totalArticulosDistintos",
        label: "Artículos Distintos",
        type: "metric",
      },
      { key: "totalOrdenes", label: "Órdenes", type: "metric" },
      { key: "costoPromedio", label: "Costo Promedio", type: "metric" },
    ],
  },

  PROVEEDORES_DETALLE: {
    availableChartTypes: ["bar", "pie"],
    defaultChartType: "bar",
    defaultXKey: "NombreArticulo",
    defaultYKey: "totalComprado",
    xFieldOptions: [
      { key: "NombreArticulo", label: "Artículo", type: "dimension" },
      { key: "NombreProveedor", label: "Proveedor", type: "dimension" },
      { key: "Categoria", label: "Categoría", type: "dimension" },
    ],
    yFieldOptions: [
      { key: "totalComprado", label: "Total Comprado", type: "metric" },
      { key: "totalUnidades", label: "Unidades", type: "metric" },
      { key: "totalOrdenes", label: "Órdenes", type: "metric" },
      { key: "costoMinimo", label: "Costo Mínimo", type: "metric" },
      { key: "costoMaximo", label: "Costo Máximo", type: "metric" },
      { key: "costoPromedio", label: "Costo Promedio", type: "metric" },
    ],
  },

  TOP_CLIENTES: {
    availableChartTypes: ["bar", "pie"],
    defaultChartType: "bar",
    defaultXKey: "NombreCliente",
    defaultYKey: "totalVentas",
    xFieldOptions: [
      { key: "NombreCliente", label: "Cliente", type: "dimension" },
    ],
    yFieldOptions: [
      { key: "totalVentas", label: "Total Ventas", type: "metric" },
      { key: "totalTickets", label: "Tickets", type: "metric" },
      { key: "totalUnidades", label: "Unidades", type: "metric" },
    ],
  },

  TOP_CATEGORIAS: {
    availableChartTypes: ["bar", "pie", "treemap"],
    defaultChartType: "bar",
    defaultXKey: "Categoria",
    defaultYKey: "totalVentas",
    xFieldOptions: [
      { key: "Categoria", label: "Categoría", type: "dimension" },
      { key: "Grupo", label: "Grupo", type: "dimension" },
    ],
    yFieldOptions: [
      { key: "totalVentas", label: "Total Ventas", type: "metric" },
      { key: "totalUnidades", label: "Unidades", type: "metric" },
    ],
  },

  MARGEN_ARTICULO: {
    availableChartTypes: ["bar", "line"],
    defaultChartType: "bar",
    defaultXKey: "Nombre",
    defaultYKey: "totalVentas",
    xFieldOptions: [
      { key: "Nombre", label: "Artículo", type: "dimension" },
      { key: "Categoria", label: "Categoría", type: "dimension" },
    ],
    yFieldOptions: [
      { key: "totalVentas", label: "Total Ventas", type: "metric" },
      { key: "totalCosto", label: "Total Costo", type: "metric" },
      { key: "totalUnidades", label: "Unidades", type: "metric" },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIONES ADICIONALES PARA EL FRONTEND
// ─────────────────────────────────────────────────────────────────────────────

export type ComparisonType = "week" | "month" | "quarter" | "year";

export interface PeriodComparisonConfig {
  type: ComparisonType;
  label: string;
  getDateRange: (
    referenceDate: Date,
    offset: number,
  ) => { start: string; end: string };
}

export const PERIOD_COMPARISON_CONFIGS: Record<
  ComparisonType,
  PeriodComparisonConfig
> = {
  week: {
    type: "week",
    label: "Semana",
    getDateRange: (referenceDate: Date, offset: number) => {
      const date = new Date(referenceDate);
      date.setDate(date.getDate() + offset * 7);
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    },
  },
  month: {
    type: "month",
    label: "Mes",
    getDateRange: (referenceDate: Date, offset: number) => {
      const date = new Date(referenceDate);
      date.setMonth(date.getMonth() + offset);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    },
  },
  quarter: {
    type: "quarter",
    label: "Trimestre",
    getDateRange: (referenceDate: Date, offset: number) => {
      const date = new Date(referenceDate);
      const quarter = Math.floor(date.getMonth() / 3);
      date.setMonth((quarter + offset) * 3);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 3, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    },
  },
  year: {
    type: "year",
    label: "Año",
    getDateRange: (referenceDate: Date, offset: number) => {
      const year = referenceDate.getFullYear() + offset;
      return { start: `${year}-01-01`, end: `${year}-12-31` };
    },
  },
};

export const getPredefinedComparisons = () => {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  return {
    weekOverWeek: {
      period1: PERIOD_COMPARISON_CONFIGS.week.getDateRange(lastWeek, 0),
      period2: PERIOD_COMPARISON_CONFIGS.week.getDateRange(today, 0),
      label: "Semana vs Semana Anterior",
    },
    monthOverMonth: {
      period1: PERIOD_COMPARISON_CONFIGS.month.getDateRange(today, -1),
      period2: PERIOD_COMPARISON_CONFIGS.month.getDateRange(today, 0),
      label: "Mes vs Mes Anterior",
    },
    yearOverYear: {
      period1: PERIOD_COMPARISON_CONFIGS.year.getDateRange(today, -1),
      period2: PERIOD_COMPARISON_CONFIGS.year.getDateRange(today, 0),
      label: "Año vs Año Anterior",
    },
  };
};
