
import { useState, useEffect } from 'react';
import Link from "next/link";
import MainForm from '@/components/form/main-form';
import { Menu, LogOut, LogIn, UserPlus } from 'lucide-react';
import { usePostLogutMutation } from '@/hooks/reducers/auth';
import { LogInField } from '@/utils/constants/forms/logIn';
import { navigationAdmin, navigationAlmacen, navigationDefault, navigationUser, navigationVentas } from '@/utils/constants/router';
import { getLocalStorageItem } from '@/utils/functions/local-storage';
import { cn } from '@/utils/functions/cn';
import { closeModalReducer, openAlertReducer, openModalReducer } from '@/hooks/reducers/drop-down';
import { useAppDispatch } from '@/hooks/selector';
import { Modal } from '@/components/modal';
import { useRouter } from "next/navigation";

interface MenuProps {
    isScrolled?: boolean;
}

const AppMenu: React.FC<MenuProps> = ({ isScrolled }) => {
    const navigation = useRouter();
    const [logoutProcess] = usePostLogutMutation();
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const dispatch = useAppDispatch();
    // Estado para almacenar los datos del usuario
    const [userData, setUserData] = useState<{
        role: string | null;
        id: string | null;
        token: string | null;
    }>({
        role: null,
        id: null,
        token: null,
    });

    // Obtener datos de localStorage solo en el cliente
    useEffect(() => {
        setUserData({
            role: getLocalStorageItem("user-role"),
            id: getLocalStorageItem("user-id"),
            token: getLocalStorageItem("token"),
        });
    }, []);

    useEffect(() => {
        if (menuOpen || loginModalOpen) {
            document.body.style.overflow = 'hidden';
            if (menuOpen) {
                // Enfocar el menú al abrir para accesibilidad
                setTimeout(() => {
                    const menu = document.querySelector('aside');
                    menu?.focus();
                }, 100);
            }
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [menuOpen, loginModalOpen]);


    const handleLogout = async () => {
        if (!userData.id) return;

        try {
            await logoutProcess(userData.id).unwrap();
            setMenuOpen(false);
            dispatch(
                openAlertReducer({
                    title: "Sesion cerrada",
                    message: "Vuelve pronto!",
                    type: "info",
                    icon: "alert",
                    duration: 4000
                })
            );
            // Actualizar estado después de logout
            setUserData({ role: null, id: null, token: null });
            navigation.push("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const navigationItems = () => {
        const role = userData.role;
        if (!role) return navigationDefault;
        const navigationMap: any = {
            admin: navigationAdmin,
            user: navigationUser,
            almacen: navigationAlmacen,
            seguridad: navigationAlmacen,
            ventas: navigationVentas,
            // ... otros roles
        };
        return navigationMap[role] || navigationUser;
    };

    return (
        <>
            <button
                onClick={() => setMenuOpen(true)}
                className={cn(isScrolled ? "top-2" : "top-4", " right-4 z-30 p-2 rounded-full cursor-pointer")}
                aria-label="Abrir menú"
            >
                <Menu className={cn(isScrolled ? "text-green-700" : "text-white")} size={24} />
            </button>

            {/* Menú lateral */}
            <aside
                className={cn(isScrolled ?? "absolute",
                    "fixed inset-y-0 right-0 z-50 w-64 bg-[var(--background)] shadow-xl transform transition-transform duration-300 ease-in-out",
                    menuOpen ? "translate-x-0" : "translate-x-full overflow-hidden"
                )} aria-hidden={!menuOpen}
            >
                <header className="bg-gradient-to-r from-green-600 to-green-800 text-white p-4">
                    {userData.token ? (
                        <section className="flex flex-col gap-2">
                            <span className=''>
                                {userData.role}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-center cursor-pointer flex items-center justify-center w-full py-2 px-4 bg-white text-green-700 font-semibold rounded-lg gap-2"
                            >
                                <LogOut size={18} /> Cerrar Sesión
                            </button>
                        </section>
                    ) : (
                        <section className="space-y-3">
                            <button
                                onClick={() => dispatch(openModalReducer({ modalName: "login-modal" }))}
                                className="flex cursor-pointer items-center justify-center w-full py-2 px-4 bg-white text-green-700 font-semibold rounded-lg gap-2"
                            >
                                <LogIn size={18} /> Iniciar Sesión
                            </button>
                            <Link
                                href="/register"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center justify-center w-full py-2 px-4 border border-white text-white font-semibold rounded-lg gap-2"
                            >
                                <UserPlus size={18} /> Registrarse
                            </Link>
                        </section>
                    )}
                </header>

                <nav className="p-2">
                    <ul className="space-y-1">
                        {navigationItems().map((item: any) => {
                            const Icon = item.icon;
                            return Icon ? (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-700 transition-colors"
                                    >
                                        <Icon size={20} className="mr-3 text-gray-500 dark:text-gray-200" aria-hidden="true" />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                </li>
                            ) : null;
                        })}
                    </ul>
                </nav>

                <button
                    onClick={() => setMenuOpen(false)}
                    className="absolute cursor-pointer w-0 h-0 top-3 right-3 p-1 text-white hover:bg-white/20 rounded-full"
                    aria-label="Cerrar menú"
                >
                    {/* <X size={24} /> */}
                </button>
            </aside>

            {/* Fondo oscuro */}
            {menuOpen && (
                <button
                    className="fixed cursor-pointer inset-0 z-40 bg-black/50"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Cerrar menú"
                    tabIndex={-1}
                />
            )}

            <Modal title="Formulario de Tarea" modalName={"login-modal"} maxWidth='sm'>
                <MainForm
                    actionType="post-login"
                    dataForm={LogInField()}
                    message_button="Iniciar Sesión"
                    onSuccess={() => {
                        setLoginModalOpen(false);
                        setMenuOpen(false);
                        try {
                            // Actualizar datos de usuario después de login exitoso
                            setUserData({
                                role: getLocalStorageItem("user-role"),
                                id: getLocalStorageItem("user-id"),
                                token: getLocalStorageItem("token"),
                            });
                            dispatch(closeModalReducer({ modalName: "login-modal" }));
                            navigation.push(navigationItems()[0].href); // Redirigir al primer item del menú
                        } catch {
                            dispatch(
                                openAlertReducer({
                                    title: "Correo o contraseña incorrectos!",
                                    message: "Credenciales invalidas",
                                    type: "error",
                                    icon: "alert",
                                    duration: 4000
                                })
                            );
                            navigation.push("/"); // Redirigir a la página de login
                        }
                    }}
                />
            </ Modal>
        </>
    );
};

export default AppMenu;

