export const OPERATORS = [
  { value: "=", label: "Igual a" },
  { value: "<>", label: "Diferente de" },
  { value: ">", label: "Mayor que" },
  { value: "<", label: "Menor que" },
  { value: ">=", label: "Mayor o igual que" },
  { value: "<=", label: "Menor o igual que" },
  { value: "LIKE", label: "Contiene" },
  { value: "NOT LIKE", label: "No contiene" },
  { value: "IN", label: "En lista" },
  { value: "NOT IN", label: "No en lista" },
  { value: "IS NULL", label: "Es nulo" },
  { value: "IS NOT NULL", label: "No es nulo" },
];

// Períodos predefinidos para fechas
export const DATE_PERIODS = [
  { label: "Últimos 7 días", days: 7 },
  { label: "Últimos 30 días", days: 30 },
  { label: "Últimos 90 días", days: 90 },
  { label: "Este mes", days: null, custom: true },
  { label: "Mes anterior", days: null, custom: true },
  { label: "Este año", days: null, custom: true },
  { label: "Personalizado", days: null, custom: true },
];
