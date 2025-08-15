"use client";

import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { Button } from "@/components/button";
import MainForm from "@/components/form/main-form";
import Segment from "@/components/segment";
import DynamicTable from "@/components/table";
import { ChartCandlestick, Container, FileBarChart2Icon, Hash, Lock, ChartSpline, Store } from "lucide-react";
import { useState } from "react";
import { SubastaField } from "../constants/subasta";

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
        {(<>
          <Segment
            items={[
              { value: "listas", label: "Listas" },
              { value: "subastas", label: "Subastas" },
            ]}
            defaultValue="listas"
            size="sm"
            accent="slate"
            onValueChange={(value) => setsection(value)}
          />
          {section === "subastas" &&
            <ul className="flex gap-4">
              <Button color="success" label="Crear Subasta" />
              <Button color="success" label="Mis Subastas" />
            </ul>}
          <Button color="success"> Exportar <FileBarChart2Icon /></Button>
        </>)}
      </section>

      {section === "listas" ?
        (<section className="flex flex-col gap-4 mt-4 items-center w-full">

          <BentoGrid>
            <BentoItem
              rowSpan={8}
              colSpan={1}
              title="Crear Subasta"
              description="Crea una subasta para obtener mejores precios y condiciones de compra."
              icon={<ChartCandlestick className="h-6 w-6 text-purple-900" />}
            >
              <MainForm
                actionType="submit"
                dataForm={SubastaField()}
                message_button="Crear"
                onSuccess={(data: any) => console.log(data)}
              />
            </BentoItem>

            <BentoItem
              rowSpan={1}
              colSpan={1}
              title="Mayoreo"
              description=""
              icon={<Container className="h-6 w-6 text-purple-900" />}
              className="dark:bg-purple-700 bg-purple-100"
            >
              <section>
                <ul className="flex flex-wrap gap-2">
                  <li className="flex items-center bg-indigo-200 dark:bg-indigo-700 text-white px-4 py-2 rounded-2xl">.</li>
                  <li className="flex items-center bg-indigo-200 dark:bg-indigo-700 text-white px-4 py-2 rounded-2xl" >.</li>
                  <li className="flex items-center bg-indigo-200 dark:bg-indigo-700 text-white px-4 py-2 rounded-2xl">.</li>
                  <li className="flex items-center bg-indigo-200 dark:bg-indigo-700 text-white px-4 py-2 rounded-2xl">.</li>
                </ul>
              </section>
            </BentoItem>

            <BentoItem
              rowSpan={1}
              colSpan={1}
              title=""
              description=""
              icon={<ChartCandlestick className="h-6 w-6 text-green-900" />}
              className="dark:bg-green-700 bg-green-100"
            >
            </BentoItem>

            <BentoItem
              rowSpan={1}
              colSpan={1}
              title="Guadalupe"
              description=""
              icon={<Store className="h-6 w-6 text-purple-900" />}
              className="dark:bg-purple-700 bg-purple-100"
            >
            </BentoItem>
            <BentoItem
              rowSpan={1}
              colSpan={1}
              title=""
              description=""
              icon={<ChartSpline className="h-6 w-6 text-green-900" />}
              className="dark:bg-green-700 bg-green-100"
            >
            </BentoItem>
            <BentoItem
              rowSpan={1}
              colSpan={1}
              title="Testereazo"
              description=""
              icon={<Store className="h-6 w-6 text-purple-900" />}
              className="dark:bg-purple-700 bg-purple-100"
            >
            </BentoItem>

            <BentoItem
              rowSpan={1}
              colSpan={1}
              title=""
              description=""
              icon={<ChartCandlestick className="h-6 w-6 text-green-900" />}
              className="dark:bg-green-700 bg-green-100"
            >
            </BentoItem>

            <BentoItem
              rowSpan={1}
              colSpan={1}
              title="Palmas"
              description=""
              icon={<Store className="h-6 w-6 text-purple-900" />}
              className="dark:bg-purple-700 bg-purple-100"
            >
            </BentoItem>
            <BentoItem
              rowSpan={1}
              colSpan={1}
              title=""
              description=""
              icon={<ChartSpline className="h-6 w-6 text-green-900" />}
              className="dark:bg-green-700 bg-green-100"
            />
          </BentoGrid>
        </section>)
        :
        (<section className="flex flex-col gap-4 mt-4 items-center w-full">
          <DynamicTable data={datosAgrupados} itemsPerPage={IMPORT_PAGE_SIZE} />
        </section>)
      }
    </main>
  );
}
