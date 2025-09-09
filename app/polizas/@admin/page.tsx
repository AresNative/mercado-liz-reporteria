"use client"

import {
  Filter,
  Search,
  Plus,
  RefreshCw,
  FileText,
  Download,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
  Save,
  Calculator,
  BookOpen,
  Building,
  Calendar,
  DollarSign
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

// Interfaces para el armado de pólizas
interface Poliza {
  id: number;
  numero: string;
  tipo: string;
  fecha: string;
  concepto: string;
  periodo: string;
  total_debe: number;
  total_haber: number;
  estado: 'borrador' | 'pendiente' | 'aprobada' | 'rechazada' | 'contabilizada';
  usuario_creador: string;
  fecha_creacion: string;
  fecha_contabilizacion?: string;
}

interface Movimiento {
  id: number;
  poliza_id: number;
  cuenta_contable: string;
  descripcion: string;
  referencia: string;
  centro_costo: string;
  debe: number;
  haber: number;
  tipo_movimiento: 'cargo' | 'abono';
}

interface CuentaContable {
  codigo: string;
  nombre: string;
  tipo: 'activo' | 'pasivo' | 'capital' | 'ingreso' | 'gasto';
  nivel: number;
  padre?: string;
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
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  periodo: string;
}

// Componente para el formulario de filtros
const FiltrosPolizas = ({ onSubmit, register }: {
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
            placeholder="Buscar póliza o concepto..."
            className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <select
          {...register("tipo")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-w-[150px]"
        >
          <option value="">Todos los tipos</option>
          <option value="diario">Diario</option>
          <option value="ingresos">Ingresos</option>
          <option value="egresos">Egresos</option>
          <option value="nomina">Nómina</option>
          <option value="ajuste">Ajuste</option>
          <option value="cierre">Cierre</option>
        </select>

        <select
          {...register("estado")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-w-[150px]"
        >
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobada">Aprobada</option>
          <option value="rechazada">Rechazada</option>
          <option value="contabilizada">Contabilizada</option>
        </select>

        <select
          {...register("periodo")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-w-[140px]"
        >
          <option value="">Todos los periodos</option>
          <option value="2024-01">Enero 2024</option>
          <option value="2024-02">Febrero 2024</option>
          <option value="2024-03">Marzo 2024</option>
          <option value="2024-04">Abril 2024</option>
          <option value="2024-05">Mayo 2024</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            {...register("fecha_inicio")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            placeholder="Fecha inicio"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            {...register("fecha_fin")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            placeholder="Fecha fin"
          />
        </div>

        <button type="submit" className="flex items-center rounded-md px-3 py-2 text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors whitespace-nowrap">
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
            placeholder="Buscar póliza..."
            className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select
            {...register("tipo")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">Todos tipos</option>
            <option value="diario">Diario</option>
            <option value="ingresos">Ingresos</option>
            <option value="egresos">Egresos</option>
            <option value="nomina">Nómina</option>
          </select>

          <select
            {...register("estado")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">Todos estados</option>
            <option value="borrador">Borrador</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select
            {...register("periodo")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            <option value="">Todos periodos</option>
            <option value="2024-01">Ene 2024</option>
            <option value="2024-02">Feb 2024</option>
            <option value="2024-03">Mar 2024</option>
          </select>

          <button type="submit" className="flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors">
            <Filter className="mr-1 h-4 w-4" />
            Filtrar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            {...register("fecha_inicio")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            placeholder="Inicio"
          />
          <input
            type="date"
            {...register("fecha_fin")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            placeholder="Fin"
          />
        </div>
      </div>
    </form>
  );
};

// Hook personalizado para la gestión de pólizas
const usePolizas = () => {
  const [polizas, setPolizas] = useState<Poliza[]>([]);
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

  const fetchPolizas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulamos datos de pólizas
      const mockData: Poliza[] = [
        {
          id: 1,
          numero: "POL-2024-001",
          tipo: "diario",
          fecha: "2024-01-15",
          concepto: "Póliza de nómina quincenal",
          periodo: "2024-01",
          total_debe: 125000,
          total_haber: 125000,
          estado: "contabilizada",
          usuario_creador: "admin@empresa.com",
          fecha_creacion: "2024-01-15 09:30:00",
          fecha_contabilizacion: "2024-01-15 10:15:00"
        },
        {
          id: 2,
          numero: "POL-2024-002",
          tipo: "ingresos",
          fecha: "2024-01-16",
          concepto: "Ventas del día 15 de enero",
          periodo: "2024-01",
          total_debe: 85000,
          total_haber: 85000,
          estado: "aprobada",
          usuario_creador: "contador@empresa.com",
          fecha_creacion: "2024-01-16 08:45:00"
        },
        {
          id: 3,
          numero: "POL-2024-003",
          tipo: "egresos",
          fecha: "2024-01-17",
          concepto: "Pago a proveedores",
          periodo: "2024-01",
          total_debe: 45000,
          total_haber: 45000,
          estado: "pendiente",
          usuario_creador: "auxiliar@empresa.com",
          fecha_creacion: "2024-01-17 14:20:00"
        },
        {
          id: 4,
          numero: "POL-2024-004",
          tipo: "ajuste",
          fecha: "2024-01-18",
          concepto: "Ajuste por diferencia de caja",
          periodo: "2024-01",
          total_debe: 1200,
          total_haber: 1200,
          estado: "borrador",
          usuario_creador: "contador@empresa.com",
          fecha_creacion: "2024-01-18 11:10:00"
        }
      ];

      setPolizas(mockData);
      setTotalPages(1);
      setTotalRecords(mockData.length);
    } catch (err) {
      console.error("Error fetching pólizas:", err);
      setError("No se pudieron cargar las pólizas. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, activeFilters, getWithFilter]);

  useEffect(() => {
    fetchPolizas();
  }, [fetchPolizas]);

  return {
    polizas,
    currentPage,
    totalPages,
    totalRecords,
    isLoading,
    error,
    setCurrentPage,
    setActiveFilters,
    refetch: fetchPolizas
  };
};

// Hook para estadísticas de pólizas
const useEstadisticasPolizas = () => {
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstadisticas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulamos datos estadísticos
      const mockEstadisticas = {
        total_polizas: 156,
        polizas_contabilizadas: 132,
        polizas_pendientes: 12,
        polizas_borrador: 8,
        polizas_rechazadas: 4,
        total_movimientos: 2847,
        saldo_cuadrado: 156,
        saldo_descuadrado: 0
      };

      setEstadisticas(mockEstadisticas);
    } catch (err) {
      console.error("Error fetching estadísticas:", err);
      setError("No se pudieron cargar las estadísticas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEstadisticas();
  }, [fetchEstadisticas]);

  return {
    estadisticas,
    isLoading,
    error,
    refetch: fetchEstadisticas
  };
};

// Componente para estadísticas de pólizas
const EstadisticasPolizas = ({ estadisticas }: { estadisticas: any }) => {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'contabilizada': return 'text-green-600';
      case 'aprobada': return 'text-blue-600';
      case 'pendiente': return 'text-yellow-600';
      case 'borrador': return 'text-gray-600';
      case 'rechazada': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'contabilizada': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'aprobada': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'pendiente': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'borrador': return <Edit className="h-5 w-5 text-gray-500" />;
      case 'rechazada': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <BentoGrid cols={4} className="mb-6">
      <BentoItem
        title="Total Pólizas"
        description="Registradas en el sistema"
        className="bg-purple-50 border-purple-200"
        icon={<FileText className="h-6 w-6 text-purple-600" />}
      >
        <div className="text-2xl font-bold text-purple-600">
          {estadisticas.total_polizas}
        </div>
      </BentoItem>

      <BentoItem
        title="Contabilizadas"
        description="Pólizas procesadas"
        className="bg-green-50 border-green-200"
        icon={<CheckCircle className="h-6 w-6 text-green-600" />}
      >
        <div className="text-2xl font-bold text-green-600">
          {estadisticas.polizas_contabilizadas}
        </div>
      </BentoItem>

      <BentoItem
        title="Pendientes"
        description="Por revisar/aprobar"
        className="bg-yellow-50 border-yellow-200"
        icon={<Clock className="h-6 w-6 text-yellow-600" />}
      >
        <div className="text-2xl font-bold text-yellow-600">
          {estadisticas.polizas_pendientes}
        </div>
      </BentoItem>

      <BentoItem
        title="Movimientos"
        description="Total registrados"
        className="bg-blue-50 border-blue-200"
        icon={<Calculator className="h-6 w-6 text-blue-600" />}
      >
        <div className="text-2xl font-bold text-blue-600">
          {estadisticas.total_movimientos.toLocaleString()}
        </div>
      </BentoItem>
    </BentoGrid>
  );
};

// Configuración de columnas para la tabla de pólizas
const polizasTableColumns = [
  { key: "numero", header: "Número" },
  {
    key: "fecha",
    header: "Fecha",
    transform: (value: string) => new Date(value).toLocaleDateString('es-MX')
  },
  { key: "concepto", header: "Concepto" },
  {
    key: "tipo",
    header: "Tipo",
    transform: (value: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'diario' ? 'bg-purple-100 text-purple-800' :
        value === 'ingresos' ? 'bg-green-100 text-green-800' :
          value === 'egresos' ? 'bg-red-100 text-red-800' :
            value === 'nomina' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
        }`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    )
  },
  {
    key: "total_debe",
    header: "Total Debe",
    transform: (value: number) => (
      <span className="font-medium text-red-600">
        {new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
          minimumFractionDigits: 2
        }).format(value)}
      </span>
    )
  },
  {
    key: "total_haber",
    header: "Total Haber",
    transform: (value: number) => (
      <span className="font-medium text-green-600">
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === 'contabilizada' ? 'bg-green-100 text-green-800' :
        value === 'aprobada' ? 'bg-blue-100 text-blue-800' :
          value === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
            value === 'borrador' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
        }`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    )
  }
];

// Componente para el formulario de movimientos
const FormularioMovimientos = ({ movimientos, onAddMovimiento, onRemoveMovimiento, onUpdateMovimiento }: {
  movimientos: Movimiento[];
  onAddMovimiento: () => void;
  onRemoveMovimiento: (id: number) => void;
  onUpdateMovimiento: (id: number, field: string, value: any) => void;
}) => {
  const totalDebe = movimientos.reduce((sum, mov) => sum + (mov.debe || 0), 0);
  const totalHaber = movimientos.reduce((sum, mov) => sum + (mov.haber || 0), 0);
  const diferencia = totalDebe - totalHaber;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Movimientos Contables</h3>
        <button
          onClick={onAddMovimiento}
          className="flex items-center gap-1 bg-purple-600 text-white text-sm px-3 py-2 rounded-md hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar Movimiento
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Cuenta</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2 text-left">Referencia</th>
              <th className="px-3 py-2 text-left">Centro Costo</th>
              <th className="px-3 py-2 text-right">Debe</th>
              <th className="px-3 py-2 text-right">Haber</th>
              <th className="px-3 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((movimiento, index) => (
              <tr key={movimiento.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={movimiento.cuenta_contable}
                    onChange={(e) => onUpdateMovimiento(movimiento.id, 'cuenta_contable', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="Cuenta contable"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={movimiento.descripcion}
                    onChange={(e) => onUpdateMovimiento(movimiento.id, 'descripcion', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="Descripción"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={movimiento.referencia}
                    onChange={(e) => onUpdateMovimiento(movimiento.id, 'referencia', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="Referencia"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={movimiento.centro_costo}
                    onChange={(e) => onUpdateMovimiento(movimiento.id, 'centro_costo', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="Centro costo"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={movimiento.debe}
                    onChange={(e) => onUpdateMovimiento(movimiento.id, 'debe', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right"
                    placeholder="0.00"
                    step="0.01"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={movimiento.haber}
                    onChange={(e) => onUpdateMovimiento(movimiento.id, 'haber', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right"
                    placeholder="0.00"
                    step="0.01"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => onRemoveMovimiento(movimiento.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td colSpan={4} className="px-3 py-2 text-right">Totales:</td>
              <td className="px-3 py-2 text-right text-red-600">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                  minimumFractionDigits: 2
                }).format(totalDebe)}
              </td>
              <td className="px-3 py-2 text-right text-green-600">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                  minimumFractionDigits: 2
                }).format(totalHaber)}
              </td>
              <td className="px-3 py-2"></td>
            </tr>
            <tr>
              <td colSpan={4} className="px-3 py-2 text-right">Diferencia:</td>
              <td colSpan={2} className={`px-3 py-2 text-right font-bold ${Math.abs(diferencia) < 0.01 ? 'text-green-600' : 'text-red-600'
                }`}>
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                  minimumFractionDigits: 2
                }).format(diferencia)}
              </td>
              <td className="px-3 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {Math.abs(diferencia) >= 0.01 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">
            ⚠️ La póliza no está cuadrada. La diferencia es de {diferencia.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};

export default function ArmadoPolizas() {
  const dispatch = useAppDispatch();
  const {
    polizas,
    currentPage,
    totalPages,
    totalRecords,
    isLoading,
    error,
    setCurrentPage,
    setActiveFilters,
    refetch
  } = usePolizas();

  const {
    estadisticas,
    isLoading: isLoadingEstadisticas,
    error: errorEstadisticas,
    refetch: refetchEstadisticas
  } = useEstadisticasPolizas();

  // Estado para el formulario de nueva póliza
  const [nuevaPoliza, setNuevaPoliza] = useState<Partial<Poliza>>({
    tipo: 'diario',
    fecha: new Date().toISOString().split('T')[0],
    periodo: '2024-01',
    estado: 'borrador'
  });

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [nextMovimientoId, setNextMovimientoId] = useState(1);

  const { handleSubmit, register, reset } = useForm<FiltrosForm>();

  const onSubmit = (data: FiltrosForm) => {
    const nuevosFiltros: Filtro[] = [];

    if (data.search) {
      nuevosFiltros.push(
        { Key: "numero", Value: data.search, Operator: "contains" },
        { Key: "concepto", Value: data.search, Operator: "contains" }
      );
    }

    if (data.tipo) {
      nuevosFiltros.push({ Key: "tipo", Value: data.tipo, Operator: "=" });
    }

    if (data.estado) {
      nuevosFiltros.push({ Key: "estado", Value: data.estado, Operator: "=" });
    }

    if (data.periodo) {
      nuevosFiltros.push({ Key: "periodo", Value: data.periodo, Operator: "=" });
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
    refetchEstadisticas();
  };

  const handleAddMovimiento = () => {
    const newMovimiento: Movimiento = {
      id: nextMovimientoId,
      poliza_id: 0,
      cuenta_contable: '',
      descripcion: '',
      referencia: '',
      centro_costo: '',
      debe: 0,
      haber: 0,
      tipo_movimiento: 'cargo'
    };
    setMovimientos([...movimientos, newMovimiento]);
    setNextMovimientoId(nextMovimientoId + 1);
  };

  const handleRemoveMovimiento = (id: number) => {
    setMovimientos(movimientos.filter(mov => mov.id !== id));
  };

  const handleUpdateMovimiento = (id: number, field: string, value: any) => {
    setMovimientos(movimientos.map(mov =>
      mov.id === id ? { ...mov, [field]: value } : mov
    ));
  };

  const handleSavePoliza = () => {
    // Lógica para guardar la póliza
    console.log("Guardando póliza:", nuevaPoliza);
    console.log("Movimientos:", movimientos);
  };

  return (
    <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
      <header className="mb-8">
        <h1 className="flex items-center text-2xl font-bold md:text-3xl">
          <BookOpen className="mr-2 h-8 w-8 text-purple-600" />
          Armado de Pólizas Contables
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-100">
          Creación, edición y gestión de pólizas contables
        </p>
      </header>

      {/* Estadísticas de Pólizas */}
      {isLoadingEstadisticas ? (
        <div className="mb-6">
          <LoadingSection message="Cargando estadísticas..." />
        </div>
      ) : errorEstadisticas ? (
        <div className="mb-6 p-4 bg-red-50 rounded-lg text-center">
          <p className="text-red-500 mb-2">{errorEstadisticas}</p>
          <button
            onClick={refetchEstadisticas}
            className="text-purple-600 hover:text-purple-800 underline"
          >
            Reintentar
          </button>
        </div>
      ) : estadisticas ? (
        <EstadisticasPolizas estadisticas={estadisticas} />
      ) : null}

      {/* Formulario de Nueva Póliza */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Nueva Póliza</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Póliza</label>
            <select
              value={nuevaPoliza.tipo}
              onChange={(e) => setNuevaPoliza({ ...nuevaPoliza, tipo: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="diario">Diario</option>
              <option value="ingresos">Ingresos</option>
              <option value="egresos">Egresos</option>
              <option value="nomina">Nómina</option>
              <option value="ajuste">Ajuste</option>
              <option value="cierre">Cierre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={nuevaPoliza.fecha}
              onChange={(e) => setNuevaPoliza({ ...nuevaPoliza, fecha: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <select
              value={nuevaPoliza.periodo}
              onChange={(e) => setNuevaPoliza({ ...nuevaPoliza, periodo: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="2024-01">Enero 2024</option>
              <option value="2024-02">Febrero 2024</option>
              <option value="2024-03">Marzo 2024</option>
              <option value="2024-04">Abril 2024</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
            <input
              type="text"
              value={nuevaPoliza.concepto || ''}
              onChange={(e) => setNuevaPoliza({ ...nuevaPoliza, concepto: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="Concepto de la póliza"
            />
          </div>
        </div>

        <FormularioMovimientos
          movimientos={movimientos}
          onAddMovimiento={handleAddMovimiento}
          onRemoveMovimiento={handleRemoveMovimiento}
          onUpdateMovimiento={handleUpdateMovimiento}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSavePoliza}
            className="flex items-center gap-1 bg-purple-600 text-white text-sm px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
          >
            <Save className="h-4 w-4" />
            Guardar Póliza
          </button>
        </div>
      </div>

      {/* Lista de Pólizas Existentes */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <article className="p-4">
          <header className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="mr-4">
              <h2 className="text-lg font-semibold">Pólizas Existentes</h2>
              <p className="text-sm text-gray-500">
                {totalRecords} pólizas en el sistema
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <FiltrosPolizas
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
                  onClick={() => handleOpenModal('importar-polizas')}
                  className="flex items-center gap-1 bg-green-600 text-white text-sm px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Importar
                </button>
              </div>
            </div>
          </header>

          <section className="overflow-x-auto">
            {isLoading ? (
              <LoadingSection message="Cargando pólizas..." />
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-red-500 mb-2">{error}</p>
                <button
                  onClick={refetch}
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  Reintentar
                </button>
              </div>
            ) : polizas.length > 0 ? (
              <>
                <DynamicTable
                  data={polizas}
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
                <p className="text-gray-500 mb-4">No se encontraron pólizas con los filtros aplicados.</p>
                <button
                  onClick={limpiarFiltros}
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  Ver todas las pólizas
                </button>
              </div>
            )}
          </section>
        </article>
      </div>

      {/* Modales */}
      <Modal
        modalName="detalle-poliza"
        title="Detalle de Póliza"
        maxWidth="4xl"
      >
        <div className="p-4">
          <p>Detalles completos de la póliza seleccionada...</p>
        </div>
      </Modal>

      <Modal
        modalName="importar-polizas"
        title="Importar Pólizas"
        maxWidth="lg"
      >
        <div className="p-4">
          <p>Formulario para importar pólizas desde archivos...</p>
        </div>
      </Modal>
    </main>
  );
}