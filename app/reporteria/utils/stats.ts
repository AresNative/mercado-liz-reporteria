import { formatValue } from "@/utils/constants/format-values";
import {
  AlertCircle,
  Calculator,
  DollarSign,
  GitCompare,
  Package,
  Percent,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";

export const BENTO_METRICS_CONFIG: Record<string, any[]> = {
  ventas: [
    {
      title: "Ventas",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: DollarSign,
      description: "Total en ventas",
      styles: {
        icon: "text-green-600 dark:text-green-400",
      },
    },
    {
      title: "Costos",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: Calculator,
      description: "Total de costos",
      styles: {
        icon: "text-red-600 dark:text-red-400",
      },
    },
    {
      title: "Margen",
      raw: 0,
      display: formatValue(0, "percentage"),
      type: "percent",
      icon: Percent,
      description: "Margen de utilidad",
      styles: {
        icon: "text-blue-600 dark:text-blue-400",
      },
    },
    {
      title: "Utilidad",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: TrendingUp,
      description: "Utilidad neta",
      styles: {
        icon: "text-purple-600 dark:text-purple-400",
      },
    },
    {
      title: "Artículos",
      raw: 0,
      display: formatValue(0, "number"),
      type: "number",
      icon: Package,
      description: "Artículos vendidos",
      styles: {
        icon: "text-orange-600 dark:text-orange-400",
      },
    },
    {
      title: "Tikets",
      raw: 0,
      display: formatValue(0, "number"),
      type: "number",
      icon: Package,
      description: "tikets vendidos",
      styles: {
        icon: "text-teal-600 dark:text-teal-400",
      },
    },
    {
      title: "Promedio",
      raw: 0,
      display: formatValue(0, "number"),
      type: "number",
      icon: Package,
      description: "promedio venta por tiket",
      styles: {
        icon: "text-indigo-600 dark:text-indigo-400",
      },
    },
  ],
  compras: [
    {
      title: "Costo Total",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: Calculator,
      description: "Total de compras",
      styles: {
        icon: "text-red-600 dark:text-red-400",
      },
    },
    {
      title: "Artículos",
      raw: 0,
      display: formatValue(0, "number"),
      type: "number",
      icon: Package,
      description: "Artículos comprados",
      styles: {
        icon: "text-orange-600 dark:text-orange-400",
      },
    },
    {
      title: "Proveedores",
      raw: 0,
      display: formatValue(0, "number"),
      type: "number",
      icon: Users,
      description: "Proveedores distintos",
      styles: {
        icon: "text-purple-600 dark:text-purple-400",
      },
    },
    {
      title: "Costo Mínimo",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: Calculator,
      description: "Costo mínimo de artículos",
      styles: {
        icon: "text-green-600 dark:text-green-400",
      },
    },
    {
      title: "Costo Máximo",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: Calculator,
      description: "Costo máximo de artículos",
      styles: {
        icon: "text-yellow-600 dark:text-yellow-400",
      },
    },
  ],
  mermas: [
    {
      title: "Costo Merma",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: AlertCircle,
      description: "Costo por mermas",
      styles: {
        icon: "text-red-600 dark:text-red-400",
      },
    },
    {
      title: "Artículos",
      raw: 0,
      display: formatValue(0, "number"),
      type: "number",
      icon: Package,
      description: "Artículos con merma",
      styles: {
        icon: "text-orange-600 dark:text-orange-400",
      },
    },
  ],
  inventario: [
    {
      title: "Costo Total",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: Warehouse,
      description: "Valor del inventario",
      styles: {
        icon: "text-blue-600 dark:text-blue-400",
      },
    },
    {
      title: "Artículos",
      raw: 0,
      display: formatValue(0, "number"),
      type: "number",
      icon: Package,
      description: "Artículos en inventario",
      styles: {
        icon: "text-green-600 dark:text-green-400",
      },
    },
  ],
  comparacion: [
    {
      title: "Ventas",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: DollarSign,
      description: "Total de ventas",
      styles: {
        icon: "text-green-600 dark:text-green-400",
      },
    },
    {
      title: "Compras",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: ShoppingCart,
      description: "Total de compras",
      styles: {
        icon: "text-red-600 dark:text-red-400",
      },
    },
    {
      title: "Diferencia",
      raw: 0,
      display: formatValue(0, "currency"),
      type: "currency",
      icon: GitCompare,
      description: "Diferencia venta-compra",
      styles: {
        icon: "text-purple-600 dark:text-purple-400",
      },
    },
    {
      title: "Margen",
      raw: 0,
      display: formatValue(0, "percentage"),
      type: "percent",
      icon: Percent,
      description: "Margen comparativo",
      styles: {
        icon: "text-blue-600 dark:text-blue-400",
      },
    },
    {
      title: "Artículos",
      raw: 0,
      display: formatValue(0, "number"),
      type: "number",
      icon: Package,
      description: "Artículos comparados",
      styles: {
        icon: "text-orange-600 dark:text-orange-400",
      },
    },
  ],
};
