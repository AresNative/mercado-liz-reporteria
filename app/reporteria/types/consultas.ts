export type ReportType =
  | "ventas"
  | "compras"
  | "mermas"
  | "inventario"
  | "comparacion";

export interface FilterRule {
  column: string;
  operator: string;
  value: any;
  groupId: string;
}

export interface FilterGroup {
  id: string;
  filters: FilterRule[];
  logicalOperator: "AND" | "OR";
  name?: string;
}

export interface ApiResponse<T = any> {
  data?: {
    data: T[];
    page?: number;
    totalRecords?: number;
    totalEstimated?: number;
  };
  error?: any;
}
