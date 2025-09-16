"use client";

import Pagination from "@/components/pagination";
import DynamicTable, { DataItem } from "@/components/table";
import { FilterSection } from "../components/filter-section";
import { useGetMutation } from "@/hooks/reducers/api_int";
import { LoadingSection } from "@/template/loading-screen";
import { ChartBar, Eye, EyeOff, Filter, RotateCcw, Sliders, X, Download, Upload } from "lucide-react";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { ReportType } from "../utils/types";
import { REPORT_CONFIGS } from "../constants/configs";
import { exportToExcel } from "../utils/export-excel";
import { importFromExcel } from "../utils/import-excel";
import Badge from "@/components/badge";
import { RenderChart } from "../components/render-grafic";
import Card from "@/components/card";
import { formatValue } from "@/utils/constants/format-values";
import { AnimatePresence, motion } from "framer-motion";

// Tamaño de página para datos importados
const IMPORT_PAGE_SIZE = 10;

interface DashboardWidget {
  id: string;
  title: string;
  type: "stat" | "chart" | "list";
  size: "small" | "medium" | "large";
  visible: boolean;
  position: number;
}

interface DashboardConfig {
  widgets: DashboardWidget[];
  layout: "grid" | "masonry";
}

// Definir tipos para las estructuras de filtros
interface BusquedaParams {
  Key: string;
  Value: string;
  Operator?: string;
}

interface SelectParams {
  Key: string;
}

interface AgregacionParams {
  Key: string;
  Operation?: string;
  Alias?: string;
}

interface OrderParams {
  Key: string;
  Direction?: string;
}

interface Filters {
  Filtros: BusquedaParams[];
  Selects: SelectParams[];
  Agregaciones: AgregacionParams[];
  OrderBy?: OrderParams | null;
}

const defaultConfig: DashboardConfig = {
  widgets: [
    { id: "stats", title: "Totales", type: "stat", size: "large", visible: true, position: 0 },
    { id: "chart", title: "Gráfica", type: "chart", size: "medium", visible: true, position: 2 },
    { id: "table", title: "Tabla", type: "list", size: "medium", visible: true, position: 3 },
  ],
  layout: "grid",
};

// Mapeo de nombres de meses a su número correspondiente
const monthMap: Record<string, number> = {
  'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
  'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
};

// Columnas específicas para cada tipo de consulta
const getSummaryColumns = (config: ReportType): AgregacionParams[] => {
  const amountKey = REPORT_CONFIGS[config]?.amountKey || 'CostoTotal';
  return [
    { Key: "Cantidad", Operation: "SUM", Alias: "Cantidad" },
    { Key: amountKey, Operation: "SUM", Alias: amountKey }
  ];
};

const getChartColumns = (config: ReportType): (SelectParams | AgregacionParams)[] => {
  const amountKey = REPORT_CONFIGS[config]?.amountKey || 'CostoTotal';
  return [
    { Key: "Año" },
    { Key: "Mes" },
    { Key: amountKey, Operation: "SUM", Alias: amountKey }
  ];
};

export default function ReporteriaDashboard() {
  const [configPerzonalization, setConfigPerzonalization] = useState<DashboardConfig>(defaultConfig);
  const [getData, { isLoading }] = useGetMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [areaData, setAreaData] = useState<any[]>([]);
  const [showCustomization, setShowCustomization] = useState(false);
  const [config, setConfig] = useState<ReportType>("compras");
  const [tableData, setTableData] = useState<DataItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"api" | "imported">("api");
  const [importedData, setImportedData] = useState<DataItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cantidad, setCantidad] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Filters>({
    Filtros: [],
    Selects: [],
    Agregaciones: [],
    OrderBy: null,
  });

  const toggleWidgetVisibility = (widgetId: string) => {
    setConfigPerzonalization((prev) => ({
      ...prev,
      widgets: prev.widgets.map((widget) =>
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget,
      ),
    }));
  };

  const resetConfig = () => {
    setConfigPerzonalization(defaultConfig);
  };

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

  const handleGetData = useCallback(async () => {
    try {
      const { Filtros, Selects, Agregaciones, OrderBy } = activeFilters;

      // Configuración base para todas las solicitudes
      const baseFilters = {
        Filtros: Filtros,
        Selects: Selects,
        Agregaciones: Agregaciones,
        OrderBy: OrderBy ? OrderBy : {
          Key: "FechaEmision",
          Direction: "desc"
        }
      };

      // Ejecutar todas las solicitudes en paralelo
      const [tableRes, summaryRes, chartRes] = await Promise.all([
        // Datos de tabla
        getData({
          url: config,
          filters: baseFilters,
          pageSize: 10,
          page: page,
        }),

        // Resumen - con columnas específicas para agregación
        getData({
          url: config,
          filters: {
            ...baseFilters,
            OrderBy: {
              "Key": REPORT_CONFIGS[config]?.amountKey,
              "Direction": "desc"
            },
            Agregaciones: getSummaryColumns(config)
          },
          pageSize: 1,
          page: 1,
        }),

        // Datos para gráfico - con columnas específicas para agrupamiento
        getData({
          url: config,
          filters: {
            ...baseFilters,
            OrderBy: {
              "Key": REPORT_CONFIGS[config]?.amountKey,
              "Direction": "desc"
            },
            Selects: getChartColumns(config).filter(col => !('Operation' in col)) as SelectParams[],
            Agregaciones: getChartColumns(config).filter(col => 'Operation' in col) as AgregacionParams[],
          },
          pageSize: 100,
          page: 1,
        })
      ]);

      // Verificar si hay errores en las respuestas
      if (tableRes.error || summaryRes.error || chartRes.error) {
        console.error("Error en alguna de las respuestas:", tableRes.error || summaryRes.error || chartRes.error);
        return;
      }

      // Procesar datos de resumen
      const amountKey = REPORT_CONFIGS[config]?.amountKey || 'CostoTotal';
      const summaryData = summaryRes.data?.data?.[0] || {};

      setTotal(summaryData[amountKey] || 0);
      setCantidad(summaryData.Cantidad || 0);

      // Procesar datos para gráfico
      const chartData = chartRes.data?.data || [];
      const groupedByYear = chartData.reduce((acc: Record<string, any[]>, item: any) => {
        const year = item.Año;
        if (!acc[year]) acc[year] = [];
        acc[year].push(item);
        return acc;
      }, {});

      const yearSeries = Object.entries(groupedByYear).map(([year, yearData]: any) => {
        // Ordenar por número de mes
        const sortedData = yearData
          .map((item: any) => ({
            ...item,
            order: monthMap[item.Mes?.toLowerCase()] || 0,
            monthName: item.Mes
          }))
          .sort((a: any, b: any) => a.order - b.order);

        return {
          name: year,
          data: sortedData.map((item: any) => ({
            x: item.monthName,
            y: item[amountKey] || 0,
            order: item.order
          }))
        };
      });

      setAreaData(yearSeries);

      // Procesar datos de tabla
      const processedData = tableRes.data.data.map((item: DataItem, index: number) => ({
        ID: item.ID || index,
        ...item,
      }));

      setTotalPages(tableRes.data.totalPages || 1);
      setPage(tableRes.data.page || 1);
      setTableData(processedData);
      setDataSource("api");

    } catch (error: any) {
      setTableData([]);
      setTotal(0);
      setCantidad(0);
      console.error("Error fetching data:", error);
    }
  }, [config, page, activeFilters, getData]);

  const exportDataToExcel = useCallback(async () => {
    try {
      if (dataSource === "imported") {
        // Exportar datos importados
        exportToExcel(importedData, `${config}_imported_data.xlsx`);
      } else {
        // Exportar datos de API
        const { Filtros, Selects, Agregaciones, OrderBy } = activeFilters;

        const { data } = await getData({
          url: config,
          filters: {
            Filtros: Filtros,
            Selects: Selects,
            Agregaciones: Agregaciones,
            OrderBy: OrderBy ? OrderBy : {
              Key: "FechaEmision",
              Direction: "desc"
            }
          },
          pageSize: 100000,
          page: 1,
        });

        exportToExcel(data.data, `${config}_report.xlsx`);
      }
    } catch (error) {
      console.error("Error al exportar:", error);
      setImportStatus("Error en la exportación");
      setTimeout(() => setImportStatus(null), 3000);
    }
  }, [config, dataSource, importedData, activeFilters, getData]);

  const importDataToExcel = useCallback(async (file: File) => {
    try {
      setImportStatus("Importando datos...");

      // 1. Importar datos del Excel
      const imported = await importFromExcel(file);

      // 2. Almacenar datos importados completos
      setImportedData(imported);

      // 3. Cambiar a modo importado
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

  // Función para activar el input de archivo
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Manejador de cambio de archivo
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importDataToExcel(file);
      // Limpiar input para permitir cargar el mismo archivo nuevamente
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [importDataToExcel]);

  const handleApplyFilters = useCallback((newFilters: Filters) => {
    setActiveFilters(newFilters);
    setPage(1);
    setDataSource("api");
  }, []);

  const handleResetFilters = useCallback(() => {
    setActiveFilters({
      Filtros: [],
      Selects: [],
      Agregaciones: [],
      OrderBy: {
        "Key": REPORT_CONFIGS[config]?.amountKey,
        "Direction": "desc"
      },
    });
    setPage(1);
    setDataSource("api");
  }, []);

  const columns = useMemo(() => {
    return tableData.length > 0 ? Object.keys(tableData[0]).filter(Boolean) : [];
  }, [tableData]);

  const visibleWidgets = configPerzonalization.widgets.filter((w) => w.visible).sort((a, b) => a.position - b.position);

  const renderWidget = (widget: DashboardWidget, key: any) => {
    switch (widget.id) {
      case "stats":
        return (
          <section key={key} className="max-w-7xl w-full flex flex-col md:flex-row gap-4">
            {total > 0 && (
              <Card
                title="Total"
                icon={<ChartBar className="text-white" />}
                value={formatValue(total, "currency")}
              />
            )}
            {cantidad > 0 && (
              <Card
                title="Cantidad"
                icon={<ChartBar className="text-white" />}
                value={formatValue(cantidad, "number")}
              />
            )}
          </section>
        );

      case "chart":
        return (
          <section key={key} className="max-w-7xl w-full mx-auto mt-4">
            {areaData.length > 0 ? (
              <RenderChart
                type="area"
                barData={areaData}
                treemapData={[]}
                Categories={Object.keys(monthMap)}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay datos disponibles para mostrar la gráfica
              </div>
            )}
          </section>
        );

      case "table":
        return (
          <section key={key} className="mt-4 w-full max-w-7xl mx-auto overflow-x-auto">
            <DynamicTable
              data={dataSource === "imported" ? paginatedImportedData : tableData}
            />
          </section>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (dataSource === "api") {
      handleGetData();
    }
  }, [page, activeFilters, config, dataSource, handleGetData]);

  return (
    <main className="flex flex-col items-center m-auto px-4 py-8 max-w-screen-2xl">
      <section className="w-full mb-6 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <h1 className="text-xl font-bold">Reporte de {REPORT_CONFIGS[config]?.title || config}</h1>

          <select
            className="border border-gray-300 bg-white rounded px-3 py-2"
            value={config}
            onChange={(e) => {
              setConfig(e.target.value as ReportType);
              setPage(1);
              setDataSource("api");
            }}
          >
            {Object.entries(REPORT_CONFIGS).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.title}
              </option>
            ))}
          </select>

          {/* Indicador de fuente de datos */}
          {dataSource === "imported" && (
            <div className="flex items-center gap-2">
              <Badge color="green" text="Viendo datos importados" />
              <button
                onClick={returnToApiData}
                className="flex items-center cursor-pointer text-xs gap-1 text-red-600 hover:text-red-800"
                aria-label="Regresar a datos de la API"
              >
                <X size={14} />
                Regresar
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={exportDataToExcel}
            className="flex items-center justify-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition text-sm"
            aria-label="Exportar datos"
          >
            <Download size={16} />
            Exportar
          </button>

          <button
            onClick={triggerFileInput}
            className="flex items-center justify-center gap-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition text-sm"
            aria-label="Importar datos"
          >
            <Upload size={16} />
            Importar
          </button>

          <button
            onClick={() => setShowCustomization(!showCustomization)}
            className="flex items-center justify-center gap-1 bg-white text-gray-800 dark:text-gray-200 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm"
            aria-label="Personalizar dashboard"
          >
            <Sliders size={16} />
            Personalizar
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
            aria-label="Mostrar/ocultar filtros"
          >
            <Filter size={16} />
            {showFilters ? "Ocultar" : "Filtros"}
          </button>
        </div>
      </section>

      <AnimatePresence>
        {showCustomization && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white w-full shadow border rounded-lg mb-4 overflow-hidden"
            aria-labelledby="customization-title"
          >
            <header className="px-4 py-3 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 id="customization-title" className="text-base font-medium text-gray-900">
                  Personalizar Dashboard
                </h3>
                <button
                  onClick={resetConfig}
                  className="flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                  aria-label="Restablecer configuración"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Restablecer
                </button>
              </div>
            </header>

            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {configPerzonalization.widgets.map((widget) => (
                  <article key={widget.id} className="border border-gray-200 rounded-lg p-3">
                    <header className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{widget.title}</h4>
                      <button
                        onClick={() => toggleWidgetVisibility(widget.id)}
                        className={`p-1 rounded cursor-pointer ${widget.visible
                          ? "text-green-600 hover:text-green-700"
                          : "text-gray-400 hover:text-gray-600"
                          }`}
                        aria-label={`${widget.visible ? "Ocultar" : "Mostrar"} ${widget.title}`}
                      >
                        {widget.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </header>
                  </article>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Input oculto para selección de archivos */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        aria-hidden="true"
      />

      {/* Mensaje de estado de importación */}
      {importStatus && (
        <div className={`mb-4 px-4 py-2 rounded ${importStatus.includes("correctamente")
          ? "bg-green-100 text-green-700 border border-green-200"
          : "bg-red-100 text-red-700 border border-red-200"
          }`}>
          {importStatus}
        </div>
      )}

      <AnimatePresence>
        {showFilters && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white w-full shadow rounded-lg mb-4 overflow-hidden max-w-7xl"
          >
            <FilterSection
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
              config={config}
              filterFunction={getData}
              cols={columns}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {isLoading ? (
        <LoadingSection message="Cargando datos" />
      ) : (
        <>
          <AnimatePresence mode="wait">
            {visibleWidgets.map((widget, index) => (
              <motion.div
                key={widget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="w-full flex justify-center"
              >
                {renderWidget(widget, index)}
              </motion.div>
            ))}
          </AnimatePresence>
        </>
      )}

      {(tableData.length > 0 || paginatedImportedData.length > 0) && (
        <div className="mt-6 w-full max-w-7xl">
          <Pagination
            currentPage={page}
            loading={isLoading}
            setCurrentPage={setPage}
            totalPages={dataSource === "imported" ? importedTotalPages : totalPages}
          />
        </div>
      )}
    </main>
  );
}