// global.ts
import { useRef, useEffect } from "react";
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/api/api_int";
import { safeCall } from "@/hooks/use-debounce";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "@/utils/types/consultas";

export interface RequestPayload {
  table: string;
  filtros: {
    selects?: Array<{ Key: string; Alias?: string }>;
    agregaciones?: Array<{ Key: string; Alias: string; Operation: string }>;
    FiltrosAnd?: Array<{
      Filtros?: Array<{ Key: string; Operator: string; Value?: any }>;
      OperadorLogico?: "AND" | "OR";
    }>;
    Filtros?: Array<{ Key: string; Operator: string; Value?: any }>;
    Order?: Array<{ Key: string; Direction: string }>;
  };
  page?: number;
  pageSize?: number;
  signal?: AbortSignal; // Se añade internamente
}

 export type GetDataFunction = (args: any) => Promise<ApiResponse>;

/**
 * Clase genérica para ejecutar cualquier tipo de consulta al endpoint getData.
 * Maneja automáticamente la cancelación de peticiones previas.
 */
export class ManagmentRead {
  private readonly getData: GetDataFunction;
  private activeControllers: Map<string, AbortController> = new Map();

  constructor(getDataFunction: GetDataFunction ) {
    this.getData = getDataFunction;
  }

  execute<T = any>(
    payload: Omit<RequestPayload, "signal">,
  ): { promise: Promise<ApiResponse<T>>; cancel: () => void } {
    const requestId = uuidv4();
    const controller = new AbortController();
    const body = { ...payload, signal: controller.signal };

    this.activeControllers.set(requestId, controller);

    const promise = safeCall(() => this.getData(body), requestId)
      .then((response) => {
        if (controller.signal.aborted) {
          return {
            error: { name: "AbortError", message: "Request aborted" },
          } as ApiResponse<T>;
        }
        return response as ApiResponse<T>;
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return {
            error: { name: "AbortError", message: "Request aborted" },
          } as ApiResponse<T>;
        }
        console.error("Error en execute:", error);
        return { error } as ApiResponse<T>;
      })
      .finally(() => {
        // Una vez completada (éxito, error o aborto), eliminamos el controller del map
        this.activeControllers.delete(requestId);
      });

    const cancel = () => {
      const ctrl = this.activeControllers.get(requestId);
      if (ctrl) {
        ctrl.abort();
        this.activeControllers.delete(requestId);
      }
    };

    return { promise, cancel };
  }

  cancelAll(): void {
    this.activeControllers.forEach((controller) => {
      controller.abort();
    });
    this.activeControllers.clear();
  }

  get pendingCount(): number {
    return this.activeControllers.size;
  }
}

export function useManagmentRead(): ManagmentRead {
  const [getData] = useGetWithFiltersGeneralInIntelisisMutation();
  const managerRef = useRef<ManagmentRead | null>(null);

  if (!managerRef.current) {
    managerRef.current = new ManagmentRead(getData);
  }

  useEffect(() => {
    const manager = managerRef.current;
    return () => {
      manager?.cancelAll();
    };
  }, []);

  return managerRef.current;
}
export function useManagmentSearch(): ManagmentRead {
  const [getData] = useGetWithFiltersGeneralInIntelisisMutation();
  const managerRef = useRef<ManagmentRead | null>(null);

  if (!managerRef.current) {
    managerRef.current = new ManagmentRead(getData);
  }

  useEffect(() => {
    const manager = managerRef.current;
    return () => {
      manager?.cancelAll();
    };
  }, []);

  return managerRef.current;
}
