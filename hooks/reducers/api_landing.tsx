import { EnvConfig } from "@/utils/constants/env.config";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

const { api_landing: apiUrl } = EnvConfig();

export const api_landing = createApi({
    reducerPath: "api_landing",
    refetchOnFocus: true,
    keepUnusedDataFor: 10, // Reducir tiempo de caché para datos no usados
    refetchOnMountOrArgChange: true, // Mejor control de refetch
    baseQuery: fetchBaseQuery({
        baseUrl: apiUrl,
        prepareHeaders: async (headers, { }) => {
            const token = await getCookie("token") ?? getLocalStorageItem('token'); // <- usa cookie

            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getLanding: builder.mutation({
            query: ({ url, filters, signal, page, pageSize, sum, distinct }) => ({
                url: `v2/${url}`,
                method: "POST",
                params: { sum, page, pageSize, distinct }, // Mejor práctica para parámetros
                body: filters,

                headers: {
                    'Content-Type': 'application/json',
                },
                signal
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || 'Error fetching data',
            }),
            extraOptions: { maxRetries: 2 }
        }),
        postLandingJson: builder.mutation({
            query: ({ url, data, signal }) => ({
                url: `${url}`,
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                },
                signal
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || 'Error fetching data',
            }),
            extraOptions: { maxRetries: 2 }
        }),
        postLanding: builder.mutation({
            query: ({ url, data, signal }) => ({
                url: `${url}`,
                method: "POST",
                body: data,
                signal
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.error || "Error en el envío del formulario",
            }),
        }),
    }),
});

export const {
    useGetLandingMutation,
    usePostLandingJsonMutation,
    usePostLandingMutation
} = api_landing;
