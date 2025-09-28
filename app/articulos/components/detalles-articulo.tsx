// app/articulos/components/detalles-articulo.tsx
"use client";

import {
    Package, Mail, DollarSign, Hash,
    Calendar, BarChart, Tag, Building,
    Download, X, ImageIcon
} from "lucide-react";
import { useAppSelector } from "@/hooks/selector";
import { closeModalReducer } from "@/hooks/reducers/drop-down";
import { useAppDispatch } from "@/hooks/selector";
import { useEffect, useState } from "react";
import { useGetWithFiltersGeneralMutation } from "@/hooks/reducers/api";

interface Articulo {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    categoria: string;
    precio_compra: number;
    precio_venta: number;
    stock: number;
    stock_minimo: number;
    unidad_medida: string;
    marca: string;
    modelo: string;
    estado: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

interface Imagen {
    id: number;
    id_ref: number;
    tabla: string;
    url: string;
    descripcion: string;
}

export const ModalDetallesArticulo = ({ selectedArticulo }: any) => {
    console.log(selectedArticulo);

    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state: any) => state.dropDownReducer.modals['detalles-articulo']);
    const [imagenes, setImagenes] = useState<Imagen[]>([]);
    const [getWithFilter] = useGetWithFiltersGeneralMutation();

    const handleClose = () => {
        dispatch(closeModalReducer({ modalName: 'detalles-articulo' }));
    };

    useEffect(() => {
        if (isOpen && selectedArticulo) {
            cargarImagenes();
        }
    }, [isOpen, selectedArticulo]);

    const cargarImagenes = async () => {
        try {
            const response = await getWithFilter({
                url: `api/v1/recursos/imagenes/articulos/${selectedArticulo.id}`
            });

            if ('data' in response) {
                setImagenes(response.data as Imagen[]);
            }
        } catch (error) {
            console.error('Error cargando imágenes:', error);
        }
    };

    if (!isOpen || !selectedArticulo) return null;

    const articulo: Articulo = selectedArticulo;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const getStatusColor = (estado: string) => {
        return estado === "Activo"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
    };

    const getStockStatus = (stock: number, stockMinimo: number) => {
        if (stock === 0) return "bg-red-100 text-red-800";
        if (stock <= stockMinimo) return "bg-yellow-100 text-yellow-800";
        return "bg-green-100 text-green-800";
    };

    const InfoItem = ({ icon: Icon, label, value, className = "" }: {
        icon: any;
        label: string;
        value: string | number | null;
        className?: string;
    }) => (
        <div className={`flex items-start space-x-3 ${className}`}>
            <Icon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-sm text-gray-900 mt-1 break-words">
                    {value || "No especificado"}
                </p>
            </div>
        </div>
    );

    const SectionTitle = ({ title }: { title: string }) => (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            {title}
        </h3>
    );

    return (
        <div className="p-4 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900">
                            {articulo.nombre}
                        </h2>
                        <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(articulo.estado)}`}>
                                {articulo.estado}
                            </span>
                            <span className="text-sm text-gray-500">{articulo.codigo}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatus(articulo.stock, articulo.stock_minimo)}`}>
                                Stock: {articulo.stock}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Imágenes del artículo */}
            {imagenes.length > 0 && (
                <div className="mb-6">
                    <SectionTitle title="Imágenes del Producto" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imagenes.map((imagen) => (
                            <div key={imagen.id} className="relative group">
                                <img
                                    src={imagen.url}
                                    alt={imagen.descripcion}
                                    className="w-full h-24 object-cover rounded-lg border"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                                    <button className="opacity-0 group-hover:opacity-100 text-white p-1">
                                        <ImageIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Básica */}
                <div className="space-y-4">
                    <SectionTitle title="Información Básica" />

                    <InfoItem
                        icon={Hash}
                        label="Código"
                        value={articulo.codigo}
                    />

                    <InfoItem
                        icon={Tag}
                        label="Categoría"
                        value={articulo.categoria}
                    />

                    <InfoItem
                        icon={Building}
                        label="Marca"
                        value={articulo.marca}
                    />

                    <InfoItem
                        icon={Tag}
                        label="Modelo"
                        value={articulo.modelo}
                    />

                    <InfoItem
                        icon={BarChart}
                        label="Unidad de Medida"
                        value={articulo.unidad_medida}
                    />
                </div>

                {/* Precios y Stock */}
                <div className="space-y-4">
                    <SectionTitle title="Precios y Stock" />

                    <InfoItem
                        icon={DollarSign}
                        label="Precio de Compra"
                        value={formatCurrency(articulo.precio_compra)}
                    />

                    <InfoItem
                        icon={DollarSign}
                        label="Precio de Venta"
                        value={formatCurrency(articulo.precio_venta)}
                    />

                    <InfoItem
                        icon={Package}
                        label="Stock Actual"
                        value={articulo.stock}
                    />

                    <InfoItem
                        icon={Package}
                        label="Stock Mínimo"
                        value={articulo.stock_minimo}
                    />

                    <InfoItem
                        icon={DollarSign}
                        label="Margen de Ganancia"
                        value={formatCurrency(articulo.precio_venta - articulo.precio_compra)}
                    />
                </div>
            </div>

            {/* Descripción */}
            {articulo.descripcion && (
                <div className="mt-6">
                    <SectionTitle title="Descripción" />
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">{articulo.descripcion}</p>
                    </div>
                </div>
            )}

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <InfoItem
                    icon={Calendar}
                    label="Fecha de Creación"
                    value={formatDate(articulo.fecha_creacion)}
                />

                <InfoItem
                    icon={Calendar}
                    label="Última Actualización"
                    value={formatDate(articulo.fecha_actualizacion)}
                />
            </div>

            {/* Acciones */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};