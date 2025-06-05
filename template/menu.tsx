"use client";
import { useState, useEffect } from 'react'; // Añade useEffect
import Link from "next/link";
import MainForm from '@/components/form/main-form';
import { X, Menu, LogOut, LogIn, UserPlus, User } from 'lucide-react';
import { usePostLogutMutation } from '@/hooks/reducers/auth';
import { LogInField } from '@/utils/constants/forms/logIn';
import { navigationAdmin, navigationDefault, navigationUser } from '@/utils/constants/router';
import { getLocalStorageItem } from '@/utils/functions/local-storage';

const AppMenu = () => {
    const [logoutProcess] = usePostLogutMutation();
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

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

    const handleLogout = async () => {
        if (!userData.id) return;

        try {
            await logoutProcess(userData.id).unwrap();
            setMenuOpen(false);
            // Actualizar estado después de logout
            setUserData({ role: null, id: null, token: null });
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const navigationItems = () => {
        if (!userData.role) return navigationDefault;
        return userData.role === "admin" ? navigationAdmin : navigationUser;
    };

    return (
        <>
            <button
                onClick={() => setMenuOpen(true)}
                className="fixed right-4 top-4 z-30 p-2 rounded-full bg-white shadow-md"
                aria-label="Abrir menú"
            >
                <Menu className="text-purple-700" size={24} />
            </button>

            {/* Menú lateral */}
            <aside
                className={`fixed inset-y-0 right-0 z-40 w-64 bg-white shadow-xl transition-transform duration-300 ${menuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                aria-hidden={!menuOpen}
            >
                <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4">
                    {userData.token ? (
                        <section className="text-center space-y-3">
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center w-full py-2 px-4 bg-white text-purple-700 font-semibold rounded-lg gap-2"
                            >
                                <LogOut size={18} /> Cerrar Sesión
                            </button>
                        </section>
                    ) : (
                        <section className="space-y-3">
                            <button
                                onClick={() => setLoginModalOpen(true)}
                                className="flex items-center justify-center w-full py-2 px-4 bg-white text-purple-700 font-semibold rounded-lg gap-2"
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
                        {navigationItems().map((item) => {
                            const Icon = item.icon;
                            return Icon ? (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center p-3 rounded-lg text-gray-700 hover:bg-purple-50"
                                    >
                                        <Icon size={20} className="mr-3 text-gray-500" aria-hidden="true" />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                </li>
                            ) : null;
                        })}
                    </ul>

                    {!userData.token && (
                        <footer className="p-4 text-sm text-gray-500 mt-4">
                            <p>
                                ¿Eres proveedor?{' '}
                                <Link
                                    href="/proveedor-login"
                                    onClick={() => setMenuOpen(false)}
                                    className="text-purple-600 hover:underline"
                                >
                                    Acceso proveedores
                                </Link>
                            </p>
                        </footer>
                    )}
                </nav>

                <button
                    onClick={() => setMenuOpen(false)}
                    className="absolute top-3 right-3 p-1 text-white hover:bg-white/20 rounded-full"
                    aria-label="Cerrar menú"
                >
                    <X size={24} />
                </button>
            </aside>

            {/* Fondo oscuro */}
            {menuOpen && (
                <button
                    className="fixed inset-0 z-30 bg-black/50"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Cerrar menú"
                    tabIndex={-1}
                />
            )}

            {/* Modal de Login */}
            {loginModalOpen && (
                <section className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <article className="bg-white rounded-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
                        <header className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                            <h2 className="text-lg font-medium flex items-center gap-2">
                                <User size={20} /> Iniciar Sesión
                            </h2>
                            <button
                                onClick={() => setLoginModalOpen(false)}
                                className="p-1 rounded-full hover:bg-gray-100"
                                aria-label="Cerrar modal"
                            >
                                <X className="text-purple-700" size={24} />
                            </button>
                        </header>

                        <section className="p-6">
                            <MainForm
                                actionType="post-login"
                                dataForm={LogInField()}
                                message_button="Iniciar Sesión"
                                onSuccess={() => {
                                    setLoginModalOpen(false);
                                    setMenuOpen(false);
                                    // Actualizar datos de usuario después de login exitoso
                                    setUserData({
                                        role: getLocalStorageItem("user-role"),
                                        id: getLocalStorageItem("user-id"),
                                        token: getLocalStorageItem("token"),
                                    });
                                }}
                            />
                        </section>
                    </article>
                </section>
            )}
        </>
    );
};

export default AppMenu;