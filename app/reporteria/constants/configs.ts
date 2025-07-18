import { ReportConfig, ReportType } from "../utils/types";

export const REPORT_CONFIGS: Record<ReportType, ReportConfig> = {
  compras: {
    type: "compras",
    title: "compras",
    amountKey: "CostoTotal",
    mainField: "Proveedor",
    sumKey: "Proveedor",
  },
  ventas: {
    type: "ventas",
    title: "ventas",
    amountKey: "ImporteTotal",
    mainField: "Cliente",
    sumKey: "Cliente",
  },
  /* gastos: {
    type: "gastos",
    title: "gastos",
    amountKey: "ImporteTotal",
    mainField: "Cliente",
    sumKey: "Cliente",
  }, */
  almacen: {
    type: "almacen",
    title: "almacen",
    amountKey: "CostoTotal",
    mainField: "Producto",
    sumKey: "Producto",
  },
  /* utilidadbruta: {
    type: "utilidadbruta",
    title: "utilidadbruta",
    amountKey: "ImporteTotal",
    mainField: "Cliente",
    sumKey: "Cliente",
  }, */
  mermas: {
    type: "mermas",
    title: "mermas",
    amountKey: "ImporteTotal",
    mainField: "Producto",
    sumKey: "Producto",
  },
};
