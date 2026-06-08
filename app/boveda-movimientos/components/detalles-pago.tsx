"use client";

import {
    User, Mail, Phone, MapPin, Calendar, Briefcase,
    Building, DollarSign, FileText, BadgeCheck,
    Download, Clock, Hash, X
} from "lucide-react";
import { Button } from "@/components/button";
import { useCallback, useEffect, useState } from "react";
import { useGetWithFiltersIntelisisMutation } from "@/hooks/api/api_int";
import DynamicTable from "@/components/table";
import Pagination from "@/components/pagination";

interface PagoResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: any[];
}

export const DetallesPago = ({ selectedPago }: any) => {
    const [pago, setPago] = useState<any>([]);
    const [pagoDetails, setPagoDetails] = useState<any>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersIntelisisMutation();

    if (!selectedPago) return null;

    
    const fetchPago = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getWithFilter({
                table: `CXP INNER JOIN CXPD ON CXP.MOV = 'Pago' AND CXPD.ID = ${selectedPago} AND CXPD.Aplica = 'Entrada Compra' AND CXPD.ID = CXP.ID INNER JOIN Prov ON CXP.Proveedor = Prov.Proveedor LEFT JOIN COMPRA ON CXPD.AplicaID = COMPRA.MovID LEFT JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo `,
                pageSize: "10",
                page: currentPage,
                filtros: {
                    Selects: [
                        { Key: "CXP.ID", },
                        {
                            Key: "CXP.Proveedor"
                        },
                        {
                            Key: "Prov.Nombre",
                            Alias: "Nombre Proveedor"
                        },
                        { Key: "CXPD.Importe" },
                        { Key: "art.Articulo" },
                        { Key: "art.Descripcion1", Alias: "Nombre" },
                        { Key: "comprad.Costo", Alias: "Costo Unitario" },
                        { Key: "comprad.Unidad" },
                        { Key: "comprad.Factor" },
                    ],
                    agregaciones: [
                        { Key: "comprad.Cantidad", Alias: "Cantidad", Operation: "SUM" },
                        { Key: "comprad.CantidadInventario", Alias: "Articulos Totales", Operation: "SUM" },
                        { Key: "(comprad.Costo * comprad.Cantidad)", Alias: "Total Compras", Operation: "SUM" },
                    ],
                    /* Filtros: activeFilters.Filtros, */
                }
            });

            if ('data' in response) {
                const pagoData = response.data as PagoResponse;


                const formattedDetailsData = pagoData.data.map((item) => {
                    //const { Codigo, Articulo, Nombre, Categoria, Grupo, Familia, Unidad, Factor, ...rest } = item;
                    return ({
                        nombre: item.Proveedor,
                        apellido: item["Nombre Proveedor"],
                        "Costo Unitario": item["Costo Unitario"] || 0,
                        Unidad: [item.Unidad, ...(item.Factor > 1 ? [`x${item.Factor}`] : [])],
                        Cantidad: [item.Cantidad, ...(item.Factor > 1 ? [`${item["Articulos Totales"]}`] : [])],
                        ["Total Compras"]: item["Total Compras"] || 0,
                    })
                });
                setPagoDetails(formattedDetailsData);

                const formattedData = pagoData.data.map((item) => {
                    //const { Codigo, Articulo, Nombre, Categoria, Grupo, Familia, Unidad, Factor, ...rest } = item;
                    return ({
                        Articulo: [item.Nombre, item.Articulo ],
                        "Costo Unitario": item["Costo Unitario"] || 0,
                        Unidad: [item.Unidad, ...(item.Factor > 1 ? [`x${item.Factor}`] : [])],
                        Cantidad: [item.Cantidad, ...(item.Factor > 1 ? [`${item["Articulos Totales"]}`] : []) ],
                        ["Total Compras"]: item["Total Compras"] || 0,
                    })
                });
                setPago(formattedData);
                setTotalPages(pagoData.totalPages);
                setTotalRecords(pagoData.totalRecords);
            } else if ('error' in response) {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (err) {
            console.error("Error fetching pago:", err);
            setError("No se pudieron cargar los pago. Intente nuevamente.");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage,/*  activeFilters, setActiveFilters */]);
    
    useEffect(() => {
        fetchPago();
    }, [currentPage]);
    
    const getStatusColor = (estado: string) => {
        return estado === "Activo"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
    };

    return (
        <main className="p-4">
            {/* Header con información básica */}
            <header className="bg-gray-50 rounded-lg p-4 mb-6">
                <ul className="flex items-center space-x-4">
                    <li className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-green-600" />
                    </li>
                    <li className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900">
                            {pagoDetails.nombre} {pagoDetails.apellido}
                        </h2>
                        <article className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pagoDetails.estado)}`}>
                                {pagoDetails.estado}
                            </span>
                            <span className="text-sm text-gray-500">#{pagoDetails.num_empleado}</span>
                        </article>
                    </li>
                </ul>
            </header>
            <dt className="flex flex-col gap-2">
                <DynamicTable
                    data={pago}
                />
                <Pagination
                    currentPage={currentPage}
                    loading={isLoading}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                />
            </dt>
        </main>
    );
};