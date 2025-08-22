"use client";

import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { Button } from "@/components/button";
import MainForm from "@/components/form/main-form";
import Segment from "@/components/segment";
import DynamicTable from "@/components/table";
import { FileBarChart2Icon, Users } from "lucide-react";
import React, { useState, useEffect } from "react";
import { ChecadorField } from "../constants/checador";
import { CheckadorService, type RegistroTiempo } from "../utils/checador-logic";
import { Clock, MapPin, ArrowRight, CheckCircle } from "lucide-react";
import Badge from "@/components/badge";

// Tamaño de página para datos importados
const IMPORT_PAGE_SIZE = 10;

export default function User() {
  const [section, setSection] = useState("listas");
  const [registros, setRegistros] = useState<RegistroTiempo[]>([]);
  const [ultimoRegistro, setUltimoRegistro] = useState<RegistroTiempo | null>(null);
  const [tipoProximo, setTipoProximo] = useState<{
    tipo: "entrada" | "salida" | "traslado";
    mensaje: string;
  } | null>(null);

  useEffect(() => {
    cargarRegistros();
  }, []);

  const cargarRegistros = () => {
    const registrosRecientes = CheckadorService.obtenerRegistrosRecientes(10);
    setRegistros(registrosRecientes);
  };

  const handleEmpleadoChange = (empleadoId: string, sucursal: string) => {
    if (empleadoId && sucursal) {
      const ultimo = CheckadorService.obtenerUltimoRegistro(empleadoId);
      const proximo = CheckadorService.determinarTipoRegistro(empleadoId, sucursal);
      setUltimoRegistro(ultimo);
      setTipoProximo(proximo);
    } else {
      setUltimoRegistro(null);
      setTipoProximo(null);
    }
  };

  const handleRegistroExitoso = (result: any, formData: any) => {
    console.log(result, formData);

    const nuevoRegistro = CheckadorService.registrarTiempo(formData.empleado_id, formData.nombre, formData.sucursal);

    setUltimoRegistro(nuevoRegistro);
    cargarRegistros();

    // Limpiar la predicción después del registro
    setTimeout(() => {
      setTipoProximo(null);
    }, 2000);
  };

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "entrada":
        return "bg-green-100 text-green-800 border-green-200";
      case "salida":
        return "bg-red-100 text-red-800 border-red-200";
      case "traslado":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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
              description="El sistema detecta automáticamente si es entrada, salida o traslado"
              className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
            >
              <MainForm
                actionType="checador"
                dataForm={ChecadorField()}
                message_button="Registrar Tiempo"
                onSuccess={handleRegistroExitoso}
                formName="checador"
              /* onFieldChange={(name, value, formData) => {
                if (name === "empleado_id" || name === "sucursal") {
                  handleEmpleadoChange(formData.empleado_id, formData.sucursal);
                }
              }} */
              />

              {/* Predicción del próximo registro */}
              {tipoProximo && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Próximo registro:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="green" text={tipoProximo.tipo.toUpperCase()} />
                    <span className="text-sm text-blue-700 dark:text-blue-300">{tipoProximo.mensaje}</span>
                  </div>
                </div>
              )}

              {/* Último registro del empleado */}
              {ultimoRegistro && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Último registro de este empleado:
                  </h4>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge color="green" text={ultimoRegistro.tipo.toUpperCase()} />
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {ultimoRegistro.sucursal}
                    </span>
                    <span>
                      {ultimoRegistro.fecha} - {ultimoRegistro.hora}
                    </span>
                  </div>
                </div>
              )}
            </BentoItem>

            {/* Tarjetas de resumen */}
            <BentoItem
              rowSpan={{ sm: 1, md: 2, lg: 2 }}
              colSpan={{ sm: 1, md: 2, lg: 2 }}
              title="Registros Recientes"
              description="Últimos movimientos registrados en el sistema"
            >
              <div className="flex flex-col h-full space-y-3 max-h-96 overflow-y-auto">
                {registros.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay registros disponibles</p>
                ) : (
                  registros.map((registro) => (
                    <div
                      key={registro.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Badge color="green" text={registro.tipo.toUpperCase()} />
                        <div>
                          <p className="font-medium text-sm">{registro.nombre}</p>
                          <p className="text-xs text-gray-500">ID: {registro.empleado_id}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {registro.sucursal}
                        </div>
                        <div>{registro.fecha}</div>
                        <div>{registro.hora}</div>
                      </div>
                    </div>
                  ))
                )}
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
    </main>
  );
}