"use client"

import { useState, useEffect, useCallback } from 'react';
import {
    Package,
    Search,
    Filter,
    Plus,
    Upload,
    Download,
    RefreshCw,
    Edit,
    Trash2,
    Image as ImageIcon,
    BarChart3,
    Layers,
    Settings,
    Save,
    X
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import {
    useGetWithFiltersGeneralMutation,
    usePutGeneralMutation,
    usePostGeneralMutation,
    usePostImgMutation,
    useDeleteGeneralMutation
} from "@/hooks/reducers/api";
import { LoadingSection } from "@/template/loading-screen";
import { Modal } from "@/components/modal";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Pagination from "@/components/pagination";
import { Field } from '@/utils/types/interfaces';
import MainForm from '@/components/form/main-form';
import { EnvConfig } from '@/utils/constants/env.config';

// Interfaces basadas en la respuesta de la API
interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    costo: number | null;
    cantidad: number | null;
    unidad_nombre: string | null;
    categoria_nombre: string | null;
    codigo_barras: string | null;
    imagenes?: string[];
    url?: string | null;
}

interface ApiResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: Producto[];
}

interface EstadisticasProductos {
    total_productos: number;
    productos_sin_stock: number;
    productos_bajo_stock: number;
    valor_total_inventario: number;
    productos_sin_imagen: number;
}

interface Filtro {
    Key: string;
    Value: any;
    Operator: string;
}

interface ActiveFilters {
    Filtros: Filtro[];
    Selects: any[];
    OrderBy: any | null;
    sum: boolean;
    distinct: boolean;
}

// Props para componentes hijos
interface VistaProductosProps {
    productos: Producto[];
    isLoading: boolean;
    onViewDetails: (producto: Producto) => void;
    onEdit: (producto: Producto) => void;
    onDelete: (id: number) => void;
    onGestionStock: (producto: Producto) => void;
    onCrearProducto: () => void;
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

interface VistaInventarioProps {
    productos: Producto[];
    isLoading: boolean;
}

interface VistaActualizacionMasivaProps {
    productos: Producto[];
    productosSeleccionados: number[];
    onToggleSeleccion: (id: number) => void;
    onSeleccionarTodos: () => void;
    onActualizacionMasiva: (data: any) => void;
    modoEdicionMasiva: boolean;
    setModoEdicionMasiva: (mode: boolean) => void;
}

interface VistaGestionImagenesProps {
    productos: Producto[];
    onSubirImagen: any;
}

interface ModalDetalleProductoProps {
    producto: Producto | null;
    onClose: () => void;
}

interface ModalGestionStockProps {
    producto: Producto | null;
    onClose: () => void;
    onSave: (id: number, cantidad: number) => void;
}

const { hubs: apiUrl } = EnvConfig();
// Componente ModalGestionStock
const ModalGestionStock = ({ producto, onClose, onSave }: ModalGestionStockProps) => {
    const [cantidad, setCantidad] = useState(producto?.cantidad || 0);

    if (!producto) return null;

    return (
        <Modal modalName="gestion_stock" title="Gestión de Stock" maxWidth="md">
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">{producto.nombre}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cantidad Actual: {producto.cantidad || 0} {producto.unidad_nombre || 'unidades'}
                        </label>
                        <input
                            type="number"
                            value={cantidad}
                            onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            min="0"
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                onSave(producto.id, cantidad);
                                onClose();
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Guardar Stock
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

// Componente ModalDetalleProducto - CORREGIDO
const ModalDetalleProducto = ({ producto, onClose }: ModalDetalleProductoProps) => {
    // Función para obtener las imágenes del producto
    const obtenerImagenes = (producto: Producto) => {
        if (producto.imagenes && producto.imagenes.length > 0) {
            return producto.imagenes;
        }
        if (producto.url) {
            return [producto.url];
        }
        return [];
    };

    if (!producto) return null;

    const imagenes = obtenerImagenes(producto);

    return (
        <Modal modalName="detalle_producto" title="Detalle del Producto" maxWidth="lg">
            <div className="p-6">
                <h2 className="text-xl font-bold mb-4">{producto.nombre}</h2>

                {/* Imagen principal si existe */}
                {imagenes.length > 0 && (
                    <div className="mb-6">
                        <img
                            src={apiUrl.slice(0, -1) + imagenes[0]}
                            alt={producto.nombre}
                            className="w-full max-w-md h-64 object-cover rounded-lg border mx-auto"
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Descripción</label>
                        <p className="text-gray-900">{producto.descripcion || 'Sin descripción'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Categoría</label>
                        <p className="text-gray-900">{producto.categoria_nombre || 'Sin categoría'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Precio</label>
                        <p className="text-gray-900">${producto.precio.toFixed(2)}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Costo</label>
                        <p className="text-gray-900">${producto.costo?.toFixed(2) || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Stock</label>
                        <p className="text-gray-900">{producto.cantidad || 0} {producto.unidad_nombre || 'unidades'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Código Barras</label>
                        <p className="text-gray-900">{producto.codigo_barras || 'N/A'}</p>
                    </div>
                </div>

                {/* Sección de imágenes adicionales */}
                {imagenes.length > 1 && (
                    <div className="mt-6">
                        <label className="text-sm font-medium text-gray-500">Imágenes Adicionales</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {imagenes.slice(1).map((img, index) => (
                                <img
                                    key={index}
                                    src={apiUrl.slice(0, -1) + img}
                                    alt={`Imagen ${index + 2} de ${producto.nombre}`}
                                    className="w-full h-24 object-cover rounded border"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

// Componente VistaProductos - CORREGIDO
const VistaProductos = ({
    productos,
    isLoading,
    onViewDetails,
    onEdit,
    onDelete,
    onGestionStock,
    onCrearProducto,
    currentPage,
    totalPages,
    setCurrentPage
}: VistaProductosProps) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Lista de Productos</h2>
                <button
                    onClick={onCrearProducto}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Producto
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
            {isLoading ? (
                <LoadingSection message="Cargando productos..." />
            ) : productos.length > 0 ? (
                <>
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Categoría
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Precio
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Costo
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {productos.map((producto) => (
                                <tr key={producto.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            {/* Miniaturas de imágenes */}
                                            <div className="flex-shrink-0">
                                                {producto.url || (producto.imagenes && producto.imagenes.length > 0) ? (
                                                    <img
                                                        src={apiUrl.slice(0, -1) + producto.url || apiUrl.slice(0, -1) + producto.imagenes![0]}
                                                        alt={producto.nombre}
                                                        className="w-10 h-10 object-cover rounded border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-200 rounded border border-gray-200 flex items-center justify-center">
                                                        <ImageIcon className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{producto.nombre}</div>
                                                <div className="text-sm text-gray-500">{producto.descripcion || 'Sin descripción'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        {producto.categoria_nombre || 'Sin categoría'}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        ${producto.precio.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        ${producto.costo?.toFixed(2) || 'N/A'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${!producto.cantidad || producto.cantidad === 0
                                            ? 'bg-red-100 text-red-800'
                                            : producto.cantidad <= 10
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-green-100 text-green-800'
                                            }`}>
                                            {producto.cantidad || 0} {producto.unidad_nombre || 'unidades'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onViewDetails(producto)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                title="Ver detalles"
                                            >
                                                Ver
                                            </button>
                                            <button
                                                onClick={() => onEdit(producto)}
                                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                                title="Editar"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => onGestionStock(producto)}
                                                className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                                                title="Gestionar Stock"
                                            >
                                                <Package className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(producto.id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-4 border-t border-gray-200">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            loading={isLoading}
                            setCurrentPage={setCurrentPage}
                        />
                    </div>
                </>
            ) : (
                <div className="p-8 text-center">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron productos.</p>
                </div>
            )}
        </div>
    </div>
);

// Componente VistaInventario
const VistaInventario = ({ productos, isLoading }: VistaInventarioProps) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Control de Inventario</h2>
        </div>
        <div className="overflow-x-auto">
            {isLoading ? (
                <LoadingSection message="Cargando inventario..." />
            ) : (
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Producto
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock Actual
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock Mínimo
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Valor en Inventario
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {productos.map((producto) => {
                            const cantidad = producto.cantidad || 0;
                            const costo = producto.costo || 0;
                            const valorInventario = cantidad * costo;

                            return (
                                <tr key={producto.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <div className="font-medium text-gray-900">{producto.nombre}</div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        {cantidad} {producto.unidad_nombre || 'unidades'}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        10
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cantidad === 0
                                            ? 'bg-red-100 text-red-800'
                                            : cantidad <= 10
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-green-100 text-green-800'
                                            }`}>
                                            {cantidad === 0 ? 'Agotado' :
                                                cantidad <= 10 ? 'Bajo Stock' : 'Disponible'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        ${valorInventario.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    </div>
);

// Componente VistaActualizacionMasiva
const VistaActualizacionMasiva = ({
    productos,
    productosSeleccionados,
    onToggleSeleccion,
    onSeleccionarTodos,
    onActualizacionMasiva,
    modoEdicionMasiva,
    setModoEdicionMasiva
}: VistaActualizacionMasivaProps) => {
    const formActualizacionMasiva: Field[] = [
        { type: "H1", label: "Actualización Masiva", require: false },
        {
            type: "NUMBER",
            name: "precio",
            label: "Nuevo Precio",
            placeholder: "Dejar vacío para no modificar",
            require: false
        },
        {
            type: "NUMBER",
            name: "costo",
            label: "Nuevo Costo",
            placeholder: "Dejar vacío para no modificar",
            require: false
        },
        {
            type: "TEXT_AREA",
            name: "descripcion",
            label: "Nueva Descripción",
            placeholder: "Dejar vacío para no modificar",
            require: false
        }
    ];

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Actualización Masiva</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                            {productosSeleccionados.length} productos seleccionados
                        </span>
                        {modoEdicionMasiva ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setModoEdicionMasiva(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <X className="h-4 w-4" />
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setModoEdicionMasiva(true)}
                                disabled={productosSeleccionados.length === 0}
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <Settings className="h-4 w-4" />
                                Editar Seleccionados
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {modoEdicionMasiva && (
                <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                    <MainForm
                        message_button={`Aplicar a ${productosSeleccionados.length} productos`}
                        actionType="put"
                        dataForm={formActualizacionMasiva}
                        onSuccess={(result: any, formData: any) => {
                            onActualizacionMasiva(formData);
                        }}
                        iconButton={<Save className="size-4" />}
                    />
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                    type="checkbox"
                                    checked={productosSeleccionados.length === productos.length && productos.length > 0}
                                    onChange={onSeleccionarTodos}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Producto
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Precio Actual
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {productos.map((producto) => (
                            <tr key={producto.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4">
                                    <input
                                        type="checkbox"
                                        checked={productosSeleccionados.includes(producto.id)}
                                        onChange={() => onToggleSeleccion(producto.id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="font-medium text-gray-900">{producto.nombre}</div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">
                                    ${producto.precio.toFixed(2)}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">
                                    {producto.cantidad || 0} {producto.unidad_nombre || 'unidades'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Componente VistaGestionImagenes - COMPLETAMENTE CORREGIDO
const VistaGestionImagenes = ({ productos, onSubirImagen }: VistaGestionImagenesProps) => {
    const [imagenesCargando, setImagenesCargando] = useState<{ [key: number]: boolean }>({});

    // Función para obtener las imágenes de cada producto
    const obtenerImagenesProducto = (producto: Producto): string[] => {
        if (producto.imagenes && producto.imagenes.length > 0) {
            return producto.imagenes;
        }
        if (producto.url) {
            return [producto.url];
        }
        return [];
    };

    const handleSubirImagenProducto = async (productoId: number, formData: any) => {
        setImagenesCargando(prev => ({ ...prev, [productoId]: true }));

        try {
            const fileData = new FormData();
            fileData.append('IdRef', productoId.toString());
            fileData.append('Tabla', 'articulos');
            fileData.append('Descripcion', `Imágenes para producto ${productoId}`);

            if (formData.file) {
                if (Array.isArray(formData.file)) {
                    formData.file.forEach((file: File) => {
                        fileData.append('File', file);
                    });
                } else {
                    fileData.append('File', formData.file);
                }
            }

            await onSubirImagen({
                idRef: productoId,
                tabla: 'articulos',
                descripcion: `Imágenes para producto ${productoId}`,
                file: fileData
            }).unwrap();

            alert('Imágenes subidas correctamente');
            // Recargar la página o actualizar los datos
            window.location.reload();
        } catch (error) {
            console.error("Error subiendo imágenes:", error);
            alert('Error al subir las imágenes');
        } finally {
            setImagenesCargando(prev => ({ ...prev, [productoId]: false }));
        }
    };

    const FormularioImagenesProducto = ({ productoId, productoNombre }: { productoId: number, productoNombre: string }) => {
        const formSubirImagen: Field[] = [
            {
                type: "FILE",
                name: "file",
                label: "Seleccionar imagen",
                multiple: false,
                require: true
            }
        ];

        return (
            <MainForm
                message_button={imagenesCargando[productoId] ? "Subiendo..." : "Subir Imagen"}
                actionType="post"
                aditionalData={{
                    idRef: productoId,
                    tabla: 'articulos',
                    descripcion: `Imágenes para producto ${productoId}`
                }}
                dataForm={formSubirImagen}
                onSuccess={(result: any, formData: any) => {
                    handleSubirImagenProducto(productoId, formData);
                }}
                iconButton={<Upload className="size-4" />}
            />
        );
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Gestión de Imágenes</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Sube imágenes para tus productos. Formatos soportados: JPG, PNG, GIF.
                </p>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {productos.map((producto) => {
                        const imagenes = obtenerImagenesProducto(producto);
                        const tieneImagenes = imagenes.length > 0;

                        return (
                            <div key={producto.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex flex-col mb-4">
                                    <div>
                                        <span className="font-medium text-gray-900">{producto.nombre}</span>
                                        <p className="text-sm text-gray-500">ID: {producto.id}</p>
                                    </div>
                                    <div className='flex justify-between items-center mt-2'>
                                        <p className="text-xs text-gray-400">{producto.categoria_nombre || 'Sin categoría'}</p>
                                        <p className={`text-xs px-2 py-1 w-fit rounded-full ${tieneImagenes
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {tieneImagenes
                                                ? `${imagenes.length} imagen(es)`
                                                : 'Sin imágenes'
                                            }
                                        </p>
                                    </div>
                                </div>

                                {/* Vista previa de imágenes existentes */}
                                {tieneImagenes && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Imagen actual:</h4>
                                        <div className="space-y-2">
                                            {imagenes.map((img, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={apiUrl.slice(0, -1) + img}
                                                        alt={`Imagen ${index + 1} de ${producto.nombre}`}
                                                        className="w-full h-32 object-cover rounded border border-gray-200"
                                                    />
                                                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                        {index + 1}/{imagenes.length}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {!tieneImagenes && (
                                    <div className="mb-4 p-4 bg-gray-50 rounded border border-dashed border-gray-300 text-center">
                                        <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No hay imágenes</p>
                                    </div>
                                )}

                                {/* Formulario de subida de imágenes */}
                                <FormularioImagenesProducto
                                    productoId={producto.id}
                                    productoNombre={producto.nombre}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Componente Estadisticas
const EstadisticasComponent = ({ stats }: { stats: EstadisticasProductos }) => (
    <BentoGrid cols={5} className="mb-6">
        <BentoItem
            title="Total Productos"
            description="En el sistema"
            className="bg-blue-50 border-blue-200"
            icon={<Package className="h-6 w-6 text-blue-600" />}
        >
            <div className="text-2xl font-bold text-blue-600">{stats.total_productos}</div>
        </BentoItem>

        <BentoItem
            title="Sin Stock"
            description="Agotados"
            className="bg-red-50 border-red-200"
            icon={<Package className="h-6 w-6 text-red-600" />}
        >
            <div className="text-2xl font-bold text-red-600">{stats.productos_sin_stock}</div>
        </BentoItem>

        <BentoItem
            title="Bajo Stock"
            description="≤ 10 unidades"
            className="bg-orange-50 border-orange-200"
            icon={<Package className="h-6 w-6 text-orange-600" />}
        >
            <div className="text-2xl font-bold text-orange-600">{stats.productos_bajo_stock}</div>
        </BentoItem>

        <BentoItem
            title="Valor Inventario"
            description="Costo total"
            className="bg-green-50 border-green-200"
            icon={<BarChart3 className="h-6 w-6 text-green-600" />}
        >
            <div className="text-2xl font-bold text-green-600">
                ${stats.valor_total_inventario.toLocaleString()}
            </div>
        </BentoItem>

        <BentoItem
            title="Sin Imagen"
            description="Por subir"
            className="bg-purple-50 border-purple-200"
            icon={<ImageIcon className="h-6 w-6 text-purple-600" />}
        >
            <div className="text-2xl font-bold text-purple-600">{stats.productos_sin_imagen}</div>
        </BentoItem>
    </BentoGrid>
);

// Componente NavegacionVistas
const NavegacionVistas = ({ vistaActiva, setVistaActiva }: { vistaActiva: string, setVistaActiva: (vista: any) => void }) => (
    <div className="flex border-b border-gray-200 mb-6">
        <button
            onClick={() => setVistaActiva('productos')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${vistaActiva === 'productos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
        >
            <Package className="w-4 h-4 inline mr-2" />
            Productos
        </button>
        <button
            onClick={() => setVistaActiva('inventario')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${vistaActiva === 'inventario'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
        >
            <Layers className="w-4 h-4 inline mr-2" />
            Inventario
        </button>
        <button
            onClick={() => setVistaActiva('actualizacion')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${vistaActiva === 'actualizacion'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
        >
            <Settings className="w-4 h-4 inline mr-2" />
            Actualización Masiva
        </button>
        <button
            onClick={() => setVistaActiva('imagenes')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${vistaActiva === 'imagenes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
        >
            <ImageIcon className="w-4 h-4 inline mr-2" />
            Gestión de Imágenes
        </button>
    </div>
);

// Componente principal
export default function AdministracionProductos() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
    const [productoParaStock, setProductoParaStock] = useState<Producto | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [vistaActiva, setVistaActiva] = useState<'productos' | 'inventario' | 'actualizacion' | 'imagenes'>('productos');
    const [productosSeleccionados, setProductosSeleccionados] = useState<number[]>([]);
    const [modoEdicionMasiva, setModoEdicionMasiva] = useState(false);

    const [getWithFilter] = useGetWithFiltersGeneralMutation();
    const [putGeneral] = usePutGeneralMutation();
    const [postGeneral] = usePostGeneralMutation();
    const [postImg] = usePostImgMutation();
    const [deleteGeneral] = useDeleteGeneralMutation();

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [],
        Selects: [],
        OrderBy: null,
        sum: false,
        distinct: false
    });

    const [estadisticas, setEstadisticas] = useState<EstadisticasProductos>({
        total_productos: 0,
        productos_sin_stock: 0,
        productos_bajo_stock: 0,
        valor_total_inventario: 0,
        productos_sin_imagen: 0
    });

    const { handleSubmit, register, reset } = useForm();
    const dispatch = useAppDispatch();

    // Función para obtener productos
    const fetchProductos = useCallback(async () => {
        setIsLoading(true);
        try {
            const filtros: any = {
                Selects: [
                    { key: "articulos.id" },
                    { key: "articulos.nombre" },
                    { key: "articulos.descripcion" },
                    { key: "articulos.precio" },
                    { key: "historia_costos.costo" },
                    { key: "inventario.cantidad" },
                    { key: "unidades.nombre", alias: "unidad_nombre" },
                    { key: "categorias.nombre", alias: "categoria_nombre" },
                    { key: "codigos_barras.codigo_barras" },
                    { key: "imagenes.url" }
                ],
                Order: [
                    { Key: "articulos.nombre", Direction: "Asc" }
                ]
            };

            if (activeFilters.Filtros.length > 0) {
                filtros.Filtros = activeFilters.Filtros;
            }

            const response = await getWithFilter({
                table: `articulos
                    left join codigos_barras on articulos.id = codigos_barras.articulo_id
                    left join historia_costos on articulos.id = historia_costos.articulo_id
                    left join categorias on articulos.categoria_id = categorias.id
                    left join unidades on articulos.unidad_id = unidades.id
                    left join inventario on articulos.id = inventario.articulo_id
                    left join imagenes on articulos.id = imagenes.id_ref and imagenes.tabla = 'articulos'`,
                pageSize: 10,
                page: currentPage,
                tag: 'Productos',
                filtros: filtros
            }).unwrap() as ApiResponse;

            if (response && response.data) {
                // Procesar imágenes - convertir url individual en array de imagenes
                const productosProcesados = response.data.map(producto => ({
                    ...producto,
                    imagenes: producto.url ? [producto.url] : []
                }));

                setTotalPages(response.totalPages);
                setTotalItems(response.totalRecords);
                setProductos(productosProcesados);
                calcularEstadisticas(productosProcesados);
            }
        } catch (error) {
            console.error("Error fetching productos:", error);
            setProductos([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activeFilters, getWithFilter]);

    useEffect(() => {
        fetchProductos();
    }, [fetchProductos]);

    const calcularEstadisticas = (listaProductos: Producto[]) => {
        const stats: EstadisticasProductos = {
            total_productos: totalItems,
            productos_sin_stock: listaProductos.filter(p => !p.cantidad || p.cantidad === 0).length,
            productos_bajo_stock: listaProductos.filter(p => (p.cantidad || 0) > 0 && (p.cantidad || 0) <= 10).length,
            valor_total_inventario: listaProductos.reduce((sum, p) => sum + ((p.costo || 0) * (p.cantidad || 0)), 0),
            productos_sin_imagen: listaProductos.filter(p => !p.url && (!p.imagenes || p.imagenes.length === 0)).length
        };
        setEstadisticas(stats);
    };

    const handleOpenModal = (producto: Producto) => {
        setProductoSeleccionado(producto);
        dispatch(openModalReducer({ modalName: "detalle_producto" }));
    };

    const handleEditarProducto = (producto: Producto) => {
        setProductoSeleccionado(producto);
        dispatch(openModalReducer({ modalName: "editar_producto" }));
    };

    const handleGestionStock = (producto: Producto) => {
        setProductoParaStock(producto);
        dispatch(openModalReducer({ modalName: "gestion_stock" }));
    };

    const handleGuardarStock = async (productoId: number, cantidad: number) => {
        try {
            await putGeneral({
                table: "inventario",
                id: productoId,
                data: {
                    cantidad: cantidad,
                    fecha: new Date().toISOString()
                }
            }).unwrap();

            fetchProductos();
            alert('Stock actualizado correctamente');
        } catch (error) {
            console.error("Error actualizando stock:", error);
            alert('Error al actualizar el stock');
        }
    };

    const handleEliminarProducto = async (productoId: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            try {
                await deleteGeneral({
                    table: "articulos",
                    id: productoId
                }).unwrap();

                fetchProductos();
                alert('Producto eliminado correctamente');
            } catch (error) {
                console.error("Error eliminando producto:", error);
                alert('Error al eliminar el producto');
            }
        }
    };

    const handleToggleSeleccion = (productoId: number) => {
        setProductosSeleccionados(prev =>
            prev.includes(productoId)
                ? prev.filter(id => id !== productoId)
                : [...prev, productoId]
        );
    };

    const handleSeleccionarTodos = () => {
        if (productosSeleccionados.length === productos.length) {
            setProductosSeleccionados([]);
        } else {
            setProductosSeleccionados(productos.map(p => p.id));
        }
    };

    const handleActualizacionMasiva = async (data: any) => {
        try {
            const updates = productosSeleccionados.map(id =>
                putGeneral({
                    table: "articulos",
                    id: id,
                    data: {
                        precio: data.precio !== undefined && data.precio !== '' ? parseFloat(data.precio) : undefined,
                        costo: data.costo !== undefined && data.costo !== '' ? parseFloat(data.costo) : undefined,
                        descripcion: data.descripcion || undefined,
                    }
                })
            );

            await Promise.all(updates);
            setModoEdicionMasiva(false);
            setProductosSeleccionados([]);
            fetchProductos();
            alert('Actualización masiva completada');
        } catch (error) {
            console.error("Error en actualización masiva:", error);
            alert('Error en la actualización masiva');
        }
    };

    const handleCrearProducto = async (data: any) => {
        try {
            await postGeneral({
                table: "articulos",
                data: {
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    precio: parseFloat(data.precio),
                    categoria_id: data.categoria_id,
                    unidad_id: data.unidad_id
                }
            }).unwrap();

            fetchProductos();
            dispatch(openModalReducer({ modalName: "crear_producto" }));
            alert('Producto creado correctamente');
        } catch (error) {
            console.error("Error creando producto:", error);
            alert('Error al crear el producto');
        }
    };

    const handleGuardarEdicion = async (data: any) => {
        if (!productoSeleccionado) return;

        try {
            await putGeneral({
                table: "articulos",
                id: productoSeleccionado.id,
                data: {
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    precio: parseFloat(data.precio),
                    categoria_id: data.categoria_id,
                    unidad_id: data.unidad_id
                }
            }).unwrap();

            fetchProductos();
            setProductoSeleccionado(null);
            dispatch(openModalReducer({ modalName: "editar_producto" }));
            alert('Producto actualizado correctamente');
        } catch (error) {
            console.error("Error editando producto:", error);
            alert('Error al actualizar el producto');
        }
    };

    const limpiarFiltros = () => {
        reset();
        setActiveFilters(prev => ({ ...prev, Filtros: [] }));
        setCurrentPage(1);
    };

    const onSubmitFiltros = (data: any) => {
        const nuevosFiltros: Filtro[] = [];

        if (data.search) {
            nuevosFiltros.push({
                Key: "articulos.nombre",
                Value: data.search,
                Operator: "contains"
            });
        }

        if (data.categoria) {
            nuevosFiltros.push({
                Key: "categorias.nombre",
                Value: data.categoria,
                Operator: "="
            });
        }

        if (data.stock_min) {
            nuevosFiltros.push({
                Key: "inventario.cantidad",
                Value: parseFloat(data.stock_min),
                Operator: ">="
            });
        }

        if (data.stock_max) {
            nuevosFiltros.push({
                Key: "inventario.cantidad",
                Value: parseFloat(data.stock_max),
                Operator: "<="
            });
        }

        setActiveFilters(prev => ({ ...prev, Filtros: nuevosFiltros }));
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="h-8 w-8 text-blue-600" />
                        Administración de Productos
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Gestiona tu inventario, precios y productos desde un solo lugar
                    </p>
                </div>

                {/* Estadísticas */}
                <EstadisticasComponent stats={estadisticas} />

                {/* Filtros */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
                    <form onSubmit={handleSubmit(onSubmitFiltros)} className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[250px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                {...register("search")}
                                placeholder="Buscar productos..."
                                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <input
                            type="text"
                            {...register("categoria")}
                            placeholder="Categoría"
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                {...register("stock_min")}
                                placeholder="Stock mín"
                                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="number"
                                {...register("stock_max")}
                                placeholder="Stock máx"
                                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                            <Filter className="h-4 w-4" />
                            Filtrar
                        </button>

                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                            Limpiar
                        </button>

                        <button
                            type="button"
                            onClick={fetchProductos}
                            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Actualizar"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    </form>
                </div>

                {/* Navegación de Vistas */}
                <NavegacionVistas vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />

                {/* Contenido de la Vista Activa */}
                {vistaActiva === 'productos' && (
                    <VistaProductos
                        productos={productos}
                        isLoading={isLoading}
                        onViewDetails={handleOpenModal}
                        onEdit={handleEditarProducto}
                        onDelete={handleEliminarProducto}
                        onGestionStock={handleGestionStock}
                        onCrearProducto={() => dispatch(openModalReducer({ modalName: "crear_producto" }))}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={setCurrentPage}
                    />
                )}

                {vistaActiva === 'inventario' && (
                    <VistaInventario
                        productos={productos}
                        isLoading={isLoading}
                    />
                )}

                {vistaActiva === 'actualizacion' && (
                    <VistaActualizacionMasiva
                        productos={productos}
                        productosSeleccionados={productosSeleccionados}
                        onToggleSeleccion={handleToggleSeleccion}
                        onSeleccionarTodos={handleSeleccionarTodos}
                        onActualizacionMasiva={handleActualizacionMasiva}
                        modoEdicionMasiva={modoEdicionMasiva}
                        setModoEdicionMasiva={setModoEdicionMasiva}
                    />
                )}

                {vistaActiva === 'imagenes' && (
                    <VistaGestionImagenes
                        productos={productos}
                        onSubirImagen={postImg}
                    />
                )}

                {/* Modales */}
                <ModalDetalleProducto
                    producto={productoSeleccionado}
                    onClose={() => setProductoSeleccionado(null)}
                />

                <ModalGestionStock
                    producto={productoParaStock}
                    onClose={() => setProductoParaStock(null)}
                    onSave={handleGuardarStock}
                />

                {/* Modal Crear Producto */}
                <Modal modalName="crear_producto" title="Crear Nuevo Producto" maxWidth="2xl">
                    <MainForm
                        message_button="Crear Producto"
                        actionType="post"
                        dataForm={[
                            { type: "H1", label: "Crear Nuevo Producto", require: false },
                            {
                                type: "INPUT",
                                name: "nombre",
                                label: "Nombre del Producto",
                                placeholder: "Ingresa el nombre del producto",
                                require: true
                            },
                            {
                                type: "TEXT_AREA",
                                name: "descripcion",
                                label: "Descripción",
                                placeholder: "Describe el producto",
                                require: false
                            },
                            {
                                type: "NUMBER",
                                name: "precio",
                                label: "Precio",
                                placeholder: "0.00",
                                require: true
                            },
                            {
                                type: "NUMBER",
                                name: "costo",
                                label: "Costo",
                                placeholder: "0.00",
                                require: false
                            },
                            {
                                type: "SELECT",
                                name: "categoria_id",
                                label: "Categoría",
                                options: [
                                    { value: "1", label: "Electrónicos" },
                                    { value: "2", label: "Ropa" },
                                    { value: "3", label: "Hogar" },
                                    { value: "4", label: "Deportes" },
                                    { value: "5", label: "Otros" }
                                ],
                                require: true
                            },
                            {
                                type: "SELECT",
                                name: "unidad_id",
                                label: "Unidad",
                                options: [
                                    { value: "1", label: "Pieza" },
                                    { value: "2", label: "Kilogramo" },
                                    { value: "3", label: "Litro" },
                                    { value: "4", label: "Metro" },
                                    { value: "5", label: "Caja" }
                                ],
                                require: true
                            }
                        ]}
                        onSuccess={handleCrearProducto}
                        iconButton={<Plus className="size-4" />}
                    />
                </Modal>

                {/* Modal Editar Producto */}
                <Modal modalName="editar_producto" title="Editar Producto" maxWidth="2xl">
                    {productoSeleccionado && (
                        <MainForm
                            message_button="Guardar Cambios"
                            actionType="put"
                            dataForm={[
                                { type: "H1", label: `Editar: ${productoSeleccionado.nombre}`, require: false },
                                {
                                    type: "INPUT",
                                    name: "nombre",
                                    label: "Nombre del Producto",
                                    placeholder: "Ingresa el nombre del producto",
                                    require: true,
                                    valueDefined: productoSeleccionado.nombre
                                },
                                {
                                    type: "TEXT_AREA",
                                    name: "descripcion",
                                    label: "Descripción",
                                    placeholder: "Describe el producto",
                                    require: false,
                                    valueDefined: productoSeleccionado.descripcion
                                },
                                {
                                    type: "NUMBER",
                                    name: "precio",
                                    label: "Precio",
                                    placeholder: "0.00",
                                    require: true,
                                    valueDefined: productoSeleccionado.precio
                                },
                                {
                                    type: "NUMBER",
                                    name: "costo",
                                    label: "Costo",
                                    placeholder: "0.00",
                                    require: false,
                                    valueDefined: productoSeleccionado.costo || 0
                                },
                                {
                                    type: "SELECT",
                                    name: "categoria_id",
                                    label: "Categoría",
                                    options: [
                                        { value: "1", label: "Electrónicos" },
                                        { value: "2", label: "Ropa" },
                                        { value: "3", label: "Hogar" },
                                        { value: "4", label: "Deportes" },
                                        { value: "5", label: "Otros" }
                                    ],
                                    require: true,
                                    valueDefined: productoSeleccionado.categoria_nombre || "Otros"
                                },
                                {
                                    type: "SELECT",
                                    name: "unidad_id",
                                    label: "Unidad",
                                    options: [
                                        { value: "1", label: "Pieza" },
                                        { value: "2", label: "Kilogramo" },
                                        { value: "3", label: "Litro" },
                                        { value: "4", label: "Metro" },
                                        { value: "5", label: "Caja" }
                                    ],
                                    require: true,
                                    valueDefined: productoSeleccionado.unidad_nombre || "Pieza"
                                }
                            ]}
                            onSuccess={handleGuardarEdicion}
                            iconButton={<Save className="size-4" />}
                        />
                    )}
                </Modal>
            </div>
        </div>
    );
}