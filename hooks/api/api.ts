import { EnvConfig } from "@/utils/constants/env.config";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getCookie } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

const USER_DATA_KEY = "userData";
const { api: apiUrl } = EnvConfig();

export const api = createApi({
  reducerPath: "api",
  refetchOnFocus: true,
  keepUnusedDataFor: 5,
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
      query: ({ table, tag, page, pageSize, filtros, signal }) => ({
        url: `v1/consultar`,
        method: "POST",
        params: {
          fromClause: table,
        },
        body: { ...filtros, page, pageSize },
        providesTags: [tag],
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

    putGeneral: builder.mutation({
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

    postImg: builder.mutation({
      query: ({ idRef, tabla, descripcion, file, signal }) => ({
        url: `v1/recursos/imagenes/upload`,
        method: "POST",
        params: { idRef, tabla, descripcion },
        body: file,
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    postArchvios: builder.mutation({
      query: ({ idRef, tabla, descripcion, file, signal }) => ({
        url: `v1/recursos/archivos/upload`,
        method: "POST",
        params: { idRef, tabla, descripcion },
        body: file,
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    deleteGeneral: builder.mutation({
      query: ({ table, column, id, signal }) => ({
        url: `v1/delete/${id}`,
        method: "DELETE",
        params: { column, table },
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
  useGetPerIdsQuery,
  useGetWithFiltersMutation,
  usePostGeneralMutation,
  usePutGeneralMutation,
  usePostImgMutation,
  usePostArchviosMutation,
  useDeleteGeneralMutation,
  useDeleteImgMutation,
  useDeleteArchivosMutation,
} = api;
