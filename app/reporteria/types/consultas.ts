export type ReportType =
  | "ventas"
  | "compras"
  | "mermas"
  | "inventario"
  | "comparacion";

export interface StatsData {
  totalVentas?: number;
  totalTikets?: number;
  totalCosto?: number;
  totalArticulos?: number;
  totalCompras?: number;
  diferencia?: number;
  totalClientes?: number;
  totalProveedores?: number;
  utilidad?: number;
  margen?: number;
  promedio?: number;
}
