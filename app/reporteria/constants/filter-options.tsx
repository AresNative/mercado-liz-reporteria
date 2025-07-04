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
  // Crear mapa de valores existentes para búsqueda rápida
  const existingValues = new Set(fieldOptions.map(opt => opt.value));
  const colsSet = new Set(cols);

  // Separar opciones existentes
  const inCols: FieldOption[] = [];
  const notInCols: FieldOption[] = [];

  // Mapa para acceso rápido a las opciones
  const optionsMap = new Map<string, FieldOption>();
  fieldOptions.forEach(opt => optionsMap.set(opt.value, opt));

  // Recorrer cols para obtener opciones existentes en orden
  cols.forEach(col => {
    if (optionsMap.has(col)) {
      inCols.push(optionsMap.get(col)!);
    }
  });

  // Obtener opciones que no están en cols
  fieldOptions.forEach(opt => {
    if (!colsSet.has(opt.value)) {
      notInCols.push(opt);
    }
  });

  // Crear opciones para campos no definidos
  const otherOptions: FieldOption[] = cols
    .filter(col => !existingValues.has(col))
    .map(col => ({
      value: col,
      label: col,
      icon: <HelpCircle className="inline mr-2" />,
      category: "Otros"
    }));

  // Combinar todas las opciones ordenadas
  const orderedOptions = [...inCols, ...notInCols];
  const grouped: GroupedFieldOption[] = [
    {
      label: "Datos de producto",
      options: orderedOptions.filter(o => o.category === "Datos de producto"),
    },
    {
      label: "Operaciones",
      options: orderedOptions.filter(o => o.category === "Operaciones"),
    },
    {
      label: "Contable",
      options: orderedOptions.filter(o => o.category === "Contable"),
    },
  ];
  // Añadir sección "Otros" si hay campos no definidos
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
