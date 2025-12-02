"use client";
// pages/dashboard.tsx (ejemplo de uso integrado)
import { SalesReport } from '../components/SalesReport';
import { useState } from 'react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'sales'>('products');
  const [selectedCategory, setSelectedCategory] = useState('ELECTRONICA');
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: '2024-12-31'
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dashboard de Consultas Masivas
          </h1>

          {/* Navegación */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'products'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
                }`}
            >
              Catálogo de Productos
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'sales'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
                }`}
            >
              Reporte de Ventas
            </button>
          </div>

          {/* Filtros específicos por pestaña */}
          {activeTab === 'products' && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="ELECTRONICA">Electrónica</option>
                <option value="HOGAR">Hogar</option>
                <option value="OFICINA">Oficina</option>
              </select>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio:
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Fin:
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Contenido principal */}
        <main>
          {/* {activeTab === 'products' && (
            <ProductCatalog categoria={selectedCategory} />
          )} */}

          {activeTab === 'sales' && (
            <SalesReport
              fechaInicio={dateRange.start}
              fechaFin={dateRange.end}
            />
          )}
        </main>
      </div>
    </div>
  );
}