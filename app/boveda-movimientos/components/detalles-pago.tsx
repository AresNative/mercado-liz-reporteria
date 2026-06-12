"use client";

import {
    Copy,
    Eye,
    FileText,
    Share2,
    Trash2,
    Upload
} from "lucide-react";
import { Button } from "@/components/button";
import { useCallback, useEffect, useState } from "react";
import { useGetWithFiltersIntelisisMutation } from "@/hooks/api/api_int";
import DynamicTable from "@/components/table";
import Pagination from "@/components/pagination";
import { ContextMenu } from "@/components/context-menu";

interface PagoResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: any[];
}

export const DetallesPago = ({ selectedPago }: any) => {
    const [pago, setPago] = useState<any>([]);
    const [pagoDetails, setPagoDetails] = useState<any>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersIntelisisMutation();

    if (!selectedPago) return null;

    
    const fetchPago = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getWithFilter({
                table: `CXP INNER JOIN CXPD ON CXP.MOV = 'Pago' AND CXP.ID = ${selectedPago} AND CXPD.ID = CXP.ID INNER JOIN Prov ON CXP.Proveedor = Prov.Proveedor INNER JOIN COMPRA ON COMPRA.Mov = CXP.Origen AND CXP.OrigenID = COMPRA.MovID INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo INNER JOIN CFDValidoMovLista AS CFDL ON CXP.OrigenID = CFDL.MovID INNER JOIN CFDEgreso AS Egreso ON Egreso.UUID = CFDL.UUID AND Egreso.ModuloID = CFDL.ModuloID`,
                filtros: {
                    Selects: [
                        { Key: "COMPRA.MovID" },
                        { Key: "CXP.OrigenID"},
                        { Key: "CXP.ID" },
                        { Key: "CXP.Proveedor" },
                        { Key: "Prov.Nombre", Alias: "Nombre Proveedor" },
                        { Key: "CXPD.Importe" },
                        { Key: "art.Articulo" },
                        { Key: "art.Descripcion1", Alias: "Nombre" },
                        { Key: "ART.Categoria" },
                        { Key: "ART.Grupo" },
                        { Key: "ART.Familia" },
                        { Key: "comprad.Costo", Alias: "Costo Unitario" },
                        { Key: "comprad.Unidad" },
                        { Key: "comprad.Factor" },
                        { Key: "comprad.Impuesto1", Alias: "IVA" },
                        { Key: "comprad.Impuesto2", Alias: "IEPS" },
                        { Key: "comprad.Impuesto3", Alias: "ISR" },
                        { Key: "Egreso.Documento" },
                    ],
                    agregaciones: [
                        { Key: "comprad.Cantidad", Alias: "Cantidad", Operation: "SUM" },
                        { Key: "comprad.CantidadInventario", Alias: "Articulos Totales", Operation: "SUM" },
                        { Key: "(comprad.Costo * comprad.Cantidad)", Alias: "Total Compras", Operation: "SUM" },
                    ],
                    /* Filtros: activeFilters.Filtros, */
                },
                pageSize: pageSize,
                page: currentPage,
            });

            if ('data' in response) {
                const pagoData = response.data as PagoResponse;

                const lastItem = pagoData.data[pagoData.data.length - 1];

                const formattedDetails = lastItem && {
                    movId: lastItem.MovID,
                    num_empleado: lastItem.Proveedor,
                    nombre: lastItem["Nombre Proveedor"],
                    estado: lastItem["Estado Proveedor"] || "Activo",
                };                
                setPagoDetails(formattedDetails);

                const formattedData = pagoData.data.map((item) => {
                    //const { Codigo, Articulo, Nombre, Categoria, Grupo, Familia, Unidad, Factor, ...rest } = item;
                    return ({
                        Articulo: [item.Nombre, item.Articulo ],
                        Categoria: [item.Categoria, item.Grupo, item.Familia],
                        Unidad: [item.Unidad, ...(item.Factor > 1 ? [`x${item.Factor}`] : [])],
                        Cantidad: [item.Cantidad, ...(item.Factor > 1 ? [`${item["Articulos Totales"]}`] : [])],
                        IVA: item.IVA,
                        IEPS: item.IEPS,
                        ISR: item.ISR,
                        "Costo Unitario": item["Costo Unitario"],
                        ["Total Compras"]: item["Total Compras"],
                    })
                });
                setPago(formattedData);
                setTotalPages(pagoData.totalPages);
            } else if ('error' in response) {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (err) {
            console.error("Error fetching pago:", err);
            setError("No se pudieron cargar los pago. Intente nuevamente.");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, pageSize]);
    
    useEffect(() => {
        fetchPago();
    }, [currentPage, pageSize]);
    
    const getStatusColor = (estado: string) => {
        return estado === "Activo"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
    };

    return (
        <main className="p-4">
            {/* Header con información básica */}
            <header className="bg-zinc-50 rounded-lg p-4 mb-6">
                <ul className="flex items-center gap-4 justify-between">
                    <li className="flex flex-col">
                        <h2 className="text-xl font-bold text-gray-900">
                            {(pagoDetails && pagoDetails.nombre) && pagoDetails.nombre}
                        </h2>
                        <article className="flex items-center space-x-4 mt-2">
                            {(pagoDetails && pagoDetails.estado) && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pagoDetails.estado)}`}>
                                    {pagoDetails.estado}
                                </span>
                            )}
                            {(pagoDetails && pagoDetails.num_empleado) && (
                                <span className="text-sm text-gray-500">#{pagoDetails.num_empleado}</span>
                            )}
                            {(pagoDetails && pagoDetails.movId) && (
                                <span className="text-sm text-gray-500">#{pagoDetails.movId}</span>
                            )}
                        </article>
                    </li>
                    <li className="flex flex-col gap-2">
                        <Button color="success" size="small">
                            <Upload className="size-5" /> Subir Expediente
                        </Button>
                        <Button color="success" size="small">
                            <Eye className="size-5" /> Ver Expediente
                        </Button>
                    </li>
                </ul>
            </header>
            <dt className="flex flex-col gap-2">
                <DynamicTable
                    data={pago}
                    contextMenuItems={(row) => [
                        {
                            label: 'Copiar',
                            icon: <Copy size={16} />,
                            onClick: () => console.log('Copiado'),
                        },
                        {
                            label: 'Ver detalles',
                            icon: <FileText size={16} />,
                            onClick: () => console.log('Mostrar detalles'),
                        },
                        {
                            label: 'Compartir',
                            icon: <Share2 size={16} />,
                            onClick: () => console.log('Abrir diálogo de compartir'),
                        },
                        {
                            label: 'Eliminar',
                            icon: <Trash2 size={16} />,
                            onClick: () => console.log('Elemento eliminado'),
                            danger: true,
                        },
                    ]}
                />
                <Pagination
                    currentPage={currentPage}
                    loading={isLoading}
                    setCurrentPage={setCurrentPage}
                    currentPageSize={pageSize}
                    onPageSizeChange={setPageSize}
                    totalPages={totalPages}
                />
            </dt>
        </main>
    );
};