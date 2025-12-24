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

export async function safeCall<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    const res: any = await fn();

    if (res && "error" in res) {
      throw new Error(`Error en ${context}: ${JSON.stringify(res.error)}`);
    }
    return res;
  } catch (err: any) {
    /* console.error(`❌ ${context}:`, err); */
    throw new Error(err.message || `Fallo en ${context}`);
  }
}
