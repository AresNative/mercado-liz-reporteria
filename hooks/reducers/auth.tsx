import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { EnvConfig } from "@/utils/constants/env.config";
import {
    getLocalStorageItem,
    removeFromLocalStorage,
    setLocalStorageItem
} from "@/utils/functions/local-storage";

const { api: apiUrl } = EnvConfig();

// Constantes para evitar errores de escritura
const TOKEN_KEY = "token";
const USER_ROLE_KEY = "user-role";
const USER_ID_KEY = "user-id";

// Utilidad para manejar cookies de forma segura
const cookieManager = {
    set: (name: string, value: string, days = 7, path = "/") => {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    },

    remove: (name: string, path = "/") => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
    },

    get: (name: string): string | null => {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
            const [cookieName, cookieValue] = cookie.split("=").map(c => c.trim());
            if (cookieName === name) {
                return decodeURIComponent(cookieValue);
            }
        }
        return null;
    }
};

export const authApi = createApi({
    reducerPath: "authApi",
    refetchOnFocus: true,
    baseQuery: fetchBaseQuery({
        baseUrl: apiUrl,
        prepareHeaders: (headers) => {
            headers.set("Content-Type", "application/json");

            // Priorizar token de cookies sobre localStorage por seguridad
            const token = cookieManager.get(TOKEN_KEY) || getLocalStorageItem(TOKEN_KEY);

            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }

            return headers;
        },
    }),
    endpoints: (builder) => ({
        registerUser: builder.mutation({
            query: (userData) => ({
                url: "Auth/register",
                method: "POST",
                body: userData,
            }),
        }),
        loginUser: builder.mutation({
            query: (credentials) => ({
                url: "Auth/login",
                method: "POST",
                body: credentials,
            }),
            onQueryStarted: async (_, { queryFulfilled, dispatch }) => {
                try {
                    const { data: responseData } = await queryFulfilled;

                    if (responseData.token) {
                        // Almacenar en cookies (más seguro para HTTP-only en producción)
                        cookieManager.set(TOKEN_KEY, responseData.token);
                        cookieManager.set(USER_ROLE_KEY, responseData.rol);
                        cookieManager.set(USER_ID_KEY, responseData.id);

                        // Almacenar en localStorage para fácil acceso del cliente
                        setLocalStorageItem(TOKEN_KEY, responseData.token);
                        setLocalStorageItem(USER_ROLE_KEY, responseData.rol);
                        setLocalStorageItem(USER_ID_KEY, responseData.id);
                    }
                } catch (error) {
                    console.error("Error during login:", error);
                    // Podrías dispatchar una acción de error aquí si es necesario
                }
            },
        }),
        logoutUser: builder.mutation({
            query: () => ({
                url: `Auth/logout`,
                method: "POST",
                responseHandler: (response) => response.text(),
            }),
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    // Limpiar cookies
                    cookieManager.remove(TOKEN_KEY);
                    cookieManager.remove(USER_ROLE_KEY);
                    cookieManager.remove(USER_ID_KEY);

                    // Limpiar localStorage
                    removeFromLocalStorage(TOKEN_KEY);
                    removeFromLocalStorage(USER_ROLE_KEY);
                    removeFromLocalStorage(USER_ID_KEY);
                } catch (error) {
                    console.error("Error during logout:", error);
                }
            },
        }),
        // Endpoint adicional para verificar token
        verifyToken: builder.query({
            query: () => "Auth/verify",
        }),
    }),
});

export const {
    useRegisterUserMutation,
    useLoginUserMutation,
    useLogoutUserMutation,
    useVerifyTokenQuery,
} = authApi;