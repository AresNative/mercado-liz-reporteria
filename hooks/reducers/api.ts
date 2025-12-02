import { EnvConfig } from "@/utils/constants/env.config";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

const { api: apiUrl } = EnvConfig();
/* 
@  endpoints:
@    - get: consulta general
@    - getGeneral: consulta general sin url base
@    - getPerIds: consulta por ID
@    - getWithFilters: consulta con filtros y paginación
@    - getWithFiltersGeneral: consulta con filtros y paginación sin url base
@    - post: creación de registros
@    - postGeneral: creación de registros sin url base
@    - put: actualización de registros
@    - putGeneral: actualización de registros sin url base
@    - postImg: subida de imágenes

* el uso de los endpoints general es para cuando se requiere especificar la tabla en los parámetros
* en lugar de tener una url base fija.
* Cada endpoint maneja errores y reintentos de manera uniforme.

! Nota: Asegúrate de que los endpoints del backend coincidan con los definidos aquí.

Ejemplo de uso en un componente:

import { useGetQuery, usePostMutation } from "@/hooks/reducers/api";
const { data, isLoading:loading, error, refetch } = useGetQuery({ url: 'tu-endpoint', signal: new AbortController().signal });
const [postData, { data: postResponse, error: postError, isLoading: isPosting }] = usePostMutation();
postData({ url: 'tu-endpoint', data: { key: 'value' }, signal: new AbortController().signal });

? Los endpoints con "General" permiten especificar la tabla en los parámetros, por lo que solo deben en desarrollo.
*/
export const api = createApi({
  reducerPath: "api",
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
    getGeneral: builder.query({
      query: ({ param, signal }) => ({
        url: `/consultar`,
        method: "GET",
        params: { param },
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    getPerIds: builder.query({
      query: ({ url, id, signal }) => ({
        url: `${url}/consultar/${id}`,
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
      query: ({ url, page, pageSize, filtros, signal }) => ({
        url: `${url}/consultar/filtros`,
        method: "POST",

        params: {
          page,
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
    getWithFiltersGeneral: builder.mutation({
      query: ({ table, tag, page, pageSize, filtros, signal }) => ({
        url: `/v1/consultar/filtros`,
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
    post: builder.mutation({
      query: ({ url, data, signal }) => ({
        url: `${url}/register`,
        method: "POST",
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
    postGeneral: builder.mutation({
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
    put: builder.mutation({
      query: ({ url, id, data, signal }) => ({
        url: `${url}/update/${id}`,
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

    putGeneral: builder.mutation({
      query: ({ table, id, data, signal }) => ({
        url: `v1/update/${id}`,
        method: "PUT",
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

    postImg: builder.mutation({
      // <-- endpoint para subir imagenes
      query: ({ idRef, tabla, descripcion, file, signal }) => ({
        url: `v1/recursos/imagenes/upload`,
        method: "POST",
        params: { idRef, tabla, descripcion },
        body: file, // Asegúrate de que 'file' sea un FormData con la imagen
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    postArchvios: builder.mutation({
      // <-- endpoint para subir archivos
      query: ({ idRef, tabla, descripcion, file, signal }) => ({
        url: `v1/recursos/archivos/upload`,
        method: "POST",
        params: { idRef, tabla, descripcion },
        body: file, // Asegúrate de que 'file' sea un FormData con la imagen
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    // Agregar este endpoint a tu api.ts
    deleteGeneral: builder.mutation({
      query: ({ table, id, signal }) => ({
        url: `v1/delete/${id}`,
        method: "DELETE",
        params: { table },
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error deleting data",
      }),
      extraOptions: { maxRetries: 2 },
    }),

    deleteImg: builder.mutation({
      query: ({ id, signal }) => ({
        url: `v1/recursos/imagenes/delete/${id}`,
        method: "DELETE",
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error deleting data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    deleteArchivos: builder.mutation({
      query: ({ id, signal }) => ({
        url: `v1/recursos/archivos/delete/${id}`,
        method: "DELETE",
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error deleting data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
  }),
});

export const {
  useGetQuery,
  useGetGeneralQuery,
  useGetPerIdsQuery,
  useGetWithFiltersMutation,
  useGetWithFiltersGeneralMutation,
  usePostMutation,
  usePostGeneralMutation,
  usePutMutation,
  usePutGeneralMutation,
  usePostImgMutation,
  usePostArchviosMutation,
  useDeleteGeneralMutation,
  useDeleteImgMutation,
  useDeleteArchivosMutation,
} = api;
