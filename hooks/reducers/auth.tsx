;
import { EnvConfig } from "@/utils/constants/env.config";
import { getLocalStorageItem, removeFromLocalStorage, setLocalStorageItem } from "@/utils/functions/local-storage";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const { api: apiUrl } = EnvConfig();

export const auth = createApi({
    reducerPath: "auth",
    refetchOnFocus: true,
    baseQuery: fetchBaseQuery({
        baseUrl: apiUrl,
        prepareHeaders: (headers) => {
            headers.set("Content-Type", "application/json");
            const token = getLocalStorageItem("token");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        postUserRegister: builder.mutation({
            query: (data) => ({
                url: "v1/users/register",
                method: "POST",
                body: data,
            }),
        }),
        postUserLogin: builder.mutation({
            query: (data) => ({
                url: "v1/users/login",
                method: "POST",
                body: data,
            }),
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    const { data: responseData } = await queryFulfilled;
                    // Verifica si la respuesta contiene un token
                    if (responseData.token) {
                        // Guardar el token en localStorage
                        setLocalStorageItem("user-role", responseData.role.trimEnd());
                        setLocalStorageItem("user-id", responseData.userId);
                        setLocalStorageItem("token", responseData.token);
                    }
                } catch (error) {
                    console.log("Error al hacer login:", error);
                }
            },
        }),
        postLogut: builder.mutation({
            query: (userId) => ({
                url: `v1/users/logout`,
                method: "POST",
                params: { id: userId },
            }),
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    // Eliminar todos los datos relacionados con la sesión
                    removeFromLocalStorage("user-role");
                    removeFromLocalStorage("user-id");
                    removeFromLocalStorage("token");
                } catch (error) {
                    console.log("Error al hacer logout:", error);
                }
            },
        }),
    }),
});

export const {
    usePostLogutMutation,
    usePostUserLoginMutation,
    usePostUserRegisterMutation,
} = auth;
