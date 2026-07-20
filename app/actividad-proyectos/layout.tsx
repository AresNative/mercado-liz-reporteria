'use client';
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { getCookieinPage } from "@/utils/functions/cookies";
import AuthController from "@/components/auth/controller";
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
    console.log(userRole);
    
    return (
        <AuthController>
            <Header />
            {userRole === 'admin'  && children}
            <Footer />
        </AuthController>
    );
};

export default Layout;