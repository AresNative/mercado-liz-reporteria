// global.ts
import { useRef, useEffect } from "react";
import { safeCall } from "@/hooks/use-debounce";
import { v4 as uuidv4 } from "uuid";
import { ApiResponse } from "@/utils/types/consultas";

import { GetDataFunction, RequestPayload } from "./api";
import { useGetWithFiltersMutation } from "../api/api";

/**
 * Clase genérica para ejecutar cualquier tipo de consulta al endpoint getData.
 * Maneja automáticamente la cancelación de peticiones previas.
 */
export class ManagmentWeb {
  private readonly getData: GetDataFunction;
  private activeControllers: Map<string, AbortController> = new Map();

  constructor(getDataFunction: GetDataFunction) {
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

export function useManagmentWeb(): ManagmentWeb {
  const [getData] = useGetWithFiltersMutation();
  const managerRef = useRef<ManagmentWeb | null>(null);

  if (!managerRef.current) {
    managerRef.current = new ManagmentWeb(getData);
  }

  useEffect(() => {
    const manager = managerRef.current;
    return () => {
      manager?.cancelAll();
    };
  }, []);

  return managerRef.current;
}
