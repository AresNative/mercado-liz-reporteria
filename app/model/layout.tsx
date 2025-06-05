// components/DashboardLayout.tsx (Client Component)
"use client";

import { ReactNode } from "react";
import { DashboardLayoutProps } from "@/utils/types/interfaces";
import Providers from "@/hooks/provider";

const DashboardLayout = ({
  admin,
  user,
  userRole, // Recibe el rol como prop
}: DashboardLayoutProps & { userRole: string }) => {
  const roleContent: Record<string, ReactNode> = {
    admin: admin,
    user: user,
  };

  return (
    <>
      {userRole && roleContent[userRole] ? (
        <Providers>{roleContent[userRole]}</Providers>
      ) : (
        <>Acceso no autorizado</>
      )}
    </>
  );
};

export default DashboardLayout;