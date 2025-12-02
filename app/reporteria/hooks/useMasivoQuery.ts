// hooks/useMasivoQuery.ts - VERSIÓN OPTIMIZADA
import { EnvConfig } from "@/utils/constants/env.config";
import { useState, useCallback } from "react";

interface MasivoQueryParams {
  Table: string;
  Page?: number;
  PageSize?: number;
  Filtros?: any;
  IncludeTotalCount?: boolean;
}

interface MasivoResponse {
  data: any[];
  totalRecords?: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  timestamp: string;
}

const { test_api: apiUrl } = EnvConfig();

export const useMasivoQuery = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useCallback(
    async (params: MasivoQueryParams): Promise<MasivoResponse> => {
      setLoading(true);
      setError(null);

      try {
        // Optimizar parámetros automáticamente
        const optimizedParams = optimizeQueryParams(params);

        console.log("Enviando consulta optimizada:", optimizedParams);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 segundos

        const response = await fetch(apiUrl + "v2/masivo/consultar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(optimizedParams),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log("Respuesta del servidor:", result);

        return result;
      } catch (err) {
        console.error("Error en useMasivoQuery:", err);
        let errorMessage = "Error desconocido al consultar datos";

        if (err instanceof Error) {
          if (err.name === "AbortError") {
            errorMessage =
              "La consulta tardó demasiado tiempo. Intente con filtros más específicos.";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  // Consulta rápida para testing
  const quickQuery = useCallback(
    async (params: MasivoQueryParams): Promise<MasivoResponse> => {
      setLoading(true);
      setError(null);

      try {
        const optimizedParams = {
          ...params,
          PageSize: Math.min(params.PageSize || 10, 10), // Máximo 10 para consulta rápida
        };

        console.log("Enviando consulta rápida:", optimizedParams);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

        const response = await fetch(apiUrl + "v2/masivo/consultar-rapido", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(optimizedParams),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        return result;
      } catch (err) {
        console.error("Error en quickQuery:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Error en consulta rápida";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  // Optimizar parámetros de consulta
  const optimizeQueryParams = (
    params: MasivoQueryParams
  ): MasivoQueryParams => {
    return {
      ...params,
      PageSize: Math.min(params.PageSize || 50, 100), // Limitar tamaño de página
      Filtros: {
        ...params.Filtros,
        Filtros: (params.Filtros?.Filtros || []).slice(0, 5), // Máximo 5 filtros
        Selects: (params.Filtros?.Selects || []).slice(0, 8), // Máximo 8 columnas
      },
    };
  };

  // Función para formatear fechas
  const formatDatesForSQL = (params: MasivoQueryParams): MasivoQueryParams => {
    if (!params.Filtros?.Filtros) return params;

    const formattedFiltros = params.Filtros.Filtros.map((filter: any) => {
      if (filter.Key.toLowerCase().includes("fecha") && filter.Value) {
        let dateValue = filter.Value;

        if (typeof dateValue === "string") {
          dateValue = dateValue.split("T")[0]; // Solo YYYY-MM-DD

          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (dateRegex.test(dateValue)) {
            return {
              ...filter,
              Value: dateValue,
            };
          }
        }
      }
      return filter;
    });

    return {
      ...params,
      Filtros: {
        ...params.Filtros,
        Filtros: formattedFiltros,
      },
    };
  };

  return { query, quickQuery, loading, error };
};
