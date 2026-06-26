'use client';
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { getCookieinPage } from "@/utils/functions/cookies";
import AuthController from "@/components/auth/controller";
import Transferencia from "./transferencia-page";
import { useEffect, useState } from "react";
import Footer from "@/template/footer";
import Header from "@/template/header";

const USER_DATA_KEY = "userData";
const USER_ROLE_KEY = "user-role";

const Layout = ({ children }: { children: React.ReactNode }) => {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const getUserRole = async () => {
        try {
            let role: any = await getCookieinPage(USER_ROLE_KEY);

            if (!role) {
                const userData = await getLocalStorageItem(USER_DATA_KEY);
                if (userData && typeof userData === 'object' && userData !== null) {
                    role = userData.rol ? String(userData.rol) : null;
                }
            }

            setUserRole(role);
        } catch (error) {
            console.error("Error al obtener datos de localStorage:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getUserRole();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthController>
            <Header />
            {userRole === 'admin' && children}
            {userRole === 'pagos' && <Transferencia />}
            {userRole !== 'admin' && userRole !== 'pagos' && (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Acceso no autorizado
                        </h1>
                        <p className="text-gray-600 mb-6">
                            No tienes permisos para acceder a esta página.
                        </p>
                        <a
                            href="/login"
                            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Ir al inicio de sesión
                        </a>
                    </div>
                </div>
            )}
            <Footer />
        </AuthController>
    );
};

export default Layout;