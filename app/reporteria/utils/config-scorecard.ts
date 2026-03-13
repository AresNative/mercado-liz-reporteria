import { QueryConfig } from "../types/config";

export const QUERY_CONFIGS: Record<string, QueryConfig> = {
  PERIODOS: {
    table: `VENTA AS venta`,
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
    searchColumns: [],
  },
  compras: {
    table: `COMPRA AS compra
            INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID
            INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo
            LEFT JOIN CB AS cb ON cb.Cuenta = art.Articulo AND cb.Codigo = comprad.Codigo
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
      {
        Key: "comprad.Costo",
        Alias: "minimoCosto",
        Operation: "MIN",
      },
      {
        Key: "comprad.Costo",
        Alias: "maximoCosto",
        Operation: "MAX",
      },
    ],
    fechaField: "compra.FechaEmision",
    searchColumns: [],
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
    searchColumns: [],
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
    searchColumns: [],
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
    searchColumns: [],
  },
};
