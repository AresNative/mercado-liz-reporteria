import { EnvConfig } from "@/utils/constants/env.config";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

const { test_api: apiUrl } = EnvConfig();
export const api_test = createApi({
  reducerPath: "api_test",
  refetchOnFocus: true,
  keepUnusedDataFor: 5, // Reducir tiempo de caché para datos no usados
  refetchOnMountOrArgChange: true, // Mejor control de refetch
  baseQuery: fetchBaseQuery({
    baseUrl: apiUrl,
    prepareHeaders: async (headers, {}) => {
      const token = (await getCookie("token")) ?? getLocalStorageItem("token"); // <- usa cookie
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    get: builder.query({
      query: ({ url, signal }) => ({
        url: `${url}/consultar`,
        method: "GET",
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    getWithFilters: builder.mutation({
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

export const { useGetQuery, useGetWithFiltersMutation } = api_test;
