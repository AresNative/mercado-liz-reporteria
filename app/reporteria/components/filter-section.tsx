"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { Plus } from "lucide-react";
import { FilterSectionProps, FormValues } from "../utils/types";
import { DateFilterSection } from "./date-filter-section";
import { FilterRow } from "./filter-row";
import { OrderBySection } from "./order-by-section";
import { SelectFieldRow } from "./select-field-row";

export const FilterSection = ({ onApply, onReset, config, filterFunction }: FilterSectionProps) => {
    const { control, register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
        defaultValues: {
            Filtros: [{ Key: "", Value: "", Operator: "" }],
            Selects: [{ Key: "" }],
            OrderBy: { Key: "", Direction: "asc" },
            DateFilters: { startDate: "", endDate: "", preset: "" }
        }
    });

    const { fields: filtros, append: addFiltro, remove: removeFiltro } = useFieldArray({ control, name: "Filtros" });
    const { fields: selects, append: addSelectField, remove: removeSelectField } = useFieldArray({ control, name: "Selects" });

    const onSubmit = (data: FormValues) => {
        const baseFilters = data.Filtros
            .filter(f => f.Key && f.Operator)  // Solo filtros con Key y Operator definidos
            .filter(f => f.Key !== "FechaEmision");  // Excluir campo de fecha
        const dateFilters = data.Filtros
            .filter(f => f.Key === "FechaEmision" && f.Value);  // Solo filtros de fecha con valor   ;

        if (data.DateFilters.startDate) {
            dateFilters.push({
                Key: "FechaEmision",
                Value: data.DateFilters.startDate,
                Operator: ">="
            });
        }

        if (data.DateFilters.endDate) {
            dateFilters.push({
                Key: "FechaEmision",
                Value: data.DateFilters.endDate,
                Operator: "<="
            });
        }

        onApply({
            Filtros: [...baseFilters, ...dateFilters],
            Selects: data.Selects.filter(s => s.Key),
            OrderBy: data.OrderBy.Key ? data.OrderBy : { Key: "", Direction: "asc" }
        });
    };

    const handleReset = () => {
        reset();
        onReset();
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full mb-8 bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-700 space-y-8"
            role="form"
            aria-label="Formulario de filtros de datos"
        >
            {/* Filtros */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filtros de búsqueda</h3>
                    <button
                        type="button"
                        onClick={() => addFiltro({ Key: "", Value: "", Operator: "" })}
                        className="inline-flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 focus:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                        aria-label="Agregar nuevo filtro"
                    >
                        <Plus size={16} />
                        Agregar filtro
                    </button>
                </div>

                <div className="space-y-3" role="group" aria-label="Lista de filtros">
                    {filtros.map((field, idx) => (
                        <FilterRow
                            key={field.id}
                            index={idx}
                            control={control}
                            register={register}
                            onRemove={() => removeFiltro(idx)}
                            isLast={filtros.length <= 1}
                            filterFunction={filterFunction}
                            config={config}
                        />
                    ))}
                </div>
            </div>

            {/* Campos a Mostrar */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Campos a mostrar</h3>
                    <button
                        type="button"
                        onClick={() => addSelectField({ Key: "" })}
                        className="inline-flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 focus:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                        aria-label="Agregar nuevo campo"
                    >
                        <Plus size={16} />
                        Agregar campo
                    </button>
                </div>

                <div className="space-y-3" role="group" aria-label="Lista de campos a mostrar">
                    {selects.map((field, idx) => (
                        <SelectFieldRow
                            key={field.id}
                            index={idx}
                            register={register}
                            onRemove={() => removeSelectField(idx)}
                            isLast={selects.length <= 1}
                        />
                    ))}
                </div>
            </div>

            {/* Ordenar por */}
            <OrderBySection register={register} />

            {/* Filtros de Fecha */}
            <DateFilterSection register={register} watch={watch} setValue={setValue} />

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-zinc-700">
                <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-2.5 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 focus:bg-gray-50 dark:focus:bg-zinc-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 font-medium"
                >
                    Restablecer filtros
                </button>
                <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 font-medium"
                >
                    Aplicar filtros
                </button>
            </div>
        </form>
    );
};