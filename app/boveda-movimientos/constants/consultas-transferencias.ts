const general = {
    table: "pagos INNER JOIN proveedores as prov ON prov.id = pagos.proveedor_id",
    selects: [
        { Key: "pagos.id", },
        { Key: "prov.clave", Alias: "Proveedor" },
        { Key: "prov.nombre", Alias: "Nombre" },
        { Key: "monto", },
        { Key: "fecha", },
        { Key: "metodo_pago", },
    ],
}

const proveedores_int = {
    table: "Prov",
    selects: [
        { Key: "Nombre" },
        { Key: "Proveedor" }
    ],
};

const proveedores = {
    table: "proveedores",
    selects: [{ Key: "Nombre" }, { Key: "clave" }],
};