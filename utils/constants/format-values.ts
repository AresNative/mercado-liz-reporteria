export const formatValue = (
  value: number | string | null | undefined,
  format: "currency" | "percentage" | "number" | "compact" = "number",
  decimals: number = 2,
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
  return new Date(dateString).toLocaleDateString("es-ES");
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
export const formatDateToISO = (dateString?: string): string | null => {
  if (!dateString) return null;
  return new Date(dateString).toISOString().split("T")[0];
};
export const formatDateISOString = (date: Date): string => {
  return date.toISOString();
};
export const formatDateDisplay = (date: Date | null): string => {
  if (!date) return "Seleccionar";
  return date.toISOString().split("T")[0]; /* .toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }); */
};


// Helpers de tiempo para Actividades.
// Centraliza la conversión horas/minutos <-> texto y decimal, para que
// tabla, detalle y agrupaciones muestren siempre el mismo formato.

/** Convierte horas + minutos a un total en minutos (soporta datos viejos sin `minutos`). */
export function toTotalMinutos(horas: any, minutos: any = 0): number {
    const h = Number(horas) || 0;
    const m = Number(minutos) || 0;
    return Math.round(h * 60 + m);
}

/** Da formato "2h 30m" (u "45m" si no hay horas completas). */
export function formatDuracion(horas: any, minutos: any = 0): string {
    const totalMin = toTotalMinutos(horas, minutos);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

/** Total en horas decimales, útil para sumas/promedios (ej. 2h 30m -> 2.5). */
export function toDecimalHoras(horas: any, minutos: any = 0): number {
    return Math.round((toTotalMinutos(horas, minutos) / 60) * 100) / 100;
}

/** Suma un arreglo de actividades y regresa el total ya formateado + decimal. */
export function sumarDuraciones(actividades: { horas?: any; minutos?: any }[]) {
    const totalMinutos = actividades.reduce(
        (acc, a) => acc + toTotalMinutos(a.horas, a.minutos),
        0
    );
    return {
        totalMinutos,
        totalHoras: Math.floor(totalMinutos / 60),
        totalMinutosRestantes: totalMinutos % 60,
        totalDecimal: Math.round((totalMinutos / 60) * 100) / 100,
        label: totalMinutos === 0
            ? "0m"
            : totalMinutos % 60 === 0
                ? `${Math.floor(totalMinutos / 60)}h`
                : `${Math.floor(totalMinutos / 60)}h ${totalMinutos % 60}m`,
    };
}