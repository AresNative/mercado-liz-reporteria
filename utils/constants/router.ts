import {
  House,
  Package,
  Tag,
  ClipboardList,
  List,
  Briefcase,
  Truck,
  UserPlus,
  Star,
  ScanBarcode,
  BookUser,
  Clock,
  TicketPercent,
  LayoutList,
  ShieldUser,
} from "lucide-react";
import React from "react";

const Pages = {
  Layout: () => import("@/app/model/layout"),
  // ... otros componentes
};

export const navigationDefault = [
  {
    name: "Pantalla Inicial",
    href: "/layout",
    icon: House,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Historia",
    href: "/Historia",
    icon: Clock,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Promociones",
    href: "/promociones",
    icon: TicketPercent,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Promociones",
    href: "/promociones/:id" /* los que no cuenten con icono no aparecen en el menu */,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Vacantes",
    href: "/vacantes",
    icon: BookUser,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Postulaciones",
    href: "/postulaciones",
    icon: Briefcase,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Valoracion",
    href: "/valoracion",
    icon: Star,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Verificador",
    href: "/verificador",
    icon: ScanBarcode,
    page: React.lazy(Pages.Layout),
  },
];

export const navigationUser = [
  {
    name: "Pantalla Inicial",
    href: "/layout",
    icon: House,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Verificador",
    href: "/verificador",
    icon: ScanBarcode,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Listas",
    href: "/listas",
    icon: LayoutList,
    page: React.lazy(Pages.Layout),
  },
];

export const navigationAdmin = [
  {
    name: "Pantalla Inicial",
    href: "/layout",
    icon: House,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Combos",
    href: "/combos",
    icon: Package,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Listas",
    href: "/listas",
    icon: List,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Etiquetas",
    href: "/etiquetas",
    icon: Tag,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Valoracion",
    href: "/valoracion",
    icon: Star,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Vacantes",
    href: "/vacantes",
    icon: UserPlus,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Postulaciones",
    href: "/postulaciones",
    icon: Briefcase,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Promociones",
    href: "/promociones",
    icon: TicketPercent,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Promociones",
    href: "/promociones/:id" /* los que no cuenten con icono no aparecen en el menu */,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Proveedores",
    href: "/proveedores",
    icon: Truck,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Verificador",
    href: "/verificador",
    icon: ScanBarcode,
    page: React.lazy(Pages.Layout),
  },
  {
    name: "Files Test",
    href: "/files-test",
    icon: ShieldUser,
    page: React.lazy(Pages.Layout),
  },
];
