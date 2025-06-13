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
} from "lucide-react";

export const fieldOptions = [
  {
    value: "Nombre",
    label: "Nombre",
    icon: <FolderPen className="inline mr-2" />,
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
    category: "Cotable",
  },
  {
    value: "Factor",
    label: "Factor",
    icon: <Repeat2 className="inline mr-2" />,
    category: "Cotable",
  },
  {
    value: "Equivalencia",
    label: "Equivalencia",
    icon: <ArrowLeftRight className="inline mr-2" />,
    category: "Cotable",
  },
  {
    value: "CostoUnitario",
    label: "Costo unitario",
    icon: <Banknote className="inline mr-2" />,
    category: "Cotable",
  },
  {
    value: "CostoTotal",
    label: "Costo total",
    icon: <Bitcoin className="inline mr-2" />,
    category: "Cotable",
  },
  {
    value: "ImporteUnitario",
    label: "Importe unitario",
    icon: <Banknote className="inline mr-2" />,
    category: "Cotable",
  },
  {
    value: "ImporteTotal",
    label: "Importe total",
    icon: <Bitcoin className="inline mr-2" />,
    category: "Cotable",
  },
  {
    value: "Cantidad",
    label: "Cantidad",
    icon: <Tally5 className="inline mr-2" />,
    category: "Cotable",
  },
];

export const groupedFieldOptions = [
  {
    label: "Datos de producto",
    options: fieldOptions.filter((o) => o.category === "Datos de producto"),
  },
  {
    label: "Operaciones",
    options: fieldOptions.filter((o) => o.category === "Operaciones"),
  },
  {
    label: "Cotable",
    options: fieldOptions.filter((o) => o.category === "Cotable"),
  },
];

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
