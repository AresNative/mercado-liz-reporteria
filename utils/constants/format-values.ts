import { ReportConfig } from "@/app/reporteria/utils/types";

export const formatValue = (value: number, format?: string): string => {
  switch (format) {
    case "currency":
      return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    case "percentage":
      return `${value.toFixed(2)}%`;
    case "number":
      return value.toLocaleString("en-US");
    default:
      return value.toString();
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
export const calculateSummary = (proveedores: any[], config: ReportConfig) => {
  if (proveedores.length === 0) {
    return {
      totalCantidad: 0,
      totalCosto: 0,
      mayorProveedor: "N/A",
      cantidadMayor: 0,
      porcentajeMayor: 0,
    };
  }

  let totalCantidad = 0;
  let totalCosto = 0;
  let maxCantidad = -Infinity;
  let mayorProveedor = proveedores[0];

  for (const p of proveedores) {
    totalCantidad += p.Cantidad;
    totalCosto += p[config.amountKey];

    if (p.Cantidad > maxCantidad) {
      maxCantidad = p.Cantidad;
      mayorProveedor = p;
    }
  }

  const porcentajeMayor = (mayorProveedor.Cantidad / totalCantidad) * 100 || 0;

  return {
    totalCantidad,
    totalCosto,
    mayorProveedor: mayorProveedor[config.mainField] || "N/A",
    cantidadMayor: mayorProveedor.Cantidad,
    porcentajeMayor,
  };
};
