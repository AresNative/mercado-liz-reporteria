"use client";
// pages/dashboard.tsx (ejemplo de uso integrado)
import SalesReport from '../components/SalesReport';
import { useState } from 'react';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState({
    start: new Date('2024-01-01').toISOString().split('T')[0],
    end: new Date('2025-12-31').toISOString().split('T')[0]
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dashboard de Consultas Masivas
          </h1>


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
        </header>

        {/* Contenido principal */}
        <main>
          <SalesReport
            fechaInicio={dateRange.start}
            fechaFin={dateRange.end}
          />
        </main>
      </div>
    </div>
  );
}