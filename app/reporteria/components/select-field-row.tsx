"use client";

import { X } from "lucide-react";
import { Controller } from "react-hook-form";
import { CustomSelect } from "./custom-select";
import { getGroupedFieldOptions } from "../constants/filter-options";

interface SelectFieldRowProps {
    index: number;
    register: any;
    control: any;
    onRemove: () => void;
    isLast: boolean;
    cols?: any;
}

export const SelectFieldRow = ({ index, register, control, onRemove, isLast, cols }: SelectFieldRowProps) => (
    <div className="flex gap-3 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg border border-gray-200 dark:border-zinc-600">
        <div className="flex-1">
            <label className="sr-only" htmlFor={`select-field-${index}`}>
                Campo a mostrar {index + 1}
            </label>
            <Controller
                name={`select-field-${index}`}
                {...register(`Selects.${index}.Key`)}
                control={control}
                render={({ field }) => (
                    <CustomSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={getGroupedFieldOptions(cols)}
                        placeholder="Seleccionar campo"
                        inputId={`filter-field-${index}`}
                        ariaLabel={`Campo para filtro ${index + 1}`}
                    />
                )}
            />
            {/* <input
                id={`select-field-${index}`}
                {...register(`Selects.${index}.Key`)}
                placeholder="Nombre del campo a mostrar"
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                aria-label={`Campo a mostrar ${index + 1}`}
            /> */}
        </div>
        <button
            type="button"
            onClick={onRemove}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
            disabled={isLast}
            aria-label={`Eliminar campo ${index + 1}`}
            title={isLast ? "Debe mantener al menos un campo" : `Eliminar campo ${index + 1}`}
        >
            <X size={18} />
        </button>
    </div>
);