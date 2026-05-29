import {
  Building,
  DollarSign,
  Filter,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import { QueryConfig, SearchColumn } from "../types/config";
import { ReportType } from "../types/consultas";

// Constantes y configuración
export const CONFIG: any = {
  PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  STATUS: { CONCLUIDO: "CONCLUIDO" },
  MARGIN_WARNING: 20,
  MARGIN_CRITICAL: 10,
  REPORT_TYPES: {
    VENTAS: "ventas",
    COMPRAS: "compras",
    MERMAS: "mermas",
    COMPARACION: "comparacion",
  } as const,
} as const;

// Configuración de columnas de búsqueda por tipo de reporte
export const SEARCH_COLUMNS_CONFIG: Record<ReportType, SearchColumn[]> = {
  ventas: [
    {
      key: "articulo",
      label: "Artículo",
      icon: Package,
      color: "text-blue-500",
      tableField: "Descripcion1",
      prefix: "ART.",
      table: "ART",
    },
    {
      key: "cliente",
      label: "Cliente",
      icon: Users,
      color: "text-green-500",
      tableField: "Nombre",
      prefix: "C.",
      table: "C",
    },
    {
      key: "categoria",
      label: "Categoría",
      icon: Filter,
      color: "text-purple-500",
      tableField: "Categoria",
      prefix: "ART.",
      table: "ART",
    },
    {
      key: "codigo",
      label: "Código",
      icon: DollarSign,
      color: "text-yellow-500",
      tableField: "Codigo",
      prefix: "ventad.",
      table: "cb",
    },
  ],
  compras: [
    {
      key: "articulo",
      label: "Artículo",
      icon: Package,
      color: "text-blue-500",
      tableField: "Descripcion1",
      prefix: "ART.",
      table: "ART",
    },
    {
      key: "proveedor",
      label: "Proveedor",
      icon: ShoppingCart,
      color: "text-orange-500",
      tableField: "Nombre",
      prefix: "P.",
      table: "P",
    },
    {
      key: "fabricante",
      label: "Fabricante",
      icon: Building,
      color: "text-red-500",
      tableField: "Fabricante",
      prefix: "ART.",
      table: "ART",
    },
    {
      key: "codigo",
      label: "Código",
      icon: DollarSign,
      color: "text-yellow-500",
      tableField: "Codigo",
      prefix: "comprad.",
      table: "cb",
    },
  ],
  mermas: [
    {
      key: "articulo",
      label: "Artículo",
      icon: Package,
      color: "text-blue-500",
      tableField: "Descripcion1",
      prefix: "art.",
      table: "art",
    },
    {
      key: "concepto",
      label: "Concepto",
      icon: Filter,
      color: "text-purple-500",
      tableField: "Concepto",
      prefix: "inv.",
      table: "inv",
    },
    {
      key: "categoria",
      label: "Categoría",
      icon: Filter,
      color: "text-indigo-500",
      tableField: "Categoria",
      prefix: "art.",
      table: "art",
    },
    {
      key: "codigo",
      label: "Código",
      icon: DollarSign,
      color: "text-yellow-500",
      tableField: "Codigo",
      prefix: "invd.",
      table: "cb",
    },
  ],
  inventario: [
    {
      key: "articulo",
      label: "Artículo",
      icon: Package,
      color: "text-blue-500",
      tableField: "Descripcion1",
      prefix: "art.",
      table: "art",
    },
    {
      key: "descripcion",
      label: "Descripción",
      icon: Filter,
      color: "text-purple-500",
      tableField: "Descripcion1",
      prefix: "art.",
      table: "art",
    },
  ]
};

// Configuración de consultas por tipo de reporte
export const QUERY_CONFIGS: Record<ReportType, QueryConfig> = {
  ventas: {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo INNER JOIN Cte AS C ON venta.Cliente = C.Cliente`,
    selects: [
      { Key: "ventad.Codigo" },
      { Key: "C.Nombre", Alias: "Cliente" },
      { Key: "ventad.Articulo" },
      { Key: "ART.Descripcion1", Alias: "Nombre" },
      { Key: "ART.Categoria" },
      { Key: "ART.Grupo" },
      { Key: "ventad.Cantidad" },
      { Key: "ventad.Unidad" },
      { Key: "ventad.Factor" },
      { Key: "ventad.Precio", Alias: "Precio unitario" },
      { Key: "ventad.Costo", Alias: "Costo unitario" },
      { Key: "ventad.Almacen" },
      { Key: "venta.FechaEmision" },
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
      { Key: "venta.ID", Alias: "totalTikets", Operation: "COUNT DISTINCT" },
    ],
    fechaField: "FechaEmision",
    searchColumns: SEARCH_COLUMNS_CONFIG.ventas,
  },
  compras: {
    table: `COMPRA AS compra INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo LEFT JOIN CB AS cb ON cb.Cuenta = art.Articulo AND cb.Codigo = comprad.Codigo LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor`,
    selects: [
      { Key: "CB.Codigo" },
      { Key: "P.Nombre", Alias: "Proveedor" },
      { Key: "ART.Fabricante" },
      { Key: "comprad.Articulo" },
      { Key: "ART.Descripcion1", Alias: "Nombre" },
      { Key: "ART.Categoria" },
      { Key: "ART.Grupo" },
      { Key: "comprad.Cantidad" },
      { Key: "comprad.Unidad" },
      { Key: "comprad.Factor" },
      { Key: "comprad.CantidadInventario" },
      { Key: "comprad.DescuentoLinea", Alias: "Descuento" },
      { Key: "comprad.Costo", Alias: "CostoUnitario" },
      { Key: "comprad.Almacen" },
      { Key: "compra.FechaEmision" },
    ],
    agregaciones: [
      {
        Key: "(comprad.Costo * comprad.Cantidad)",
        Alias: "totalCosto",
        Operation: "SUM",
      },
      {
        Key: "comprad.CantidadInventario",
        Alias: "totalArticulos",
        Operation: "SUM",
      },
      {
        Key: "compra.Proveedor",
        Alias: "totalProveedores",
        Operation: "COUNT DISTINCT",
      },
      { Key: "comprad.Costo", Alias: "minimoCosto", Operation: "MIN" },
      { Key: "comprad.Costo", Alias: "maximoCosto", Operation: "MAX" },
    ],
    fechaField: "FechaEmision",
    searchColumns: SEARCH_COLUMNS_CONFIG.compras,
  },
  mermas: {
    table: `INV AS inv INNER JOIN INVD AS invd ON invd.ID = inv.ID AND inv.Mov = 'SALIDA DIVERSA' AND inv.Concepto = 'SALIDA POR MERMAS' INNER JOIN Art AS art ON art.Articulo = invd.Articulo`,
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
      { Key: "inv.FechaEmision" },
    ],
    agregaciones: [
      {
        Key: "(invd.Costo * invd.Cantidad)",
        Alias: "totalCosto",
        Operation: "SUM",
      },
      { Key: "invd.Cantidad", Alias: "totalArticulos", Operation: "SUM" },
    ],
    fechaField: "FechaEmision",
    searchColumns: SEARCH_COLUMNS_CONFIG.mermas,
  },
  inventario: {
    table: `INVD AS invd INNER JOIN inv AS inv ON inv.ID = invd.ID INNER JOIN Art AS art ON art.Articulo = invd.Articulo`,
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
      { Key: "inv.FechaEmision" },
    ],
    agregaciones: [
      {
        Key: "(invd.Costo * invd.Cantidad)",
        Alias: "totalCosto",
        Operation: "SUM",
      },
      { Key: "invd.Cantidad", Alias: "totalArticulos", Operation: "SUM" },
    ],
    fechaField: "FechaEmision",
    searchColumns: SEARCH_COLUMNS_CONFIG.inventario,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPARISON_QUERY_CONFIGS
// Tres consultas totalmente independientes que se lanzan en paralelo.
// Sus resultados se fusionan en processComparisonStats() en page.tsx.
// ─────────────────────────────────────────────────────────────────────────────
export const COMPARISON_QUERY_CONFIGS = {
  ventas: {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ART.Articulo = ventad.Articulo`,
    agregaciones: [
      {
        Key: "(ventad.Precio * ventad.Cantidad)",
        Alias: "totalVentas",
        Operation: "SUM",
      },
      {
        Key: "(ventad.Costo * ventad.Cantidad)",
        Alias: "totalCostoVentas",
        Operation: "SUM",
      },
      { Key: "venta.ID", Alias: "totalTikets", Operation: "COUNT DISTINCT" },
      {
        Key: "ventad.Articulo",
        Alias: "totalArticulosVendidos",
        Operation: "COUNT DISTINCT",
      },
    ],
    fechaField: "FechaEmision",
  },
  compras: {
    table: `COMPRA AS compra INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON ART.Articulo = comprad.Articulo`,
    agregaciones: [
      {
        Key: "(comprad.Costo * comprad.Cantidad)",
        Alias: "totalCompras",
        Operation: "SUM",
      },
      {
        Key: "compra.Proveedor",
        Alias: "totalProveedores",
        Operation: "COUNT DISTINCT",
      },
      {
        Key: "comprad.Articulo",
        Alias: "totalArticulosComprados",
        Operation: "COUNT DISTINCT",
      },
    ],
    fechaField: "FechaEmision",
  },
  mermas: {
    table: `INV AS inv INNER JOIN INVD AS invd ON invd.ID = inv.ID AND inv.Mov = 'SALIDA DIVERSA' AND inv.Concepto = 'SALIDA POR MERMAS' INNER JOIN Art AS art ON art.Articulo = invd.Articulo`,
    agregaciones: [
      {
        Key: "(invd.Costo * invd.Cantidad)",
        Alias: "totalMermas",
        Operation: "SUM",
      },
      {
        Key: "invd.Articulo",
        Alias: "totalArticulosMerma",
        Operation: "COUNT DISTINCT",
      },
    ],
    fechaField: "FechaEmision",
  },
} as const;

export type ComparisonQueryKey = keyof typeof COMPARISON_QUERY_CONFIGS;
