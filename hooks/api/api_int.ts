import { EnvConfig } from "@/utils/constants/env.config";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

const USER_DATA_KEY = "userData";
const { api_int: apiUrl } = EnvConfig();

export const api_int = createApi({
  reducerPath: "api_int",
  refetchOnFocus: true,
  keepUnusedDataFor: 10, // Reducir tiempo de caché para datos no usados
  refetchOnMountOrArgChange: true, // Mejor control de refetch
  baseQuery: fetchBaseQuery({
    baseUrl: apiUrl,
    prepareHeaders: async (headers) => {
      headers.set("Content-Type", "application/json");

      // Obtener token de cookies primero
      let token = await getCookie("token");

      // Si no hay token en cookies, buscar en localStorage
      if (!token) {
        const userData = getLocalStorageItem(USER_DATA_KEY);

        // userData es un objeto, necesitamos extraer el token
        if (userData && typeof userData === "object" && userData.token) {
          token = userData.token;
        }
      }

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    get: builder.mutation({
      query: ({ url, filters, signal, page, pageSize, sum, distinct }) => ({
        url: `v2/${url}`,
        method: "POST",
        params: { sum, page, pageSize, distinct }, // Mejor práctica para parámetros
        body: filters,
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    postIntelisis: builder.mutation({
      query: ({ table, data, signal }) => ({
        url: `v1/register`,
        method: "POST",
        params: { table },
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    getArticulos: builder.query({
      query: ({ page, pageSize, filtro, listaPrecio, signal }) => ({
        url: `Precios`,
        method: "GET",
        params: {
          page,
          pageSize,
          listaPrecio,
          filtro, // codigo de barras o nombre
        },
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    getWithFiltersGeneralInIntelisis: builder.mutation({
      query: ({ table, page, pageSize, filtros, signal }) => ({
        url: `/v1/consultar/filtros`,
        method: "POST",
        params: {
          page,
          table, // tabla a consultar
          pageSize,
        },
        body: filtros,
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    getMasivoWithFilters: builder.mutation({
      query: ({ table, tag, page, pageSize, filtros, signal }) => ({
        url: `/v2/masivo/consultar`,
        method: "POST",
        params: {
          page,
          table, // tabla a consultar
          pageSize,
        },
        body: filtros,
        providesTags: [tag],
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
  }),
});

export const {
  useGetMutation,
  usePostIntelisisMutation,
  useGetArticulosQuery,
  useGetWithFiltersGeneralInIntelisisMutation,
  useGetMasivoWithFiltersMutation,
} = api_int;
