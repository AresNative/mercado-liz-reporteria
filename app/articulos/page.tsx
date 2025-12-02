"use client"

import { useState, useEffect, useCallback } from 'react';
import {
    Package,
    Search,
    Filter,
    Upload,
    RefreshCw,
    Edit,
    Image as ImageIcon,
    X,
    Save,
    CheckSquare,
    Square,
    Eye
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/hooks/selector";
import { openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down";
import {
    useGetWithFiltersGeneralMutation,
    usePutGeneralMutation
} from "@/hooks/reducers/api";
import { LoadingSection } from "@/template/loading-screen";
import { Modal } from "@/components/modal";
import MainForm from '@/components/form/main-form';
import Pagination from "@/components/pagination";
import { EnvConfig } from '@/utils/constants/env.config';

const { hubs: apiUrl } = EnvConfig();

interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    url?: string | null;
    imagenes?: string[];
    articulo?: string;
}

interface ApiResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: Producto[];
}

interface ActiveFilters {
    Filtros: Array<{ Key: string; Value: any; Operator: string }>;
}

// Componente para vista de productos con imágenes
const VistaProductosConImagenes = ({
    productos,
    isLoading,
    onSelect,
    onUpdate,
    onUploadImage,
    onViewDetails,
    selectedIds,
    onToggleSelectAll,
    allSelected
}: {
    productos: Producto[];
    isLoading: boolean;
    onSelect: (id: number) => void;
    onUpdate: (producto: Producto) => void;
    onUploadImage: (producto: Producto) => void;
    onViewDetails: (producto: Producto) => void;
    selectedIds: number[];
    onToggleSelectAll: () => void;
    allSelected: boolean;
}) => {
    const obtenerImagenPrincipal = (producto: Producto) => {
        if (producto.imagenes && producto.imagenes.length > 0) {
            return producto.imagenes[0];
        }
        return producto.url || null;
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Productos</h2>
                <p className="text-sm text-gray-600">Selecciona productos para acciones masivas</p>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? (
                    <LoadingSection message="Cargando productos..." />
                ) : productos.length > 0 ? (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        onClick={onToggleSelectAll}
                                        className="p-1 hover:bg-gray-100 rounded"
                                        title={allSelected ? "Desmarcar todos" : "Marcar todos"}
                                    >
                                        {allSelected ? (
                                            <CheckSquare className="h-5 w-5 text-blue-600" />
                                        ) : (
                                            <Square className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Artículo
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Precio
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Imagen
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {productos.map((producto) => {
                                const imagen = obtenerImagenPrincipal(producto);
                                const isSelected = selectedIds.includes(producto.id);
                                const tieneImagen = !!imagen;

                                return (
                                    <tr
                                        key={producto.id}
                                        className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                                    >
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => onSelect(producto.id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                {/* Vista previa de imagen */}
                                                {tieneImagen ? (
                                                    <div className="flex-shrink-0">
                                                        <img
                                                            src={apiUrl.slice(0, -1) + imagen}
                                                            alt={producto.nombre}
                                                            className="w-12 h-12 object-cover rounded border border-gray-200"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                        <div className="hidden w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                                            <ImageIcon className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                                        <ImageIcon className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                )}

                                                <div>
                                                    <div className="font-medium text-gray-900">{producto.nombre}</div>
                                                    <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">
                                                        {producto.descripcion || 'Sin descripción'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-900">
                                            {producto.articulo || 'N/A'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-900">
                                            ${producto.precio.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {tieneImagen ? (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <ImageIcon className="h-4 w-4" />
                                                        <span className="text-xs">Con imagen</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-red-600">
                                                        <ImageIcon className="h-4 w-4" />
                                                        <span className="text-xs">Sin imagen</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onViewDetails(producto)}
                                                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                                                    title="Ver detalles"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onUploadImage(producto)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                    title="Subir/Reemplazar imagen"
                                                >
                                                    <Upload className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => onUpdate(producto)}
                                                    className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center">
                        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No se encontraron productos.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente para panel de filtros
const PanelFiltros = ({ register, handleSubmit, onSubmitFiltros, limpiarFiltros, fetchProductos }: any) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <form onSubmit={handleSubmit(onSubmitFiltros)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buscar por artículo
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            {...register("articulo")}
                            placeholder="Código o número de artículo..."
                            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buscar por nombre
                    </label>
                    <input
                        type="text"
                        {...register("nombre")}
                        placeholder="Nombre del producto..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Buscar en descripción
                    </label>
                    <input
                        type="text"
                        {...register("descripcion")}
                        placeholder="Palabras en la descripción..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    <Filter className="h-4 w-4" />
                    Aplicar Filtros
                </button>

                <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                    Limpiar filtros
                </button>

                <button
                    type="button"
                    onClick={fetchProductos}
                    className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
                    title="Actualizar lista"
                >
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>
        </form>
    </div>
);

// Componente para panel de selección masiva
const PanelSeleccionMasiva = ({
    selectedCount,
    onUpdatePrices,
    onUploadImages,
    onCancel
}: {
    selectedCount: number;
    onUpdatePrices: () => void;
    onUploadImages: () => void;
    onCancel: () => void;
}) => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
            <div>
                <h3 className="font-medium text-blue-800">Selección Masiva</h3>
                <p className="text-sm text-blue-600">{selectedCount} productos seleccionados</p>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    <X className="h-4 w-4" />
                    Cancelar selección
                </button>

                <button
                    onClick={onUpdatePrices}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    <Edit className="h-4 w-4" />
                    Actualizar Precios
                </button>

                <button
                    onClick={onUploadImages}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Upload className="h-4 w-4" />
                    Subir Imágenes
                </button>
            </div>
        </div>
    </div>
);

// Componente para modal de detalle de imagen
const ModalDetalleImagen = ({ producto, onClose }: { producto: Producto | null; onClose: () => void }) => {
    if (!producto) return null;

    const obtenerImagenPrincipal = (producto: Producto) => {
        if (producto.imagenes && producto.imagenes.length > 0) {
            return producto.imagenes[0];
        }
        return producto.url || null;
    };

    const imagen = obtenerImagenPrincipal(producto);
    const tieneImagen = !!imagen;

    return (
        <Modal modalName="detalle_imagen" title="Detalle del Producto" maxWidth="lg">
            <div className="p-6">
                <h2 className="text-xl font-bold mb-4">{producto.nombre}</h2>

                {/* Información del producto */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Artículo</label>
                        <p className="text-gray-900">{producto.articulo || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Precio</label>
                        <p className="text-gray-900">${producto.precio.toFixed(2)}</p>
                    </div>
                    <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-500">Descripción</label>
                        <p className="text-gray-900">{producto.descripcion || 'Sin descripción'}</p>
                    </div>
                </div>

                {/* Imagen del producto */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Imagen del Producto</h3>

                    {tieneImagen ? (
                        <div className="flex flex-col items-center">
                            <img
                                src={apiUrl.slice(0, -1) + imagen}
                                alt={producto.nombre}
                                className="max-w-full max-h-96 object-contain rounded-lg border border-gray-200"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center">
                                <ImageIcon className="h-16 w-16 text-gray-400 mb-2" />
                                <p className="text-gray-500">Error al cargar la imagen</p>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">URL: {imagen}</p>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Este producto no tiene imagen</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default function GestionProductosConImagenes() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [productoParaImagen, setProductoParaImagen] = useState<Producto | null>(null);
    const [productoParaEditar, setProductoParaEditar] = useState<Producto | null>(null);
    const [productoDetalle, setProductoDetalle] = useState<Producto | null>(null);
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({ Filtros: [] });

    const [getWithFilter] = useGetWithFiltersGeneralMutation();
    const [putGeneral] = usePutGeneralMutation();

    const { handleSubmit, register, reset } = useForm();
    const dispatch = useAppDispatch();

    // Obtener productos con filtros
    const fetchProductos = useCallback(async () => {
        setIsLoading(true);
        try {
            const filtros: any = {
                Selects: [
                    { key: "articulos.id" },
                    { key: "articulos.nombre" },
                    { key: "articulos.descripcion" },
                    { key: "articulos.precio" },
                    { key: "articulos.articulo" },
                    { key: "imagenes.url" }
                ],
                Order: [{ Key: "articulos.id", Direction: "Desc" }]
            };

            if (activeFilters.Filtros.length > 0) {
                filtros.Filtros = activeFilters.Filtros;
            }

            const response = await getWithFilter({
                table: `articulos left join imagenes on articulos.id = imagenes.id_ref and imagenes.tabla = 'articulos'`,
                pageSize: 10,
                page: currentPage,
                tag: 'Productos',
                filtros: filtros
            }).unwrap() as ApiResponse;

            if (response?.data) {
                const productosProcesados = response.data.map(producto => ({
                    ...producto,
                    imagenes: producto.url ? [producto.url] : []
                }));
                setProductos(productosProcesados);
                setTotalPages(response.totalPages);
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

    // Manejo de selección
    const handleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(pid => pid !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === productos.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(productos.map(p => p.id));
        }
    };

    // Filtros
    const onSubmitFiltros = (data: any) => {
        const nuevosFiltros = [];

        if (data.articulo) {
            nuevosFiltros.push({
                Key: "articulos.articulo",
                Value: data.articulo,
                Operator: "like"
            });
        }

        if (data.nombre) {
            nuevosFiltros.push({
                Key: "articulos.nombre",
                Value: data.nombre,
                Operator: "like"
            });
        }

        if (data.descripcion) {
            nuevosFiltros.push({
                Key: "articulos.descripcion",
                Value: data.descripcion,
                Operator: "like"
            });
        }

        setActiveFilters({ Filtros: nuevosFiltros });
        setCurrentPage(1);
    };

    const limpiarFiltros = () => {
        reset();
        setActiveFilters({ Filtros: [] });
        setCurrentPage(1);
    };

    // Ver detalles del producto
    const handleViewDetails = (producto: Producto) => {
        setProductoDetalle(producto);
        dispatch(openModalReducer({ modalName: "detalle_imagen" }));
    };

    // Subir imagen individual
    const handleSubirImagen = (producto: Producto) => {
        setProductoParaImagen(producto);
        dispatch(openModalReducer({ modalName: "subir_imagen" }));
    };

    const handleGuardarImagen = async (data: any) => {
        if (!productoParaImagen) return;
        console.log(data);

        try {

            dispatch(openAlertReducer({
                title: "Imagen subida",
                message: "La imagen se ha subido correctamente",
                type: "success",
                duration: 3000,
                icon: 'alert'
            }));

            fetchProductos();
            setProductoParaImagen(null);
        } catch (error) {
            console.error("Error subiendo imagen:", error);
            alert('Error al subir la imagen');
        }
    };

    // Actualizar producto individual
    const handleUpdateProduct = (producto: Producto) => {
        setProductoParaEditar(producto);
        dispatch(openModalReducer({ modalName: "editar_producto" }));
    };

    const handleGuardarActualizacion = async (data: any) => {
        if (!productoParaEditar) return;

        try {
            await putGeneral({
                table: "articulos",
                id: productoParaEditar.id,
                data: {
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    precio: parseFloat(data.precio),
                    articulo: data.articulo
                }
            }).unwrap();

            dispatch(openAlertReducer({
                title: "Producto actualizado",
                message: "Los cambios se guardaron correctamente",
                type: "success",
                duration: 3000,
                icon: 'alert'
            }));

            fetchProductos();
            setProductoParaEditar(null);
        } catch (error) {
            console.error("Error actualizando producto:", error);
            alert('Error al actualizar el producto');
        }
    };

    // Actualización masiva de precios
    const handleActualizacionMasivaPrecios = () => {
        dispatch(openModalReducer({ modalName: "actualizar_masivo" }));
    };

    const handleGuardarActualizacionMasiva = async (data: any) => {
        try {
            const updates = selectedIds.map(id =>
                putGeneral({
                    table: "articulos",
                    id: id,
                    data: {
                        precio: data.precio ? parseFloat(data.precio) : undefined,
                        descripcion: data.descripcion || undefined
                    }
                })
            );

            await Promise.all(updates);

            dispatch(openAlertReducer({
                title: "Actualización completada",
                message: `${selectedIds.length} productos actualizados`,
                type: "success",
                duration: 4000,
                icon: 'alert'
            }));

            setSelectedIds([]);
            fetchProductos();
        } catch (error) {
            console.error("Error en actualización masiva:", error);
            alert('Error en la actualización masiva');
        }
    };

    // Subida masiva de imágenes
    const handleSubidaMasivaImagenes = () => {
        dispatch(openModalReducer({ modalName: "subir_masivo" }));
    };

    const handleGuardarSubidaMasiva = async (data: any) => {
        try {

            dispatch(openAlertReducer({
                title: "Imágenes subidas",
                message: `${selectedIds.length} imágenes procesadas`,
                type: "success",
                duration: 4000,
                icon: 'alert'
            }));

            setSelectedIds([]);
            fetchProductos();
        } catch (error) {
            console.error("Error subiendo imágenes:", error);
            alert('Error al subir las imágenes');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="h-6 w-6 text-blue-600" />
                        Gestión de Productos con Imágenes
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Visualiza imágenes, actualiza precios y gestiona productos
                    </p>
                </div>

                {/* Filtros */}
                <PanelFiltros
                    register={register}
                    handleSubmit={handleSubmit}
                    onSubmitFiltros={onSubmitFiltros}
                    limpiarFiltros={limpiarFiltros}
                    fetchProductos={fetchProductos}
                />

                {/* Panel de selección masiva */}
                {selectedIds.length > 0 && (
                    <PanelSeleccionMasiva
                        selectedCount={selectedIds.length}
                        onUpdatePrices={handleActualizacionMasivaPrecios}
                        onUploadImages={handleSubidaMasivaImagenes}
                        onCancel={() => setSelectedIds([])}
                    />
                )}

                {/* Lista de productos con imágenes */}
                <VistaProductosConImagenes
                    productos={productos}
                    isLoading={isLoading}
                    onSelect={handleSelect}
                    onUpdate={handleUpdateProduct}
                    onUploadImage={handleSubirImagen}
                    onViewDetails={handleViewDetails}
                    selectedIds={selectedIds}
                    onToggleSelectAll={handleSelectAll}
                    allSelected={selectedIds.length === productos.length && productos.length > 0}
                />

                {/* Paginación */}
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        loading={isLoading}
                        setCurrentPage={setCurrentPage}
                    />
                </div>

                {/* Modal Detalle de Imagen */}
                <ModalDetalleImagen
                    producto={productoDetalle}
                    onClose={() => setProductoDetalle(null)}
                />

                {/* Modal Subir Imagen Individual */}
                <Modal modalName="subir_imagen" title="Subir Imagen" maxWidth="md">
                    {productoParaImagen && (
                        <div className="p-4">
                            <div className="mb-4">
                                <h3 className="font-medium">{productoParaImagen.nombre}</h3>
                                <p className="text-sm text-gray-600">Artículo: {productoParaImagen.articulo || 'N/A'}</p>
                            </div>
                            <MainForm
                                message_button="Subir Imagen"
                                actionType=""
                                dataForm={[
                                    {
                                        type: "FILE",
                                        name: "file",
                                        label: "Seleccionar imagen",
                                        multi: false,
                                        require: true,
                                    }
                                ]}
                                aditionalData={{
                                    idRef: productoParaImagen.id,
                                    tabla: 'articulos'
                                }}
                                onSuccess={handleGuardarImagen}
                                iconButton={<Upload className="size-4" />}
                            />
                        </div>
                    )}
                </Modal>

                {/* Modal Editar Producto Individual */}
                <Modal modalName="editar_producto" title="Editar Producto" maxWidth="md">
                    {productoParaEditar && (
                        <MainForm
                            message_button="Guardar Cambios"
                            actionType="put"
                            dataForm={[
                                {
                                    type: "INPUT",
                                    name: "nombre",
                                    label: "Nombre del Producto",
                                    require: true,
                                    valueDefined: productoParaEditar.nombre
                                },
                                {
                                    type: "INPUT",
                                    name: "articulo",
                                    label: "Código de Artículo",
                                    require: false,
                                    valueDefined: productoParaEditar.articulo || ''
                                },
                                {
                                    type: "TEXT_AREA",
                                    name: "descripcion",
                                    label: "Descripción",
                                    require: false,
                                    valueDefined: productoParaEditar.descripcion
                                },
                                {
                                    type: "NUMBER",
                                    name: "precio",
                                    label: "Precio",
                                    require: true,
                                    valueDefined: productoParaEditar.precio
                                }
                            ]}
                            onSuccess={handleGuardarActualizacion}
                            iconButton={<Save className="size-4" />}
                        />
                    )}
                </Modal>

                {/* Modal Actualización Masiva */}
                <Modal modalName="actualizar_masivo" title="Actualización Masiva" maxWidth="md">
                    <div className="p-4">
                        <p className="text-sm text-gray-600 mb-4">
                            Actualizando {selectedIds.length} productos seleccionados
                        </p>
                        <MainForm
                            message_button="Aplicar a Seleccionados"
                            actionType="put"
                            dataForm={[
                                {
                                    type: "NUMBER",
                                    name: "precio",
                                    label: "Nuevo Precio",
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
                            ]}
                            onSuccess={handleGuardarActualizacionMasiva}
                            iconButton={<Save className="size-4" />}
                        />
                    </div>
                </Modal>

                {/* Modal Subida Masiva de Imágenes */}
                <Modal modalName="subir_masivo" title="Subir Imágenes Masivamente" maxWidth="md">
                    <div className="p-4">
                        <p className="text-sm text-gray-600 mb-4">
                            Subiendo imagen para {selectedIds.length} productos seleccionados
                        </p>
                        <MainForm
                            message_button="Subir a Todos"
                            actionType=""
                            dataForm={[
                                {
                                    type: "FILE",
                                    name: "file",
                                    label: "Seleccionar imagen",
                                    multi: false,
                                    require: true
                                }
                            ]}
                            onSuccess={handleGuardarSubidaMasiva}
                            iconButton={<Upload className="size-4" />}
                        />
                    </div>
                </Modal>
            </div>
        </div>
    );
}