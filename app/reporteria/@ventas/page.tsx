"use client";

import Pagination from "@/components/pagination";
import DynamicTable, { DataItem } from "@/components/table";
import { FilterSection } from "../components/filter-section";
import { useGetMutation } from "@/hooks/reducers/api_int";
import { LoadingSection } from "@/template/loading-screen";
import { Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { ReportType } from "../utils/types";
import { REPORT_CONFIGS } from "../constants/configs";

export default function User() {
  const [getData, { isLoading }] = useGetMutation();

  // Estado para tipo de reporte
  const [config, setConfig] = useState<ReportType>("compras");

  const [tableData, setTableData] = useState<DataItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    handleGetData();
  }, [page, activeFilters, config]);

  const handleApplyFilters = (newFilters: any) => {
    console.log(newFilters);

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
              setPage(1); // Reinicia la paginación al cambiar el tipo de reporte
            }}
          >
            {Object.entries(REPORT_CONFIGS).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.title}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          <Filter size={18} />
          {showFilters ? "Ocultar" : "Mostrar"}
        </button>
      </section>

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
