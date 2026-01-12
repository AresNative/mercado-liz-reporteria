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
  oferta?: {
    precio: number;
    fechaHasta: string;
  };
}
