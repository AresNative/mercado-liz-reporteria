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

// use-debounce.ts (versión mejorada)

export async function safeCall<T>(
  fn: () => Promise<T>,
  context: string,
  signal?: AbortSignal,
): Promise<T> {
  // Si la señal ya está abortada, lanzamos inmediatamente
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Creamos una promesa que se rechaza cuando la señal se aborta
  let abortListener: (() => void) | undefined;
  const abortPromise = new Promise<never>((_, reject) => {
    if (signal) {
      abortListener = () => reject(new DOMException('Aborted', 'AbortError'));
      signal.addEventListener('abort', abortListener);
    }
  });

  try {
    // Competimos entre la función original y la promesa de aborto
    return await Promise.race([fn(), abortPromise]);
  } catch (err: any) {
    // Si es AbortError, lo relanzamos tal cual
    if (err?.name === 'AbortError') throw err;

    // Si ya es SafeCallError, lo relanzamos
    if (err instanceof SafeCallError) throw err;

    // Detección mejorada de error de red / servidor caído
    const isNetworkError =
      err instanceof TypeError ||
      err?.message?.toLowerCase?.().includes('fetch') ||
      err?.message?.toLowerCase?.().includes('network') ||
      err?.status === 0;

    throw new SafeCallError(
      err.message || `Fallo en ${context}`,
      context,
      isNetworkError,
    );
  } finally {
    if (abortListener && signal) {
      signal.removeEventListener('abort', abortListener);
    }
  }
}
