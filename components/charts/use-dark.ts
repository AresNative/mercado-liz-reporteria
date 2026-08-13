"use client";

import { useEffect, useState } from "react";

/**
 * Detecta si el tema oscuro está activo observando la clase `dark` en <html>.
 *
 * Los gráficos de ApexCharts se renderizan en SVG con estilos inline y no
 * heredan las clases de Tailwind, así que hay que pasarles el modo de forma
 * explícita (theme.mode, colores, etc.). Este hook mantiene ese valor
 * sincronizado en tiempo real si el usuario cambia de tema sin recargar.
 */
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));

    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
