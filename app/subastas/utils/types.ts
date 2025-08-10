export type ReportType =
  | "compras"
  | "ventas"
  | "almacen"
  /*   | "gastos" */
  /* | "utilidadbruta" */
  | "mermas";

export interface ReportConfig {
  type: ReportType;
  title: string;
  amountKey: "CostoTotal" | "ImporteTotal";
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

export type FilterType = { Key: string; Value: string; Operator: string };
export type SelectType = { Key: string };
export type OrderByType = { Key: string; Direction: "asc" | "desc" };

export interface FilterSectionProps {
  onApply: (filters: {
    Filtros: FilterType[];
    Selects: SelectType[];
    OrderBy: OrderByType;
    sum: boolean;
    distinct: boolean;
  }) => void;
  onReset: () => void;
  config: string;
  filterFunction: any;
  cols?: any;
}

export type FormValues = {
  Filtros: FilterType[];
  Selects: SelectType[];
  OrderBy: OrderByType;
  DateFilters: {
    startDate: string;
    endDate: string;
    preset: string;
  };
  sum: boolean;
  distinct: boolean;
};
