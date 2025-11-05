export type ReportType = "compras" | "ventas" | "almacen" | "mermas";

export interface ReportConfig {
  type: ReportType;
  title: string;
  table: string;
  amountKey: "CostoTotal" | "ImporteTotal";
  baseSelects: Array<{ Key: string; Alias: string }>;
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

// Nuevos tipos para filtros extendidos
export interface StoreFilterType {
  selectedStore: string;
  operator: string;
}

export interface MarginFilterType {
  minMargin: string;
  maxMargin: string;
  marginType: string;
}

export interface EnhancedFormValues extends FormValues {
  StoreFilter: StoreFilterType;
  MarginFilter: MarginFilterType;
}

export interface FilterSectionProps {
  onApply: (filters: {
    Filtros: FilterType[];
    Selects: SelectType[];
    OrderBy: OrderByType;
    Agregaciones: { Key: string; Operation: string; Alias: string }[];
  }) => void;
  onReset: () => void;
  config: string;
  filterFunction: any;
  cols?: any;
  availableStores?: string[];
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
  StoreFilter?: StoreFilterType;
  MarginFilter?: MarginFilterType;
};
