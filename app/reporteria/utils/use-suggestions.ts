// hooks/useSuggestions.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useManagmentRead } from "@/hooks/classes/api";
import { safeCall } from "@/hooks/use-debounce";
import { REPORT, ActiveFilters, REPORT_CONFIGS, SEARCH_FIELDS_MAP, buildFiltrosAnd, SUGGESTIONS_LIMIT } from "./report-utils";

// Caché simple: clave -> array de sugerencias
const suggestionCache = new Map<string, string[]>();

export function useSuggestions(
  selectedReport: REPORT,
  searchTerm: string, // valor debounced
  activeFilters: ActiveFilters,
) {
  const [manager] = useManagmentRead();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const previousKey = useRef<string>("");

  const fetchSuggestions = useCallback(async () => {
    // Si no hay término de búsqueda, limpiar y salir
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    // Construir clave de caché: reporte + término + filtros relevantes (fecha, almacén)
    const cacheKey = `${selectedReport}|${trimmed}|${activeFilters.FiltrosOther?.map((f) => f.Value).join("|") || ""}`;
    if (cacheKey === previousKey.current) {
      // Si ya estamos procesando la misma clave, no repetir
      return;
    }
    previousKey.current = cacheKey;

    // Verificar caché
    if (suggestionCache.has(cacheKey)) {
      setSuggestions(suggestionCache.get(cacheKey)!);
      return;
    }

    // Cancelar petición anterior
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const config = REPORT_CONFIGS[selectedReport];
    const searchFields = SEARCH_FIELDS_MAP[selectedReport] || [];
    if (!config || searchFields.length === 0) {
      setSuggestions([]);
      return;
    }

    // Construir filtros para sugerencias (solo fecha y almacén, sin otros filtros complejos)
    const baseFiltros = config.filtros?.Filtros || [];
    const filtrosAnd = buildFiltrosAnd(baseFiltros, activeFilters);

    // Solo necesitamos los campos de búsqueda con DISTINCT
    const agregaciones = searchFields.map((field) => ({
      Key: field,
      Operation: "DISTINCT",
      Alias: field.split(".").pop() || field,
    }));

    const payload = {
      table: config.table,
      filtros: {
        agregaciones,
        FiltrosAnd: filtrosAnd,
        // No incluimos Order ni otros para ahorrar
      },
      page: 1,
      pageSize: SUGGESTIONS_LIMIT,
      signal: abortRef.current.signal,
    };

    try {
      const { promise } = await manager.execute(payload);
      const response: any = await safeCall(
        () => promise,
        `suggestions/${selectedReport}`,
      );
      if (abortRef.current?.signal.aborted) return;

      // Extraer valores únicos de todas las columnas devueltas
      const values = new Set<string>();
      (response.data?.data || []).forEach((row: any) => {
        Object.values(row).forEach((val: any) => {
          if (typeof val === "string" && val.trim() !== "") {
            values.add(val.trim());
          }
        });
      });

      const result = Array.from(values);
      // Guardar en caché
      suggestionCache.set(cacheKey, result);
      setSuggestions(result);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      // Silenciar otros errores para no molestar al usuario
    }
  }, [selectedReport, searchTerm, activeFilters, manager]);

  // Debounce manual con cancelación: solo llamamos a fetch cuando el término
  // lleva estable 400ms sin cambios.
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions();
    }, 400);

    return () => {
      clearTimeout(handler);
      // Opcional: abortar la petición si el término cambia antes de que se ejecute
      // pero lo dejamos para que se cancele en la siguiente ejecución
    };
  }, [fetchSuggestions]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return suggestions;
}
