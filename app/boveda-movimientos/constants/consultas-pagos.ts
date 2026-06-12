const general_int = {
  table:
    "CXP INNER JOIN Prov ON CXP.Proveedor = Prov.Proveedor INNER JOIN (SELECT DISTINCT ID FROM CXPD) AS CXPD_Unico ON CXP.ID = CXPD_Unico.ID",
  selects: [
    { Key: "CXP.ID" },
    { Key: "CXP.OrigenID" },
    { Key: "CXP.Proveedor" },
    { Key: "Prov.Nombre" },
    { Key: "CXP.Sucursal" },
    { Key: "CXP.Importe", Alias: "Importe" },
    { Key: "CXP.Saldo" },
    { Key: "CXP.Impuestos" },
    { Key: "CXP.IVAFiscal" },
    { Key: "CXP.IEPSFiscal" },
    { Key: "CXP.FechaEmision" },
  ],
};

const xml = (selectedPago:string) => {
    return {
      table: `CXP INNER JOIN CXPD ON CXP.MOV = 'Pago' AND CXPD.Aplica = 'Entrada Compra' AND CXPD.ID = ${selectedPago} AND CXPD.ID = CXP.ID INNER JOIN Prov ON CXP.Proveedor = Prov.Proveedor LEFT JOIN COMPRA ON CXPD.AplicaID = COMPRA.MovID LEFT JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo `,
      selects: [
        { Key: "compra.MovID" },
        { Key: "CXP.ID" },
        { Key: "CXP.Proveedor" },
        { Key: "Prov.Nombre", Alias: "Nombre Proveedor" },
        { Key: "CXPD.Importe" },
        { Key: "art.Articulo" },
        { Key: "art.Descripcion1", Alias: "Nombre" },
        { Key: "ART.Categoria" },
        { Key: "ART.Grupo" },
        { Key: "ART.Familia" },
        { Key: "comprad.Costo", Alias: "Costo Unitario" },
        { Key: "comprad.Unidad" },
        { Key: "comprad.Factor" },
        { Key: "comprad.Impuesto1", Alias: "IVA" },
        { Key: "comprad.Impuesto2", Alias: "IEPS" },
        { Key: "comprad.Impuesto3", Alias: "ISR" },
      ],
      agregaciones: [
        { Key: "comprad.Cantidad", Alias: "Cantidad", Operation: "SUM" },
        {
          Key: "comprad.CantidadInventario",
          Alias: "Articulos Totales",
          Operation: "SUM",
        },
        {
          Key: "(comprad.Costo * comprad.Cantidad)",
          Alias: "Total Compras",
          Operation: "SUM",
        },
      ],
    };
};