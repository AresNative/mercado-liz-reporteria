import { getCookieinPage } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { ReactNode } from "react";

// app/nominas/layout.tsx
export const dynamic = 'force-dynamic';

interface NominaLayoutProps {
    children?: React.ReactNode;
    ventas?: React.ReactNode;
    admin?: React.ReactNode;
    // Sin children si no lo necesitas
}

const Layout = async ({ ventas, admin }: NominaLayoutProps) => {
    const userRole = await getCookieinPage("user-role") ??
        getLocalStorageItem("user-role") ??
        "none";

    const roleContent: Record<string, ReactNode> = {
        ventas: ventas,
        admin: admin,
        rh: admin,
    };

    // Si no hay children, el layout solo muestra el parallel route
    return (
        <section className="pt-10">
            {userRole && roleContent[userRole] ? (
                roleContent[userRole]
            ) : (
                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">
                        Acceso no autorizado
                    </h2>
                    <p>No tienes permisos para ver esta sección</p>
                </div>
            )}
        </section>
    );
};

export default Layout;