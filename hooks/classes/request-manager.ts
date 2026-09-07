import { v4 as uuidv4 } from "uuid";
import { safeCall } from "@/hooks/use-debounce";
import { ApiResponse } from "@/utils/types/consultas";

export interface RequestPayload {
  table: string;
  filtros: {
    selects?: Array<{ Key: string; Alias?: string }>;
    agregaciones?: Array<{ Key: string; Alias?: string; Operation: string }>;
    FiltrosAnd?: Array<{
      Filtros?: Array<{ Key: string; Operator: string; Value?: any }>;
      OperadorLogico?: "AND" | "OR";
    }>;
    Filtros?: Array<{ Key: string; Operator: string; Value?: any }>;
    Order?: Array<{ Key: string; Direction: string }>;
  };
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export type GetDataFunction = (args: any) => Promise<ApiResponse>;

const DEFAULT_CACHE_TTL_MS = 15_000;

interface CacheEntry {
  data: ApiResponse;
  expiresAt: number;
}

export class RequestManager {
  private readonly getData: GetDataFunction;
  private activeControllers: Map<string, AbortController> = new Map();
  // Peticiones en vuelo por clave de payload, para deduplicar llamadas
  // simultáneas idénticas.
  private inFlight: Map<string, Promise<ApiResponse>> = new Map();
  // Resultado exitoso más reciente por clave de payload, con expiración.
  private cache: Map<string, CacheEntry> = new Map();
  private readonly cacheTtlMs: number;

  constructor(
    getDataFunction: GetDataFunction,
    cacheTtlMs: number = DEFAULT_CACHE_TTL_MS,
  ) {
    this.getData = getDataFunction;
    this.cacheTtlMs = cacheTtlMs;
  }

  private cacheKeyFor(payload: Omit<RequestPayload, "signal">): string {
    // No incluimos `signal` (no serializable / siempre distinto) en la
    // clave; el resto del payload sí define univocamente la consulta.
    return JSON.stringify(payload);
  }

  execute<T = any>(
    payload: Omit<RequestPayload, "signal">,
    key?: string,
    options?: { skipCache?: boolean },
  ): { promise: Promise<ApiResponse<T>>; cancel: () => void } {
    const cacheKey = this.cacheKeyFor(payload);
    const requestId = key ?? uuidv4();

    if (key) this.cancel(key);

    if (!options?.skipCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return {
          promise: Promise.resolve(cached.data as ApiResponse<T>),
          cancel: () => {},
        };
      }

      const pending = this.inFlight.get(cacheKey);
      if (pending) {
        return {
          promise: pending as Promise<ApiResponse<T>>,
          cancel: () => {},
        };
      }
    }

    const controller = new AbortController();
    const body = { ...payload, signal: controller.signal };
    this.activeControllers.set(requestId, controller);

    const promise = safeCall(
      () => this.getData(body),
      requestId,
      controller.signal,
    )
      .then((response) => {
        if (controller.signal.aborted) {
          return {
            error: { name: "AbortError", message: "Request aborted" },
          } as ApiResponse<T>;
        }
        const res = response as ApiResponse<T>;
        if (res && !("error" in res)) {
          this.cache.set(cacheKey, {
            data: res,
            expiresAt: Date.now() + this.cacheTtlMs,
          });
        }
        return res;
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
        this.activeControllers.delete(requestId);
        this.inFlight.delete(cacheKey);
      });

    this.inFlight.set(cacheKey, promise);

    const cancel = () => {
      const ctrl = this.activeControllers.get(requestId);
      if (ctrl) {
        ctrl.abort();
        this.activeControllers.delete(requestId);
      }
      this.inFlight.delete(cacheKey);
    };

    return { promise, cancel };
  }

  cancel(key: string): void {
    const ctrl = this.activeControllers.get(key);
    if (ctrl) {
      ctrl.abort();
      this.activeControllers.delete(key);
    }
  }

  cancelAll(): void {
    this.activeControllers.forEach((controller) => controller.abort());
    this.activeControllers.clear();
  }

  /** Borra el caché de una consulta puntual (mismo payload) o completo. */
  invalidate(payload?: Omit<RequestPayload, "signal">): void {
    if (!payload) {
      this.cache.clear();
      return;
    }
    this.cache.delete(this.cacheKeyFor(payload));
  }

  get pendingCount(): number {
    return this.activeControllers.size;
  }
}

// Alias por compatibilidad con imports existentes (`ManagmentRead`,
// `ManagmentWeb` apuntaban a implementaciones separadas idénticas; ahora
// ambas son esta misma clase).
export { RequestManager as ManagmentRead };
export { RequestManager as ManagmentWeb };
