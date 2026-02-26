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
export const CONFIG = {
  PAGE_SIZE: 10,
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
      tableField: "ART.Descripcion1",
      prefix: "ART.",
      table: "ART",
    },
    {
      key: "cliente",
      label: "Cliente",
      icon: Users,
      color: "text-green-500",
      tableField: "C.Nombre",
      prefix: "C.",
      table: "C",
    },
    {
      key: "categoria",
      label: "Categoría",
      icon: Filter,
      color: "text-purple-500",
      tableField: "ART.Categoria",
      prefix: "ART.",
      table: "ART",
    },
    {
      key: "codigo",
      label: "Código",
      icon: DollarSign,
      color: "text-yellow-500",
      tableField: "ventad.Codigo",
      prefix: "ventad.",
      table: "ventad",
    },
  ],
  compras: [
    {
      key: "articulo",
      label: "Artículo",
      icon: Package,
      color: "text-blue-500",
      tableField: "ART.Descripcion1",
      prefix: "ART.",
      table: "ART",
    },
    {
      key: "proveedor",
      label: "Proveedor",
      icon: ShoppingCart,
      color: "text-orange-500",
      tableField: "P.Nombre",
      prefix: "P.",
      table: "P",
    },
    {
      key: "fabricante",
      label: "Fabricante",
      icon: Building,
      color: "text-red-500",
      tableField: "ART.Fabricante",
      prefix: "ART.",
      table: "ART",
    },
    {
      key: "codigo",
      label: "Código",
      icon: DollarSign,
      color: "text-yellow-500",
      tableField: "CB.Codigo",
      prefix: "comprad.",
      table: "comprad",
    },
  ],
  mermas: [
    {
      key: "articulo",
      label: "Artículo",
      icon: Package,
      color: "text-blue-500",
      tableField: "art.Descripcion1",
      prefix: "art.",
      table: "art",
    },
    {
      key: "concepto",
      label: "Concepto",
      icon: Filter,
      color: "text-purple-500",
      tableField: "inv.Concepto",
      prefix: "inv.",
      table: "inv",
    },
    {
      key: "categoria",
      label: "Categoría",
      icon: Filter,
      color: "text-indigo-500",
      tableField: "art.Categoria",
      prefix: "art.",
      table: "art",
    },
    {
      key: "codigo",
      label: "Código",
      icon: DollarSign,
      color: "text-yellow-500",
      tableField: "invd.Codigo",
      prefix: "invd.",
      table: "invd",
    },
  ],
  inventario: [
    {
      key: "articulo",
      label: "Artículo",
      icon: Package,
      color: "text-blue-500",
      tableField: "art.Descripcion1",
      prefix: "art.",
      table: "art",
    },
    {
      key: "descripcion",
      label: "Descripción",
      icon: Filter,
      color: "text-purple-500",
      tableField: "art.Descripcion1",
      prefix: "art.",
      table: "art",
    },
  ],
  comparacion: [
    {
      key: "articulo",
      label: "Artículo",
      icon: Package,
      color: "text-blue-500",
      tableField: "ART.Descripcion1",
      prefix: "ART.",
      table: "ART",
    },
    {
      key: "categoria",
      label: "Categoría",
      icon: Filter,
      color: "text-purple-500",
      tableField: "ART.Categoria",
      prefix: "ART.",
      table: "ART",
    },
    {
      key: "fabricante",
      label: "Fabricante",
      icon: Building,
      color: "text-red-500",
      tableField: "ART.Fabricante",
      prefix: "ART.",
      table: "ART",
    },
    {
      key: "codigo",
      label: "Código",
      icon: DollarSign,
      color: "text-yellow-500",
      tableField: "ventad.Codigo",
      prefix: "ventad.",
      table: "ventad",
    },
  ],
};

// Configuración de consultas por tipo de reporte
export const QUERY_CONFIGS: Record<ReportType, QueryConfig> = {
  ventas: {
    table: `VENTA AS venta
            INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID
            INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo
            INNER JOIN Cte AS C ON venta.Cliente = C.Cliente`,
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
    fechaField: "venta.FechaEmision",
    searchColumns: SEARCH_COLUMNS_CONFIG.ventas,
  },
  compras: {
    table: `COMPRA AS compra
            INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID
            INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo
            INNER JOIN CB AS cb ON cb.Cuenta = art.Articulo
            LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor`,
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
    ],
    fechaField: "compra.FechaEmision",
    searchColumns: SEARCH_COLUMNS_CONFIG.compras,
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
      { Key: "inv.FechaEmision" },
    ],
    agregaciones: [
      {
        Key: "(invd.Costo * invd.Cantidad)",
        Alias: "totalCosto",
        Operation: "SUM",
      },
      {
        Key: "(invd.Cantidad * ART.Factor)",
        Alias: "totalArticulos",
        Operation: "SUM",
      },
    ],
    fechaField: "inv.FechaEmision",
    searchColumns: SEARCH_COLUMNS_CONFIG.mermas,
  },
  inventario: {
    table: `INVD AS invd
                INNER JOIN inv AS inv ON inv.ID = invd.ID
                LEFT JOIN Art AS art ON art.Articulo = invd.Articulo`,
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
      {
        Key: "(invd.Cantidad * ART.Factor)",
        Alias: "totalArticulos",
        Operation: "SUM",
      },
    ],
    fechaField: "inv.FechaEmision",
    searchColumns: SEARCH_COLUMNS_CONFIG.inventario,
  },
  comparacion: {
    table: `VENTA AS venta
        INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID
        LEFT JOIN COMPRA AS compra ON compra.FechaEmision = venta.FechaEmision
        LEFT JOIN COMPRAD AS comprad ON comprad.ID = compra.ID AND comprad.Articulo = ventad.Articulo
        INNER JOIN ART AS ART ON ART.Articulo = ventad.Articulo
        LEFT JOIN Cte AS C ON venta.Cliente = C.Cliente
        LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor`,
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
      { Key: "ART.Fabricante" },
    ],
    agregaciones: [
      {
        Key: "(ventad.Precio * ventad.Cantidad)",
        Alias: "totalVentas",
        Operation: "SUM",
      },
      {
        Key: "(comprad.Costo * comprad.Cantidad)",
        Alias: "totalCompras",
        Operation: "SUM",
      },
      {
        Key: "((ventad.Precio * ventad.Cantidad) - (ventad.Costo * ventad.Cantidad))",
        Alias: "diferencia",
        Operation: "SUM",
      },
      {
        Key: "ventad.Articulo",
        Alias: "totalArticulos",
        Operation: "COUNT DISTINCT",
      },
    ],
    fechaField: "venta.FechaEmision",
    searchColumns: SEARCH_COLUMNS_CONFIG.comparacion,
  },
};
