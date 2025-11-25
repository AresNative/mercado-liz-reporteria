// config.ts
type EnvConfigType = {
  test_api: string;
  api: string;
  api_int: string;
  hubs: string;
  mode: string;
  itemsPerPage: number;
};

export const EnvConfig = (): EnvConfigType => {
  const mode = process.env.NEXT_PUBLIC_MODE ?? "development";

  const test_api = "http://localhost:5000/api/";

  const api =
    mode === "production"
      ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5230/api/"
      : "http://localhost:5230/api/";

  const api_int =
    process.env.NEXT_PUBLIC_API_URL_INT || "http://localhost:5000/api/";

  const hubs =
    mode === "production"
      ? process.env.NEXT_PUBLIC_HUBS_URL ?? "http://localhost:5230/"
      : "http://localhost:5230/";

  const itemsPerPage = parseInt(process.env.ITEMS_PER_PAGE || "10", 10); // Fallback a 10 si no está definido

  return {
    test_api,
    api,
    api_int,
    hubs,
    mode,
    itemsPerPage,
  };
};
