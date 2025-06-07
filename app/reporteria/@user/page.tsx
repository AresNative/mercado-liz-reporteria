"use client";

import Pagination from "@/components/pagination";
import DynamicTable, { DataItem } from "@/components/table";
import { useGetMutation } from "@/hooks/reducers/api_int";
import { LoadingScreen } from "@/template/loading-screen";
import { ChevronDown, Filter, X } from "lucide-react";
import { useEffect, useState } from "react";

// Tipos para los filtros
type FilterType = {
  Key: string;
  Value: string;
  Operator: string;
};

type SelectType = {
  Key: string;
};

type OrderByType = {
  Key: string;
  Direction: "asc" | "desc";
};

export default function User() {
  const [getData] = useGetMutation();
  const [config] = useState('ventas');
  const [tableData, setTableData] = useState<DataItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Estados para los filtros
  const [filters, setFilters] = useState<FilterType[]>([
    { Key: "", Value: "", Operator: "" }
  ]);
  const [selects, setSelects] = useState<SelectType[]>([
    { Key: "" }
  ]);
  const [orderBy, setOrderBy] = useState<OrderByType>({
    Key: "",
    Direction: "asc"
  });

  async function handleGetData() {
    setIsLoading(true);
    try {
      const { data } = await getData({
        url: `reporteria/${config}`,
        pageSize: 10,
        page: page,
        sum: false,
        distinct: false,
        signal: undefined,
        filters: {
          Filtros: filters.filter(f => f.Key && f.Operator),
          Selects: selects.filter(s => s.Key),
          OrderBy: orderBy.Key ? orderBy : null
        },
      });

      const processedData = data.data.map((item: DataItem, index: number) => ({
        ...item,
        ID: item.ID || index
      }));

      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
      setTableData(processedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    handleGetData();
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    handleGetData();
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters([{ Key: "", Value: "", Operator: "" }]);
    setSelects([{ Key: "" }]);
    setOrderBy({ Key: "", Direction: "asc" });
    setPage(1);
    handleGetData();
  };

  // Funciones para manejar filtros dinámicos
  const addFilter = () => {
    setFilters([...filters, { Key: "", Value: "", Operator: "" }]);
  };

  const removeFilter = (index: number) => {
    if (filters.length <= 1) return;
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  const updateFilter = (index: number, field: keyof FilterType, value: string) => {
    const newFilters = [...filters];
    newFilters[index][field] = value;
    setFilters(newFilters);
  };

  const addSelect = () => {
    setSelects([...selects, { Key: "" }]);
  };

  const removeSelect = (index: number) => {
    if (selects.length <= 1) return;
    const newSelects = [...selects];
    newSelects.splice(index, 1);
    setSelects(newSelects);
  };

  const updateSelect = (index: number, value: string) => {
    const newSelects = [...selects];
    newSelects[index].Key = value;
    setSelects(newSelects);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <main className="flex flex-col items-center max-w-6xl m-auto px-4 py-8">
      <div className="w-full mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reporte de Ventas</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          <Filter size={18} />
          {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
        </button>
      </div>

      {showFilters && (
        <div className="w-full mb-8 bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sección Filtros */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center justify-between">
                Filtros
                <button
                  onClick={addFilter}
                  className="text-sm bg-green-700 text-white px-2 py-1 rounded"
                >
                  + Agregar
                </button>
              </h3>

              {filters.map((filter, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-3">
                  <div className="col-span-5">
                    <input
                      value={filter.Key}
                      onChange={(e) => updateFilter(index, "Key", e.target.value)}
                      placeholder="Campo"
                      className="w-full px-3 py-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                    />
                  </div>

                  <div className="col-span-3">
                    <select
                      value={filter.Operator}
                      onChange={(e) => updateFilter(index, "Operator", e.target.value)}
                      className="w-full px-3 py-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                    >
                      <option value="">Operador</option>
                      <option value="=">Igual a</option>
                      <option value="<>">Diferente</option>
                      <option value=">">Mayor que</option>
                      <option value="<">Menor que</option>
                      <option value=">=">Mayor o igual a</option>
                      <option value="<=">Menor o igual a</option>
                      <option value="like">Precido</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <input
                      value={filter.Value}
                      onChange={(e) => updateFilter(index, "Value", e.target.value)}
                      placeholder="Valor"
                      className="w-full px-3 py-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                    />
                  </div>

                  <div className="col-span-1 flex items-center">
                    <button
                      onClick={() => removeFilter(index)}
                      disabled={filters.length <= 1}
                      className="text-red-500 disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sección Selects */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center justify-between">
                Campos a Mostrar
                <button
                  onClick={addSelect}
                  className="text-sm bg-green-700 text-white px-2 py-1 rounded"
                >
                  + Agregar
                </button>
              </h3>

              {selects.map((select, index) => (
                <div key={index} className="flex gap-2 mb-3">
                  <input
                    value={select.Key}
                    onChange={(e) => updateSelect(index, e.target.value)}
                    placeholder="Nombre del campo"
                    className="flex-1 px-3 py-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                  />
                  <button
                    onClick={() => removeSelect(index)}
                    disabled={selects.length <= 1}
                    className="text-red-500 disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Sección Order By */}
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-3">Ordenar por</h3>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-5">
                  <input
                    value={orderBy.Key}
                    onChange={(e) => setOrderBy({ ...orderBy, Key: e.target.value })}
                    placeholder="Campo para ordenar"
                    className="w-full px-3 py-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                  />
                </div>

                <div className="col-span-5">
                  <select
                    value={orderBy.Direction}
                    onChange={(e) => setOrderBy({
                      ...orderBy,
                      Direction: e.target.value as "asc" | "desc"
                    })}
                    className="w-full px-3 py-2 border rounded dark:bg-zinc-700 dark:border-zinc-600"
                  >
                    <option value="asc">Ascendente (A-Z)</option>
                    <option value="desc">Descendente (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition"
            >
              Restablecer
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <DynamicTable data={tableData} />
      </div>

      <Pagination
        currentPage={page}
        loading={isLoading}
        setCurrentPage={setPage}
        totalPages={totalPages}
      />
    </main>
  );
}