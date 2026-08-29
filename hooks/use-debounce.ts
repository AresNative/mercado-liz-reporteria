import { useEffect, useState } from "react";
// --- HANDLER GLOBAL DE ERRORES ---
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Error enriquecido: además del mensaje, expone si la causa fue que el
// servidor (p.ej. Intelisis) no respondió, para que la UI pueda mostrar
// un mensaje distinto ("está caído, reintenta más tarde") de un error de
// datos/validación.
export class SafeCallError extends Error {
  isServerDown: boolean;
  context: string;

  constructor(message: string, context: string, isServerDown = false) {
    super(message);
    this.name = "SafeCallError";
    this.context = context;
    this.isServerDown = isServerDown;
  }
}

export async function safeCall<T>(
  fn: () => Promise<T>,
  context: string,
): Promise<T> {
  try {
    const res: any = await fn();

    if (res && "error" in res) {
      // res.error viene de transformErrorResponse en api_int.ts:
      // { status, message, isServerDown }
      const apiError = res.error || {};
      const message = apiError.message || `Error en ${context}`;
      throw new SafeCallError(message, context, Boolean(apiError.isServerDown));
    }
    return res;
  } catch (err: any) {
    if (err?.name === "AbortError") throw err; // dejar pasar cancelaciones tal cual

    if (err instanceof SafeCallError) throw err;

    /* console.error(`❌ ${context}:`, err); */
    // Errores de red "crudos" (fetch falló antes de llegar a RTK Query) también
    // cuentan como servidor caído / inalcanzable.
    const looksLikeNetworkFailure =
      err?.message?.toLowerCase?.().includes("fetch") ||
      err?.message?.toLowerCase?.().includes("network");
    throw new SafeCallError(
      err.message || `Fallo en ${context}`,
      context,
      looksLikeNetworkFailure,
    );
  }
}
