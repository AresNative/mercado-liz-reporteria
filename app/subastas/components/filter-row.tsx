"use client";

import { Controller, useWatch } from "react-hook-form";
import { X } from "lucide-react";

import { getGroupedFieldOptions } from "../constants/filter-options";
import { AutoComplete } from "./auto-complete";
import { CustomSelect } from "./custom-select";
import { fetchNames } from "../utils/api";

interface FilterRowProps {
    index: number;
    control: any;
    register: any;
    onRemove: () => void;
    isLast: boolean;
    config: string;
    filterFunction: any;
    cols?: any;
}

export const FilterRow = ({ index, control, register, onRemove, isLast, config, filterFunction, cols }: FilterRowProps) => {
    const selectedKey = useWatch({
        control,
        name: `Filtros.${index}.Key`,
    });
    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg border border-gray-200 dark:border-zinc-600">
            <div className="md:col-span-5">
                <label className="sr-only" htmlFor={`filter-field-${index}`}>
                    Campo para filtro {index + 1}
                </label>
                <Controller
                    name={`Filtros.${index}.Key`}
                    control={control}
                    render={({ field }) => (
                        <CustomSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={getGroupedFieldOptions(cols)}
                            placeholder="Seleccionar columna..."
                            inputId={`filter-field-${index}`}
                            ariaLabel={`Campo para filtro ${index + 1}`}
                        />
                    )}
                />
            </div>

            <div className="md:col-span-3">
                <label className="sr-only" htmlFor={`filter-operator-${index}`}>
                    Operador para filtro {index + 1}
                </label>
                <select
                    id={`filter-operator-${index}`}
                    {...register(`Filtros.${index}.Operator`, { required: selectedKey !== "" })}
                    value={"like"}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                    aria-label={`Operador para filtro ${index + 1}`}
                >
                    <option value="">Seleccionar operador</option>
                    <option value="=">= Igual</option>
                    <option value="<>">≠ Diferente</option>
                    <option value=">">&gt; Mayor que</option>
                    <option value="<">&lt; Menor que</option>
                    <option value=">=">&ge; Mayor o igual</option>
                    <option value="<=">&le; Menor o igual</option>
                    <option value="like">Contiene</option>
                </select>
            </div>

            <div className="md:col-span-3">
                <label className="sr-only" htmlFor={`filter-value-${index}`}>
                    Valor para filtro {index + 1}
                </label>
                <Controller
                    name={`Filtros.${index}.Value`}
                    control={control}
                    render={({ field }) => (
                        <AutoComplete
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Valor a filtrar..."
                            fetchOptions={(query, page, signal) =>
                                fetchNames(query, page, selectedKey, config, filterFunction, signal)
                            }
                        />
                    )}
                />
            </div>

            <div className="md:col-span-1 flex justify-center">
                <button
                    type="button"
                    onClick={onRemove}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                    disabled={isLast}
                    aria-label={`Eliminar filtro ${index + 1}`}
                    title={isLast ? "Debe mantener al menos un filtro" : `Eliminar filtro ${index + 1}`}
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    )
};