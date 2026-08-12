"use client";

import { useAppSelector } from "@/hooks/selector";
import { Upload } from "lucide-react";
import MainForm from '@/components/form/main-form';
import { usePutIntelisisMutation } from "@/hooks/api/api_int";
import { useAppDispatch } from "@/hooks/selector";
import { openAlertReducer } from "@/hooks/reducers/drop-down";
import { useState } from "react";
import { usePostImgMutation } from "@/hooks/api/api";

// Función auxiliar para eliminar valores vacíos
const cleanData = (obj: Record<string, any>) => {
    const result: Record<string, any> = {};
    for (const key in obj) {
        const value = obj[key];
        if (
            value !== null &&
            value !== undefined &&
            value !== '' &&
            !(typeof value === 'string' && value.trim() === '')
        ) {
            result[key] = value;
        }
    }
    return result;
};

export const ModalActualizarArticulo = ({ selectedArticulo, refetch }: { selectedArticulo: any[] | null, refetch: any }) => {
    const isOpen = useAppSelector((state: any) => state.dropDownReducer.modals['actualizar-articulo']);
    const [putInt] = usePutIntelisisMutation();
    const [postImg] = usePostImgMutation();
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const selectedArticuloList = selectedArticulo ?? [];

    if (!selectedArticulo || selectedArticuloList.length === 0) return null;
    // Determinar si es edición individual o múltiple
    const isSingle = selectedArticuloList.length === 1;
    const articuloUnico = isSingle ? selectedArticuloList[0] : null;

    // Valores por defecto para el formulario (si es individual)
    const defaultValues = isSingle ? {
        NombreCorto: articuloUnico?.Articulo?.[0] || '',
        Descripcion1: articuloUnico?.Descripcion?.[0] || '',
        Descripcion2: articuloUnico?.Descripcion?.[1] || '',
        Grupo: articuloUnico?.Categoria?.[1] || '',
        Categoria: articuloUnico?.Categoria?.[0] || '',
        Familia: articuloUnico?.Categoria?.[2] || '',
        Linea: articuloUnico?.Categoria?.[3] || '',
        Proveedor: articuloUnico?.Proveedor?.[0] || '',
        Fabricante: articuloUnico?.Proveedor?.[1] || '',
        Unidad: articuloUnico?.Unidad?.[0] || '',
        UnidadCompra: articuloUnico?.Unidad?.[2]?.replace('Compra: ', '') || '',
        UnidadTraspaso: articuloUnico?.Unidad?.[3]?.replace('Traspaso: ', '') || '',
        Factor: articuloUnico?.Unidad?.[1]?.replace('x', '') || '',
        CostoEstandar: articuloUnico?.Costo?.[0] ? parseFloat(articuloUnico.Costo[0].replace(/[^0-9.-]+/g, '')) : '',
        Estatus: articuloUnico?.Estatus?.[0] || '',
        SeCompra: articuloUnico?.Estatus?.includes('Compra') || false,
        SeVende: articuloUnico?.Estatus?.includes('Venta') || false,
        TieneCaducidad: articuloUnico?.Estatus?.includes('Caducidad') || false,
    } : {};

    if (!isOpen || !selectedArticulo || selectedArticulo.length === 0) return null;

    async function updateArticulo(data: any, formData: any) {
        setIsLoading(true);
        try {
            // 1. Limpiar los datos (eliminar vacíos)
            const cleanedData = cleanData(data);
            // Eliminar campos de archivo si existen (no van en la actualización de la tabla art)
            delete cleanedData.file;
            if (!selectedArticulo) return;
            // 2. Subir imagen si se seleccionó un archivo
            const file = data.file; // el campo se llama "file" (definido en dataForm)
            let imageUploadPromises: any = [];
            if (file && file instanceof File && file.size > 0) {
                // Subir la misma imagen para cada artículo seleccionado
                imageUploadPromises = selectedArticulo.map(item => {
                    const idRef = item.Articulo?.[1] || '';
                    if (!idRef) return Promise.resolve(null);
                    const formDataImg = new FormData();
                    formDataImg.append('IdRef', idRef);
                    formDataImg.append('Tabla', 'articulos');
                    formDataImg.append('Descripcion', 'Imagen actualizada desde edición');
                    formDataImg.append('File', file);
                    return postImg({
                        idRef,
                        tabla: 'articulos',
                        descripcion: 'Imagen actualizada desde edición',
                        file: formDataImg,
                        signal: new AbortController().signal,
                    }).unwrap();
                });
            }

            // 3. Actualizar cada artículo (tabla art)
            const updatePromises = selectedArticulo.map((item: any) => {
                const articuloId = item.Articulo?.[1] || '';
                if (!articuloId) return Promise.resolve(null);
                return putInt({
                    table: "art",
                    data: {
                        Data: cleanedData,
                        Filtros: [{ Key: "Articulo", Value: articuloId, Operator: "=" }]
                    },
                    signal: new AbortController().signal,
                }).unwrap();
            });

            // 4. Ejecutar todas las promesas en paralelo
            await Promise.all([...updatePromises, ...imageUploadPromises]);

            // 5. Éxito
            dispatch(openAlertReducer({
                title: "Actualización exitosa",
                message: `Se actualizaron ${selectedArticulo.length} artículo(s) correctamente.`,
                type: "success",
                icon: "archivo",
                duration: 4000
            }));
            refetch(); // Refrescar tabla
        } catch (error: any) {
            console.error("Error al actualizar:", error);
            dispatch(openAlertReducer({
                title: "Error al actualizar",
                message: error?.data?.message || "Ocurrió un error inesperado.",
                type: "error",
                icon: "alert",
                duration: 4000
            }));
        } finally {
            setIsLoading(false);
        }
    }

    // Construcción dinámica del dataForm
    const baseFields = [
        { label: "Grupo", name: "Grupo", type: "INPUT", require: false, valueDefined: defaultValues?.Grupo },
        { label: "Categoría", name: "Categoria", type: "INPUT", require: false, valueDefined: defaultValues?.Categoria },
        { label: "Familia", name: "Familia", type: "INPUT", require: false, valueDefined: defaultValues?.Familia },
        { label: "Línea", name: "Linea", type: "INPUT", require: false, valueDefined: defaultValues?.Linea },
        { label: "Unidad", name: "Unidad", type: "INPUT", require: false, valueDefined: defaultValues?.Unidad },
        /* { label: "Unidad de Compra", name: "UnidadCompra", type: "INPUT", require: false, valueDefined: defaultValues?.UnidadCompra },
        { label: "Unidad de Traspaso", name: "UnidadTraspaso", type: "INPUT", require: false, valueDefined: defaultValues?.UnidadTraspaso }, */
        { label: "Factor", name: "Factor", type: "NUMBER", require: false, valueDefined: defaultValues?.Factor },
        /* { label: "Costo Estándar", name: "CostoEstandar", type: "NUMBER", require: false, valueDefined: defaultValues?.CostoEstandar }, */
        {
            label: "Estatus", name: "Estatus", type: "SELECT", require: false, options: [
                { label: "Alta", value: "ALTA" },
                { label: "Descontinuado", value: "DESCONTINUADO" },
                { label: "Bloqueado", value: "BLOQUEADO" },
            ], valueDefined: defaultValues?.Estatus
        },
    ];

    const individualFields = [
        { label: "Nombre corto", name: "NombreCorto", type: "INPUT", require: false, valueDefined: defaultValues?.NombreCorto },
        { label: "Nombre del Artículo", name: "Descripcion1", type: "INPUT", require: false, valueDefined: defaultValues?.Descripcion1 },
        { label: "Descripción", name: "Descripcion2", type: "TEXT_AREA", require: false, valueDefined: defaultValues?.Descripcion2 },
        { label: "Proveedor", name: "Proveedor", type: "INPUT", require: false, valueDefined: defaultValues?.Proveedor },
        { label: "Fabricante", name: "Fabricante", type: "INPUT", require: false, valueDefined: defaultValues?.Fabricante },
    ];

    // Campo de imagen (varía el label)
    const imageField = {
        label: isSingle ? "Subir nueva imagen" : "Subir nueva imagen (se asignará a todos los seleccionados)",
        name: "file",
        type: "FILE",
        require: false,
        multi: false,
    };

    // Construir dataForm final
    let dataForm: any[] = [];
    if (isSingle) {
        dataForm = [...individualFields, ...baseFields, imageField];
    } else {
        dataForm = [...baseFields, imageField];
    }

    // Obtener la URL de la imagen actual (si es individual)
    const currentImageUrl = isSingle ? articuloUnico?.Imagen?.[1] : null;

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            {!isSingle && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300 text-sm">
                    <strong>Edición múltiple:</strong> Los cambios se aplicarán a los {selectedArticulo.length} artículos seleccionados.
                    {selectedArticulo.length > 1 && " La imagen subida se asignará a todos."}
                    <br />
                    <span className="text-xs">Solo se muestran campos que pueden ser comunes.</span>
                </div>
            )}
            <MainForm
                actionType=""
                message_button={isLoading ? "Actualizando..." : "Actualizar"}
                iconButton={<Upload className="size-4" />}
                onSuccess={updateArticulo}
                dataForm={dataForm}
            />
            {/* Vista previa de la imagen actual (solo individual) */}
            {isSingle && currentImageUrl && (
                <div className="mt-4">
                    <p className="text-sm text-gray-500">Imagen actual:</p>
                    <img src={currentImageUrl} alt="Actual" className="mt-2 max-h-32 rounded-lg border" />
                </div>
            )}
        </div>
    );
};