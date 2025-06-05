import {
  getLocalStorageItem,
  setLocalStorageItem,
} from "@/utils/functions/local-storage";
import { useEffect, useState } from "react";

type ChangeEvent = React.ChangeEvent<HTMLInputElement>;

type Theme = "light" | "dark";

type UseThemeReturn = [Theme, (e: ChangeEvent) => void];

export const useTheme = (initialTheme: Theme): UseThemeReturn => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Usamos inicialización perezosa para leer del localStorage solo una vez al inicio
    const savedTheme = getLocalStorageItem("theme");
    return savedTheme ? (savedTheme as Theme) : initialTheme;
  });

  const handleChange = (e: ChangeEvent) => {
    const newTheme = e.target.checked ? "dark" : "light";
    setTheme(newTheme);
  };

  useEffect(() => {
    // Aplicar el tema al montar el componente
    applyTheme(theme);
  }, []);

  useEffect(() => {
    // Aplicar el tema cuando cambia
    applyTheme(theme);
    setLocalStorageItem("theme", theme);
  }, [theme]);

  const applyTheme = (currentTheme: Theme) => {
    document.body.setAttribute("data-theme", currentTheme);
    document.documentElement.classList.toggle("dark", currentTheme === "dark");
    document.documentElement.classList.toggle(
      "ion-palette-dark",
      currentTheme === "dark"
    );
  };

  return [theme, handleChange];
};
