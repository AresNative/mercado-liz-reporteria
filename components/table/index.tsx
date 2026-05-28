"use client";

import type React from "react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
    Check,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Download,
    FileSpreadsheet,
    FileText,
    Grid2x2X,
    X,
    Printer
} from "lucide-react";
import { ViewTR, type ArrayColumnDisplay } from "./toggle-view";
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
    onRightClick?: (rowData: any) => void;
    /**
     * Si se pasa, el componente llama este callback cada vez que el usuario
     * cambia la columna de orden, para que el padre pueda re-fetchear desde
     * el servidor con el nuevo ORDER BY.
     */
    onSortChange?: (column: string, direction: "asc" | "desc") => void;
}

// ── Helpers de tipo de columna ─────────────────────────────────────────────────

const isDateColumn = (key: string) => {
    const k = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return k.includes("fecha") || k.includes("date");
};

const isPercentageColumn = (key: string) => {
    const k = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return k.includes("porcentaje") || key.includes("IVA") || key.includes("IEPS");
};

const isCurrencyColumn = (key: string) => {
    const k = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return (
        k.includes("price") || k.includes("precio") || k.includes("diferencia") ||
        k.includes("puja") || k.includes("importe") || k.includes("costo") ||
        k.includes("venta") || k.includes("compra") || k.includes("utilidad") ||
        k.includes("margen") || k.includes("comprado") || k.includes("ticket")
    );
};

// ── Icono de sort ──────────────────────────────────────────────────────────────

const SortIcon = ({
    column,
    sortColumn,
    sortDirection,
}: {
    column: string;
    sortColumn: string | null;
    sortDirection: "asc" | "desc";
}) => {
    if (sortColumn !== column)
        return <ChevronsUpDown size={12} className="opacity-25 shrink-0" />;
    return sortDirection === "asc"
        ? <ChevronUp size={12} className="text-blue-500 shrink-0" />
        : <ChevronDown size={12} className="text-blue-500 shrink-0" />;
};

// ── Componente principal ───────────────────────────────────────────────────────

const DynamicTable: React.FC<DynamicTableProps> = ({
    data,
    loading = false,
    onRowClick,
    onRightClick,
    onSortChange,
}) => {
    const tableRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const [showExportMenu, setShowExportMenu] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [selectedRowsData, setSelectedRowsData] = useState<Map<string, any>>(new Map());
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [showColumnMenu, setShowColumnMenu] = useState<string | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
    // Modo de visualización para columnas cuyo valor es un array (ej. ["PEPE", "00020"])
    const [arrayDisplayModes, setArrayDisplayModes] = useState<Record<string, ArrayColumnDisplay>>({});

    const handleArrayDisplayChange = useCallback((col: string, mode: ArrayColumnDisplay) => {
        setArrayDisplayModes(prev => ({ ...prev, [col]: mode }));
    }, []);

    // Cerrar menú de exportación al hacer clic fuera
    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node))
                setShowExportMenu(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    // Detectar datos agrupados (con Pujas)
    const isGroupedData = useMemo(
        () => data.length > 0 && data[0].Pujas && Array.isArray(data[0].Pujas),
        [data]
    );

    const baseColumns = useMemo(
        () => (data.length === 0 ? [] : Object.keys(data[0]).filter(k => k !== 'Pujas')),
        [data]
    );

    const providerColumns = useMemo(() => {
        if (!isGroupedData || !data[0]?.Pujas?.length) return [];
        return data[0].Pujas.map((p: any) => `Proveedor_${p.Proveedor.replace('#', '')}`);
    }, [data, isGroupedData]);

    const columns = useMemo(() => [...baseColumns, ...providerColumns], [baseColumns, providerColumns]);

    const displayData = useMemo(() => {
        if (!isGroupedData) return data;
        return data.map(item => {
            const row = { ...item };
            delete row.Pujas;
            item.Pujas?.forEach((p: any) => {
                row[`Proveedor_${p.Proveedor.replace('#', '')}`] = { puja: p.Puja, cantidad: p.Cantidad };
            });
            return row;
        });
    }, [data, isGroupedData]);

    // Inicializar / sincronizar columnas visibles
    useEffect(() => {
        setVisibleColumns(prev =>
            columns.reduce((acc, col) => {
                acc[col] = col in prev ? prev[col] : true;
                return acc;
            }, {} as Record<string, boolean>)
        );
    }, [columns]);

    // Resetear sort cuando llegan datos nuevos desde el padre
    useEffect(() => {
        setSortColumn(null);
        setSortDirection("desc");
    }, [data]);

    // ── Sort ───────────────────────────────────────────────────────────────────

    const toggleSort = useCallback(
        (column: string) => {
            setSortColumn(prevCol => {
                const newDir: "asc" | "desc" = prevCol === column
                    ? (sortDirection === "asc" ? "desc" : "asc")
                    : "desc";
                setSortDirection(newDir);
                onSortChange?.(column, newDir);
                return column;
            });
        },
        [sortDirection, onSortChange]
    );

    const filteredAndSortedData = useMemo(() => {
        return [...displayData].sort((a, b) => {
            if (!sortColumn) return 0;
            const av = a[sortColumn];
            const bv = b[sortColumn];
            if (av === bv) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            const cmp = av < bv ? -1 : 1;
            return sortDirection === "asc" ? cmp : -cmp;
        });
    }, [displayData, sortColumn, sortDirection]);

    // ── Selección ──────────────────────────────────────────────────────────────

    const getRowId = useCallback((item: any): string => item.ID || JSON.stringify(item), []);
    const isRowSelected = useCallback((id: string) => selectedRows.has(id), [selectedRows]);

    const toggleRowSelection = (rowId: string, rowData: any) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (next.has(rowId)) {
                next.delete(rowId);
                setSelectedRowsData(d => { const n = new Map(d); n.delete(rowId); return n; });
            } else {
                next.add(rowId);
                setSelectedRowsData(d => new Map(d).set(rowId, rowData));
            }
            return next;
        });
    };

    const allCurrentPageSelected =
        displayData.length > 0 && displayData.every(item => isRowSelected(getRowId(item)));

    const selectAllRows = () => {
        const ids = displayData.map(item => getRowId(item));
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (allCurrentPageSelected) {
                ids.forEach(id => {
                    next.delete(id);
                    setSelectedRowsData(d => { const n = new Map(d); n.delete(id); return n; });
                });
            } else {
                ids.forEach(id => {
                    if (!next.has(id)) {
                        next.add(id);
                        const rd = displayData.find(i => getRowId(i) === id);
                        if (rd) setSelectedRowsData(d => new Map(d).set(id, rd));
                    }
                });
            }
            return next;
        });
    };

    const clearAllSelections = () => { setSelectedRows(new Set()); setSelectedRowsData(new Map()); };
    const getSelectedData = useCallback(() => Array.from(selectedRowsData.values()), [selectedRowsData]);
    const toggleColumn = (col: string) => setVisibleColumns(p => ({ ...p, [col]: !p[col] }));
    const getVisibleColumnsForExport = () => columns.filter(c => visibleColumns[c]);

    // ── Formateo ───────────────────────────────────────────────────────────────

    const formatCellValueForExport = (key: string, value: any): string => {
        if (value == null) return '-';
        // ── Array con modo de display configurable ────────────────────────────
        if (Array.isArray(value)) {
            const mode = arrayDisplayModes[key] ?? "both";
            if (mode === "first") return String(value[0] ?? "");
            if (mode === "second") return String(value[1] ?? "");
            return value.map(String).join(" / ");
        }
        if (typeof value === 'object' && 'puja' in value)
            return `Puja: ${formatNumberValue(value.puja, "currency", 2)} | Cant.: ${formatNumberValue(value.cantidad, "number", 2)}`;
        if (typeof value === 'boolean') return value ? 'Sí' : 'No';
        if (key.toLowerCase() === 'file' && typeof value === 'object') return value?.fileName || 'Archivo';
        if (isDateColumn(key)) {
            try { const d = new Date(value); return isNaN(d.getTime()) ? String(value) : formatDateDisplay(d); }
            catch { return String(value); }
        }
        if (isPercentageColumn(key) && typeof value === 'number') return formatNumberValue(value, "percentage", 2);
        if (isCurrencyColumn(key) && typeof value === 'number') return formatNumberValue(value, "currency", 2);
        if (typeof value === 'number') return formatNumberValue(value, "number", Number.isInteger(value) ? 0 : 2);
        return String(value);
    };

    const formatCellValue = (key: string, value: any): React.ReactNode => {
        if (value == null) return <span className="text-gray-300 dark:text-gray-600">—</span>;
        // ── Array con modo de display configurable ────────────────────────────
        if (Array.isArray(value)) {
            const mode = arrayDisplayModes[key] ?? "both";
            if (mode === "first") return <span>{String(value[0] ?? "—")}</span>;
            if (mode === "second") return <span>{String(value[1] ?? "—")}</span>;
            // "both"
            return (
                <div className="flex flex-col text-xs leading-tight">
                    <span>{String(value[0] ?? "—")}</span>
                    <span className="text-gray-400 dark:text-gray-500">{String(value[1] ?? "—")}</span>
                </div>
            );
        }
        if (typeof value === 'object' && 'puja' in value)
            return (
                <div className="flex flex-col text-xs leading-tight">
                    <span>Puja: {formatNumberValue(value.puja, "currency", 2)}</span>
                    <span className="text-gray-400">Cant.: {formatNumberValue(value.cantidad, "number", 2)}</span>
                </div>
            );
        if (typeof value === 'boolean') return value ? <Check size={15} className="text-green-500" /> : <X size={15} className="text-red-500" />;
        if (key.toLowerCase() === 'file' && typeof value === 'object')
            return value?.content
                ? <Download size={15} className="text-blue-500 hover:text-blue-700 cursor-pointer"
                    onClick={() => { const a = document.createElement('a'); a.href = `data:${value.contentType};base64,${value.content}`; a.download = value.fileName || 'file'; a.click(); }} />
                : <X size={15} className="text-gray-400" />;
        if (isDateColumn(key)) {
            try { const d = new Date(value); return isNaN(d.getTime()) ? value : formatDateDisplay(d); }
            catch { return value; }
        }
        if (isPercentageColumn(key) && typeof value === 'number') return formatNumberValue(value, "percentage", 2);
        if (isCurrencyColumn(key) && typeof value === 'number') return formatNumberValue(value, "currency", 2);
        if (typeof value === 'number') return formatNumberValue(value, "number", Number.isInteger(value) ? 0 : 2);
        return String(value);
    };

    // ── Exportación ────────────────────────────────────────────────────────────

    const performExcelExport = (rows: any[]) => {
        const cols = getVisibleColumnsForExport();
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows.map(item => {
            const row: Record<string, string> = {};
            cols.forEach(c => { row[c.replace('Proveedor_', 'Prov. ')] = formatCellValueForExport(c, item[c]); });
            return row;
        }));
        ws['!cols'] = cols.map(c => ({ wch: Math.max(c.length * 2, 15) }));
        XLSX.utils.book_append_sheet(wb, ws, 'Datos');
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
            `exportacion_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const performPDFExport = (rows: any[]) => {
        const cols = getVisibleColumnsForExport();
        const doc = new jsPDF({ orientation: cols.length > 6 ? 'landscape' : 'portrait', unit: 'mm' });
        doc.setFontSize(16); doc.text('Reporte de Datos', 14, 15);
        doc.setFontSize(10); doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 22);
        autoTable(doc, {
            head: [cols.map(c => c.replace('Proveedor_', 'Prov. '))],
            body: rows.map(item => cols.map(c => formatCellValueForExport(c, item[c]))),
            startY: 30,
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });
        doc.save(`exportacion_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const performPrint = (rows: any[]) => {
        const cols = getVisibleColumnsForExport();
        const win = window.open('', '_blank');
        if (!win) { alert('Permite ventanas emergentes para imprimir'); return; }
        win.document.write(`<!DOCTYPE html><html><head><title>Reporte</title>
        <style>body{font-family:Arial,sans-serif;margin:20px}
        table{border-collapse:collapse;width:100%}
        th{background:#2980b9;color:#fff;padding:8px;text-align:left}
        td{border:1px solid #ddd;padding:6px}
        tr:nth-child(even){background:#f5f5f5}</style></head><body>
        <h2>Reporte de Datos</h2><p>Generado: ${new Date().toLocaleString()} | Registros: ${rows.length}</p>
        <table><thead><tr>${cols.map(c => `<th>${c.replace('Proveedor_', 'Prov. ')}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(item => `<tr>${cols.map(c => `<td>${formatCellValueForExport(c, item[c])}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></body></html>`);
        win.document.close(); win.print();
    };

    const exportToExcel = () => { const d = getSelectedData(); if (!d.length) { alert('No hay filas seleccionadas'); return; } performExcelExport(d); setShowExportMenu(false); };
    const exportToPDF = () => { const d = getSelectedData(); if (!d.length) { alert('No hay filas seleccionadas'); return; } performPDFExport(d); setShowExportMenu(false); };
    const handlePrint = () => { const d = getSelectedData(); if (!d.length) { alert('No hay filas seleccionadas'); return; } performPrint(d); setShowExportMenu(false); };

    // ── Teclado ────────────────────────────────────────────────────────────────

    const handleRowKeyDown = (e: React.KeyboardEvent, item: any, index: number) => {
        if (e.key === "ArrowDown") { e.preventDefault(); (document.querySelector(`[data-row-index="${index + 1}"]`) as HTMLElement)?.focus(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); (document.querySelector(`[data-row-index="${index - 1}"]`) as HTMLElement)?.focus(); }
        else if (e.key === "Enter") { e.preventDefault(); onRowClick?.(item); }
        else if (e.key === " ") { e.preventDefault(); toggleRowSelection(getRowId(item), item); }
    };

    // ── Renders condicionales ──────────────────────────────────────────────────

    if (loading) return <TableSkeleton />;
    if (displayData.length === 0)
        return (
            <div className="w-full">
                <section className="w-fit text-center py-6 m-auto flex gap-2 text-gray-400 dark:text-gray-500">
                    <Grid2x2X /> Sin datos disponibles
                </section>
            </div>
        );

    return (
        <div className="w-full space-y-3 relative" ref={tableRef}>

            {/* ── Toolbar ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200 dark:border-zinc-700 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <ViewTR
                        setShowColumnMenu={setShowColumnMenu}
                        column="toggle"
                        toggleColumn={toggleColumn}
                        showColumnMenu={showColumnMenu}
                        visibleColumns={visibleColumns}
                        allColumns={true}
                    />
                    <button
                        onClick={selectAllRows}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 transition-colors"
                    >
                        {allCurrentPageSelected ? 'Deseleccionar página' : 'Seleccionar página'}
                    </button>
                    {selectedRows.size > 0 && (
                        <button
                            onClick={clearAllSelections}
                            className="px-2.5 py-1.5 flex gap-1 items-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 transition-colors"
                        >
                            Deseleccionar todos <X size={12} className="text-red-500" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Indicador de sort activo con botón para limpiar */}
                    {sortColumn && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                            {sortDirection === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            <span className="font-medium">{sortColumn}</span>
                            <button
                                onClick={() => { setSortColumn(null); setSortDirection("desc"); }}
                                className="ml-0.5 hover:text-red-500 transition-colors"
                                title="Quitar orden"
                            >
                                <X size={10} />
                            </button>
                        </span>
                    )}

                    {/* Botón de exportar (solo cuando hay selección) */}
                    {selectedRows.size > 0 && (
                        <div className="relative" ref={exportMenuRef}>
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                            >
                                <Download size={13} />
                                Exportar ({selectedRows.size})
                                <ChevronDown size={11} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showExportMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.12 }}
                                        className="absolute right-0 mt-1 w-52 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 z-50"
                                    >
                                        <div className="py-1">
                                            {[
                                                { label: 'Exportar a Excel', icon: <FileSpreadsheet size={14} className="text-green-600" />, action: exportToExcel },
                                                { label: 'Exportar a PDF', icon: <FileText size={14} className="text-red-600" />, action: exportToPDF },
                                                { label: 'Imprimir', icon: <Printer size={14} className="text-blue-600" />, action: handlePrint },
                                            ].map(opt => (
                                                <button
                                                    key={opt.label}
                                                    onClick={opt.action}
                                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                                >
                                                    {opt.icon} {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Tabla ─────────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50 dark:bg-zinc-900">
                            <tr>
                                {/* Checkbox global */}
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                                    <input
                                        type="checkbox"
                                        className="border-gray-300 dark:border-zinc-600 text-blue-600"
                                        checked={allCurrentPageSelected}
                                        onChange={selectAllRows}
                                    />
                                </th>

                                {columns.map(column => visibleColumns[column] && (
                                    <th
                                        key={column}
                                        className="relative px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            {/*
                                             * ── Sort directo en el encabezado ──────────────────────────
                                             * Click en el nombre de columna → ordena ASC/DESC en el cliente.
                                             * Si se pasa onSortChange, también notifica al padre para
                                             * que re-fetchee desde el servidor con el nuevo ORDER BY.
                                             */}
                                            <button
                                                onClick={() => toggleSort(column)}
                                                className={cn(
                                                    "flex items-center gap-0.5 hover:text-gray-900 dark:hover:text-white transition-colors rounded px-0.5",
                                                    sortColumn === column
                                                        ? "text-blue-600 dark:text-blue-400 font-semibold"
                                                        : "text-gray-500 dark:text-gray-400"
                                                )}
                                                title={`Ordenar por ${column}`}
                                            >
                                                <span className="tracking-wider">
                                                    {column.replace('Proveedor_', 'Prov. ')}
                                                </span>
                                                <SortIcon
                                                    column={column}
                                                    sortColumn={sortColumn}
                                                    sortDirection={sortDirection}
                                                />
                                            </button>

                                            {/* Toggle visibilidad */}
                                            <ViewTR
                                                setShowColumnMenu={setShowColumnMenu}
                                                column={column}
                                                toggleColumn={toggleColumn}
                                                showColumnMenu={showColumnMenu}
                                                visibleColumns={visibleColumns}
                                                isArrayColumn={Array.isArray(displayData[0]?.[column])}
                                                arrayDisplayMode={arrayDisplayModes[column] ?? "both"}
                                                onArrayDisplayChange={handleArrayDisplayChange}
                                            />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                            <AnimatePresence>
                                {filteredAndSortedData.map((item, index) => {
                                    const rowId = getRowId(item);
                                    const isSelected = isRowSelected(rowId);
                                    return (
                                        <motion.tr
                                            key={index}
                                            data-row-index={index}
                                            tabIndex={0}
                                            role="row"
                                            aria-selected={isSelected}
                                            className={cn(
                                                "transition-colors",
                                                onRowClick && "cursor-pointer",
                                                "hover:bg-zinc-50 dark:hover:bg-zinc-700/40",
                                                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                                                isSelected && "bg-blue-50 dark:bg-blue-900/20"
                                            )}
                                            onClick={() => onRowClick?.(item)}
                                            onKeyDown={e => handleRowKeyDown(e, item, index)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.12 }}
                                        >
                                            <td className="px-4 py-3 w-40">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600"
                                                    checked={isSelected}
                                                    onChange={() => toggleRowSelection(rowId, item)}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            </td>

                                            {columns.map(column => visibleColumns[column] && (
                                                <td
                                                    key={`${column}`}
                                                    className={cn(
                                                        "px-2 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white",
                                                        // Resaltar la columna actualmente ordenada
                                                        sortColumn === column &&
                                                        "bg-blue-50/40 dark:bg-blue-900/10"
                                                    )}
                                                >
                                                    {formatCellValue(column, item[column])}
                                                </td>
                                            ))}
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pie */}
            <div className="text-xs text-gray-400 dark:text-gray-500 px-1">
                {selectedRows.size > 0
                    ? <span className="text-blue-600 dark:text-blue-400 font-medium">{selectedRows.size} fila(s) seleccionada(s)</span>
                    : `${filteredAndSortedData.length} registro(s)`}
            </div>
        </div>
    );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const TableSkeleton = () => (
    <div className="w-full space-y-3 animate-pulse">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-zinc-600">
            <div className="h-6 w-36 bg-gray-200 dark:bg-zinc-700 rounded" />
            <div className="h-6 w-6 bg-gray-200 dark:bg-zinc-700 rounded" />
        </div>
        <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <th key={i} className="px-4 py-3">
                                <div className="h-3 w-20 bg-gray-300 dark:bg-zinc-700 rounded" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                    {Array.from({ length: 5 }).map((_, r) => (
                        <tr key={r}>
                            {Array.from({ length: 5 }).map((_, c) => (
                                <td key={c} className="px-4 py-3">
                                    <div className="h-3 w-full bg-gray-200 dark:bg-zinc-700 rounded" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default DynamicTable;