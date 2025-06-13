"use client";

import { CalendarDays } from "lucide-react";
import { datePresets } from "../constants/filter-options";
import { getDateFromPreset } from "../utils/date-utils";

interface DateFilterSectionProps {
    register: any;
    watch: any;
    setValue: any;
}

export const DateFilterSection = ({ register, watch, setValue }: DateFilterSectionProps) => {
    const startDate = watch("DateFilters.startDate");
    const endDate = watch("DateFilters.endDate");
    const preset = watch("DateFilters.preset");

    const handlePresetChange = (presetValue: string) => {
        if (presetValue) {
            const dates = getDateFromPreset(presetValue);
            setValue("DateFilters.startDate", dates.start);
            setValue("DateFilters.endDate", dates.end);
        } else {
            setValue("DateFilters.startDate", "");
            setValue("DateFilters.endDate", "");
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CalendarDays size={20} />
                Filtros de fecha
            </h3>

            <div className="space-y-4 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg border border-gray-200 dark:border-zinc-600">
                <div>
                    <label htmlFor="date-preset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fechas clave
                    </label>
                    <select
                        id="date-preset"
                        {...register("DateFilters.preset", {
                            onChange: (e: any) => handlePresetChange(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                    >
                        <option value="">Seleccionar fecha predefinida</option>
                        {datePresets.map((preset) => (
                            <option key={preset.value} value={preset.value}>
                                {preset.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-300 dark:bg-zinc-600"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        O seleccionar rango personalizado
                    </span>
                    <div className="flex-1 h-px bg-gray-300 dark:bg-zinc-600"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fecha desde
                        </label>
                        <input
                            id="start-date"
                            type="date"
                            {...register("DateFilters.startDate")}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fecha hasta
                        </label>
                        <input
                            id="end-date"
                            type="date"
                            {...register("DateFilters.endDate")}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                        />
                    </div>
                </div>

                {(startDate || endDate) && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Rango seleccionado:</strong>
                            {startDate && ` Desde ${new Date(startDate).toLocaleDateString("es-ES")}`}
                            {startDate && endDate && " "}
                            {endDate && `hasta ${new Date(endDate).toLocaleDateString("es-ES")}`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};