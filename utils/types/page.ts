export interface PageProps {
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  mobileScreen?: boolean;
  onClick?: () => void;
  onScroll?: (isScrolled: boolean) => void;
}
export interface Producto {
  id: string;
  articulo?: string;
  image?: string;
  nombre: string;
  descuento?: number;
  categoria: string;
  codigo: string;
  unidad: string;
  precio: number;
  cantidad: number;
  impuesto1?: number;
  impuesto2?: number;
  tipoImpuesto1?: number;
  tipoImpuesto2?: number;
  precioRegular?: number;
  factor?: number;
  oferta?: {
    precio: number;
    fechaHasta: string;
  };
}
