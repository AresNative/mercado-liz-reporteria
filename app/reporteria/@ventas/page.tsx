"use client";

import Pagination from "@/components/pagination";
import DynamicTable, { DataItem } from "@/components/table";
import { FilterSection } from "../components/filter-section"; // Ruta al componente
import { useGetMutation } from "@/hooks/reducers/api_int";
import { LoadingSection } from "@/template/loading-screen";
import { Filter } from "lucide-react";
import { useEffect, useState } from "react";

export default function User() {
  const [getData, { isLoading }] = useGetMutation();
  const [config] = useState('ventas');
  const [tableData, setTableData] = useState<DataItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Estado para almacenar los filtros activos
  const [activeFilters, setActiveFilters] = useState({
    Filtros: [],
    Selects: [],
    OrderBy: null
  });

  async function handleGetData() {
    try {
      const { data } = await getData({
        url: `reporteria/${config}`,
        pageSize: 10,
        page: page,
        sum: false,
        distinct: false,
        signal: undefined,
        filters: activeFilters
      });

      const processedData = data.data.map((item: DataItem, index: number) => ({
        // Asegurarse de que cada item tenga un ID único
        ID: item.ID || index, ...item,
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
  }, [page, activeFilters]);

  // Manejar aplicación de nuevos filtros
  const handleApplyFilters = (newFilters: any) => {
    setActiveFilters(newFilters);
    setPage(1);
  };

  // Manejar reset de filtros
  const handleResetFilters = () => {
    setActiveFilters({
      Filtros: [],
      Selects: [],
      OrderBy: null
    });
    setPage(1);
  };

  return (
    <main className="flex flex-col items-center max-w-7xl m-auto px-4 py-8">
      <section className="w-full mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reporte de Ventas</h1>
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

      {isLoading ? (<LoadingSection message="Cargando datos" />) : (<DynamicTable data={tableData} />)}

      <Pagination
        currentPage={page}
        loading={isLoading}
        setCurrentPage={setPage}
        totalPages={totalPages}
      />
    </main>
  );
}