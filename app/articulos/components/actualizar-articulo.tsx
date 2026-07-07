"use client";

import { useAppSelector } from "@/hooks/selector";
import { Upload } from "lucide-react";
import MainForm from '@/components/form/main-form';
import { usePutIntelisisMutation } from "@/hooks/api/api_int";

// Función auxiliar para eliminar valores vacíos
const cleanData = (obj: Record<string, any>) => {
    const result: Record<string, any> = {};
    for (const key in obj) {
        const value = obj[key];
        // Se omiten null, undefined, string vacío o solo espacios
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

export const ModalActualizarArticulo = ({ selectedArticulo, refetch }: { selectedArticulo: any | null, refetch: any }) => {
    const isOpen = useAppSelector((state: any) => state.dropDownReducer.modals['actualizar-articulo']);
    const [putInt] = usePutIntelisisMutation();

    if (!isOpen || !selectedArticulo) return null;

    async function updateArticulo(data: any) {
        // Limpiar los datos antes de enviarlos
        const cleanedData = cleanData(data);

        // Si no hay datos que actualizar, salimos (opcional)
        if (Object.keys(cleanedData).length === 0) {
            console.warn("No hay datos válidos para actualizar");
            return;
        }

        // Para cada artículo seleccionado, se envía la misma data limpia
        selectedArticulo.map((item: any) => {
            putInt({
                table: "art",
                data: {
                    Data: cleanedData,
                    Filtros: [{ Key: "Articulo", Value: item.Articulo[1], Operator: "=" }]
                },
                signal: new AbortController().signal,
            }).unwrap();
        });
        refetch();
    }

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <MainForm
                actionType=""
                message_button="Actualizar"
                iconButton={<Upload className="size-4" />}
                onSuccess={updateArticulo}   // nombre corregido
                dataForm={[
                    {
                        label: "Nombre corto del Artículo",
                        name: "NombreCorto",
                        type: "INPUT",
                        require: false,
                    },
                    {
                        label: "Nombre del Artículo",
                        name: "Descripcion1",
                        type: "INPUT",
                        require: false,
                    },
                    {
                        label: "Descripción",
                        name: "Descripcion2",
                        type: "TEXT_AREA",
                        require: false,
                    },
                ]}
            />
        </div>
    );
};