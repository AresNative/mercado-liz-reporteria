import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Menu, LogOut, LogIn, UserPlus, X } from "lucide-react";
import { useLogoutUserMutation } from "@/hooks/api/auth";
import { useAppDispatch } from "@/hooks/selector";
import { closeModalReducer, openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down";
import MainForm from "@/components/form/main-form";
import { Modal } from "@/components/modal";
import { SwitchToggle } from "@/components/switch-mode";
import Badge from "@/components/badge";
import { LogInField } from "@/utils/constants/forms/logIn";
import {
    navigationAdmin,
    navigationAlmacen,
    navigationDefault,
    navigationNomina,
    navigationRh,
    navigationUser,
    navigationVentas,
} from "@/utils/constants/router";
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage";
import { cn } from "@/utils/functions/cn";

// Constantes para claves de localStorage
const STORAGE_KEYS = {
    USER_DATA: "userData",
    USER_CREDENTIALS: "userCredentials",
    USER_ROL: "user-rol",
    USER_ID: "user-id",
    TOKEN: "token",
} as const;

// Tipos
interface UserData {
    rol: string | null;
    id: string | null;
    token: string | null;
}

interface UserCredentials {
    email: string | null;
    password: string | null;
}

interface MenuProps {
    isScrolled?: boolean;
}

// Hook personalizado para manejar autenticación
function useAuth() {
    const [userData, setUserData] = useState<UserData>({
        rol: null,
        id: null,
        token: null,
    });
    const [userCredentials, setUserCredentials] = useState<UserCredentials>({
        email: null,
        password: null,
    });

    // Cargar datos al montar
    useEffect(() => {
        setUserData(getLocalStorageItem(STORAGE_KEYS.USER_DATA));
        setUserCredentials(getLocalStorageItem(STORAGE_KEYS.USER_CREDENTIALS));
    }, []);

    const clearUserData = useCallback(() => {
        setUserData({ rol: null, id: null, token: null });
        setUserCredentials({ email: null, password: null });
    }, []);

    return { userData, userCredentials, setUserData, clearUserData };
}

// Hook para bloquear/desbloquear scroll del body
function useLockScroll(active: boolean) {
    useEffect(() => {
        if (active) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [active]);
}

// Hook para manejar el foco al abrir/cerrar menú
function useFocusManagement(menuOpen: boolean, menuRef: React.RefObject<HTMLElement | null>) {
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (menuOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement;
            const timer = setTimeout(() => {
                menuRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        } else {
            previousFocusRef.current?.focus();
        }
    }, [menuOpen, menuRef]);
}

const AppMenu: React.FC<MenuProps> = ({ isScrolled = false }) => {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const [logoutProcess] = useLogoutUserMutation();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLElement>(null);

    const { userData, userCredentials, setUserData, clearUserData } = useAuth();

    // Bloquear scroll cuando el menú está abierto
    useLockScroll(menuOpen);

    // Manejo de foco en el menú
    useFocusManagement(menuOpen, menuRef);

    // Obtener elementos de navegación según rol (memorizado)
    const navigationItems = useMemo(() => {
        const rol = userData.rol;
        if (!rol) return navigationDefault;

        const navigationMap: Record<string, any[]> = {
            admin: navigationAdmin,
            empleado: navigationUser,
            almacen: navigationAlmacen,
            seguridad: navigationAlmacen,
            ventas: navigationVentas,
            rh: navigationRh,
            nomina: navigationNomina,
        };
        return navigationMap[rol] || navigationUser;
    }, [userData.rol]);

    // Cerrar sesión
    const handleLogout = useCallback(async () => {
        try {
            await logoutProcess(null);
            clearUserData();
            setMenuOpen(false);
            dispatch(
                openAlertReducer({
                    title: "Sesión cerrada",
                    message: "Vuelve pronto!",
                    type: "info",
                    icon: "alert",
                    duration: 4000,
                })
            );
            router.push("/");
        } catch (error) {
            console.error("Logout failed:", error);
            dispatch(
                openAlertReducer({
                    title: "Error al cerrar sesión",
                    message: "Inténtalo nuevamente",
                    type: "error",
                    icon: "alert",
                    duration: 4000,
                })
            );
        }
    }, [logoutProcess, clearUserData, dispatch, router]);

    // Abrir modal de login
    const openLoginModal = useCallback(() => {
        dispatch(openModalReducer({ modalName: "login-modal" }));
    }, [dispatch]);

    // Cerrar menú
    const closeMenu = useCallback(() => setMenuOpen(false), []);

    return (
        <section className="relative">
            {/* Botón abrir menú */}
            <button
                onClick={() => setMenuOpen(true)}
                className={cn(
                    isScrolled ? "top-2" : "top-4",
                    "right-4 z-30 p-2 rounded-full cursor-pointer"
                )}
                aria-label="Abrir menú"
                aria-haspopup="true"
                aria-expanded={menuOpen}
            >
                <Menu
                    className={cn(isScrolled ? "text-green-700" : "text-white")}
                    size={24}
                />
            </button>

            {/* Menú lateral */}
            <aside
                ref={menuRef}
                className={cn(
                    "fixed inset-y-0 right-0 z-50 w-64 bg-[var(--background)] shadow-xl transform transition-transform duration-300 ease-in-out",
                    menuOpen ? "translate-x-0" : "translate-x-full overflow-hidden"
                )}
                aria-hidden={!menuOpen}
                tabIndex={menuOpen ? 0 : -1}
                role="dialog"
                aria-label="Menú de navegación"
            >
                {/* Cabecera del menú */}
                <header className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4 flex flex-row-reverse gap-2 w-full">
                    <button
                        onClick={closeMenu}
                        className="cursor-pointer p-1 text-white hover:bg-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label="Cerrar menú"
                    >
                        <X size={20} />
                    </button>

                    {userData.token ? (
                        <section className="relative flex flex-col gap-2 w-full">
                            <span className="text-xs truncate">{userCredentials.email}</span>
                            <section className="absolute -bottom-7 -right-2">
                                <Badge
                                    color={userData.rol === "admin" ? "blue" : "pink"}
                                    text={userData.rol || ""}
                                />
                            </section>
                            <button
                                onClick={handleLogout}
                                className="text-center cursor-pointer flex items-center justify-center w-full py-2 px-4 bg-white text-green-700 font-semibold rounded-lg gap-2 hover:bg-gray-100 transition-colors"
                            >
                                <LogOut size={18} /> Cerrar Sesión
                            </button>
                        </section>
                    ) : (
                        <section className="space-y-3 w-full">
                            <button
                                onClick={openLoginModal}
                                className="flex cursor-pointer items-center justify-center w-full py-2 px-4 bg-white text-green-700 font-semibold rounded-lg gap-2 hover:bg-gray-100 transition-colors"
                            >
                                <LogIn size={18} /> Iniciar Sesión
                            </button>
                            <Link
                                href="/register"
                                onClick={closeMenu}
                                className="flex items-center justify-center w-full py-2 px-4 border border-white text-white font-semibold rounded-lg gap-2 hover:bg-white/10 transition-colors"
                            >
                                <UserPlus size={18} /> Registrarse
                            </Link>
                        </section>
                    )}
                </header>

                {/* Navegación */}
                <nav className="p-2">
                    <ul className="space-y-1">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            if (!Icon) return null;
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={closeMenu}
                                        className={cn(
                                            "flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-700 transition-colors",
                                            isActive && "bg-green-100 dark:bg-green-800 font-semibold"
                                        )}
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        <Icon size={20} className="mr-3 text-gray-500 dark:text-gray-200" aria-hidden="true" />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                        <li className="flex items-center rounded-lg text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-700 transition-colors">
                            <SwitchToggle />
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Fondo oscuro (overlay) */}
            {menuOpen && (
                <button
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm cursor-pointer"
                    onClick={closeMenu}
                    aria-label="Cerrar menú"
                    tabIndex={-1}
                />
            )}

            {/* Modal de inicio de sesión - USO DE MAINFORM SIN MODIFICAR */}
            <Modal title="Iniciar Sesión" modalName={"login-modal"} maxWidth="sm">
                <MainForm
                    actionType="post-login"
                    dataForm={LogInField()}
                    message_button="Iniciar Sesión"
                    onSuccess={() => {
                        try {
                            // Actualizar datos de usuario después de login exitoso
                            setUserData({
                                rol: getLocalStorageItem(STORAGE_KEYS.USER_ROL),
                                id: getLocalStorageItem(STORAGE_KEYS.USER_ID),
                                token: getLocalStorageItem(STORAGE_KEYS.TOKEN),
                            });
                            setMenuOpen(false);
                            dispatch(closeModalReducer({ modalName: "login-modal" }));
                            router.push("/reporteria");
                        } catch {
                            dispatch(
                                openAlertReducer({
                                    title: "Correo o contraseña incorrectos!",
                                    message: "Credenciales invalidas",
                                    type: "error",
                                    icon: "alert",
                                    duration: 4000,
                                })
                            );
                            router.push("/");
                        }
                    }}
                />
            </Modal>
        </section>
    );
};

export default AppMenu;