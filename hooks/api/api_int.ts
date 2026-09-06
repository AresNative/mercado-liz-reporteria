import { EnvConfig } from "@/utils/constants/env.config";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

const USER_DATA_KEY = "userData";
const { api_int: apiUrl } = EnvConfig();

export const api_int = createApi({
  reducerPath: "api_int",
  refetchOnFocus: true,
  keepUnusedDataFor: 10,
  refetchOnMountOrArgChange: true,
  baseQuery: fetchBaseQuery({
    baseUrl: apiUrl,
    prepareHeaders: async (headers) => {
      headers.set("Content-Type", "application/json");

      let token = await getCookie("token");

      if (!token) {
        const userData = getLocalStorageItem(USER_DATA_KEY);
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
        params: { sum, page, pageSize, distinct },
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
          filtro,
        },
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    getWithFiltersIntelisis: builder.mutation({
      query: ({ table, page, pageSize, filtros, signal }) => ({
        url: `/v1/consultar`,
        method: "POST",
        params: {
          fromClause: table,
        },
        body: { ...filtros, page, pageSize },
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    putIntelisis: builder.mutation({
      query: ({ table, data, signal }) => ({
        url: `v1/update/${table}`,
        method: "PUT",
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
  }),
});

export const {
  useGetMutation,
  usePostIntelisisMutation,
  useGetArticulosQuery,
  useGetWithFiltersIntelisisMutation,
  usePutIntelisisMutation,
} = api_int;
