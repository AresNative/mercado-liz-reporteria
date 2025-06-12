import { ReactNode } from "react";
import { cookies } from "next/headers";

import { DashboardLayoutProps } from "@/utils/types/interfaces";

const Layout = async ({ admin, user, ventas }: DashboardLayoutProps) => {
  // Función para obtener el rol del usuario desde las cookies
  const getCookie = async (cookieName: string): Promise<string> => {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(cookieName);
    const value = cookie?.value ?? "";
    return value ? value : "none"; // Retorna "none" si no se encuentra el cookie
  };

  const userRole = await getCookie("user-role");

  const roleContent: Record<string, ReactNode> = {
    admin,
    user,
    ventas
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
