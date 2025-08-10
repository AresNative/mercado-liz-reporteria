import { EnvConfig } from "@/utils/constants/env.config";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

const { api: apiUrl } = EnvConfig();

export const api = createApi({
    reducerPath: "api",
    refetchOnFocus: true,
    keepUnusedDataFor: 10, // Reducir tiempo de caché para datos no usados
    refetchOnMountOrArgChange: true, // Mejor control de refetch
    baseQuery: fetchBaseQuery({
        baseUrl: apiUrl,
        prepareHeaders: async (headers, { }) => {
            headers.set("Content-Type", "application/json");
            const token = await getCookie("token") ?? getLocalStorageItem('token'); // <- usa cookie
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
        put: builder.mutation({
            query: ({ id, url, data, signal }) => ({
                url: `v2/update/${url}?ID=${id}`,
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
        getArticulosById: builder.query({
            query: ({ page, pageSize, id, filtro, categoria, listaPrecio, signal }) => ({
                url: `v1/pick-up`,
                method: "GET",
                params: {
                    page,
                    pageSize,
                    listaPrecio,
                    categoria,
                    id,
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

        /// * scrum
        getScrum: builder.query({
            query: ({ url, signal }) => ({
                url: `v1/${url}`,
                method: "GET",
                /* params: {
                    page,
                    pageSize,
                    listaPrecio,
                    categoria,
                    id,
                    filtro// codigo de barras o nombre
                }, */
                signal
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || 'Error fetching data',
            }),
            extraOptions: { maxRetries: 2 }
        }),
        getProjects: builder.query({
            query: () => `v1/projects`,
        }),
        getSprints: builder.query({
            query: (params) => `v1/projects/${params}/sprints`,
        }),
        getTasks: builder.query({
            query: (params) => `v1/sprints/${params}/tasks`,
        }),
        getHsitoryTask: builder.query({
            query: (params) => `v1/tasks/${params}/hsitory`,
        }),
        putTask: builder.mutation({
            query: ({ dataForm, idEdit }) => {
                return {
                    url: `v1/tasks/${idEdit}/assing-user`,
                    method: "POST",
                    body: dataForm,
                };
            },
        }),
        putTaskStatus: builder.mutation({
            query: (data) => {
                return {
                    url: `v1/tasks/${data.taskId}/update-status`,
                    method: "POST",
                    body: data,
                };
            },
        }),
        putTaskOrder: builder.mutation({
            query: (data) => {
                return {
                    url: `v1/tasks/${data.taskId}/update-order?order=${data.order}`,
                    method: "POST",
                };
            },
        }),
        /// * scrum
    }),
});

export const {
    useGetMutation,
    usePostMutation,
    usePutMutation,
    useGetArticulosByIdQuery,
    /* scrum */
    useGetScrumQuery,
    useGetProjectsQuery,
    useGetSprintsQuery,
    useGetTasksQuery,
    useGetHsitoryTaskQuery,
    /* <----------> */
    usePutTaskMutation,
    usePutTaskStatusMutation,
    usePutTaskOrderMutation
    /* scrum */
} = api;
