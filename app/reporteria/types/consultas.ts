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
  totalMermas?: number;
  diferencia?: number;
  totalClientes?: number;
  totalProveedores?: number;
  utilidad?: number;
  margen?: number;
  promedio?: number;
  minimoCosto?: number;
  maximoCosto?: number;
}
