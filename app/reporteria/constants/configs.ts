import { ReportConfig, ReportType } from "../utils/types";

// constants/configs.ts - Actualizado con selects base por reporte
export const REPORT_CONFIGS: Record<ReportType, ReportConfig> = {
  compras: {
    type: "compras",
    title: "compras",
    table: `COMPRAD InvD 
                  INNER JOIN COMPRA INV ON INVD.ID = INV.ID
                  LEFT JOIN ART ON INVD.Articulo = ART.Articulo
                  LEFT JOIN PROV C ON INV.Proveedor = C.Proveedor`,
    amountKey: "CostoTotal",
    mainField: "Proveedor",
    sumKey: "Proveedor",
    baseSelects: [
      { Key: "INVD.Codigo", Alias: "Código" },
      { Key: "C.Nombre", Alias: "Proveedor" },
      { Key: "ART.Fabricante", Alias: "Fabricante" },
      { Key: "INV.Mov", Alias: "Movimiento" },
      { Key: "INVD.Articulo", Alias: "Artículo" },
      { Key: "ART.Descripcion1", Alias: "Descripción" },
      { Key: "ART.Categoria", Alias: "Categoría" },
      { Key: "ART.Grupo", Alias: "Grupo" },
      { Key: "ART.Linea", Alias: "Línea" },
      { Key: "ART.Familia", Alias: "Familia" },
      { Key: "INVD.Unidad", Alias: "Unidad" },
      { Key: "INVD.Factor", Alias: "Factor" },
      { Key: "INVD.Cantidad", Alias: "Cantidad" },
      { Key: "INVD.CantidadInventario", Alias: "Cantidad Inventario" },
      { Key: "INVD.Costo", Alias: "Costo" },
      { Key: "INVD.Almacen", Alias: "Almacén" },
      { Key: "INVD.Impuesto1", Alias: "Impuesto 1" },
      { Key: "INVD.Impuesto2", Alias: "Impuesto 2" },
      { Key: "INVD.DescuentoImporte", Alias: "Descuento" },
      { Key: "FechaEmision", Alias: "Fecha Emisión" },
    ],
  },
  ventas: {
    type: "ventas",
    title: "ventas",
    table: `VENTA vnt WITH(NOLOCK)
                  INNER JOIN VENTAD vntd WITH(NOLOCK) ON vntd.ID = vnt.ID
                  LEFT JOIN ART WITH(NOLOCK) ON vntd.Articulo = ART.Articulo
                  LEFT JOIN Cte C WITH(NOLOCK) ON vnt.Cliente = C.Cliente `,
    amountKey: "ImporteTotal",
    mainField: "Cliente",
    sumKey: "Cliente",
    baseSelects: [
      { Key: "vntd.Codigo", Alias: "Código" },
      { Key: "C.Nombre", Alias: "Cliente" },
      { Key: "ART.Fabricante", Alias: "Fabricante" },
      { Key: "vnt.Mov", Alias: "Movimiento" },
      { Key: "vntd.Articulo", Alias: "Artículo" },
      { Key: "ART.Descripcion1", Alias: "Descripción" },
      { Key: "ART.Categoria", Alias: "Categoría" },
      { Key: "ART.Grupo", Alias: "Grupo" },
      { Key: "ART.Linea", Alias: "Línea" },
      { Key: "ART.Familia", Alias: "Familia" },
      { Key: "vntd.Unidad", Alias: "Unidad" },
      { Key: "vntd.Factor", Alias: "Factor" },
      { Key: "vntd.Cantidad", Alias: "Cantidad" },
      { Key: "vntd.CantidadInventario", Alias: "Cantidad Inventario" },
      { Key: "vntd.Precio", Alias: "Precio" },
      { Key: "vntd.Almacen", Alias: "Almacén" },
      { Key: "vntd.Impuesto1", Alias: "Impuesto 1" },
      { Key: "vntd.Impuesto2", Alias: "Impuesto 2" },
      { Key: "vntd.DescuentoImporte", Alias: "Descuento" },
      { Key: "vnt.FechaEmision", Alias: "Fecha Emisión" },
    ],
  },
  almacen: {
    type: "almacen",
    title: "almacen",
    table: `INVD invd ON inv.Estatus = 'CONCLUIDO'
                INNER JOIN inv inv ON inv.ID = invd.ID 
                LEFT JOIN Art Articulo ON art.Articulo = invd.Articulo`,
    amountKey: "CostoTotal",
    mainField: "Producto",
    sumKey: "Producto",
    baseSelects: [
      { Key: "Articulo.Articulo", Alias: "Código Artículo" },
      { Key: "Articulo.Descripcion1", Alias: "Descripción" },
      { Key: "Articulo.Fabricante", Alias: "Fabricante" },
      { Key: "Articulo.Categoria", Alias: "Categoría" },
      { Key: "Articulo.Grupo", Alias: "Grupo" },
      { Key: "Articulo.Linea", Alias: "Línea" },
      { Key: "Articulo.Familia", Alias: "Familia" },
      { Key: "inv.Almacen", Alias: "Almacén" },
      { Key: "inv.Existencia", Alias: "Existencia" },
      { Key: "inv.Disponible", Alias: "Disponible" },
      { Key: "inv.Reservado", Alias: "Reservado" },
      { Key: "Articulo.CostoPromedio", Alias: "Costo Promedio" },
      { Key: "Articulo.UltimoCosto", Alias: "Último Costo" },
    ],
  },
  mermas: {
    type: "mermas",
    title: "mermas",
    table: `INVD invd ON inv.Concepto LIKE '%MERMAS%'
                    AND inv.Estatus = 'CONCLUIDO'
                INNER JOIN inv inv ON inv.ID = invd.ID 
                LEFT JOIN Art Articulo ON Articulo.Articulo = invd.Articulo`,
    amountKey: "ImporteTotal",
    mainField: "Producto",
    sumKey: "Producto",
    baseSelects: [],
  },
};
