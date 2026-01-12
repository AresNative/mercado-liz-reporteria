export const formatValue = (
  value: number | string | null | undefined,
  format: "currency" | "percentage" | "number" | "compact" = "number",
  decimals: number = 2
): string => {
  // Manejo de valores nulos, vacíos o NaN
  if (value === null || value === undefined || value === "") return "—";

  const num = Number(value);
  if (isNaN(num)) return "—";

  switch (format) {
    case "currency":
      return num.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

    case "percentage":
      return `${num.toFixed(decimals)}%`;

    case "compact":
      return num.toLocaleString("es-MX", {
        notation: "compact",
        compactDisplay: "short",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });

    case "number":
    default:
      return num.toLocaleString("es-MX", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      });
  }
};

export const formatAPIDate = (dateString: string) => {
  if (!dateString) return "";
  return new Date(dateString).toISOString();
};
export function formatJSON(inputJSON: any) {
  // Si el input es un string, lo parsea, de lo contrario, lo toma directamente
  const data =
    typeof inputJSON === "string" ? JSON.parse(inputJSON) : inputJSON;

  // Si ya es un array, se devuelve tal cual
  if (Array.isArray(data)) {
    return data;
  }

  // Si es un objeto, convierte sus valores en un array
  return Object.values(data);
}
export function separarFechas(fechaRango: string) {
  const fechas = fechaRango.split(" - ");
  return {
    fechaInicial: fechas[0] || "",
    fechaFinal: fechas[1] || "",
  };
}
