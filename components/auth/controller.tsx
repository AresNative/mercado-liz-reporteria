"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getLocalStorageItem, clearLocalStorage } from "@/utils/functions/local-storage";
import { useLogoutUserMutation } from "@/hooks/reducers/auth";

const USER_DATA_KEY = "userData";
const TOKEN_EXPIRY_HOURS = 24;

const AuthController = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [logoutUser] = useLogoutUserMutation();

    const checkTokenExpiry = useCallback(() => {
        try {
            const userData = getLocalStorageItem(USER_DATA_KEY);

            // Verificar si existe userData y es un objeto
            if (!userData || typeof userData !== "object") {
                return false;
            }

            // El loginTime está dentro de userData (como se guarda en auth.ts)
            const loginTime = userData.loginTime;

            // Si no hay loginTime, considerar token como inválido
            if (!loginTime) {
                console.warn("No loginTime found in userData");
                return true; // Forzar logout por datos incompletos
            }

            const now = Date.now();
            const loginTimestamp = Number(loginTime);
            const hoursSinceLogin = (now - loginTimestamp) / (1000 * 60 * 60);

            console.log(`Token check: ${hoursSinceLogin.toFixed(2)} hours since login`);
            return hoursSinceLogin >= TOKEN_EXPIRY_HOURS;
        } catch (error) {
            console.error("Error checking token expiry:", error);
            return false;
        }
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await logoutUser(null).unwrap();
            console.log("Token expired - Automatic logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            clearLocalStorage();
            // Solo redirigir si no estamos ya en login
            if (!pathname.includes("/login")) {
                router.push("/login");
            }
        }
    }, [logoutUser, router, pathname]);

    const validateAndRefreshToken = useCallback(() => {
        // Solo validar si estamos en una ruta protegida
        const publicRoutes = ["/login", "/register", "/forgot-password"];
        const isPublicRoute = publicRoutes.some(route => pathname.includes(route));

        if (isPublicRoute) {
            return true;
        }

        const userData = getLocalStorageItem(USER_DATA_KEY);

        // Si no hay userData y no estamos en ruta pública, redirigir a login
        if (!userData && !isPublicRoute) {
            router.push("/login");
            return false;
        }

        // Si hay userData, verificar expiración
        if (userData) {
            const isExpired = checkTokenExpiry();

            if (isExpired) {
                handleLogout();
                return false;
            }
        }

        return true;
    }, [checkTokenExpiry, handleLogout, pathname, router]);

    // Efecto principal: verificar en carga y cambio de ruta
    useEffect(() => {
        validateAndRefreshToken();
    }, [pathname, validateAndRefreshToken]);

    // Efecto para verificación periódica (cada 10 minutos para menos carga)
    useEffect(() => {
        const interval = setInterval(() => {
            const userData = getLocalStorageItem(USER_DATA_KEY);
            if (userData) {
                console.log("Periodic token check");
                validateAndRefreshToken();
            }
        }, 10 * 60 * 1000); // 10 minutos

        return () => clearInterval(interval);
    }, [validateAndRefreshToken]);

    // Listener para actividad del usuario (eventos principales)
    useEffect(() => {
        const handleUserActivity = () => {
            const userData = getLocalStorageItem(USER_DATA_KEY);
            if (userData) {
                // Solo validar ocasionalmente con actividad, no en cada evento
                const lastCheck = sessionStorage.getItem("lastTokenCheck");
                const now = Date.now();

                if (!lastCheck || (now - parseInt(lastCheck)) > 5 * 60 * 1000) {
                    validateAndRefreshToken();
                    sessionStorage.setItem("lastTokenCheck", now.toString());
                }
            }
        };

        // Eventos clave para detectar actividad
        const events = ["click", "keydown", "mousemove"];

        // Usar throttling para evitar muchas llamadas
        let timeoutId: NodeJS.Timeout;
        const throttledHandler = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleUserActivity, 1000); // Esperar 1 segundo
        };

        events.forEach(event => {
            window.addEventListener(event, throttledHandler);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, throttledHandler);
            });
            clearTimeout(timeoutId);
        };
    }, [validateAndRefreshToken]);

    return <>{children}</>;
};

export default AuthController;