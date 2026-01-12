import { formatAPIDate } from "@/utils/constants/format-values";
import { formatFilter } from "../types/querys";

export const buildFilters = (searchParams: any): formatFilter[] => {
  const arr: formatFilter[] = [];
  const { search, rowSearch, sucursal, fechaInicial, fechaFinal } =
    searchParams;

  // Procesar search y rowSearch
  if (search && rowSearch) {
    const searchTerms = search
      .split(",")
      .map((s: any) => s.trim())
      .filter(Boolean);
    const searchRows = rowSearch
      .split(",")
      .map((s: any) => s.trim())
      .filter(Boolean);

    for (const col of searchRows) {
      for (const term of searchTerms) {
        arr.push({
          key: col,
          value: `%${term}%`,
          operator: "like",
        });
      }
    }
  }

  // Procesar sucursal
  if (sucursal) {
    const sucursales = sucursal
      .split(",")
      .map((s: any) => s.trim())
      .filter(Boolean);
    for (const suc of sucursales) {
      arr.push({
        key: "Almacen",
        value: suc,
        operator: "=",
      });
    }
  }

  // Procesar fechas
  if (fechaInicial || fechaFinal) {
    const fi = fechaInicial ? formatAPIDate(fechaInicial) : null;
    const ff = fechaFinal ? formatAPIDate(fechaFinal) : null;

    if (fi && ff) {
      arr.push(
        { key: "FechaEmision", value: fi, operator: ">=" },
        { key: "FechaEmision", value: ff, operator: "<=" }
      );
    } else if (fi) {
      arr.push({ key: "FechaEmision", value: fi, operator: "=" });
    } else if (ff) {
      arr.push({ key: "FechaEmision", value: ff, operator: "=" });
    }
  }

  return arr;
};
