import {
  House,
  ClipboardList,
  ChartArea,
  Receipt,
  Truck,
  Info,
  ChartColumnStacked,
  Clock10,
  UsersRound,
  ShoppingBasket,
  UserRoundPlus,
  Vault,
  AlertCircle,
} from "lucide-react";

export const navigationDefault = [
  {
    name: "Pantalla Inicial",
    href: "/",
    icon: House,
  },
  {
    name: "Registrar",
    href: "/register",
    icon: UserRoundPlus,
  },
  {
    name: "Informacion",
    href: "/informacion",
    icon: Info,
  },
];
export const navigationUser = [
  {
    name: "Proyectos",
    href: "/proyectos",
    icon: ClipboardList,
  },
];
export const navigationVentas = [
  {
    name: "Reporteria",
    href: "/reporteria",
    icon: ChartArea,
  },
  {
    name: "Subastas",
    href: "/subastas",
    icon: ChartColumnStacked,
  },
  {
    name: "Pick Up",
    href: "/pick-up",
    icon: Truck,
  },
  {
    name: "Articulos",
    href: "/articulos",
    icon: ShoppingBasket,
  },
  {
    name: "Compras",
    href: "/compras",
    icon: ShoppingBasket,
  },
  {
    name: "Proyectos",
    href: "/proyectos",
    icon: ClipboardList,
  },
];
export const navigationAlmacen = [
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
export const navigationRh = [
  {
    name: "Reporteria",
    href: "/reporteria",
    icon: ChartArea,
  },
  {
    name: "Nominas",
    href: "/nominas",
    icon: Clock10,
  },
  {
    name: "Empleados",
    href: "/empleados",
    icon: UsersRound,
  },
  {
    name: "Proyectos",
    href: "/proyectos",
    icon: ClipboardList,
  },
];
export const navigationAdmin = [
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
    name: "Compras",
    href: "/compras",
    icon: ShoppingBasket,
  },
  {
    name: "Empleados",
    href: "/empleados",
    icon: UsersRound,
  },
  {
    name: "Articulos",
    href: "/articulos",
    icon: ShoppingBasket,
  },
  {
    name: "Pick Up",
    href: "/pick-up",
    icon: Truck,
  },
  {
    name: "Boveda Movimientos",
    href: "/boveda-movimientos",
    icon: Vault,
  },
  {
    name: "Errores intelisis",
    href: "/error",
    icon: AlertCircle,
  },
  {
    name: "Update",
    href: "/update",
    icon: Info,
  },
];
