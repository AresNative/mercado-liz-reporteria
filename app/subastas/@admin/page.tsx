"use client";

import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { Button } from "@/components/button";
import MainForm from "@/components/form/main-form";
import Segment from "@/components/segment";
import DynamicTable from "@/components/table";
import { ChartCandlestick, Container, FileBarChart2Icon, Hash, Lock, ChartSpline, Store, Plus, FolderIcon } from "lucide-react";
import React, { useState } from "react";
import { SubastaField } from "../constants/subasta";
import Badge from "@/components/badge";
import { formatValue } from "@/utils/constants/format-values";

// Tamaño de página para datos importados
const IMPORT_PAGE_SIZE = 10;

interface Puja {
  Proveedor: string;
  Puja: number;
  Cantidad: number;
}

interface ArticuloAgrupado {
  Articulo: string;
  Fabricante: string;
  Nombre: string;
  Pujas: Puja[];
}

interface ArticuloOriginal {
  ID: number;
  Articulo: string;
  Fabricante: string;
  Nombre: string;
  Proveedor: string;
  Puja: number;
  Cantidad: number;
}
interface SubastaFinalizada {
  id: string;
  area: string;
  nombre: string;
  fechaFinalizacion: string;
  ahorroTotal: number;
  proveedorGanador: string;
}

export default function User() {
  const [section, setSection] = useState("listas");

  function agruparPorArticulo(data: ArticuloOriginal[]): ArticuloAgrupado[] {
    const resultado: ArticuloAgrupado[] = [];
    const articulosMap: Record<string, ArticuloAgrupado> = {};

    data.forEach((item: ArticuloOriginal) => {
      if (!articulosMap[item.Articulo]) {
        articulosMap[item.Articulo] = {
          Articulo: item.Articulo,
          Fabricante: item.Fabricante,
          Nombre: item.Nombre,
          Pujas: []
        };
        resultado.push(articulosMap[item.Articulo]);
      }

      articulosMap[item.Articulo].Pujas.push({
        Proveedor: item.Proveedor,
        Puja: item.Puja,
        Cantidad: item.Cantidad
      });
    });

    return resultado;
  }

  // Ejemplo de uso:
  const data: ArticuloOriginal[] = [
    {
      "ID": 0,
      "Articulo": "2904",
      "Fabricante": "SU KARNE",
      "Nombre": "COSTILLA DE RES CARGADA KG",
      "Proveedor": "#1",
      "Puja": 100.50,
      "Cantidad": 35
    },
    {
      "ID": 0,
      "Articulo": "2904",
      "Fabricante": "SU KARNE",
      "Nombre": "COSTILLA DE RES CARGADA KG",
      "Proveedor": "#2",
      "Puja": 120.50,
      "Cantidad": 5
    }
  ];

  const datosAgrupados = agruparPorArticulo(data);
  const subastasFinalizadas: Record<string, SubastaFinalizada[]> = {
    'Carnicería': [
      {
        id: 'SUB-001',
        area: 'Carnicería',
        nombre: 'Subasta de cortes premium',
        fechaFinalizacion: '2023-10-15',
        ahorroTotal: 12500,
        proveedorGanador: 'Carnes Premium SA'
      },
      {
        id: 'SUB-002',
        area: 'Carnicería',
        nombre: 'Subasta de embutidos',
        fechaFinalizacion: '2023-10-18',
        ahorroTotal: 8500,
        proveedorGanador: 'Embutidos Del Norte'
      }
    ],
    'Frutas y Verduras': [
      {
        id: 'SUB-003',
        area: 'Frutas y Verduras',
        nombre: 'Subasta de frutas de temporada',
        fechaFinalizacion: '2023-10-10',
        ahorroTotal: 9200,
        proveedorGanador: 'Frutas del Valle'
      }
    ],
    'Abarrotes': [
      {
        id: 'SUB-004',
        area: 'Abarrotes',
        nombre: 'Subasta de productos enlatados',
        fechaFinalizacion: '2023-10-05',
        ahorroTotal: 15300,
        proveedorGanador: 'Distribuidora Alimenticia'
      }
    ]
  };

  return (
    <main className="flex flex-col items-center m-auto px-4 py-8 max-w-7xl w-full">
      {/* Header mejorado */}
      <section className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 mb-8">
        <div className="w-full sm:w-auto">
          <Segment
            items={[
              { value: "listas", label: "Listas y estados" },
              { value: "subastas", label: "Subastas activas" },
            ]}
            defaultValue="listas"
            size="md"
            onValueChange={(value) => setSection(value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {section === "subastas" && (
            <div className="flex gap-2">
              <Button color="success" label="Crear" />
              <Button color="info" label="Historial" />
            </div>
          )}
          <Button color="success">
            <FileBarChart2Icon className="size-4" />
            Exportar
          </Button>
        </div>
      </section>

      {/* Contenido principal */}
      {section === "listas" ? (
        <>
          <BentoGrid cols={{ md: 4, lg: 4 }}>
            {/* Formulario principal */}
            <BentoItem
              rowSpan={{ md: 3, lg: 3 }}
              colSpan={{ md: 2, lg: 2 }}
              title="Crear Subasta"
              description="Crea una subasta para obtener mejores precios y condiciones de compra."
              icon={<ChartCandlestick className="h-6 w-6 text-gray-600" />}
              className="bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800"
            >
              <MainForm
                actionType="submit"
                dataForm={SubastaField()}
                message_button="Crear Subasta"
                onSuccess={(data: any) => console.log(data)}
              />
            </BentoItem>

            {/* Tarjetas de resumen */}
            <BentoItem
              rowSpan={{ md: 2, lg: 2 }}  // Aumentamos el rowSpan para mejor visualización
              colSpan={{ md: 2, lg: 2 }}
              title="Resumen de Compras"
              description="Historial de subastas por área"
              icon={<Container className="h-6 w-6 text-blue-600" />}
              className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
            >
              <div className="flex flex-col h-full">
                {/* Filtros rápidos */}
                <div className="mb-4">
                  <ScrollableTags />
                </div>

                {/* Listado de subastas con mejor organización */}
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 dark:scrollbar-thumb-blue-700 dark:scrollbar-track-blue-900/50">
                  {Object.entries(subastasFinalizadas).map(([area, subastas]) => (
                    <div key={area} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-base flex items-center">
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                          {area}
                        </h3>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                          {subastas.length} subastas
                        </span>
                      </div>

                      <div className="space-y-2">
                        {subastas.map(subasta => (
                          <div
                            key={subasta.id}
                            className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-medium text-sm line-clamp-2">{subasta.nombre}</p>
                              <Badge
                                color="green"
                                text={`${formatValue(subasta.ahorroTotal, "currency")}`}
                              />
                            </div>

                            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                              <span>{subasta.proveedorGanador}</span>
                              <span>{new Date(subasta.fechaFinalizacion).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen total al final */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ahorro total:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatValue(
                        Object.values(subastasFinalizadas).flat().reduce((total, subasta) => total + subasta.ahorroTotal, 0),
                        "currency"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </BentoItem>

            <BentoItem
              rowSpan={{ md: 2, lg: 4 }}
              colSpan={{ md: 2, lg: 4 }}
              title="Tendencias"
              description="Últimas tendencias de precios"
              icon={<ChartSpline className="h-6 w-6 text-gray-600" />}
              className="bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800"
            >
              <MiniChartPlaceholder />
            </BentoItem>

            {/* Tarjetas de sucursales */}
            {['Mayoreo', 'Guadalupe', 'Testereazo', 'Palmas'].map((sucursal, index) => (
              <React.Fragment key={`${sucursal}-${index}`}>
                <BentoItem
                  title={sucursal}
                  description={`Actividad en ${sucursal}`}
                  icon={<Store className="h-6 w-6 text-purple-600" />}
                  className="bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800"
                >
                  <SucursalStats index={index} />
                </BentoItem>
              </React.Fragment>
            ))}
          </BentoGrid>
        </>
      ) : (
        <section className="w-full mt-4">
          <DynamicTable
            data={datosAgrupados}
            itemsPerPage={IMPORT_PAGE_SIZE}
          />
        </section>
      )}
    </main >
  );
}

// Componentes auxiliares para mejorar la UI
const ScrollableTags = () => (
  <section className="w-full overflow-hidden mt-2">
    <ul className="flex gap-2 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      {Array.from({ length: 6 }).map((_, i) => (
        <Badge key={i} color="indigo" text={`Lista_${i + 1}`} />
      ))}
      <li className="flex-shrink-0 flex items-center bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-300 px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-700 sticky right-0 ml-auto">
        <Plus className="size-4" />
      </li>
    </ul>
  </section>
);

const MiniChartPlaceholder = () => (
  <div className="h-24 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-900/30 rounded-lg mt-2 flex items-center justify-center">
    <ChartSpline className="h-8 w-8 text-green-400 opacity-50" />
  </div>
);

const SucursalStats = ({ index }: { index: number }) => (
  <div className="flex items-center justify-between mt-2">
    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
      {formatValue((index + 1) * 12500, "currency")}
    </div>
    <div className={`text-sm ${index % 2 ? 'text-green-500' : 'text-red-500'}`}>
      {index % 2 ? '↑' : '↓'} {index + 3.5}%
    </div>
  </div>
);