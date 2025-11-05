"use client";

import Pagination from "@/components/pagination";
import DynamicTable, { DataItem } from "@/components/table";
import { FilterSection } from "../components/filter-section";
import { useGetWithFiltersGeneralIntelisisMutation } from "@/hooks/reducers/api_int";
import { LoadingSection } from "@/template/loading-screen";
import { Filter, X, Download, Upload, Database, FileText, Store, TrendingUp } from "lucide-react";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { ReportType, ReporteriaFilters, SelectType } from "../utils/types";
import { REPORT_CONFIGS } from "../constants/configs";
import { exportToExcel } from "../utils/export-excel";
import { importFromExcel } from "../utils/import-excel";
import Badge from "@/components/badge";

// Tamaño de página para datos importados
const IMPORT_PAGE_SIZE = 10;

// Interface para la respuesta de la API
interface ApiResponse {
  totalRecords: number;
  totalPages: number;
  pageSize: number;
  page: number;
  data: DataItem[];
}

export default function ReportsDashboard() {
  const [getData, { isLoading }] = useGetWithFiltersGeneralIntelisisMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para tipo de reporte
  const [config, setConfig] = useState<ReportType>("compras");
  const [tableData, setTableData] = useState<DataItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"api" | "imported">("api");
  const [importedData, setImportedData] = useState<DataItem[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [activeFilters, setActiveFilters] = useState<ReporteriaFilters>({
    Filtros: [],
    Selects: [],
    OrderBy: { Key: "", Direction: "asc" }
  });

  // Obtener configuración actual del reporte
  const currentConfig = useMemo(() => REPORT_CONFIGS[config], [config]);

  // Datos paginados para importados
  const paginatedImportedData = useMemo(() => {
    if (dataSource !== "imported") return [];
    const start = (page - 1) * IMPORT_PAGE_SIZE;
    return importedData.slice(start, start + IMPORT_PAGE_SIZE);
  }, [importedData, page, dataSource]);

  // Total de páginas para datos importados
  const importedTotalPages = useMemo(() => {
    return Math.ceil(importedData.length / IMPORT_PAGE_SIZE);
  }, [importedData]);

  // Función principal para obtener datos
  const handleGetData = useCallback(async (filters: ReporteriaFilters = activeFilters) => {
    try {
      // Usar los selects base de la configuración actual
      const baseSelects = currentConfig.baseSelects.map(select => ({ Key: select.Key }));

      // Combinar selects base con los selects de filtros
      const combinedSelects = [
        ...baseSelects,
        ...filters.Selects.filter((select: SelectType) =>
          select.Key && !baseSelects.some(base => base.Key === select.Key)
        )
      ];

      // Filtros base + filtros adicionales
      const baseFilters = [
        {
          Key: "Cantidad",
          Value: "0",
          Operator: ">"
        }
      ];

      const combinedFilters: ReporteriaFilters = {
        ...filters,
        Filtros: [...baseFilters, ...filters.Filtros],
        Selects: combinedSelects,
        OrderBy: filters.OrderBy.Key ? filters.OrderBy : {
          Key: "FechaEmision",
          Direction: "desc"
        }
      };

      const payload = {
        table: currentConfig.table,
        pageSize: 10,
        page,
        signal: undefined,
        filtros: combinedFilters
      };

      const response: ApiResponse = await getData(payload).unwrap();

      // Manejar la respuesta correctamente
      const { data, totalPages: responseTotalPages, page: responsePage } = response;

      const processedData = data.map((item: DataItem, index: number) => ({
        ID: item.ID || `row-${index}-${Date.now()}`,
        ...item,
      }));

      setTotalPages(responseTotalPages || 1);
      setPage(responsePage || 1);
      setTableData(processedData);
      setDataSource("api");
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
      setTableData([]);
      setTotalPages(1);
    }
  }, [currentConfig, page, activeFilters, getData]);

  const handleApplyFilters = useCallback((newFilters: any) => {
    const reporteriaFilters: ReporteriaFilters = {
      Filtros: newFilters.Filtros || [],
      Selects: newFilters.Selects || [],
      OrderBy: newFilters.OrderBy || { Key: "", Direction: "asc" }
    };

    setActiveFilters(reporteriaFilters);
    setPage(1);
    setDataSource("api");
  }, []);

  // Función para resetear filtros
  const handleResetFilters = useCallback(() => {
    const resetFilters: ReporteriaFilters = {
      Filtros: [],
      Selects: [],
      OrderBy: { Key: "", Direction: "asc" }
    };
    setActiveFilters(resetFilters);
    setPage(1);
    setDataSource("api");
  }, []);

  // Exportar datos
  const exportDataToExcel = useCallback(async () => {
    try {
      if (dataSource === "imported") {
        exportToExcel(importedData, `${config}_imported_data.xlsx`);
      } else {
        // Usar selects base para exportación
        const baseSelects = currentConfig.baseSelects.map(select => ({ Key: select.Key }));

        const exportFilters: ReporteriaFilters = {
          ...activeFilters,
          Selects: [...baseSelects, ...activeFilters.Selects],
          Filtros: [
            {
              Key: "Cantidad",
              Value: "0",
              Operator: ">"
            },
            ...activeFilters.Filtros
          ],
          OrderBy: activeFilters.OrderBy
        };

        const response: ApiResponse = await getData({
          table: currentConfig.table,
          pageSize: 100000,
          page: 1,
          signal: undefined,
          filtros: exportFilters
        }).unwrap();

        exportToExcel(response.data, `${config}_report.xlsx`);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      setImportStatus("Error al exportar datos");
      setTimeout(() => setImportStatus(null), 3000);
    }
  }, [dataSource, importedData, config, currentConfig, activeFilters, getData]);

  // Importar datos
  const importDataToExcel = useCallback(async (file: File) => {
    try {
      setImportStatus("Importando datos...");
      const imported = await importFromExcel(file);
      setImportedData(imported);
      setDataSource("imported");
      setPage(1);
      setImportStatus("Datos importados correctamente");
    } catch (error) {
      console.error("Error al importar:", error);
      setImportStatus("Error en la importación");
    } finally {
      setTimeout(() => setImportStatus(null), 3000);
    }
  }, []);

  // Regresar a datos de API
  const returnToApiData = useCallback(() => {
    setDataSource("api");
    setPage(1);
    handleGetData();
  }, [handleGetData]);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importDataToExcel(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [importDataToExcel]);

  // Efecto para cargar datos cuando cambian las dependencias
  useEffect(() => {
    if (dataSource === "api") {
      handleGetData();
    }
  }, [page, config, dataSource, handleGetData]);

  const columns = useMemo(() => {
    return tableData.length > 0 ? Object.keys(tableData[0]).filter(Boolean) : [];
  }, [tableData]);

  // Obtener almacenes únicos para el filtro de sucursal
  const uniqueStores = useMemo(() => {
    const stores = tableData.map(item => item.Almacen).filter(Boolean);
    return [...new Set(stores)] as string[];
  }, [tableData]);

  // Estadísticas mejoradas
  const stats = useMemo(() => {
    if (dataSource === "imported") {
      return {
        totalRecords: importedData.length,
        currentPage: page,
        totalPages: importedTotalPages,
        showingRecords: paginatedImportedData.length
      };
    }

    return {
      totalRecords: tableData.length * totalPages, // Estimación
      currentPage: page,
      totalPages: totalPages,
      showingRecords: tableData.length
    };
  }, [dataSource, importedData.length, page, importedTotalPages, paginatedImportedData.length, tableData.length, totalPages]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <section className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Database className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Reporte de {currentConfig.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {dataSource === "api" ? "Datos en tiempo real" : "Datos importados"}
                  {lastRefresh && ` • Actualizado: ${lastRefresh.toLocaleTimeString()}`}
                </p>
              </div>
            </div>

            {/* Report Type Selector */}
            <div className="flex items-center gap-3">
              <label htmlFor="report-type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de reporte:
              </label>
              <select
                id="report-type"
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={config}
                onChange={(e) => {
                  setConfig(e.target.value as ReportType);
                  setPage(1);
                  setDataSource("api");
                  handleResetFilters();
                }}
              >
                {Object.entries(REPORT_CONFIGS).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.title.charAt(0).toUpperCase() + cfg.title.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Cards Mejoradas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded">
                  <FileText className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de registros</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {stats.totalRecords.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded">
                  <Database className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mostrando</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {stats.showingRecords} reg.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded">
                  <Filter className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Filtros activos</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {activeFilters.Filtros.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded">
                  <Store className="text-orange-600 dark:text-orange-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sucursales</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {uniqueStores.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              {dataSource === "imported" && (
                <div className="flex items-center gap-2">
                  <Badge color="green" text="Viendo datos importados" />
                  <button
                    onClick={returnToApiData}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 transition-colors p-1 rounded"
                    title="Regresar a datos en tiempo real"
                  >
                    <X size={12} />
                    Regresar
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportDataToExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <Download size={18} />
                Exportar
              </button>

              <button
                onClick={triggerFileInput}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Upload size={18} />
                Importar
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Filter size={18} />
                {showFilters ? "Ocultar" : "Mostrar"} Filtros
              </button>

              <button
                onClick={() => handleGetData()}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Actualizar
              </button>
            </div>
          </div>
        </section>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".xlsx, .xls, .csv"
        />

        {/* Import status */}
        {importStatus && (
          <div className={`mb-4 p-3 rounded-lg ${importStatus.includes("correctamente")
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-red-100 text-red-700 border border-red-200"
            }`}>
            {importStatus}
          </div>
        )}

        {/* Filters Section */}
        {showFilters && (
          <FilterSection
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            config={config}
            filterFunction={getData}
            cols={columns}
            availableStores={uniqueStores}
          />
        )}

        {/* Data Table */}
        <section className="bg-white dark:bg-zinc-800 p-2 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
          {isLoading ? (
            <LoadingSection message="Cargando datos..." />
          ) : (
            <>
              <DynamicTable
                data={dataSource === "imported" ? paginatedImportedData : tableData}
              />

              {/* Pagination */}
              {(dataSource === "imported" ? importedTotalPages > 1 : totalPages > 1) && (
                <div className="border-t border-gray-200 dark:border-zinc-700 p-4">
                  <Pagination
                    currentPage={page}
                    loading={isLoading}
                    setCurrentPage={setPage}
                    totalPages={dataSource === "imported" ? importedTotalPages : totalPages}
                  />
                </div>
              )}
            </>
          )}
        </section>

        {/* Empty State */}
        {!isLoading && tableData.length === 0 && dataSource === "api" && (
          <div className="text-center py-12">
            <Database className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No hay datos disponibles
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {activeFilters.Filtros.length > 0
                ? "Intenta ajustar los filtros para ver más resultados"
                : "No se encontraron registros para este reporte"
              }
            </p>
            {activeFilters.Filtros.length > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}