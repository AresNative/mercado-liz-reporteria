"use client"

import {
  Filter,
  Search,
  Plus,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Download,
  FileText,
  Calendar,
  Building,
  Package,
  Users,
  CreditCard,
  Wallet
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersGeneralMutation } from "@/hooks/reducers/api"
import { LoadingSection } from "@/template/loading-screen"
import Pagination from "@/components/pagination"
import DynamicTable from "@/components/table"
import { Modal } from "@/components/modal"
import { BentoGrid, BentoItem } from "@/components/bento-grid"

// Interfaces para los datos de contaduría
interface Transaccion {
  id: number;
  tipo: 'venta' | 'compra' | 'gasto' | 'ingreso';
  descripcion: string;
  monto: number;
  fecha: string;
  referencia: string;
  estado: string;
  categoria: string;
}

interface ReporteFinanciero {
  ingresos_totales: number;
  gastos_totales: number;
  utilidad_neta: number;
  margen_utilidad: number;
  ventas_mes_actual: number;
  ventas_mes_anterior: number;
  crecimiento_ventas: number;
}

interface Filtro {
  Key: string;
  Value: any;
  Operator: string;
}

interface ActiveFilters {
  Filtros: Filtro[];
  Selects: any[];
  OrderBy: any | null;
  sum: boolean;
  distinct: boolean;
}

interface FiltrosForm {
  search: string;
  tipo: string;
  categoria: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
}

// Componente para el formulario de filtros
const FiltrosContabilidad = ({ onSubmit, register }: {
  onSubmit: () => void;
  register: any;
}) => {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="hidden md:flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            {...register("search")}
            placeholder="Buscar transacción..."
            className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <select
          {...register("tipo")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[150px]"
        >
          <option value="">Todos los tipos</option>
          <option value="venta">Ventas</option>
          <option value="compra">Compras</option>
          <option value="gasto">Gastos</option>
          <option value="ingreso">Ingresos</option>
        </select>

        <select
          {...register("categoria")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[150px]"
        >
          <option value="">Todas las categorías</option>
          <option value="operativo">Operativo</option>
          <option value="administrativo">Administrativo</option>
          <option value="comercial">Comercial</option>
          <option value="financiero">Financiero</option>
        </select>

        <select
          {...register("estado")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[140px]"
        >
          <option value="">Todos los estados</option>
          <option value="completado">Completado</option>
          <option value="pendiente">Pendiente</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            {...register("fecha_inicio")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Fecha inicio"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            {...register("fecha_fin")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Fecha fin"
          />
        </div>

        <button type="submit" className="flex items-center rounded-md px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap">
          <Filter className="mr-1 h-4 w-4" />
          Filtrar
        </button>
      </div>

      {/* Versión móvil */}
      <div className="md:hidden space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            {...register("search")}
            placeholder="Buscar transacción..."
            className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select
            {...register("tipo")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos tipos</option>
            <option value="venta">Ventas</option>
            <option value="compra">Compras</option>
            <option value="gasto">Gastos</option>
            <option value="ingreso">Ingresos</option>
          </select>

          <select
            {...register("categoria")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todas categorías</option>
            <option value="operativo">Operativo</option>
            <option value="administrativo">Administrativo</option>
            <option value="comercial">Comercial</option>
            <option value="financiero">Financiero</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select
            {...register("estado")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos estados</option>
            <option value="completado">Completado</option>
            <option value="pendiente">Pendiente</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <button type="submit" className="flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Filter className="mr-1 h-4 w-4" />
            Filtrar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            {...register("fecha_inicio")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Inicio"
          />
          <input
            type="date"
            {...register("fecha_fin")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Fin"
          />
        </div>
      </div>
    </form>
  );
};

// Hook personalizado para la gestión de transacciones
const useTransacciones = () => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [getWithFilter] = useGetWithFiltersGeneralMutation();

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    Filtros: [],
    Selects: [],
    OrderBy: null,
    sum: false,
    distinct: false
  });

  const fetchTransacciones = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulamos datos de transacciones (en producción esto vendría de la API)
      const mockData: Transaccion[] = [
        {
          id: 1,
          tipo: 'venta',
          descripcion: 'Venta de productos electrónicos',
          monto: 15000,
          fecha: '2024-01-15',
          referencia: 'V-001',
          estado: 'completado',
          categoria: 'comercial'
        },
        {
          id: 2,
          tipo: 'compra',
          descripcion: 'Compra de materia prima',
          monto: 8000,
          fecha: '2024-01-14',
          referencia: 'C-001',
          estado: 'completado',
          categoria: 'operativo'
        },
        {
          id: 3,
          tipo: 'gasto',
          descripcion: 'Pago de nómina',
          monto: 25000,
          fecha: '2024-01-10',
          referencia: 'G-001',
          estado: 'completado',
          categoria: 'administrativo'
        },
        {
          id: 4,
          tipo: 'ingreso',
          descripcion: 'Intereses bancarios',
          monto: 1200,
          fecha: '2024-01-08',
          referencia: 'I-001',
          estado: 'completado',
          categoria: 'financiero'
        }
      ];

      setTransacciones(mockData);
      setTotalPages(1);
      setTotalRecords(mockData.length);
    } catch (err) {
      console.error("Error fetching transacciones:", err);
      setError("No se pudieron cargar las transacciones. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, activeFilters, getWithFilter]);

  useEffect(() => {
    fetchTransacciones();
  }, [fetchTransacciones]);

  return {
    transacciones,
    currentPage,
    totalPages,
    totalRecords,
    isLoading,
    error,
    setCurrentPage,
    setActiveFilters,
    refetch: fetchTransacciones
  };
};

// Hook para reportes financieros
const useReportesFinancieros = () => {
  const [reporte, setReporte] = useState<ReporteFinanciero | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReporte = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulamos datos del reporte financiero
      const mockReporte: ReporteFinanciero = {
        ingresos_totales: 185000,
        gastos_totales: 125000,
        utilidad_neta: 60000,
        margen_utilidad: 32.4,
        ventas_mes_actual: 185000,
        ventas_mes_anterior: 162000,
        crecimiento_ventas: 14.2
      };

      setReporte(mockReporte);
    } catch (err) {
      console.error("Error fetching reporte financiero:", err);
      setError("No se pudieron cargar los reportes financieros.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReporte();
  }, [fetchReporte]);

  return {
    reporte,
    isLoading,
    error,
    refetch: fetchReporte
  };
};

// Componente para estadísticas financieras
const EstadisticasFinancieras = ({ reporte }: { reporte: ReporteFinanciero }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <BentoGrid cols={4} className="mb-6">
      <BentoItem
        title="Ingresos Totales"
        description="Este mes"
        className="bg-green-50 border-green-200"
        icon={<TrendingUp className="h-6 w-6 text-green-600" />}
      >
        <div className="text-2xl font-bold text-green-600">
          {formatCurrency(reporte.ingresos_totales)}
        </div>
      </BentoItem>

      <BentoItem
        title="Gastos Totales"
        description="Este mes"
        className="bg-red-50 border-red-200"
        icon={<TrendingDown className="h-6 w-6 text-red-600" />}
      >
        <div className="text-2xl font-bold text-red-600">
          {formatCurrency(reporte.gastos_totales)}
        </div>
      </BentoItem>

      <BentoItem
        title="Utilidad Neta"
        description="Margen: 32.4%"
        className="bg-blue-50 border-blue-200"
        icon={<DollarSign className="h-6 w-6 text-blue-600" />}
      >
        <div className="text-2xl font-bold text-blue-600">
          {formatCurrency(reporte.utilidad_neta)}
        </div>
      </BentoItem>

      <BentoItem
        title="Crecimiento Ventas"
        description="Vs mes anterior"
        className={reporte.crecimiento_ventas >= 0 ? "bg-purple-50 border-purple-200" : "bg-orange-50 border-orange-200"}
        icon={reporte.crecimiento_ventas >= 0 ?
          <TrendingUp className="h-6 w-6 text-purple-600" /> :
          <TrendingDown className="h-6 w-6 text-orange-600" />
        }
      >
        <div className={`text-2xl font-bold ${reporte.crecimiento_ventas >= 0 ? 'text-purple-600' : 'text-orange-600'}`}>
          {reporte.crecimiento_ventas >= 0 ? '+' : ''}{reporte.crecimiento_ventas}%
        </div>
      </BentoItem>
    </BentoGrid>
  );
};

// Configuración de columnas para la tabla de transacciones
const transaccionesTableColumns = [
  { key: "referencia", header: "Referencia" },
  {
    key: "fecha",
    header: "Fecha",
    transform: (value: string) => new Date(value).toLocaleDateString('es-MX')
  },
  { key: "descripcion", header: "Descripción" },
  {
    key: "tipo",
    header: "Tipo",
    transform: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'venta' ? 'bg-green-100 text-green-800' :
        value === 'compra' ? 'bg-blue-100 text-blue-800' :
          value === 'gasto' ? 'bg-red-100 text-red-800' :
            'bg-purple-100 text-purple-800'
        }`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    )
  },
  {
    key: "monto",
    header: "Monto",
    transform: (value: number, row: Transaccion) => (
      <span className={`font-medium ${row.tipo === 'venta' || row.tipo === 'ingreso' ?
        'text-green-600' : 'text-red-600'
        }`}>
        {new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
          minimumFractionDigits: 2
        }).format(value)}
      </span>
    )
  },
  {
    key: "estado",
    header: "Estado",
    transform: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'completado' ? 'bg-green-100 text-green-800' :
        value === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    )
  }
];

export default function Contaduria() {
  const dispatch = useAppDispatch();
  const {
    transacciones,
    currentPage,
    totalPages,
    totalRecords,
    isLoading,
    error,
    setCurrentPage,
    setActiveFilters,
    refetch
  } = useTransacciones();

  const {
    reporte,
    isLoading: isLoadingReporte,
    error: errorReporte,
    refetch: refetchReporte
  } = useReportesFinancieros();

  const { handleSubmit, register, reset } = useForm<FiltrosForm>();

  const onSubmit = (data: FiltrosForm) => {
    const nuevosFiltros: Filtro[] = [];

    if (data.search) {
      nuevosFiltros.push({ Key: "descripcion", Value: data.search, Operator: "contains" });
    }

    if (data.tipo) {
      nuevosFiltros.push({ Key: "tipo", Value: data.tipo, Operator: "=" });
    }

    if (data.categoria) {
      nuevosFiltros.push({ Key: "categoria", Value: data.categoria, Operator: "=" });
    }

    if (data.estado) {
      nuevosFiltros.push({ Key: "estado", Value: data.estado, Operator: "=" });
    }

    if (data.fecha_inicio && data.fecha_fin) {
      nuevosFiltros.push(
        { Key: "fecha", Value: data.fecha_inicio, Operator: ">=" },
        { Key: "fecha", Value: data.fecha_fin, Operator: "<=" }
      );
    }

    setActiveFilters(prev => ({
      ...prev,
      Filtros: nuevosFiltros
    }));
    setCurrentPage(1);
  };

  const limpiarFiltros = () => {
    reset();
    setActiveFilters(prev => ({ ...prev, Filtros: [] }));
    setCurrentPage(1);
  };

  const handleOpenModal = (modalName: string) => {
    dispatch(openModalReducer({ modalName }));
  };

  const handleRefetchAll = () => {
    refetch();
    refetchReporte();
  };

  const handleGenerarReporte = () => {
    // Lógica para generar reporte
    console.log("Generando reporte financiero...");
  };

  return (
    <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
      <header className="mb-8">
        <h1 className="flex items-center text-2xl font-bold md:text-3xl">
          <DollarSign className="mr-2 h-8 w-8 text-blue-600" />
          Módulo de Contaduría
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-100">
          Gestión financiera integral y reportes contables
        </p>
      </header>

      {/* Estadísticas Financieras */}
      {isLoadingReporte ? (
        <div className="mb-6">
          <LoadingSection message="Cargando reportes financieros..." />
        </div>
      ) : errorReporte ? (
        <div className="mb-6 p-4 bg-red-50 rounded-lg text-center">
          <p className="text-red-500 mb-2">{errorReporte}</p>
          <button
            onClick={refetchReporte}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Reintentar
          </button>
        </div>
      ) : reporte ? (
        <EstadisticasFinancieras reporte={reporte} />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Acciones Rápidas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <span className="text-blue-700">Generar Reporte Mensual</span>
              <FileText className="h-5 w-5 text-blue-600" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <span className="text-green-700">Conciliación Bancaria</span>
              <CreditCard className="h-5 w-5 text-green-600" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <span className="text-purple-700">Estado de Resultados</span>
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </button>
          </div>
        </div>

        {/* Resumen por Categorías */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Distribución de Gastos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-red-600 font-bold text-lg">45%</div>
              <div className="text-sm text-red-700">Operativos</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-blue-600 font-bold text-lg">25%</div>
              <div className="text-sm text-blue-700">Administrativos</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-green-600 font-bold text-lg">20%</div>
              <div className="text-sm text-green-700">Comerciales</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-purple-600 font-bold text-lg">10%</div>
              <div className="text-sm text-purple-700">Financieros</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <article className="p-4">
          <header className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="mr-4">
              <h2 className="text-lg font-semibold">Registro de Transacciones</h2>
              <p className="text-sm text-gray-500">
                {totalRecords} transacciones registradas
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <FiltrosContabilidad
                onSubmit={handleSubmit(onSubmit)}
                register={register}
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={limpiarFiltros}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Limpiar
                </button>

                <button
                  onClick={handleRefetchAll}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                  title="Actualizar"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>

                <button
                  onClick={handleGenerarReporte}
                  className="flex items-center gap-1 bg-blue-600 text-white text-sm px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
              </div>
            </div>
          </header>

          <section className="overflow-x-auto">
            {isLoading ? (
              <LoadingSection message="Cargando transacciones..." />
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-red-500 mb-2">{error}</p>
                <button
                  onClick={refetch}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Reintentar
                </button>
              </div>
            ) : transacciones.length > 0 ? (
              <>
                <DynamicTable
                  data={transacciones}
                />
                <div className="p-4">
                  <Pagination
                    currentPage={currentPage}
                    loading={isLoading}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                  />
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No se encontraron transacciones con los filtros aplicados.</p>
                <button
                  onClick={limpiarFiltros}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Ver todas las transacciones
                </button>
              </div>
            )}
          </section>
        </article>
      </div>

      {/* Modales */}
      <Modal
        modalName="reporte-detallado"
        title="Reporte Financiero Detallado"
        maxWidth="4xl"
      >
        <div className="p-4">
          <p>Contenido del reporte detallado...</p>
        </div>
      </Modal>

      <Modal
        modalName="nueva-transaccion"
        title="Registrar Nueva Transacción"
        maxWidth="lg"
      >
        <div className="p-4">
          <p>Formulario para nueva transacción...</p>
        </div>
      </Modal>
    </main>
  );
}