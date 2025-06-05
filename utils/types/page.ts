export interface PageProps {
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onScroll?: (isScrolled: boolean) => void;
}
export interface Product {
  id: string;
  image?: string;
  nombre: string;
  descuento?: number;
  categoria: string;
  unidad: string;
  precio: number;
  precioRegular?: number;
  factor?: number;
}
