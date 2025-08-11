"use client";

import { Button } from "@/components/button";
import Segment from "@/components/segment";
import DynamicTable from "@/components/table";
import { FileBarChart2Icon } from "lucide-react";
import { useState } from "react";

// Tamaño de página para datos importados
const IMPORT_PAGE_SIZE = 10;


export default function User() {
  const [section, setsection] = useState("listas");
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

  return (
    <main className="flex flex-col items-center m-auto px-4 py-8">
      <section className="flex items-center justify-between w-full">
        <Segment
          items={[
            { value: "listas", label: "Listas" },
            { value: "subastas", label: "Subastas" },
          ]}
          defaultValue="listas"
          size="sm"
          accent="emerald"
          onValueChange={(value) => setsection(value)}
        />
        <Button color="success"> Exportar <FileBarChart2Icon /></Button>
      </section>

      {section === "listas" ?
        (<section className="flex flex-col gap-4 mt-4 items-center w-full">
          <Button label="Solicitar Lista" />

          <DynamicTable data={[{
            "ID": 0,
            "Sucursal": "test",
            "Articulo": "2904",
            "Fabricante": "SU KARNE",
            "Nombre": "COSTILLA DE RES CARGADA KG",
            "Categoria": "PERECEDEROS",
            "Grupo": "CARNE DE RES",
            "Linea": "RES",
            "Familia": "CARNE DE RES",
            "Unidad": "Kilogramo",
            "Cantidad": 40,
            "CostoUnitario": 170,
            "IVA": 0,
            "IEPS": null,
            "FechaInicio": "2025-04-15T08:00:00",
            "FechaFin": "2025-04-25T08:00:00"
          }]} itemsPerPage={IMPORT_PAGE_SIZE} />
        </section>)
        :
        (<section className="flex flex-col gap-4 mt-4 items-center w-full">
          <ul className="flex gap-4">
            <Button label="Crear Subasta" />
            <Button label="Mis Subastas" />
          </ul>
          <DynamicTable data={datosAgrupados} itemsPerPage={IMPORT_PAGE_SIZE} />
        </section>)
      }
    </main >
  );
}
