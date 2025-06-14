import { ReportConfig, ReportType } from "../utils/types";

export const REPORT_CONFIGS: Record<ReportType, ReportConfig> = {
  compras: {
    type: "compras",
    title: "compras",
    amountKey: "Costo",
    mainField: "Proveedor",
    sumKey: "Proveedor",
  },
  ventas: {
    type: "ventas",
    title: "ventas",
    amountKey: "Importe",
    mainField: "Cliente",
    sumKey: "Cliente",
  },
};
