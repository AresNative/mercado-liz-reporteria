// Tipos mejorados
export interface Filter {
  key: string;
  value: string;
  operator: string;
}

export interface Select {
  key: string;
  alias?: string;
}

export interface Aggregation {
  key: string;
  operation: string;
  alias: string;
}

export interface Order {
  key: string;
  direction: "asc" | "desc";
}

export interface LogicalFilterGroup {
  filtros: Filter[];
  logicalOperator: "and" | "or";
}

export interface BodyRequest {
  selects: Select[];
  agregaciones: Aggregation[];
  order: Order[];
  filtrosAnd: LogicalFilterGroup[];
  filtrosOr: LogicalFilterGroup[];
}

export interface ParamsRequest {
  table: string;
  page: number;
  pageSize: number;
}

export interface ApiResponse {
  data?: {
    data: any[];
    page?: number;
    totalRecords?: number;
    totalEstimated?: number;
  };
  error?: any;
}

export interface WhatsAppFormData {
  phoneNumber: string;
  message: string;
  includeSummary?: boolean;
  includeSampleData?: boolean;
}

export interface FilterFormData {
  reportName: string;
  startDate?: string;
  endDate?: string;
  ref?: string;
  almacen?: string;
  movimiento?: string;
  clase?: string;
  subclase?: string;
  acreedor?: string;
  ejercicio?: string;
}
