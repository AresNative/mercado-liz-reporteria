import { ReportConfig, ReportType } from "../utils/types";

export const REPORT_CONFIGS: Record<ReportType, ReportConfig> = {
  COMPRA: {
    type: "COMPRA",
    title: "Compras",
    amountKey: "Costo",
    mainField: "Proveedor",
    sumKey: "Proveedor",
  },
  VENTA: {
    type: "VENTA",
    title: "Ventas",
    amountKey: "Importe",
    mainField: "Cliente",
    sumKey: "Cliente",
  },
};
