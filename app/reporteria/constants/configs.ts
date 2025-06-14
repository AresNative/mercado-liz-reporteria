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
  gastos: {
    type: "gastos",
    title: "gastos",
    amountKey: "Importe",
    mainField: "Cliente",
    sumKey: "Cliente",
  },
  almacen: {
    type: "almacen",
    title: "almacen",
    amountKey: "Costo",
    mainField: "Producto",
    sumKey: "Producto",
  },
  utilidad: {
    type: "utilidad",
    title: "utilidad",
    amountKey: "Importe",
    mainField: "Cliente",
    sumKey: "Cliente",
  },
  mermas: {
    type: "mermas",
    title: "mermas",
    amountKey: "Importe",
    mainField: "Producto",
    sumKey: "Producto",
  },
};
