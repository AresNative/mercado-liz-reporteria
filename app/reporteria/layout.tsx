import { ReactNode } from "react";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { getCookieinPage } from "@/utils/functions/cookies";

const Layout = async ({ admin, user, ventas, almacen }: {
    admin: React.ReactNode
    user: React.ReactNode
    ventas: React.ReactNode
    almacen: React.ReactNode
}) => {
    // Función para obtener el rol del usuario desde las cookies o localStorage
    // Si no se encuentra en las cookies, se busca en localStorage
    const userRole = await getCookieinPage("user-role") ?? getLocalStorageItem("user-role") ?? "none";

    const roleContent: Record<string, ReactNode> = {
        admin,
        user,
        ventas,
        almacen
    };

    return (
        <section className="pt-10">
            {userRole && roleContent[userRole] ?
                (roleContent[userRole])
                :
                (<>Acceso no autorizado</>)}
        </section>
    );
};

export default Layout;