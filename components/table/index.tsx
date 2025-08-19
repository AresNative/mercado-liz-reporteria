"use client";

import type React from "react";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, Download, EyeOff, Grid2x2X, X } from "lucide-react";
import { ViewTR } from "./toggle-view";

export type DataItem = Record<string, any>;

interface DynamicTableProps {
    data: Record<string, any>[];
    itemsPerPage?: number;
}

const DynamicTable: React.FC<DynamicTableProps> = ({ data }) => {
    // Detectamos si los datos tienen estructura agrupada (con array de Pujas)
    const isGroupedData = useMemo(() => {
        return data.length > 0 && data[0].Pujas && Array.isArray(data[0].Pujas);
    }, [data]);

    // Columnas base (excluyendo Pujas)
    const baseColumns = useMemo(() => {
        if (data.length === 0) return [];
        return Object.keys(data[0]).filter(key => key !== 'Pujas');
    }, [data]);

    // Columnas para proveedores (si hay datos agrupados)
    const providerColumns = useMemo(() => {
        if (!isGroupedData || data.length === 0) return [];
        if (!data[0].Pujas || data[0].Pujas.length === 0) return [];

        return data[0].Pujas.map((puja: any) => `Proveedor_${puja.Proveedor.replace('#', '')}`);
    }, [data, isGroupedData]);

    // Todas las columnas combinadas
    const columns = useMemo(() => {
        return [...baseColumns, ...providerColumns];
    }, [baseColumns, providerColumns]);

    // Preparamos los datos para mostrar
    const displayData = useMemo(() => {
        if (!isGroupedData) return data;

        return data.map(item => {
            const newItem = { ...item };

            // Eliminamos el array de Pujas del objeto principal
            delete newItem.Pujas;

            // Añadimos las pujas como propiedades directas
            if (item.Pujas && Array.isArray(item.Pujas)) {
                item.Pujas.forEach((puja: any) => {
                    const providerKey = `Proveedor_${puja.Proveedor.replace('#', '')}`;
                    newItem[providerKey] = {
                        puja: puja.Puja,
                        cantidad: puja.Cantidad
                    };
                });
            }

            return newItem;
        });
    }, [data, isGroupedData]);

    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [showColumnMenu, setShowColumnMenu] = useState<string | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setVisibleColumns((prev) => {
            return columns.reduce((acc, column) => {
                acc[column] = column in prev ? prev[column] : true;
                return acc;
            }, {} as Record<string, boolean>);
        });
    }, [columns]);

    const toggleColumn = (column: string) => {
        setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
    };

    const toggleRowSelection = (id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const toggleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const formatValue = (key: string, value: any) => {
        if (value === null || value === undefined) return '-';

        // Si es un objeto de proveedor (contiene puja y cantidad)
        if (typeof value === 'object' && value !== null && 'puja' in value) {
            return (
                <div className="flex flex-col">
                    <span>Puja: ${value.puja.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span>Cantidad: {value.cantidad}</span>
                </div>
            );
        }

        const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Formato de fechas
        if ((normalizedKey.includes('fecha') || normalizedKey.includes('date'))) {
            try {
                const date = new Date(value);
                if (isNaN(date.getTime())) return value;
                return date.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                });
            } catch (error) {
                console.warn(`Error formateando fecha para ${key}:`, error);
                return value;
            }
        }

        // Formato de porcentajes
        if ((normalizedKey.includes('porcentaje') || key.includes('IVA') || key.includes('IEPS'))) {
            return `${value}%`;
        }

        // Formato de precios
        if (
            (normalizedKey.includes('price') ||
                normalizedKey.includes('puja') ||
                normalizedKey.includes('importe') ||
                normalizedKey.includes('costo')) &&
            typeof value === 'number'
        ) {
            return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        // Formato de cantidades
        if (normalizedKey.includes('cantidad') && typeof value === 'number') {
            return value % 1 === 0
                ? value.toString()
                : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        // Formato booleano
        if (typeof value === 'boolean') {
            return value ? <Check color="green" size={18} /> : <X color="red" size={18} />;
        }

        // Formato de archivos
        if (normalizedKey === 'file' && typeof value === 'object') {
            return value?.content ? (
                <Download
                    size={18}
                    className="text-blue-500 hover:text-blue-700 cursor-pointer"
                    onClick={() => {
                        const link = document.createElement('a');
                        link.href = `data:${value.contentType};base64,${value.content}`;
                        link.download = value.fileName || 'file';
                        link.click();
                    }}
                />
            ) : (
                <X color="gray" size={18} />
            );
        }

        return value.toString();
    };

    const filteredAndSortedData = useMemo(() => {
        return [...displayData].sort((a: any, b: any) => {
            if (!sortColumn) return 0;
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            return sortDirection === "asc"
                ? aValue < bValue ? -1 : 1
                : aValue > bValue ? -1 : 1;
        });
    }, [displayData, sortColumn, sortDirection]);

    if (displayData.length === 0) {
        return (
            <div className="w-full">
                <section className="w-fit text-center py-5 m-auto items-center flex gap-2 text-gray-500 dark:text-gray-200">
                    <Grid2x2X /> Sin datos disponibles
                </section>
            </div>
        );
    }

    return (
        <div className="w-full space-y-8 relative">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Datos de la Tabla</h2>
                <div className="flex items-center space-x-2">
                    <ViewTR {...{ setShowColumnMenu, column: 'toggle', toggleColumn, showColumnMenu, visibleColumns, allColumns: true }} />
                </div>
            </div>
            <div className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 shadow-xl rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-100 dark:bg-zinc-900">
                            <tr>
                                <th className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 dark:border-zinc-600 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                        checked={selectedRows.length === displayData.length && displayData.length > 0}
                                        onChange={() =>
                                            setSelectedRows(
                                                selectedRows.length === displayData.length
                                                    ? []
                                                    : displayData.map((item: any) => item.ID || JSON.stringify(item))
                                            )
                                        }
                                    />
                                </th>
                                {columns.map((column) => (
                                    visibleColumns[column] && (<th
                                        key={column}
                                        className={`relative px-6 py-3 text-left text-xs font-medium ${visibleColumns[column] ? 'text-gray-500 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'} tracking-wider`}
                                    >
                                        <ul className="flex items-center">
                                            <li className="flex items-center space-x-1">
                                                <button
                                                    className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300"
                                                    onClick={() => toggleSort(column)}
                                                >
                                                    <span>{column.replace('Proveedor_', 'Prov. ')}</span>
                                                    <ChevronDown
                                                        className={`h-4 w-4 ${sortColumn === column
                                                            ? sortDirection === "asc"
                                                                ? "transform rotate-180"
                                                                : ""
                                                            : ""
                                                            }`}
                                                    />
                                                </button>
                                                <ViewTR {...{ setShowColumnMenu, column, toggleColumn, showColumnMenu, visibleColumns }} />
                                            </li>
                                        </ul>
                                    </th>)
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-600">
                            {filteredAndSortedData.map((item: any) => (
                                <motion.tr
                                    key={item.ID || JSON.stringify(item)}
                                    className="hover:bg-zinc-50 dark:hover:bg-zinc-600"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                            checked={selectedRows.includes(item.ID || JSON.stringify(item))}
                                            onChange={() => toggleRowSelection(item.ID || JSON.stringify(item))}
                                        />
                                    </td>
                                    {columns.map((column: any) => (visibleColumns[column] && (
                                        <td
                                            key={`${item.ID || JSON.stringify(item)}-${column}`}
                                            className={`px-6 py-4 whitespace-nowrap ${!visibleColumns[column] ? 'relative' : ''}`}
                                        >
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {formatValue(column, item[column])}
                                            </div>
                                        </td>
                                    )))}
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-700 dark:text-gray-200">
                    {selectedRows.length} fila(s) seleccionada(s) de {displayData.length}
                </div>
            </div>
        </div>
    );
};

export default DynamicTable;