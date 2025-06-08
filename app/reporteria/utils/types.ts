export type ReportType = "COMPRA" | "VENTA";

export interface ReportConfig {
  type: ReportType;
  title: string;
  amountKey: "Costo" | "Importe";
  mainField: string;
  sumKey: string;
}
export interface ReporteriaFilters {
  Filtros: Array<{
    Key: string;
    Value: string;
    Operator: string;
  }>;
  Selects: Array<{
    Key: string;
  }>;
  OrderBy: {
    Key: string;
    Direction: string;
  };
}
