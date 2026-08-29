// utils/config-constants.ts

// ─── Configuración general ──────────────────────────────────────────────────

export const CONFIG = {
  PAGE_SIZE: 50,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100, 250],
  STATUS: {
    CONCLUIDO: "CONCLUIDO",
    PROCESAR: "PROCESAR",
    CANCELADO: "CANCELADO",
  },
} as const;

// ─── Configuración de consultas (usado en modal-reporting original) ────────

// Nota: En la versión refactorizada de modal-reporting, estas constantes ya no se usan,
// pero se mantienen por si otros módulos las requieren.
export const QUERY_CONFIGS = {
  ventas: {
    table: `VENTA AS venta INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo INNER JOIN Sucursal ON ventad.Sucursal = Sucursal.Sucursal`,
  },
  compras: {
    table: `COMPRA AS compra INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo LEFT JOIN PROV AS P ON compra.Proveedor = P.Proveedor INNER JOIN Sucursal ON comprad.Sucursal = Sucursal.Sucursal`,
  },
  mermas: {
    table: `INV AS inv INNER JOIN INVD AS invd ON inv.Mov = 'SALIDA DIVERSA' AND invd.ID = inv.ID AND inv.Concepto = 'SALIDA POR MERMAS' OR inv.Mov = 'MERMAS' AND invd.ID = inv.ID INNER JOIN Art AS art ON art.Articulo = invd.Articulo  INNER JOIN Sucursal ON invd.Sucursal = Sucursal.Sucursal`,
  },
  // ... otros si se necesitan
};

// ─── Rangos horarios (usado en modal-reporting original) ──────────────────

export const TIME_RANGES = [
  { hora: "00:00", value: "00:00 AND 00:59" },
  { hora: "01:00", value: "01:00 AND 01:59" },
  { hora: "02:00", value: "02:00 AND 02:59" },
  { hora: "03:00", value: "03:00 AND 03:59" },
  { hora: "04:00", value: "04:00 AND 04:59" },
  { hora: "05:00", value: "05:00 AND 05:59" },
  { hora: "06:00", value: "06:00 AND 06:59" },
  { hora: "07:00", value: "07:00 AND 07:59" },
  { hora: "08:00", value: "08:00 AND 08:59" },
  { hora: "09:00", value: "09:00 AND 09:59" },
  { hora: "10:00", value: "10:00 AND 10:59" },
  { hora: "11:00", value: "11:00 AND 11:59" },
  { hora: "12:00", value: "12:00 AND 12:59" },
  { hora: "13:00", value: "13:00 AND 13:59" },
  { hora: "14:00", value: "14:00 AND 14:59" },
  { hora: "15:00", value: "15:00 AND 15:59" },
  { hora: "16:00", value: "16:00 AND 16:59" },
  { hora: "17:00", value: "17:00 AND 17:59" },
  { hora: "18:00", value: "18:00 AND 18:59" },
  { hora: "19:00", value: "19:00 AND 19:59" },
  { hora: "20:00", value: "20:00 AND 20:59" },
  { hora: "21:00", value: "21:00 AND 21:59" },
  { hora: "22:00", value: "22:00 AND 22:59" },
  { hora: "23:00", value: "23:00 AND 23:59" },
];
