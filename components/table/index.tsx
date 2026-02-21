"use client";

import type React from "react";
import { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Download, Grid2x2X, X } from "lucide-react";
import { ViewTR } from "./toggle-view";
import { cn } from "@/utils/functions/cn";
// Importamos funciones de formato
import {
    formatValue as formatNumberValue,
    formatDateDisplay,
} from "@/utils/constants/format-values";

export type DataItem = Record<string, any>;

interface DynamicTableProps {
    data: Record<string, any>[];
    loading?: boolean;
    onRowClick?: (rowData: any) => void;
}

// Funciones auxiliares para detectar tipos de columna (pueden moverse a un helper)
const isDateColumn = (key: string): boolean => {
    const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalizedKey.includes("fecha") || normalizedKey.includes("date");
};

const isPercentageColumn = (key: string): boolean => {
    const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalizedKey.includes("porcentaje") || key.includes("IVA") || key.includes("IEPS");
};

const isCurrencyColumn = (key: string): boolean => {
    const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return (
        normalizedKey.includes("price") ||
        normalizedKey.includes("precio") ||
        normalizedKey.includes("diferencia") ||
        normalizedKey.includes("puja") ||
        normalizedKey.includes("importe") ||
        normalizedKey.includes("costo")
    );
};

const isNumberColumn = (key: string): boolean => {
    const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalizedKey.includes("cantidad") || normalizedKey.includes("numero");
};

const DynamicTable: React.FC<DynamicTableProps> = ({ data, loading = false, onRowClick }) => {
    const tableRef = useRef<HTMLDivElement>(null);

    // Estados existentes
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [showColumnMenu, setShowColumnMenu] = useState<string | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

    // Detectar datos agrupados
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

    // Preparar datos para mostrar (aplanar pujas)
    const displayData = useMemo(() => {
        if (!isGroupedData) return data;

        return data.map(item => {
            const newItem = { ...item };
            delete newItem.Pujas;

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

    // Inicializar visibilidad de columnas
    useEffect(() => {
        setVisibleColumns((prev) => {
            return columns.reduce((acc, column) => {
                acc[column] = column in prev ? prev[column] : true;
                return acc;
            }, {} as Record<string, boolean>);
        });
    }, [columns]);

    // Handlers
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

    // Formatear valor de celda usando las utilidades importadas
    const formatCellValue = (key: string, value: any) => {
        if (value === null || value === undefined) return '-';

        // Si es un objeto de proveedor (contiene puja y cantidad)
        if (typeof value === 'object' && value !== null && 'puja' in value) {
            return (
                <div className="flex flex-col">
                    <span>Puja: {formatNumberValue(value.puja, "currency", 2)}</span>
                    <span>Cantidad: {formatNumberValue(value.cantidad, "number", 2)}</span>
                </div>
            );
        }

        // Booleanos
        if (typeof value === 'boolean') {
            return value ? <Check color="green" size={18} /> : <X color="red" size={18} />;
        }

        // Archivos (campo 'file')
        if (key.toLowerCase() === 'file' && typeof value === 'object') {
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

        // Fechas
        if (isDateColumn(key)) {
            try {
                const date = new Date(value);
                if (isNaN(date.getTime())) return value;
                // Usar formatDateDisplay que devuelve fecha localizada (DD/MM/YYYY)
                return formatDateDisplay(date);
            } catch {
                return value;
            }
        }

        // Porcentajes
        if (isPercentageColumn(key) && typeof value === 'number') {
            return formatNumberValue(value, "percentage", 2);
        }

        // Moneda
        if (isCurrencyColumn(key) && typeof value === 'number') {
            return formatNumberValue(value, "currency", 2);
        }

        // Números (cantidades, etc.)
        if (typeof value === 'number') {
            // Si es número entero, mostrar sin decimales; si tiene decimales, con 2
            const decimals = Number.isInteger(value) ? 0 : 2;
            return formatNumberValue(value, "number", decimals);
        }

        // Por defecto, convertir a string
        return String(value);
    };

    // Ordenar datos
    const filteredAndSortedData = useMemo(() => {
        return [...displayData].sort((a: any, b: any) => {
            if (!sortColumn) return 0;
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            const comparison = aValue < bValue ? -1 : 1;
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [displayData, sortColumn, sortDirection]);

    // Manejadores de teclado para filas
    const handleRowKeyDown = (e: React.KeyboardEvent, item: any, index: number) => {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                const nextRow = document.querySelector(`[data-row-index="${index + 1}"]`);
                (nextRow as HTMLElement)?.focus();
                break;
            case "ArrowUp":
                e.preventDefault();
                const prevRow = document.querySelector(`[data-row-index="${index - 1}"]`);
                (prevRow as HTMLElement)?.focus();
                break;
            case "Enter":
                e.preventDefault();
                if (onRowClick) onRowClick(item);
                break;
            case " ":
                e.preventDefault();
                toggleRowSelection(item.ID || JSON.stringify(item));
                break;
            default:
                break;
        }
    };

    // Renderizado condicional
    if (loading) {
        return <TableSkeleton />;
    }

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
        <div className="w-full space-y-8 relative" ref={tableRef}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-600">
                <div className="flex items-center space-x-2">
                    <ViewTR
                        setShowColumnMenu={setShowColumnMenu}
                        column="toggle"
                        toggleColumn={toggleColumn}
                        showColumnMenu={showColumnMenu}
                        visibleColumns={visibleColumns}
                        allColumns={true}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 shadow-md rounded-lg overflow-hidden">
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
                                        aria-label="Seleccionar todas las filas"
                                    />
                                </th>
                                {columns.map((column) => (
                                    visibleColumns[column] && (
                                        <th
                                            key={column}
                                            className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 tracking-wider"
                                        >
                                            <div className="flex items-center">
                                                <button
                                                    className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                                    onClick={() => toggleSort(column)}
                                                    aria-label={`Ordenar por ${column}`}
                                                >
                                                    <span>{column.replace('Proveedor_', 'Prov. ')}</span>
                                                    <ChevronDown
                                                        className={`h-4 w-4 transition-transform ${sortColumn === column
                                                            ? sortDirection === "asc"
                                                                ? "rotate-180"
                                                                : ""
                                                            : "opacity-50"
                                                            }`}
                                                    />
                                                </button>
                                                <ViewTR
                                                    setShowColumnMenu={setShowColumnMenu}
                                                    column={column}
                                                    toggleColumn={toggleColumn}
                                                    showColumnMenu={showColumnMenu}
                                                    visibleColumns={visibleColumns}
                                                />
                                            </div>
                                        </th>
                                    )
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-600">
                            <AnimatePresence>
                                {filteredAndSortedData.map((item: any, index: number) => {
                                    const rowId = item.ID || JSON.stringify(item);
                                    const isSelected = selectedRows.includes(rowId);
                                    return (
                                        <motion.tr
                                            key={rowId}
                                            data-row-index={index}
                                            tabIndex={0}
                                            role="row"
                                            aria-selected={isSelected}
                                            className={cn(
                                                onRowClick && "cursor-pointer",
                                                "hover:bg-zinc-50 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                                                isSelected && "bg-blue-50 dark:bg-blue-900/20"
                                            )}
                                            onClick={() => {
                                                if (onRowClick) onRowClick(item);
                                            }}
                                            onDoubleClick={() => {
                                                if (onRowClick) onRowClick(item);
                                            }}
                                            onKeyDown={(e) => handleRowKeyDown(e, item, index)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                    checked={isSelected}
                                                    onChange={() => toggleRowSelection(rowId)}
                                                    onClick={(e) => e.stopPropagation()} // Evitar doble acción
                                                    aria-label={`Seleccionar fila ${index + 1}`}
                                                />
                                            </td>
                                            {columns.map((column: string) => (
                                                visibleColumns[column] && (
                                                    <td
                                                        key={`${rowId}-${column}`}
                                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                                                    >
                                                        {formatCellValue(column, item[column])}
                                                    </td>
                                                )
                                            ))}
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
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

// Componente Skeleton (sin cambios, solo se muestra cuando loading)
const TableSkeleton = () => {
    const skeletonRows = 5;
    const skeletonColumns = 4;

    return (
        <div className="w-full space-y-8 animate-pulse">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-600">
                <div className="h-7 w-48 bg-gray-300 dark:bg-zinc-700 rounded"></div>
                <div className="h-8 w-8 bg-gray-300 dark:bg-zinc-700 rounded"></div>
            </div>
            <div className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-100 dark:bg-zinc-900">
                            <tr>
                                <th className="px-6 py-3">
                                    <div className="h-4 w-4 bg-gray-300 dark:bg-zinc-700 rounded mx-auto"></div>
                                </th>
                                {Array.from({ length: skeletonColumns }).map((_, index) => (
                                    <th key={index} className="px-6 py-3">
                                        <div className="h-4 w-24 bg-gray-300 dark:bg-zinc-700 rounded"></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-600">
                            {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                                <tr key={rowIndex}>
                                    <td className="px-6 py-4">
                                        <div className="h-4 w-4 bg-gray-300 dark:bg-zinc-700 rounded mx-auto"></div>
                                    </td>
                                    {Array.from({ length: skeletonColumns }).map((_, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4">
                                            <div className="h-4 w-full bg-gray-300 dark:bg-zinc-700 rounded"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                <div className="h-4 w-48 bg-gray-300 dark:bg-zinc-700 rounded"></div>
            </div>
        </div>
    );
};

export default DynamicTable;