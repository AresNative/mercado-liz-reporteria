// config.ts
type EnvConfigType = {
  api: string;
  api2: string;
  api_int: string;
  mode: string;
  itemsPerPage: number;
};

export const EnvConfig = (): EnvConfigType => {
  const mode = process.env.NEXT_PUBLIC_MODE ?? "development";

  const api =
    mode === "production"
      ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:5230/api/"
      : "http://localhost:5230/api/";
  const api2 =
    mode === "production"
      ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:5230/api/"
      : "http://localhost:5230/api/";

  const api_int =
    process.env.NEXT_PUBLIC_API_URL_INT || "http://localhost:5000/api/";

  const itemsPerPage = parseInt(process.env.ITEMS_PER_PAGE || "10", 10); // Fallback a 10 si no está definido

  return {
    api,
    api2,
    api_int,
    mode,
    itemsPerPage,
  };
};
