"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import {
  DollarSign,
  PieChart,
  BarChart3,
  FileText,
  BookOpen,
  Calculator,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Building,
  Users,
  Package,
  CreditCard,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
  Save,
  Calendar,
  Eye,
  MoreVertical
} from "lucide-react"
import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersGeneralMutation } from "@/hooks/reducers/api"
import { LoadingSection } from "@/template/loading-screen"
import Pagination from "@/components/pagination"
import DynamicTable from "@/components/table"
import { Modal } from "@/components/modal"
import { BentoGrid, BentoItem } from "@/components/bento-grid"

// Interfaces para el sistema de contaduría
interface Transaccion {
  id: number;
  tipo: 'venta' | 'compra' | 'gasto' | 'ingreso';
  descripcion: string;
  monto: number;
  fecha: string;
  referencia: string;
  estado: string;
  categoria: string;
  cuenta_contable: string;
}

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

interface ReporteFinanciero {
  ingresos_totales: number;
  gastos_totales: number;
  utilidad_neta: number;
  margen_utilidad: number;
  ventas_mes_actual: number;
  ventas_mes_anterior: number;
  crecimiento_ventas: number;
  activos_totales: number;
  pasivos_totales: number;
  patrimonio: number;
}

interface BalanceGeneral {
  activos_corrientes: number;
  activos_no_corrientes: number;
  pasivos_corrientes: number;
  pasivos_no_corrientes: number;
  patrimonio: number;
  fecha_corte: string;
}

interface EstadoResultados {
  ingresos_operativos: number;
  costos_ventas: number;
  utilidad_bruta: number;
  gastos_operativos: number;
  utilidad_operativa: number;
  otros_ingresos: number;
  otros_gastos: number;
  utilidad_neta: number;
  periodo: string;
}

// Componentes de navegación
const NavigationTabs = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'transacciones', label: 'Transacciones', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'polizas', label: 'Pólizas', icon: <FileText className="h-4 w-4" /> },
    { id: 'balance', label: 'Balance General', icon: <PieChart className="h-4 w-4" /> },
    { id: 'resultados', label: 'Estado de Resultados', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'reportes', label: 'Reportes', icon: <Download className="h-4 w-4" /> }
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// Dashboard Principal
const DashboardContabilidad = ({ reporte }: { reporte: ReporteFinanciero }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de distribución de gastos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Distribución de Gastos</h3>
          <div className="space-y-3">
            {[
              { category: 'Nómina', amount: 45000, percentage: 45, color: 'bg-red-500' },
              { category: 'Proveedores', amount: 25000, percentage: 25, color: 'bg-blue-500' },
              { category: 'Servicios', amount: 15000, percentage: 15, color: 'bg-green-500' },
              { category: 'Impuestos', amount: 10000, percentage: 10, color: 'bg-purple-500' },
              { category: 'Otros', amount: 5000, percentage: 5, color: 'bg-gray-500' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium">{item.category}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(item.amount)} ({item.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen de ratios financieros */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Ratios Financieros</h3>
          <div className="space-y-4">
            {[
              { name: 'Liquidez Corriente', value: '1.8', ideal: '1.5-2.0', status: 'good' },
              { name: 'Margen Neto', value: '18.5%', ideal: '>15%', status: 'good' },
              { name: 'ROE', value: '22.3%', ideal: '>20%', status: 'good' },
              { name: 'Endeudamiento', value: '45.2%', ideal: '<50%', status: 'warning' }
            ].map((ratio, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{ratio.name}</p>
                  <p className="text-xs text-gray-500">Ideal: {ratio.ideal}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${ratio.status === 'good' ? 'bg-green-100 text-green-800' :
                  ratio.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                  {ratio.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimas transacciones */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Últimas Transacciones</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Fecha</th>
                <th className="text-left py-2">Descripción</th>
                <th className="text-left py-2">Tipo</th>
                <th className="text-right py-2">Monto</th>
                <th className="text-left py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {[
                { fecha: '2024-01-15', descripcion: 'Pago nómina quincenal', tipo: 'gasto', monto: 45000, estado: 'completado' },
                { fecha: '2024-01-14', descripcion: 'Venta productos electrónicos', tipo: 'ingreso', monto: 25000, estado: 'completado' },
                { fecha: '2024-01-13', descripcion: 'Compra materia prima', tipo: 'gasto', monto: 18000, estado: 'pendiente' },
                { fecha: '2024-01-12', descripcion: 'Pago servicios', tipo: 'gasto', monto: 8500, estado: 'completado' }
              ].map((trans, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-2">{new Date(trans.fecha).toLocaleDateString('es-MX')}</td>
                  <td className="py-2">{trans.descripcion}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${trans.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {trans.tipo}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={trans.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(trans.monto)}
                    </span>
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${trans.estado === 'completado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {trans.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Componente de Balance General
const BalanceGeneral = ({ balance }: { balance: BalanceGeneral }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const totalActivos = balance.activos_corrientes + balance.activos_no_corrientes;
  const totalPasivos = balance.pasivos_corrientes + balance.pasivos_no_corrientes;
  const totalPasivosPatrimonio = totalPasivos + balance.patrimonio;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Balance General</h2>
        <p className="text-gray-500">Al {new Date(balance.fecha_corte).toLocaleDateString('es-MX')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activos */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-green-600">ACTIVOS</h3>

          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Activos Corrientes</span>
              <span>{formatCurrency(balance.activos_corrientes)}</span>
            </div>

            <div className="pl-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Efectivo y equivalentes</span>
                <span>{formatCurrency(balance.activos_corrientes * 0.4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cuentas por cobrar</span>
                <span>{formatCurrency(balance.activos_corrientes * 0.3)}</span>
              </div>
              <div className="flex justify-between">
                <span>Inventarios</span>
                <span>{formatCurrency(balance.activos_corrientes * 0.2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Otros activos corrientes</span>
                <span>{formatCurrency(balance.activos_corrientes * 0.1)}</span>
              </div>
            </div>

            <div className="flex justify-between border-b pb-2 pt-4">
              <span className="font-medium">Activos No Corrientes</span>
              <span>{formatCurrency(balance.activos_no_corrientes)}</span>
            </div>

            <div className="pl-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Propiedad, planta y equipo</span>
                <span>{formatCurrency(balance.activos_no_corrientes * 0.7)}</span>
              </div>
              <div className="flex justify-between">
                <span>Activos intangibles</span>
                <span>{formatCurrency(balance.activos_no_corrientes * 0.2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Otros activos no corrientes</span>
                <span>{formatCurrency(balance.activos_no_corrientes * 0.1)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 font-bold text-lg">
              <span>TOTAL ACTIVOS</span>
              <span className="text-green-600">{formatCurrency(totalActivos)}</span>
            </div>
          </div>
        </div>

        {/* Pasivos y Patrimonio */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-red-600">PASIVOS Y PATRIMONIO</h3>

          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Pasivos Corrientes</span>
              <span>{formatCurrency(balance.pasivos_corrientes)}</span>
            </div>

            <div className="pl-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Cuentas por pagar</span>
                <span>{formatCurrency(balance.pasivos_corrientes * 0.5)}</span>
              </div>
              <div className="flex justify-between">
                <span>Préstamos a corto plazo</span>
                <span>{formatCurrency(balance.pasivos_corrientes * 0.3)}</span>
              </div>
              <div className="flex justify-between">
                <span>Otros pasivos corrientes</span>
                <span>{formatCurrency(balance.pasivos_corrientes * 0.2)}</span>
              </div>
            </div>

            <div className="flex justify-between border-b pb-2 pt-4">
              <span className="font-medium">Pasivos No Corrientes</span>
              <span>{formatCurrency(balance.pasivos_no_corrientes)}</span>
            </div>

            <div className="pl-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Préstamos a largo plazo</span>
                <span>{formatCurrency(balance.pasivos_no_corrientes * 0.8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Otros pasivos no corrientes</span>
                <span>{formatCurrency(balance.pasivos_no_corrientes * 0.2)}</span>
              </div>
            </div>

            <div className="flex justify-between border-b pb-2 pt-4">
              <span className="font-medium">Patrimonio</span>
              <span>{formatCurrency(balance.patrimonio)}</span>
            </div>

            <div className="pl-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Capital social</span>
                <span>{formatCurrency(balance.patrimonio * 0.6)}</span>
              </div>
              <div className="flex justify-between">
                <span>Utilidades acumuladas</span>
                <span>{formatCurrency(balance.patrimonio * 0.3)}</span>
              </div>
              <div className="flex justify-between">
                <span>Otros componentes</span>
                <span>{formatCurrency(balance.patrimonio * 0.1)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 font-bold text-lg">
              <span>TOTAL PASIVOS Y PATRIMONIO</span>
              <span className="text-red-600">{formatCurrency(totalPasivosPatrimonio)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ratios de solvencia */}
      <div className="mt-8 pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4">Indicadores de Solvencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Ratio de Liquidez', value: (totalActivos / totalPasivos).toFixed(2), ideal: '>1.0' },
            { name: 'Endeudamiento', value: ((totalPasivos / totalActivos) * 100).toFixed(1) + '%', ideal: '<60%' },
            { name: 'Patrimonio/Activos', value: ((balance.patrimonio / totalActivos) * 100).toFixed(1) + '%', ideal: '>40%' }
          ].map((ratio, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-sm">{ratio.name}</p>
              <p className="text-2xl font-bold text-blue-600">{ratio.value}</p>
              <p className="text-xs text-gray-500">Ideal: {ratio.ideal}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente de Estado de Resultados
const EstadoResultadosComponent = ({ estadoResultados }: { estadoResultados: EstadoResultados }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const margenBruto = (estadoResultados.utilidad_bruta / estadoResultados.ingresos_operativos) * 100;
  const margenOperativo = (estadoResultados.utilidad_operativa / estadoResultados.ingresos_operativos) * 100;
  const margenNeto = (estadoResultados.utilidad_neta / estadoResultados.ingresos_operativos) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Estado de Resultados</h2>
        <p className="text-gray-500">Período: {estadoResultados.periodo}</p>
      </div>

      <div className="space-y-4">
        {/* Ingresos */}
        <div className="space-y-2">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Ingresos Operativos</span>
            <span className="font-medium">{formatCurrency(estadoResultados.ingresos_operativos)}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span className="pl-4">(-) Costo de Ventas</span>
            <span>{formatCurrency(estadoResultados.costos_ventas)}</span>
          </div>

          <div className="flex justify-between pt-2 font-bold text-lg">
            <span>UTILIDAD BRUTA</span>
            <span className="text-green-600">{formatCurrency(estadoResultados.utilidad_bruta)}</span>
          </div>

          <div className="text-sm text-gray-500 text-right">
            Margen Bruto: {margenBruto.toFixed(1)}%
          </div>
        </div>

        {/* Gastos Operativos */}
        <div className="space-y-2 pt-4">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">(-) Gastos Operativos</span>
            <span>{formatCurrency(estadoResultados.gastos_operativos)}</span>
          </div>

          <div className="pl-4 space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Gastos de venta</span>
              <span>{formatCurrency(estadoResultados.gastos_operativos * 0.4)}</span>
            </div>
            <div className="flex justify-between">
              <span>Gastos administrativos</span>
              <span>{formatCurrency(estadoResultados.gastos_operativos * 0.35)}</span>
            </div>
            <div className="flex justify-between">
              <span>Gastos de investigación</span>
              <span>{formatCurrency(estadoResultados.gastos_operativos * 0.15)}</span>
            </div>
            <div className="flex justify-between">
              <span>Otros gastos operativos</span>
              <span>{formatCurrency(estadoResultados.gastos_operativos * 0.1)}</span>
            </div>
          </div>

          <div className="flex justify-between pt-2 font-bold text-lg">
            <span>UTILIDAD OPERATIVA</span>
            <span className="text-green-600">{formatCurrency(estadoResultados.utilidad_operativa)}</span>
          </div>

          <div className="text-sm text-gray-500 text-right">
            Margen Operativo: {margenOperativo.toFixed(1)}%
          </div>
        </div>

        {/* Otros ingresos/gastos */}
        <div className="space-y-2 pt-4">
          <div className="flex justify-between">
            <span>(+) Otros Ingresos</span>
            <span className="text-green-600">{formatCurrency(estadoResultados.otros_ingresos)}</span>
          </div>

          <div className="flex justify-between">
            <span>(-) Otros Gastos</span>
            <span className="text-red-600">{formatCurrency(estadoResultados.otros_gastos)}</span>
          </div>

          <div className="flex justify-between pt-4 font-bold text-lg border-t">
            <span>UTILIDAD NETA ANTES DE IMPUESTOS</span>
            <span className="text-green-600">{formatCurrency(estadoResultados.utilidad_neta + estadoResultados.otros_gastos - estadoResultados.otros_ingresos)}</span>
          </div>

          <div className="flex justify-between">
            <span>(-) Impuesto sobre la renta</span>
            <span className="text-red-600">{formatCurrency((estadoResultados.utilidad_neta + estadoResultados.otros_gastos - estadoResultados.otros_ingresos) * 0.3)}</span>
          </div>

          <div className="flex justify-between pt-4 font-bold text-xl border-t">
            <span>UTILIDAD NETA DEL EJERCICIO</span>
            <span className="text-green-600">{formatCurrency(estadoResultados.utilidad_neta)}</span>
          </div>

          <div className="text-sm text-gray-500 text-right">
            Margen Neto: {margenNeto.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Análisis de rentabilidad */}
      <div className="mt-8 pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4">Análisis de Rentabilidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'ROA (Return on Assets)', value: ((estadoResultados.utilidad_neta / 500000) * 100).toFixed(1) + '%', desc: 'Rentabilidad sobre activos' },
            { name: 'ROE (Return on Equity)', value: ((estadoResultados.utilidad_neta / 300000) * 100).toFixed(1) + '%', desc: 'Rentabilidad sobre patrimonio' },
            { name: 'Rotación de Activos', value: (estadoResultados.ingresos_operativos / 500000).toFixed(2), desc: 'Eficiencia uso de activos' }
          ].map((metric, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-sm">{metric.name}</p>
              <p className="text-2xl font-bold text-blue-600">{metric.value}</p>
              <p className="text-xs text-gray-500">{metric.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente principal
export default function SistemaContabilidad() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const dispatch = useAppDispatch();

  // Datos de ejemplo
  const reporteFinanciero: ReporteFinanciero = {
    ingresos_totales: 185000,
    gastos_totales: 125000,
    utilidad_neta: 60000,
    margen_utilidad: 32.4,
    ventas_mes_actual: 185000,
    ventas_mes_anterior: 162000,
    crecimiento_ventas: 14.2,
    activos_totales: 500000,
    pasivos_totales: 200000,
    patrimonio: 300000
  };

  const balanceGeneral: BalanceGeneral = {
    activos_corrientes: 200000,
    activos_no_corrientes: 300000,
    pasivos_corrientes: 80000,
    pasivos_no_corrientes: 120000,
    patrimonio: 300000,
    fecha_corte: '2024-01-15'
  };

  const estadoResultados: EstadoResultados = {
    ingresos_operativos: 250000,
    costos_ventas: 150000,
    utilidad_bruta: 100000,
    gastos_operativos: 60000,
    utilidad_operativa: 40000,
    otros_ingresos: 5000,
    otros_gastos: 10000,
    utilidad_neta: 35000,
    periodo: 'Enero 2024'
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContabilidad reporte={reporteFinanciero} />;
      case 'balance':
        return <BalanceGeneral balance={balanceGeneral} />;
      case 'resultados':
        return <EstadoResultadosComponent estadoResultados={estadoResultados} />;
      case 'transacciones':
        return <div className="bg-white rounded-lg p-6">Módulo de Transacciones</div>;
      case 'polizas':
        return <div className="bg-white rounded-lg p-6">Módulo de Pólizas</div>;
      case 'reportes':
        return <div className="bg-white rounded-lg p-6">Módulo de Reportes</div>;
      default:
        return <DashboardContabilidad reporte={reporteFinanciero} />;
    }
  };

  return (
    <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
      <header className="mb-8">
        <h1 className="flex items-center text-2xl font-bold md:text-3xl">
          <Calculator className="mr-2 h-8 w-8 text-blue-600" />
          Sistema Integral de Contaduría
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-100">
          Gestión financiera completa y reportes contables
        </p>
      </header>

      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {renderActiveTab()}

      {/* Barra de herramientas global */}
      <div className="fixed bottom-6 right-6 flex space-x-3">
        <button className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-6 w-6" />
        </button>
        <button className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors">
          <Download className="h-6 w-6" />
        </button>
        <button className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors">
          <FileText className="h-6 w-6" />
        </button>
      </div>
    </main>
  );
}