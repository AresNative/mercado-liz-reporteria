"use client";

interface OrderBySectionProps {
    register: any;
}

export const OrderBySection = ({ register }: OrderBySectionProps) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ordenamiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg border border-gray-200 dark:border-zinc-600">
            <div>
                <label htmlFor="order-field" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campo para ordenar
                </label>
                <input
                    id="order-field"
                    {...register("OrderBy.Key")}
                    placeholder="Nombre del campo"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                />
            </div>
            <div>
                <label htmlFor="order-direction" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dirección
                </label>
                <select
                    id="order-direction"
                    {...register("OrderBy.Direction")}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
                >
                    <option value="asc">Ascendente (A-Z, 1-9)</option>
                    <option value="desc">Descendente (Z-A, 9-1)</option>
                </select>
            </div>
        </div>
    </div>
);