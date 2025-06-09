import { ReactNode } from "react";
import { cookies } from "next/headers";

import { DashboardLayoutProps } from "@/utils/types/interfaces";

const DashboardLayout = async ({ admin, user }: DashboardLayoutProps) => {
  // Función para obtener el rol del usuario desde las cookies en el lado del servidor
  const getCookie = async (cookieName: string) => {
    const cookieStore = await cookies(); // Acceso sincrónico a las cookies
    const cookie = cookieStore.get(cookieName);
    return cookie ? cookie.value : "";
  };

  // Obtenemos el rol del usuario directamente desde las cookies (ya que estamos en el lado del servidor)
  const userRole = await getCookie("user-role");

  // Contenido a mostrar según el rol del usuario
  const roleContent: Record<string, ReactNode> = {
    admin: admin,
    user: user,
  };

  // Renderizado en el servidor
  return (
    <section className="pt-10" >
      {/* Muestra el contenido según el rol o un mensaje por defecto */}
      {
        userRole && roleContent[userRole] ? (
          roleContent[userRole]
        ) : (
          <>Acceso no autorizado</>
        )
      }
    </section >
  );
};

export default DashboardLayout;