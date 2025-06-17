import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { EnvConfig } from "@/utils/constants/env.config";
import { getLocalStorageItem, removeFromLocalStorage, setLocalStorageItem } from "@/utils/functions/local-storage";
import { getCookie } from "@/utils/functions/cookies";

const { api: apiUrl } = EnvConfig();

export const auth = createApi({
    reducerPath: "auth",
    refetchOnFocus: true,
    baseQuery: fetchBaseQuery({
        baseUrl: apiUrl,
        prepareHeaders: (headers) => {
            const token = getLocalStorageItem('token'); // <- usa cookie
            headers.set("Content-Type", "application/json");
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

                    if (responseData.token) {
                        const options = "path=/; SameSite=Lax";
                        // Si estás en HTTPS, agrega "; Secure"
                        document.cookie = `token=${responseData.token}; ${options}`;
                        document.cookie = `user-role=${responseData.role.trimEnd()}; ${options}`;
                        document.cookie = `user-id=${responseData.userId}; ${options}`;
                        setLocalStorageItem("user-role", responseData.role.trimEnd());
                        setLocalStorageItem("user-id", responseData.userId);
                        setLocalStorageItem("token", responseData.token);
                    }
                } catch (error) {
                    console.error("Error al hacer login:", error);
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
                    // Eliminar cookies (se hace expirándolas)
                    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
                    document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
                    document.cookie = "user-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
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

// Utilidad para leer cookies del cliente


export const {
    usePostLogutMutation,
    usePostUserLoginMutation,
    usePostUserRegisterMutation,
} = auth;
