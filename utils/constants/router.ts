import {
  House,
  Clock,
  ClipboardList,
  ChartArea,
  Banknote,
  ListCheck,
  Receipt,
  Truck,
  Info,
} from "lucide-react";

export const navigationDefault = [
  {
    name: "Pantalla Inicial",
    href: "/",
    icon: House,
  },
  {
    name: "Historia",
    href: "/Historia",
    icon: Clock,
  },
  {
    name: "Informacion",
    href: "/informacion",
    icon: Info,
  },
];
export const navigationUser = [
  {
    name: "Pantalla Inicial",
    href: "/",
    icon: House,
  },
  {
    name: "Proyectos",
    href: "/proyectos",
    icon: ClipboardList,
  },
];
export const navigationVentas = [
  {
    name: "Pantalla Inicial",
    href: "/",
    icon: House,
  },
  {
    name: "Reporteria",
    href: "/reporteria",
    icon: ChartArea,
  },
  {
    name: "Pick Up",
    href: "/pick-up",
    icon: Truck,
  },
  {
    name: "Proyectos",
    href: "/proyectos",
    icon: ClipboardList,
  },
];
export const navigationAlmacen = [
  {
    name: "Pantalla Inicial",
    href: "/",
    icon: House,
  },
  {
    name: "Reporteria",
    href: "/reporteria",
    icon: ChartArea,
  },
  {
    name: "Proyectos",
    href: "/proyectos",
    icon: ClipboardList,
  },
];

export const navigationAdmin = [
  {
    name: "Pantalla Inicial",
    href: "/",
    icon: House,
  },
  {
    name: "Reporteria",
    href: "/reporteria",
    icon: ChartArea,
  },
  {
    name: "Proyectos",
    href: "/proyectos",
    icon: ClipboardList,
  },
  {
    name: "Subastas",
    href: "/subastas",
    icon: Banknote,
  },
  {
    name: "Listas",
    href: "/listas",
    icon: ListCheck,
  },
  {
    name: "Contaduria",
    href: "/contaduria",
    icon: Receipt,
  },
];
