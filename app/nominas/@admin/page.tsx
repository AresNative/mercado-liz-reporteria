"use client";

import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { Button } from "@/components/button";
import MainForm from "@/components/form/main-form";
import Segment from "@/components/segment";
import DynamicTable from "@/components/table";
import { FileBarChart2Icon } from "lucide-react";
import React, { useState } from "react";
import { ChecadorField } from "../constants/checador";

// Tamaño de página para datos importados
const IMPORT_PAGE_SIZE = 10;

export default function User() {
  const [section, setSection] = useState("listas");

  return (
    <main className="flex flex-col items-center m-auto px-4 py-8 max-w-7xl w-full">
      <section className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 mb-8">
        <Segment
          items={[
            { value: "listas", label: "Listas y estados" },
            { value: "subastas", label: "Subastas activas" },
          ]}
          defaultValue="listas"
          onValueChange={(value) => setSection(value)}
        />
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button color="success">
            <FileBarChart2Icon className="size-4" />
            Exportar
          </Button>
        </div>
      </section>

      {/* Contenido principal */}
      {section === "listas" ? (
        <>
          <BentoGrid cols={{ md: 4, lg: 4 }} className="w-full p-0">
            {/* Formulario principal */}
            <BentoItem
              rowSpan={{ sm: 1, md: 2, lg: 2 }}
              colSpan={{ sm: 1, md: 2, lg: 2 }}
              title="Registro de tiempo"
              description="El sistema detecta automáticamente si es entrada o salida."
              className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
            >
              <MainForm
                actionType="submit"
                dataForm={ChecadorField()}
                message_button="Crear Subasta"
                onSuccess={(data: any) => console.log(data)}
              />
              <section className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">

              </section>
            </BentoItem>

            {/* Tarjetas de resumen */}
            <BentoItem
              rowSpan={{ sm: 1, md: 2, lg: 2 }}  // Aumentamos el rowSpan para mejor visualización
              colSpan={{ sm: 1, md: 2, lg: 2 }}
              title="Registros Recientes"
              description="Últimos movimientos registrados en el sistema"
              className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
            >
              <div className="flex flex-col h-full">

              </div>
            </BentoItem>


          </BentoGrid>
        </>
      ) : (
        <section className="w-full mt-4">
          <DynamicTable
            data={[]}
            itemsPerPage={IMPORT_PAGE_SIZE}
          />
        </section>
      )}
    </main >
  );
}