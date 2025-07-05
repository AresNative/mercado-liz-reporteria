"use client";

import Pagination from "@/components/pagination";
import DynamicTable, { DataItem } from "@/components/table";
import { FilterSection } from "../components/filter-section";
import { useGetMutation } from "@/hooks/reducers/api_int";
import { LoadingSection } from "@/template/loading-screen";
import { Filter, X } from "lucide-react"; // Añadido X para el botón de regresar
import { useEffect, useState, useRef, useMemo } from "react"; // Añadido useMemo
import { ReportType } from "../utils/types";
import { REPORT_CONFIGS } from "../constants/configs";
import { exportToExcel } from "../utils/export-excel";
import { importFromExcel } from "../utils/import-excel";
import Badge from "@/components/badge";

// Tamaño de página para datos importados
const IMPORT_PAGE_SIZE = 10;

export default function User() {
  const [getData, { isLoading }] = useGetMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para tipo de reporte
  const [config, setConfig] = useState<ReportType>("almacen");
  const [tableData, setTableData] = useState<DataItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"api" | "imported">("api"); // Origen de los datos
  const [importedData, setImportedData] = useState<DataItem[]>([]); // Datos importados completos

  const [activeFilters, setActiveFilters] = useState({
    Filtros: [],
    Selects: [],
    OrderBy: null,
    sum: false,
    distinct: false
  });

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

  async function handleGetData() {
    try {
      const { sum, distinct, ...others } = activeFilters;
      const { data } = await getData({
        url: `reporteria/${config}`,
        pageSize: 10,
        page,
        sum,
        distinct,
        signal: undefined,
        filters: others
      });

      const processedData = data.data.map((item: DataItem, index: number) => ({
        ID: item.ID || index,
        ...item,
      }));

      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
      setTableData(processedData);
      setDataSource("api"); // Asegurar que estamos en modo API
    } catch (error) {
      console.error("Error fetching data:", error);
      setTableData([]);
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

  return (
    <main className="flex flex-col items-center max-w-7xl m-auto px-4 py-8">
      <section className="w-full mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Reporte de {config}</h1>
          <select
            className="border border-gray-300 rounded px-2 py-1"
            value={config}
            onChange={(e) => {
              setConfig(e.target.value as ReportType);
              setPage(1);
              setDataSource("api"); // Volver a modo API al cambiar config
            }}
          >
            <option value="almacen">almacen</option>
            <option value="mermas">mermas</option>
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

        <div className="flex gap-2">
          <button
            onClick={exportDataToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Exportar
          </button>
          <button
            onClick={triggerFileInput}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Importar
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            <Filter size={18} />
            {showFilters ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </section>

      {/* Input oculto para selección de archivos */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
      />

      {/* Mensaje de estado de importación */}
      {importStatus && (
        <div className={`mb-4 px-4 py-2 rounded ${importStatus.includes("correctamente")
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
          }`}>
          {importStatus}
        </div>
      )}

      {showFilters && (
        <FilterSection
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          config={config}
          filterFunction={getData}
          cols={columns}
        />
      )}

      {isLoading ? (
        <LoadingSection message="Cargando datos" />
      ) : (
        <DynamicTable
          data={dataSource === "imported" ? paginatedImportedData : tableData}
        />
      )}

      <Pagination
        currentPage={page}
        loading={isLoading}
        setCurrentPage={setPage}
        totalPages={dataSource === "imported" ? importedTotalPages : totalPages}
      />
    </main>
  );
}