import { EnvConfig } from "@/utils/constants/env.config";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const { api_int: apiUrl } = EnvConfig();

export const api_int = createApi({
    reducerPath: "api_int",
    refetchOnFocus: true,
    keepUnusedDataFor: 10, // Reducir tiempo de caché para datos no usados
    refetchOnMountOrArgChange: true, // Mejor control de refetch
    baseQuery: fetchBaseQuery({
        baseUrl: apiUrl,
        prepareHeaders: (headers, { }) => {
            headers.set("Content-Type", "application/json");
            const token = getLocalStorageItem("token");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getAll: builder.mutation({
            query: ({ url, filters, signal, page, pageSize, sum, distinct }) => ({
                url: `v2/${url}`,
                method: "POST",
                params: { sum, page, pageSize, distinct }, // Mejor práctica para parámetros
                body: filters,
                signal
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || 'Error fetching data',
            }),
            extraOptions: { maxRetries: 2 }
        }),
        post: builder.mutation({
            query: ({ url, data, signal }) => ({
                url: `v2/insert/${url}`,
                method: "POST",
                body: JSON.stringify(data),
                signal
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || 'Error fetching data',
            }),
            extraOptions: { maxRetries: 2 }
        }),
        getArticulos: builder.query({
            query: ({ page, pageSize, filtro, listaPrecio, signal }) => ({
                url: `Precios`,
                method: "GET",
                params: {
                    page,
                    pageSize,
                    listaPrecio,
                    filtro// codigo de barras o nombre
                },
                signal
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || 'Error fetching data',
            }),
            extraOptions: { maxRetries: 2 }
        }),
    }),
});

export const {
    useGetAllMutation,
    usePostMutation,
    useGetArticulosQuery,
} = api_int;