// config.ts
type EnvConfigType = {
  api: string;
  api_int: string;
  api_landing: string;
  mode: string;
  itemsPerPage: number;
};

export const EnvConfig = (): EnvConfigType => {
  const mode = process.env.NEXT_PUBLIC_MODE ?? "development";

  const api =
    mode === "production"
      ? process.env.NEXT_PUBLIC_API_URL ||
        "https://api.mercadosliz.com:8080/api/"
      : process.env.NEXT_TEST_API_URL || "http://localhost:5000/api/";

  const api_int =
    process.env.NEXT_PUBLIC_API_URL_INT || "http://localhost:5000/api/";

  const api_landing =
    process.env.NEXT_PUBLIC_API_URL_LANIDNG || "http://localhost:5000/api/";

  const itemsPerPage = parseInt(process.env.ITEMS_PER_PAGE || "10", 10); // Fallback a 10 si no está definido

  return {
    api,
    api_int,
    api_landing,
    mode,
    itemsPerPage,
  };
};
