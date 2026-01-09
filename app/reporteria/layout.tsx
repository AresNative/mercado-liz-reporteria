import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { getCookieinPage } from "@/utils/functions/cookies";
import AuthController from "@/components/auth/controller";

const USER_DATA_KEY = "userData";
const USER_ROLE_KEY = "user-role";

const Layout = ({ children }: { children: React.ReactNode }) => {
    // Función para obtener el rol del usuario
    const getUserRole = () => {
        // 1. Intentar obtener de las cookies
        const roleFromCookie = getCookieinPage(USER_ROLE_KEY);
        if (roleFromCookie) {
            return roleFromCookie;
        }

        // 2. Si no hay en cookies, buscar en localStorage
        try {
            const userData = getLocalStorageItem(USER_DATA_KEY);

            // Verificar si userData es válido y tiene rol
            if (userData && typeof userData === 'object' && userData !== null) {
                // Manejar diferentes estructuras posibles
                if ('rol' in userData) {
                    return String(userData.rol);
                } else if ('role' in userData) {
                    return String(userData.role);
                } else if ('userRole' in userData) {
                    return String(userData.userRole);
                }
            }
        } catch (error) {
            console.error("Error al obtener datos de localStorage:", error);
            return null;
        }

        return null;
    };

    const userRole = getUserRole();
    const isAuthorized = Boolean(userRole);

    return (
        <AuthController>
            {isAuthorized ? (
                <>{children}</>
            ) : (
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
        </AuthController>
    );
};

export default Layout;