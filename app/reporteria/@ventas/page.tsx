"use client";

import Pagination from "@/components/pagination";
import DynamicTable, { DataItem } from "@/components/table";
import { FilterSection } from "../components/filter-section";
import { useGetMutation } from "@/hooks/reducers/api_int";
import { LoadingSection } from "@/template/loading-screen";
import { Filter } from "lucide-react";
import { useEffect, useState, useRef } from "react"; // Añadido useRef
import { ReportType } from "../utils/types";
import { REPORT_CONFIGS } from "../constants/configs";
import { exportToExcel } from "../utils/export-excel";
import { importFromExcel } from "../utils/import-excel";

export default function User() {
  const [getData, { isLoading }] = useGetMutation();
  const fileInputRef = useRef<HTMLInputElement>(null); // Referencia para el input de archivo

  // Estado para tipo de reporte
  const [config, setConfig] = useState<ReportType>("compras");
  const [tableData, setTableData] = useState<DataItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null); // Estado para mensajes de importación

  const [activeFilters, setActiveFilters] = useState({
    Filtros: [],
    Selects: [],
    OrderBy: null,
    sum: false,
    distinct: false
  });

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
    } catch (error) {
      console.error("Error fetching data:", error);
      setTableData([]);
    }
  }

  async function exportDataToExcel() {
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

  async function importDataToExcel(file: File) {
    try {
      setImportStatus("Importando datos...");

      // 1. Importar datos del Excel
      const importedData = await importFromExcel(file);
      console.log(importedData);
      setTableData([]);
      setTableData(importedData);
      setImportStatus("Importación correcta");
    } catch (error) {
      console.error("Error al importar:", error);
      setImportStatus("Error en la importación");
    } finally {
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setImportStatus(null), 3000);
    }
  }

  // Función para activar el input de archivo
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Manejador de cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importDataToExcel(file);
    }
  };

  useEffect(() => {
    handleGetData();
  }, [page, activeFilters, config]);

  const handleApplyFilters = (newFilters: any) => {
    setActiveFilters(newFilters);
    setPage(1);
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
  };

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
            }}
          >
            {Object.entries(REPORT_CONFIGS).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.title}
              </option>
            ))}
          </select>
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
        <div className={`mb-4 px-4 py-2 rounded ${importStatus.includes("éxito")
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
        />
      )}

      {isLoading ? (
        <LoadingSection message="Cargando datos" />
      ) : (
        <DynamicTable data={tableData} />
      )}

      <Pagination
        currentPage={page}
        loading={isLoading}
        setCurrentPage={setPage}
        totalPages={totalPages}
      />
    </main>
  );
}