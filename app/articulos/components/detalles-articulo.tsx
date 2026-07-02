"use client";

import { useAppSelector } from "@/hooks/selector";
import {
    Package, Image as ImageIcon, Upload
} from "lucide-react";
import { EnvConfig } from '@/utils/constants/env.config';
import MainForm from '@/components/form/main-form';

const { hubs: apiUrl } = EnvConfig();

interface ArticuloDetalle {
    Articulo: any[];
    Descripcion: any[];
    Categoria: any[];
    Proveedor: any[];
    Unidad: any[];
    Precio: any[];
    Costo: any[];
    Estatus: any[];
    Url?: string;
    [key: string]: any;
}

export const ModalDetallesArticulo = ({ selectedArticulo, refetch }: { selectedArticulo: ArticuloDetalle | null, refetch: any }) => {
    const isOpen = useAppSelector((state: any) => state.dropDownReducer.modals['detalles-articulo']);

    if (!isOpen || !selectedArticulo) return null;

    // Obtener el código del artículo (usando el mismo formato que en page.tsx)
    const articuloCode = selectedArticulo.Articulo?.[1] || selectedArticulo.Articulo?.[0] || '';

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Package className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {selectedArticulo.Articulo?.[0] || 'Sin nombre'}
                        </h2>
                        <p className="text-gray-500">Código: {articuloCode}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 dark:text-white">
                {/* Imagen */}
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" /> Imagen del Artículo
                    </h3>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 min-h-80 flex flex-col items-center justify-center">
                        { selectedArticulo.Imagen?.[1] ? (
                            <img
                                src={apiUrl.slice(0, -1) + selectedArticulo.Imagen?.[1]}
                                alt={selectedArticulo.Imagen?.[1] || 'Artículo'}
                                className="max-h-80 object-contain rounded-lg"
                            />
                        ) : (
                            <div className="text-center">
                                <ImageIcon className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">Sin imagen disponible</p>
                                <MainForm
                                    message_button="Subir Imagen"
                                    actionType=""
                                    dataForm={[{
                                        type: "FILE",
                                        name: "file",
                                        label: "Seleccionar imagen",
                                        multi: false,
                                        require: true,
                                    }]}
                                    aditionalData={{
                                        idRef: selectedArticulo.Articulo?.[1],
                                        tabla: 'articulos'
                                        }}
                                    onSuccess={refetch}
                                    iconButton={<Upload className="size-4" />}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Información */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Información General</h3>
                        <div className="space-y-4">
                            {selectedArticulo.Descripcion && selectedArticulo.Descripcion.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">Descripción</p>
                                    <p className="text-gray-900 dark:text-gray-200">{selectedArticulo.Descripcion.join(" • ")}</p>
                                </div>
                            )}

                            {selectedArticulo.Categoria && selectedArticulo.Categoria.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">Categoría</p>
                                    <p className="text-gray-900 dark:text-gray-200">{selectedArticulo.Categoria.join(" → ")}</p>
                                </div>
                            )}

                            {selectedArticulo.Proveedor && selectedArticulo.Proveedor.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-300">Proveedor / Fabricante</p>
                                    <p className="text-gray-900 dark:text-gray-200">{selectedArticulo.Proveedor.join(" • ")}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3">Comercial</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {selectedArticulo.Precio && selectedArticulo.Precio.length > 0 && (
                                <div className="border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                                    <p className="text-sm text-gray-500">Precio</p>
                                    <p className="text-xl font-semibold text-green-600">
                                        {selectedArticulo.Precio[0]}
                                    </p>
                                </div>
                            )}
                            {selectedArticulo.Costo && selectedArticulo.Costo.length > 0 && (
                                <div className="border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                                    <p className="text-sm text-gray-500">Costo</p>
                                    <p className="text-xl font-semibold">
                                        {selectedArticulo.Costo[0]}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3">Unidad y Estatus</h3>
                        {selectedArticulo.Unidad && selectedArticulo.Unidad.length > 0 && (
                            <div className="mb-2">
                                <p className="text-sm text-gray-500 dark:text-gray-300">Unidad</p>
                                <p className="text-gray-900 dark:text-gray-200">{selectedArticulo.Unidad.join(" • ")}</p>
                            </div>
                        )}
                        {selectedArticulo.Estatus && selectedArticulo.Estatus.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-300">Estatus</p>
                                <p className="text-gray-900 dark:text-gray-200">{selectedArticulo.Estatus.join(" • ")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};