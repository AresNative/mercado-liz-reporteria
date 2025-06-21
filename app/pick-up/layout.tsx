import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { getCookieinPage } from "@/utils/functions/cookies";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  // Función para obtener el rol del usuario desde las cookies o localStorage
  // Si no se encuentra en las cookies, se busca en localStorage
  const userRole = await getCookieinPage("user-role") ?? getLocalStorageItem("user-role") ?? "none";

  return (
    <section className="pt-10">
      {userRole ? (children) : (<>Acceso no autorizado</>)}
    </section>
  );
};

export default Layout;
