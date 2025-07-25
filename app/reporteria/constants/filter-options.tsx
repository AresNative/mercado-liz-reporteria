import {
  FolderPen,
  BookCopy,
  Layers2,
  BookUser,
  ChevronsLeftRightEllipsis,
  SendToBack,
  User,
  Type,
  MapPin,
  Hash,
  Repeat2,
  ArrowLeftRight,
  Banknote,
  Bitcoin,
  Tally5,
  Key,
  DollarSign,
  HelpCircle,
} from "lucide-react";
import React from "react";
export interface FieldOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  category: string;
}

export interface GroupedFieldOption {
  label: string;
  options: FieldOption[];
}
export const fieldOptions = [
  {
    value: "Nombre",
    label: "Nombre",
    icon: <FolderPen className="inline mr-2" />,
    category: "Datos de producto",
  },
  {
    value: "Articulo",
    label: "Articulo",
    icon: <Key className="inline mr-2" />,
    category: "Datos de producto",
  },
  {
    value: "Sucursal",
    label: "Sucursal",
    icon: <Key className="inline mr-2" />,
    category: "Datos de producto",
  },
  {
    value: "Categoria",
    label: "Categoria",
    icon: <BookCopy className="inline mr-2" />,
    category: "Datos de producto",
  },
  {
    value: "Grupo",
    label: "Grupo",
    icon: <Layers2 className="inline mr-2" />,
    category: "Datos de producto",
  },
  {
    value: "Familia",
    label: "Familia",
    icon: <BookUser className="inline mr-2" />,
    category: "Datos de producto",
  },
  {
    value: "Linea",
    label: "Linea",
    icon: <ChevronsLeftRightEllipsis className="inline mr-2" />,
    category: "Datos de producto",
  },

  {
    value: "Movimiento",
    label: "Movimiento",
    icon: <SendToBack className="inline mr-2" />,
    category: "Operaciones",
  },
  {
    value: "Cliente",
    label: "Cliente",
    icon: <User className="inline mr-2" />,
    category: "Operaciones",
  },
  {
    value: "Tipo",
    label: "Tipo",
    icon: <Type className="inline mr-2" />,
    category: "Operaciones",
  },
  {
    value: "Almacen",
    label: "Almacen",
    icon: <MapPin className="inline mr-2" />,
    category: "Operaciones",
  },

  {
    value: "Unidad",
    label: "Unidad",
    icon: <Hash className="inline mr-2" />,
    category: "Contable",
  },
  {
    value: "Factor",
    label: "Factor",
    icon: <Repeat2 className="inline mr-2" />,
    category: "Contable",
  },
  {
    value: "Equivalencia",
    label: "Equivalencia",
    icon: <ArrowLeftRight className="inline mr-2" />,
    category: "Contable",
  },
  {
    value: "CostoUnitario",
    label: "Costo unitario",
    icon: <Banknote className="inline mr-2" />,
    category: "Contable",
  },
  {
    value: "CostoTotal",
    label: "Costo total",
    icon: <Bitcoin className="inline mr-2" />,
    category: "Contable",
  },
  {
    value: "ImporteUnitario",
    label: "Importe unitario",
    icon: <Banknote className="inline mr-2" />,
    category: "Contable",
  },
  {
    value: "ImporteTotal",
    label: "Importe total",
    icon: <DollarSign className="inline mr-2" />,
    category: "Contable",
  },
  {
    value: "Cantidad",
    label: "Cantidad",
    icon: <Tally5 className="inline mr-2" />,
    category: "Contable",
  },
];

export const getGroupedFieldOptions = (cols: string[]): GroupedFieldOption[] => {
  new Set(cols);
  const existingValues = new Set(fieldOptions.map(opt => opt.value));
  const optionsMap = new Map(fieldOptions.map(opt => [opt.value, opt]));

  // Filtrar SOLO las opciones que existen en cols
  const inCols: FieldOption[] = [];
  cols.forEach(col => {
    if (optionsMap.has(col)) {
      inCols.push(optionsMap.get(col)!);
    }
  });

  // Crear opciones para campos no definidos
  const otherOptions = cols
    .filter(col => !existingValues.has(col))
    .map(col => ({
      value: col,
      label: col,
      icon: <HelpCircle className="inline mr-2" />,
      category: "Otros"
    }));

  // Agrupar por categoría (solo con opciones presentes en cols)
  const grouped: GroupedFieldOption[] = [
    {
      label: "Datos de producto",
      options: inCols.filter(o => o.category === "Datos de producto"),
    },
    {
      label: "Operaciones",
      options: inCols.filter(o => o.category === "Operaciones"),
    },
    {
      label: "Contable",
      options: inCols.filter(o => o.category === "Contable"),
    },
  ].filter(group => group.options.length > 0);  // Eliminar categorías vacías

  // Añadir "Otros" solo si hay opciones
  if (otherOptions.length > 0) {
    grouped.push({
      label: "Otros",
      options: otherOptions
    });
  }

  return grouped;
};

export const datePresets = [
  { value: "today", label: "Hoy" },
  { value: "yesterday", label: "Ayer" },
  { value: "last7days", label: "Últimos 7 días" },
  { value: "last30days", label: "Últimos 30 días" },
  { value: "thisMonth", label: "Este mes" },
  { value: "lastMonth", label: "Mes pasado" },
  { value: "thisYear", label: "Este año" },
  { value: "lastYear", label: "Año pasado" },
];
