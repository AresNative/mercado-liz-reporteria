"use client";

import Pagination from "@/components/pagination";
import DynamicTable, { DataItem } from "@/components/table";
import { FilterSection } from "../components/filter-section";
import { useGetMutation } from "@/hooks/reducers/api_int";
import { LoadingSection } from "@/template/loading-screen";
import { ChartBar, Eye, EyeOff, Filter, RotateCcw, Sliders, X } from "lucide-react"; // Añadido X para el botón de regresar
import { useEffect, useState, useRef, useMemo } from "react"; // Añadido useMemo
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
  id: string
  title: string
  type: "stat" | "chart" | "list"
  size: "small" | "medium" | "large"
  visible: boolean
  position: number
}

interface DashboardConfig {
  widgets: DashboardWidget[]
  layout: "grid" | "masonry"
}

interface CustomizationSettings {
  theme: "light" | "dark" | "auto"
  accentColor: string
  compactMode: boolean
  showAnimations: boolean
  autoRefresh: boolean
  refreshInterval: number
  defaultView: "grid" | "list" | "cards"
}

const defaultConfig: DashboardConfig = {
  widgets: [
    { id: "stats", title: "Totales", type: "stat", size: "large", visible: true, position: 0 },
    { id: "chart", title: "Grafica", type: "chart", size: "medium", visible: true, position: 2 },
    { id: "table", title: "Tabla", type: "list", size: "medium", visible: true, position: 3 },
  ],
  layout: "grid",
}

const defaultCustomizationSettings: CustomizationSettings = {
  theme: "light",
  accentColor: "#3B82F6",
  compactMode: false,
  showAnimations: true,
  autoRefresh: true,
  refreshInterval: 30,
  defaultView: "grid",
}

export default function User() {
  const [configPerzonalization, setConfigPerzonalization] = useState<DashboardConfig>(defaultConfig)
  const [getData, { isLoading }] = useGetMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [areaData, setAreaData] = useState<any[]>([]); // Datos para el gráfico de área
  const [showCustomization, setShowCustomization] = useState(false)
  // Estado para tipo de reporte
  const [config, setConfig] = useState<ReportType>("compras");
  const [tableData, setTableData] = useState<DataItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"api" | "imported">("api"); // Origen de los datos
  const [importedData, setImportedData] = useState<DataItem[]>([]); // Datos importados completos
  const [total, setTotal] = useState(0);
  const [cantidad, setCantidad] = useState(0);
  const [activeFilters, setActiveFilters] = useState({
    Filtros: [],
    Selects: [],
    OrderBy: null,
    sum: false,
    distinct: false
  });
  const toggleWidgetVisibility = (widgetId: string) => {
    setConfigPerzonalization((prev) => ({
      ...prev,
      widgets: prev.widgets.map((widget) =>
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget,
      ),
    }))
  }
  const resetConfig = () => {
    setConfigPerzonalization(defaultConfig)
  }
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

  // Mapeo de nombres de meses a su número correspondiente
  const monthMap: Record<string, number> = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
    'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
  };
  async function handleGetData() {
    try {
      const { sum, distinct, ...others } = activeFilters;
      const filters = others.Filtros;
      const orderBy = others.OrderBy;

      // Configuración base para todas las solicitudes
      const baseConfig = {
        url: `reporteria/${config}`,
        signal: undefined,
        filters: { Filtros: filters, OrderBy: orderBy, Selects: others.Selects },
      };

      // Ejecutar todas las solicitudes en paralelo
      const [tableRes, summaryRes, chartRes] = await Promise.all([
        // Datos de tabla
        getData({
          ...baseConfig,
          pageSize: 10,
          page,
          sum,
          distinct
        }),

        // Resumen
        getData({
          ...baseConfig,
          pageSize: 1,
          page: 1,
          sum: true,
          distinct: false,
          filters: {
            ...baseConfig.filters,
            Selects: [{ key: "" }]
          }
        }),

        // Datos para gráfico
        getData({
          ...baseConfig,
          pageSize: 100, // Suficiente para varios años
          page: 1,
          sum: true,
          distinct: true,
          filters: {
            ...baseConfig.filters,
            Selects: [{ Key: 'Mes' }, { Key: 'Año' }]
          }
        })
      ]);

      // Procesar datos de resumen
      const amountKey = Object.entries(REPORT_CONFIGS)
        .find(([_, cfg]) => cfg.type === config)?.[1]?.amountKey || 'CostoTotal';

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
            order: monthMap[item.Mes] || 0, // Convertir nombre del mes a número
            monthName: item.Mes
          }))
          .sort((a: any, b: any) => a.order - b.order);

        return {
          name: year,
          data: sortedData.map((item: any) => ({
            x: item.monthName,
            y: item[amountKey] || 0,
            order: item.order // Para referencia
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
      setPage(tableRes.data.page);
      setTableData(processedData);
      setDataSource("api");

    } catch (error: any) {
      setTableData([]);
      setTotal(0);
      setCantidad(0);
      console.error("Error fetching data:", error);
    }
  }

  async function exportDataToExcel() {
    if (dataSource === "imported") {
      // Exportar datos importados
      exportToExcel(importedData, `${config}_imported_data.xlsx`);
    } else {
      // Exportar datos de API
      const { sum, distinct, ...others } = activeFilters;
      const { data } = await getData({
        url: `reporteria/${config}`,
        pageSize: 100000,
        page: 1,
        sum,
        distinct,
        signal: undefined,
        filters: others
      });
      exportToExcel(data.data, `${config}_report.xlsx`);
    }
  }

  async function importDataToExcel(file: File) {
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
  }

  // Regresar a datos de API
  const returnToApiData = () => {
    setDataSource("api");
    setPage(1);
    handleGetData(); // Recargar datos de API
  };

  // Función para activar el input de archivo
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Manejador de cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importDataToExcel(file);
      // Limpiar input para permitir cargar el mismo archivo nuevamente
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (dataSource === "api") {
      handleGetData();
    }
  }, [page, activeFilters, config, dataSource]);

  const handleApplyFilters = (newFilters: any) => {
    setActiveFilters(newFilters);
    setPage(1);
    setDataSource("api"); // Volver a modo API al aplicar filtros
  };

  const handleResetFilters = () => {
    setActiveFilters({
      Filtros: [],
      Selects: [],
      OrderBy: null,
      sum: false,
      distinct: false
    });
    setPage(1);
    setDataSource("api"); // Volver a modo API al resetear filtros
  };

  const columns = useMemo(() => {
    return tableData.length > 0 ? Object.keys(tableData[0]).filter(Boolean) : [];
  }, [tableData]);

  const visibleWidgets = configPerzonalization.widgets.filter((w) => w.visible).sort((a, b) => a.position - b.position)


  const renderWidget = (widget: DashboardWidget, key: any) => {
    switch (widget.id) {
      case "stats":
        return <section key={key} className="max-w-7xl w-full flex flex-col md:flex-row gap-4">
          {total > 0 && (<Card title="Total" icon={<ChartBar className="text-white" />} value={formatValue(total, "currency")} />)}
          {cantidad > 0 && (<Card title="Cantidad" icon={<ChartBar className="text-white" />} value={formatValue(cantidad, "number")} />)}
        </section>

      case "chart":
        return <section key={key} className="max-w-7xl w-full mx-auto mt-4">
          <RenderChart
            type="area"
            barData={areaData}
            treemapData={[]}
            Categories={monthMap ? Object.keys(monthMap) : []}
          />
        </section>

      case "table":
        return <section key={key} className="mt-4 w-full">
          <DynamicTable
            data={dataSource === "imported" ? paginatedImportedData : tableData}
          />
        </section>
      default:
        return null
    }
  }
  return (
    <main className="flex flex-col items-center m-auto px-4 py-8">
      <section className="w-full mb-6 flex justify-between gap-2 items-center">
        <div className="flex md:flex-row flex-col justify-between gap-4">
          <h1 className="text-xl font-bold">Reporte de {config}</h1>
          <select
            className="border border-gray-300 bg-white rounded px-2 py-1"
            value={config}
            onChange={(e) => {
              setConfig(e.target.value as ReportType);
              setPage(1);
              setDataSource("api"); // Volver a modo API al cambiar config
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
            <section className="items-center gap-1 ml-4 ">
              <Badge color="green" text="Viendo datos importados" />
              <button
                onClick={returnToApiData}
                className="flex items-center cursor-pointer text-xs gap-1 text-red-900 hover:text-red-700"
              >
                <X size={10} />
                Regresar
              </button>
            </section>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 sm:grid-cols-1 gap-2">
          <button
            onClick={exportDataToExcel}
            className="bg-green-600 items-center cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Exportar
          </button>
          <button
            onClick={triggerFileInput}
            className="bg-purple-600 items-center cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Importar
          </button>
          <button
            onClick={() => setShowCustomization(!showCustomization)}
            className="flex items-center gap-2 bg-white cursor-pointer text-gray-800 dark:text-gray-200 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            <Sliders size={18} />
            Personalizar
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-gray-600 cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            <Filter size={18} />
            {showFilters ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </section>

      <AnimatePresence>
        {showCustomization && (
          <motion.section
            id="customization-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white w-full shadow border rounded-lg mb-4 sm:mb-6 overflow-hidden"
            aria-labelledby="customization-title"
          >
            <header className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center">
                <h3 id="customization-title" className="text-base sm:text-lg font-medium text-gray-900">
                  Personalizar Pantalla
                </h3>
                <button
                  onClick={resetConfig}
                  className="flex items-center px-3 py-1 text-sm text-gray-600 dark:text-gray-100 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <RotateCcw className="h-4 w-4 mr-1" aria-hidden="true" />
                  Restablecer
                </button>
              </div>
            </header>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
                {configPerzonalization.widgets.map((widget) => (
                  <article key={widget.id} className="border border-gray-200 rounded-lg p-3 sm:p-4" role="listitem">
                    <header className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 text-sm">{widget.title}</h4>
                      <button
                        onClick={() => toggleWidgetVisibility(widget.id)}
                        className={`p-1 rounded focus:ring-2 cursor-pointer focus:ring-blue-500 focus:ring-offset-2 ${widget.visible ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-600 dark:text-gray-100"
                          }`}
                        aria-label={`${widget.visible ? "Ocultar" : "Mostrar"} ${widget.title}`}
                      >
                        {widget.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </header>
                    {/* <div className="space-y-2">
                      <fieldset>
                        <legend className="block text-xs font-medium text-gray-700 mb-1">Tamaño</legend>
                       <div className="flex space-x-1" role="radiogroup" aria-label={`Tamaño de ${widget.title}`}>
                          {["small", "medium", "large"].map((size) => (
                            <button
                              key={size}
                              onClick={() => changeWidgetSize(widget.id, size as any)}
                          className = {`px-2 py-1 text-xs rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${widget.size === size
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600 dark:text-gray-100 hover:bg-gray-200"
                            }`}
                        role="radio"
                        aria-checked={widget.size === size}
                        aria-label={`Tamaño ${size}`}
                            >
                        {size === "small" && <Minimize2 className="h-3 w-3" />}
                        {size === "medium" && <div className="h-3 w-3 border border-gray-400" />}
                        {size === "large" && <Maximize2 className="h-3 w-3" />}
                      </button>
                          ))}
                    </div> 
                      </fieldset>
                    </div>*/}
                  </article>
                ))}
              </div>
            </div>
          </motion.section>
        )
        }
      </AnimatePresence >

      {/* Input oculto para selección de archivos */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
      />

      {/* Mensaje de estado de importación */}
      {
        importStatus && (
          <div className={`mb-4 px-4 py-2 rounded ${importStatus.includes("correctamente")
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
            }`}>
            {importStatus}
          </div>
        )
      }
      <AnimatePresence>
        {showFilters && (<motion.section
          id="customization-panel"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white w-full shadow rounded-lg mb-4 sm:mb-6 overflow-hidden"
          aria-labelledby="customization-title"
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
      ) : (<>
        <AnimatePresence>{visibleWidgets.map((widget, key) => renderWidget(widget, key))}</AnimatePresence>
      </>
      )}


      <Pagination
        currentPage={page}
        loading={isLoading}
        setCurrentPage={setPage}
        totalPages={dataSource === "imported" ? importedTotalPages : totalPages}
      />
    </main >
  );
}
