// utils/report-utils.ts
import { RequestPayload } from "@/hooks/classes/api";
import { CONFIG } from "./config-constants";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type REPORT =
  | "venta"
  | "compra"
  | "merma"
  | "merma no conocida"
  | "inventario";

export interface Filtro {
  Key: string;
  Value: any;
  Operator: string;
}

export interface FiltroGrupo {
  Filtros: Filtro[];
  OperadorLogico: "AND" | "OR";
}

export interface ActiveFilters {
  Filtros: Filtro[]; // Grupo OR (búsqueda)
  FiltrosOther: Filtro[]; // Grupo AND (fechas, almacén, etc.)
  Selects: any[];
  OrderBy: any | null;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

// ─── Configuración de reportes ──────────────────────────────────────────────

export const REPORT_CONFIGS: Record<
  REPORT,
  Pick<RequestPayload, "table" | "filtros">
> = {
  venta: {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo INNER JOIN Sucursal ON ventad.Sucursal = Sucursal.Sucursal`,
    filtros: {
      selects: [
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
        {
          Key: "(ventad.Precio * ventad.Cantidad)",
          Alias: "Total Ventas",
          Operation: "SUM",
        },
        {
          Key: "(ventad.Costo * ventad.Cantidad)",
          Alias: "Total Costo",
          Operation: "SUM",
        },
        { Key: "ventad.Cantidad", Alias: "Cantidad", Operation: "SUM" },
        {
          Key: "(ventad.Cantidad * ventad.Factor)",
          Alias: "Articulos",
          Operation: "SUM",
        },
        {
          Key: "venta.Cliente",
          Alias: "Clientes Distintos",
          Operation: "COUNT DISTINCT",
        },
        { Key: "venta.ID", Alias: "Total Tikets", Operation: "COUNT DISTINCT" },
      ],
      Filtros: [
        { Key: "venta.Estatus", Operator: "IN", Value: "CONCLUIDO,PROCESAR" },
        {
          Key: "venta.Mov",
          Operator: "IN",
          Value: "Factura,Factura Credito,Nota",
        },
      ],
      Order: [{ Key: "FechaEmision", Direction: "DESC" }],
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
        {
          Key: "(comprad.Costo * comprad.Cantidad)",
          Alias: "Total Costo",
          Operation: "SUM",
        },
        {
          Key: "comprad.CantidadInventario",
          Alias: "Articulos",
          Operation: "SUM",
        },
        {
          Key: "compra.Proveedor",
          Alias: "Total Proveedores",
          Operation: "COUNT DISTINCT",
        },
      ],
      Filtros: [
        {
          Key: "compra.Estatus",
          Operator: "=",
          Value: CONFIG.STATUS.CONCLUIDO,
        },
        { Key: "compra.Mov", Operator: "=", Value: "ENTRADA COMPRA" },
      ],
      Order: [{ Key: "FechaEmision", Direction: "DESC" }],
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
        {
          Key: "(invd.Costo * invd.Cantidad)",
          Alias: "Total Mermas",
          Operation: "SUM",
        },
      ],
      Filtros: [
        { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
      ],
      Order: [{ Key: "FechaEmision", Direction: "DESC" }],
    },
  },

  "merma no conocida": {
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
        {
          Key: "(invd.Costo * invd.Cantidad)",
          Alias: "Total Mermas",
          Operation: "SUM",
        },
      ],
      Filtros: [
        { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
      ],
      Order: [{ Key: "FechaEmision", Direction: "DESC" }],
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
        {
          Key: "(invd.Costo * invd.Cantidad)",
          Alias: "Total Costo",
          Operation: "SUM",
        },
      ],
      Filtros: [
        { Key: "inv.Estatus", Operator: "=", Value: CONFIG.STATUS.CONCLUIDO },
        { Key: "inv.Mov", Operator: "NOT IN", Value: "SALIDA DIVERSA, MERMAS" },
      ],
      Order: [{ Key: "FechaEmision", Direction: "DESC" }],
    },
  },
};

// ─── Columnas sintéticas ──────────────────────────────────────────────────────

export const SYNTHETIC_COLUMNS: {
  syntheticKey: string;
  sourceFields: string[];
}[] = [
  { syntheticKey: "Articulo", sourceFields: ["Nombre", "Articulo", "Codigo"] },
  { syntheticKey: "Proveedor", sourceFields: ["Proveedor", "Fabricante"] },
  {
    syntheticKey: "Categoria",
    sourceFields: ["Categoria", "Grupo", "Familia"],
  },
  { syntheticKey: "Unidad", sourceFields: ["Unidad", "Factor"] },
  { syntheticKey: "Cantidad", sourceFields: ["Cantidad", "Articulos"] },
  { syntheticKey: "Costo", sourceFields: ["Costo", "Total Costo"] },
  {
    syntheticKey: "Sucursal",
    sourceFields: ["Sucursal", "Nombre Sucursal", "Almacen"],
  },
];

// ─── Dependencias de agregaciones ────────────────────────────────────────────

export const AGGREGATION_DEPENDENCIES: Record<string, string[]> = {
  "Total Costo": ["Costo"],
  "Total Ventas": ["Precio"],
  "Total Costo Inventario": ["Costo"],
  "Total Mermas": ["Costo"],
  "Minimo Costo": ["Costo"],
  "Maximo Costo": ["Costo"],
  Articulos: ["Cantidad"],
  "Total Articulos Mermados": ["Cantidad"],
  "Total Articulos Inventario": ["Cantidad"],
  // Agrega más según necesites
};

// ─── Mapeo del campo Almacén por reporte ────────────────────────────────────

export const ALMACEN_FIELD_MAP: Record<REPORT, string> = {
  venta: "Sucursal.Nombre",
  compra: "Sucursal.Nombre",
  merma: "Sucursal.Nombre",
  "merma no conocida": "Sucursal.Nombre",
  inventario: "Sucursal.Nombre",
};

// ─── Mapeo de campos de búsqueda por reporte ────────────────────────────────

export const SEARCH_FIELDS_MAP: Record<REPORT, string[]> = {
  venta: ["ART.Descripcion1", "ART.Articulo"],
  compra: ["ART.Descripcion1", "ART.Articulo", "P.Nombre"],
  merma: ["art.Descripcion1", "art.Articulo"],
  "merma no conocida": ["art.Descripcion1", "art.Articulo"],
  inventario: ["art.Descripcion1", "art.Articulo"],
};

// ─── Opciones de almacenes ──────────────────────────────────────────────────

export const ALMACENES_OPCIONES = [
  { value: "Valle de Guadalupe", label: "Valle de Guadalupe" },
  { value: "Mayoreo", label: "Mayoreo" },
  { value: "Testerazo", label: "Testerazo" },
  { value: "Valle de las Palmas", label: "Valle de las Palmas" },
];

// ─── Funciones de utilidad ──────────────────────────────────────────────────

export const getDefaultDateRangeValue = (): string => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return `${start.toISOString().split("T")[0]} AND ${end.toISOString().split("T")[0]}`;
};

export const buildFiltrosAnd = (
  baseFiltros: Filtro[] = [],
  activeFilters: ActiveFilters,
): FiltroGrupo[] => {
  const grupoAnd: Filtro[] = [
    ...baseFiltros,
    ...(activeFilters.FiltrosOther || []),
  ];
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

export const getHiddenAggregations = (
  visibleKeys: string[],
  aggregations: any[] = [],
): Set<string> => {
  const hiddenAggregations = new Set<string>();

  aggregations.forEach((agg: any) => {
    const alias = agg.Alias || agg.Key.split(".").pop() || agg.Key;
    const dependencies = AGGREGATION_DEPENDENCIES[alias] || [];
    const hasHiddenDependency = dependencies.some(
      (dep) => !visibleKeys.includes(dep),
    );
    if (hasHiddenDependency) {
      hiddenAggregations.add(alias);
    }
  });

  return hiddenAggregations;
};

// ─── Constantes adicionales ─────────────────────────────────────────────────

export const REPORT_KEYS = Object.keys(REPORT_CONFIGS) as REPORT[];
export const SUGGESTIONS_LIMIT = 50;
