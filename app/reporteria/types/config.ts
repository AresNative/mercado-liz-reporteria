export interface SearchColumn {
  key: string;
  label: string;
  icon: any;
  color: string;
  tableField?: string; // Campo específico en la tabla
  prefix?: string; // Prefijo para mostrar en lugar del alias
  table: string; // Prefijo para mostrar en lugar del alias
}
export interface QueryConfig {
  table: string;
  selects: Array<{ Key: string; Alias?: string }>;
  agregaciones: Array<{ Key: string; Alias: string; Operation: string }>;
  fechaField: string;
  searchColumns: SearchColumn[];
}
