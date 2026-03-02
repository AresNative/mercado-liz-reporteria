"use client";

import type React from "react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
    Check,
    ChevronDown,
    Download,
    FileSpreadsheet,
    FileText,
    Grid2x2X,
    X,
    Printer,
    Loader2
} from "lucide-react";
import { ViewTR } from "./toggle-view";
import { cn } from "@/utils/functions/cn";
import {
    formatValue as formatNumberValue,
    formatDateDisplay,
} from "@/utils/constants/format-values";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type DataItem = Record<string, any>;

interface DynamicTableProps {
    data: Record<string, any>[];
    loading?: boolean;
    onRowClick?: (rowData: any) => void;
    onExportAll?: () => Promise<Record<string, any>[]>;
    exportingAll?: boolean;
    // Nuevas props para manejar selección entre páginas
    selectedRows?: string[];
    onSelectedRowsChange?: (selectedRows: string[]) => void;
    // Identificador único para cada fila (por defecto usa 'ID' o JSON.stringify)
    rowIdField?: string;
}

// Funciones auxiliares para detectar tipos de columna
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
        normalizedKey.includes("costo") ||
        normalizedKey.includes("venta") ||
        normalizedKey.includes("compra")
    );
};

const isNumberColumn = (key: string): boolean => {
    const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalizedKey.includes("cantidad") || normalizedKey.includes("numero") || normalizedKey.includes("tiket");
};

const DynamicTable: React.FC<DynamicTableProps> = ({
    data,
    loading = false,
    onRowClick,
    onExportAll,
    exportingAll = false,
    selectedRows: externalSelectedRows,
    onSelectedRowsChange,
    rowIdField = 'ID'
}) => {
    const tableRef = useRef<HTMLDivElement>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showExportAllMenu, setShowExportAllMenu] = useState(false);
    const [exportAllLoading, setExportAllLoading] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const exportAllMenuRef = useRef<HTMLDivElement>(null);

    // Estados existentes
    const [internalSelectedRows, setInternalSelectedRows] = useState<string[]>([]);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [showColumnMenu, setShowColumnMenu] = useState<string | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});

    // Usar estado externo o interno
    const selectedRows = externalSelectedRows ?? internalSelectedRows;

    // Función para actualizar selección
    const updateSelectedRows = useCallback((newSelectedRows: string[] | ((prev: string[]) => string[])) => {
        if (onSelectedRowsChange) {
            // Si hay callback externo, usarlo
            const updated = typeof newSelectedRows === 'function'
                ? newSelectedRows(selectedRows)
                : newSelectedRows;
            onSelectedRowsChange(updated);
        } else {
            // Si no, usar estado interno
            setInternalSelectedRows(prev =>
                typeof newSelectedRows === 'function' ? newSelectedRows(prev) : newSelectedRows
            );
        }
    }, [onSelectedRowsChange, selectedRows]);

    // Obtener ID único para una fila
    const getRowId = useCallback((item: any): string => {
        return item[rowIdField] || JSON.stringify(item);
    }, [rowIdField]);

    // Verificar si una fila está seleccionada
    const isRowSelected = useCallback((rowId: string): boolean => {
        return selectedRows.includes(rowId);
    }, [selectedRows]);

    // Cerrar menús al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
            if (exportAllMenuRef.current && !exportAllMenuRef.current.contains(event.target as Node)) {
                setShowExportAllMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const toggleRowSelection = (rowId: string) => {
        updateSelectedRows(prev =>
            prev.includes(rowId)
                ? prev.filter(id => id !== rowId)
                : [...prev, rowId]
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

    const selectAllRows = () => {
        const currentPageIds = displayData.map(item => getRowId(item));

        updateSelectedRows(prev => {
            // Verificar si todas las filas de la página actual están seleccionadas
            const allCurrentPageSelected = currentPageIds.every(id => prev.includes(id));

            if (allCurrentPageSelected) {
                // Si todas están seleccionadas, deseleccionar solo las de esta página
                return prev.filter(id => !currentPageIds.includes(id));
            } else {
                // Si no, seleccionar todas las de esta página (sin perder selecciones de otras páginas)
                const newSelection = [...prev];
                currentPageIds.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            }
        });
    };

    // Obtener datos seleccionados (de todas las páginas)
    const getSelectedData = useCallback(() => {
        // Nota: Esto solo devuelve los datos de la página actual que están seleccionados
        // Para obtener todos los datos seleccionados de todas las páginas, 
        // necesitaríamos que el componente padre maneje eso
        return displayData.filter(item =>
            selectedRows.includes(getRowId(item))
        );
    }, [displayData, selectedRows, getRowId]);

    // Obtener columnas visibles para exportación
    const getVisibleColumnsForExport = () => {
        return columns.filter(col => visibleColumns[col]);
    };

    // Formatear valor para exportación (texto plano)
    const formatCellValueForExport = (key: string, value: any): string => {
        if (value === null || value === undefined) return '-';

        // Si es un objeto de proveedor (contiene puja y cantidad)
        if (typeof value === 'object' && value !== null && 'puja' in value) {
            return `Puja: ${formatNumberValue(value.puja, "currency", 2)} | Cantidad: ${formatNumberValue(value.cantidad, "number", 2)}`;
        }

        // Booleanos
        if (typeof value === 'boolean') {
            return value ? 'Sí' : 'No';
        }

        // Archivos (campo 'file')
        if (key.toLowerCase() === 'file' && typeof value === 'object') {
            return value?.fileName || 'Archivo';
        }

        // Fechas
        if (isDateColumn(key)) {
            try {
                const date = new Date(value);
                if (isNaN(date.getTime())) return String(value);
                return formatDateDisplay(date);
            } catch {
                return String(value);
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
            const decimals = Number.isInteger(value) ? 0 : 2;
            return formatNumberValue(value, "number", decimals);
        }

        return String(value);
    };

    // Función genérica para exportar datos completos
    const exportCompleteData = async (exportFunction: (data: any[]) => Promise<void> | void) => {
        if (!onExportAll) return;

        setExportAllLoading(true);
        try {
            const allData = await onExportAll();
            if (allData && allData.length > 0) {
                await exportFunction(allData);
            } else {
                alert('No hay datos para exportar');
            }
        } catch (error) {
            console.error('Error al exportar todos los datos:', error);
            alert('Error al cargar todos los datos para exportación');
        } finally {
            setExportAllLoading(false);
            setShowExportAllMenu(false);
        }
    };

    // Exportar a Excel (datos seleccionados)
    const exportToExcel = () => {
        const selectedData = getSelectedData();
        if (selectedData.length === 0) {
            alert('No hay filas seleccionadas para exportar');
            return;
        }

        performExcelExport(selectedData);
        setShowExportMenu(false);
    };

    // Exportar a Excel (todos los datos)
    const exportAllToExcel = () => {
        if (!onExportAll) {
            alert('No disponible');
            return;
        }
        exportCompleteData(performExcelExport);
    };

    const performExcelExport = (dataToExport: any[]) => {
        const visibleCols = getVisibleColumnsForExport();

        // Preparar datos para Excel
        const excelData = dataToExport.map((item: any) => {
            const row: Record<string, string> = {};
            visibleCols.forEach(col => {
                row[col.replace('Proveedor_', 'Prov. ')] = formatCellValueForExport(col, item[col]);
            });
            return row;
        });

        // Crear workbook y worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Ajustar ancho de columnas
        const colWidths = visibleCols.map(col => ({
            wch: Math.max(col.length * 2, 15)
        }));
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Datos');

        // Generar archivo
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(data, `exportacion_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Exportar a PDF (datos seleccionados)
    const exportToPDF = () => {
        const selectedData = getSelectedData();
        if (selectedData.length === 0) {
            alert('No hay filas seleccionadas para exportar');
            return;
        }

        performPDFExport(selectedData);
        setShowExportMenu(false);
    };

    // Exportar a PDF (todos los datos)
    const exportAllToPDF = () => {
        if (!onExportAll) {
            alert('No disponible');
            return;
        }
        exportCompleteData(performPDFExport);
    };

    const performPDFExport = (dataToExport: any[]) => {
        const visibleCols = getVisibleColumnsForExport();

        // Crear documento PDF
        const doc = new jsPDF({
            orientation: visibleCols.length > 6 ? 'landscape' : 'portrait',
            unit: 'mm',
        });

        // Título
        doc.setFontSize(16);
        doc.text('Reporte de Datos', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 22);
        doc.text(`Registros: ${dataToExport.length}`, 14, 28);

        // Preparar cabeceras
        const headers = visibleCols.map(col => col.replace('Proveedor_', 'Prov. '));

        // Preparar datos
        const bodyData = dataToExport.map((item: any) => {
            return visibleCols.map(col => formatCellValueForExport(col, item[col]));
        });

        // Generar tabla
        autoTable(doc, {
            head: [headers],
            body: bodyData,
            startY: 35,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak',
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            },
            margin: { top: 35 },
        });

        // Guardar PDF
        doc.save(`exportacion_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Imprimir (datos seleccionados)
    const handlePrint = () => {
        const selectedData = getSelectedData();
        if (selectedData.length === 0) {
            alert('No hay filas seleccionadas para imprimir');
            return;
        }

        performPrint(selectedData);
        setShowExportMenu(false);
    };

    // Imprimir (todos los datos)
    const handlePrintAll = () => {
        if (!onExportAll) {
            alert('No disponible');
            return;
        }
        exportCompleteData(performPrint);
    };

    const performPrint = (dataToExport: any[]) => {
        const visibleCols = getVisibleColumnsForExport();

        // Crear ventana de impresión
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, permita ventanas emergentes para imprimir');
            return;
        }

        // Generar contenido HTML
        const headers = visibleCols.map(col => col.replace('Proveedor_', 'Prov. '));

        const tableRows = dataToExport.map((item: any) => {
            return `<tr>
                ${visibleCols.map(col => `<td>${formatCellValueForExport(col, item[col])}</td>`).join('')}
            </tr>`;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte de Datos</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; }
                    .info { margin-bottom: 20px; color: #666; }
                    table { border-collapse: collapse; width: 100%; }
                    th { background-color: #2980b9; color: white; padding: 10px; text-align: left; }
                    td { border: 1px solid #ddd; padding: 8px; }
                    tr:nth-child(even) { background-color: #f5f5f5; }
                </style>
            </head>
            <body>
                <h1>Reporte de Datos</h1>
                <div class="info">
                    <p>Generado: ${new Date().toLocaleString()}</p>
                    <p>Registros: ${dataToExport.length}</p>
                </div>
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
    };

    // Formatear valor de celda (para visualización)
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
            const decimals = Number.isInteger(value) ? 0 : 2;
            return formatNumberValue(value, "number", decimals);
        }

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
                toggleRowSelection(getRowId(item));
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

    const allCurrentPageSelected = displayData.length > 0 &&
        displayData.every(item => isRowSelected(getRowId(item)));

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

                    {/* Botón de seleccionar todos */}
                    <button
                        onClick={selectAllRows}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                        {allCurrentPageSelected ? 'Deseleccionar página' : 'Seleccionar página'}
                    </button>

                    {/* Botón de exportación para datos seleccionados */}
                    {selectedRows.length > 0 && (
                        <div className="relative" ref={exportMenuRef}>
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                aria-label="Exportar datos seleccionados"
                                aria-expanded={showExportMenu}
                                aria-haspopup="true"
                                disabled={exportAllLoading}
                            >
                                <Download size={18} />
                                <span>Exportar selección ({selectedRows.length})</span>
                                <ChevronDown size={16} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showExportMenu && !exportAllLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute left-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-md shadow-lg border border-gray-200 dark:border-zinc-700 z-50"
                                        role="menu"
                                        aria-label="Opciones de exportación"
                                    >
                                        <div className="py-1">
                                            <button
                                                onClick={exportToExcel}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                                role="menuitem"
                                            >
                                                <FileSpreadsheet size={16} className="mr-3 text-green-600" />
                                                Exportar a Excel
                                            </button>
                                            <button
                                                onClick={exportToPDF}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                                role="menuitem"
                                            >
                                                <FileText size={16} className="mr-3 text-red-600" />
                                                Exportar a PDF
                                            </button>
                                            <button
                                                onClick={handlePrint}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                                role="menuitem"
                                            >
                                                <Printer size={16} className="mr-3 text-blue-600" />
                                                Imprimir
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Botón de exportación para todos los datos (todas las páginas) */}
                    {onExportAll && (
                        <div className="relative" ref={exportAllMenuRef}>
                            <button
                                onClick={() => setShowExportAllMenu(!showExportAllMenu)}
                                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                aria-label="Exportar todos los datos"
                                aria-expanded={showExportAllMenu}
                                aria-haspopup="true"
                                disabled={exportAllLoading}
                            >
                                {exportAllLoading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Download size={18} />
                                )}
                                <span>Exportar todo</span>
                                <ChevronDown size={16} className={`transition-transform ${showExportAllMenu ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showExportAllMenu && !exportAllLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute left-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-md shadow-lg border border-gray-200 dark:border-zinc-700 z-50"
                                        role="menu"
                                        aria-label="Opciones de exportación de todos los datos"
                                    >
                                        <div className="py-1">
                                            <button
                                                onClick={exportAllToExcel}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                                role="menuitem"
                                            >
                                                <FileSpreadsheet size={16} className="mr-3 text-green-600" />
                                                Exportar todo a Excel
                                            </button>
                                            <button
                                                onClick={exportAllToPDF}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                                role="menuitem"
                                            >
                                                <FileText size={16} className="mr-3 text-red-600" />
                                                Exportar todo a PDF
                                            </button>
                                            <button
                                                onClick={handlePrintAll}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                                                role="menuitem"
                                            >
                                                <Printer size={16} className="mr-3 text-blue-600" />
                                                Imprimir todo
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
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
                                        checked={allCurrentPageSelected}
                                        onChange={selectAllRows}
                                        aria-label="Seleccionar todas las filas de esta página"
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
                                    const rowId = getRowId(item);
                                    const isSelected = isRowSelected(rowId);
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
                                                    onClick={(e) => e.stopPropagation()}
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
                    {selectedRows.length} fila(s) seleccionada(s) en total
                </div>
            </div>
        </div>
    );
};

// Componente Skeleton (sin cambios)
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