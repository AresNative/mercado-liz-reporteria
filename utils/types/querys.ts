export interface DynamicTableItem {
  id: string;
  Nombre: string;
  Almacen: string;
  FechaEmision: string;
  [key: string]: any;
}
export interface formatFilter {
  key: string;
  value: string;
  operator: "like" | "=" | ">=" | "<=" | ">" | "<" | "<>" | ""; // Incluí "" como opción para el operador.
}

export interface formatSuma {
  key: string;
}
export interface orderBy {
  Key: string;
  Direction: string;
}

export interface formatLoadDate {
  filters: {
    filtros: formatFilter[];
    Selects?: formatSuma[];
    sumaAs?: [
      {
        Key: "";
        Alias: "";
      }
    ];
    Order?: orderBy[];
  };
  url: string;
  page: number;
  pageSize?: number;
  sum: boolean;
  distinct?: boolean;
  signal?: any;
}
