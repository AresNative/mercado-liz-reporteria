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
import { CFDIParser } from "@/hooks/classes/xml-reader";

interface Response {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: any[];
}

export const DetallesPago = ({ selectedPago }: any) => {
    const [pago, setPago] = useState<any[]>([]);
    const [xml, setXml] = useState<any[]>([]);
    const [pagoDetails, setPagoDetails] = useState<any>({});
    // Paginación para la primera tabla (viene del API)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    // Paginación independiente para la segunda tabla (XML)
    const [xmlCurrentPage, setXmlCurrentPage] = useState(1);
    const [xmlPageSize, setXmlPageSize] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersIntelisisMutation();

    if (!selectedPago) return null;

    // Helper para obtener el importe de un impuesto dado su código y tipo (traslado/retención)
    const getTaxAmount = (impuestos: any, codigo: string, tipo: 'traslado' | 'retencion' = 'traslado'): number => {
        if (!impuestos || !impuestos[tipo === 'traslado' ? 'traslados' : 'retenciones']) return 0;
        const lista = impuestos[tipo === 'traslado' ? 'traslados' : 'retenciones'];
        const item = lista.find((t: any) => t.impuesto === codigo);
        return item ? item.importe : 0;
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const parser = new CFDIParser();
        try {
            const response = await getWithFilter({
                table: `CXP INNER JOIN CXPD ON CXP.MOV = 'Pago' AND CXP.ID = ${selectedPago} AND CXPD.ID = CXP.ID INNER JOIN Prov ON CXP.Proveedor = Prov.Proveedor INNER JOIN COMPRA ON COMPRA.Mov = CXP.Origen AND CXP.OrigenID = COMPRA.MovID INNER JOIN COMPRAD AS comprad ON comprad.ID = compra.ID INNER JOIN ART AS ART ON comprad.Articulo = ART.Articulo INNER JOIN CFDValidoMovLista AS CFDL ON CXP.OrigenID = CFDL.MovID INNER JOIN CFDEgreso AS Egreso ON Egreso.UUID = CFDL.UUID AND Egreso.ModuloID = CFDL.ModuloID`,
                filtros: {
                    Selects: [
                        { Key: "COMPRA.MovID" },
                        { Key: "CXP.OrigenID" },
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
                },
                pageSize: pageSize,
                page: currentPage,
            });

            if ('data' in response) {
                const pagoData = response.data as Response;
                const lastItem = pagoData.data[pagoData.data.length - 1];
                const formattedDetails = lastItem && {
                    movId: lastItem.MovID,
                    num_empleado: lastItem.Proveedor,
                    nombre: lastItem["Nombre Proveedor"],
                    estado: lastItem.Documento ? "Con Documento" : "Sin Documento",
                };
                setPagoDetails(formattedDetails);

                // 2. Obtener todos los ítems que tienen documento y eliminar duplicados (por contenido XML)
                const itemsConDocumento = pagoData.data.filter(item => item.Documento);
                const documentosUnicos: typeof pagoData.data = [];
                const documentosSet = new Set<string>();
                for (const item of itemsConDocumento) {
                    if (!documentosSet.has(item.Documento)) {
                        documentosSet.add(item.Documento);
                        documentosUnicos.push(item);
                    }
                }

                // 3. Parsear TODOS los documentos únicos y concatenar sus conceptos
                let parsedConceptos: any[] = [];
                for (const item of documentosUnicos) {
                    if (item.Documento) {
                        const resultado = parser.parse(item.Documento);
                        const conceptos = resultado.conceptos.map((itemConcepto: any) => {
                            const impuestos = itemConcepto.impuestos || { traslados: [], retenciones: [] };
                            const iva = getTaxAmount(impuestos, '002', 'traslado');
                            const ieps = getTaxAmount(impuestos, '003', 'traslado');
                            const isr = getTaxAmount(impuestos, '001', 'retencion');
                            return {
                                Articulo: [itemConcepto.descripcion, itemConcepto.claveProdServ],
                                Unidad: itemConcepto.unidad,
                                Cantidad: itemConcepto.cantidad,
                                IVA: iva,
                                IEPS: ieps,
                                ISR: isr,
                                "Costo Unitario": itemConcepto.valorUnitario,
                                ["Total Compras"]: itemConcepto.importe,
                            };
                        });
                        parsedConceptos = parsedConceptos.concat(conceptos);
                    }
                }

                // 4. Asignar los conceptos combinados al estado (una sola vez)
                setXml(parsedConceptos);
                setXmlCurrentPage(1);
                setXmlPageSize(pageSize);

                // 5. Generar la tabla principal con todos los ítems (sin cambios en esta lógica)
                const formattedData = pagoData.data.map((item) => ({
                    Articulo: [item.Nombre, item.Articulo],
                    Unidad: [item.Unidad, ...(item.Factor > 1 ? [`x${item.Factor}`] : [])],
                    Cantidad: [item.Cantidad, ...(item.Factor > 1 ? [`${item["Articulos Totales"]}`] : [])],
                    IVA: item.IVA,
                    IEPS: item.IEPS,
                    ISR: item.ISR,
                    "Costo Unitario": item["Costo Unitario"],
                    "Total Compras": item["Total Compras"],
                }));
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
    }, [currentPage, pageSize, selectedPago]);

    useEffect(() => {
        fetchData();
    }, [fetchData, currentPage, pageSize]);

    // Calcular datos paginados para la segunda tabla (XML)
    const startIdx = (xmlCurrentPage - 1) * xmlPageSize;
    const endIdx = startIdx + xmlPageSize;
    const paginatedXml = xml.slice(startIdx, endIdx);
    const xmlTotalPages = Math.max(1, Math.ceil(xml.length / xmlPageSize));

    const getStatusColor = (estado: string) => {
        return estado === "Con Documento"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
    };

    return (
        <main className="p-4">
            {/* Header con información básica */}
            <header className="bg-zinc-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                <ul className="flex items-center gap-4 justify-between">
                    <li className="flex flex-col">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {pagoDetails?.nombre || "Sin nombre"}
                        </h2>
                        <article className="flex items-center space-x-4 mt-2">
                            {pagoDetails?.estado && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pagoDetails.estado)}`}>
                                    {pagoDetails.estado}
                                </span>
                            )}
                            {pagoDetails?.num_empleado && (
                                <span className="text-sm text-gray-500">#{pagoDetails.num_empleado}</span>
                            )}
                            {pagoDetails?.movId && (
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
            <section className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-75">
                    <DynamicTable
                        data={pago}
                        contextMenuItems={(row) => [
                            {
                                label: 'Copiar',
                                icon: <Copy size={16} />,
                                onClick: () => console.log('Copiado', row),
                            },
                            {
                                label: 'Ver detalles',
                                icon: <FileText size={16} />,
                                onClick: () => console.log('Mostrar detalles', row),
                            },
                            {
                                label: 'Compartir',
                                icon: <Share2 size={16} />,
                                onClick: () => console.log('Abrir diálogo de compartir', row),
                            },
                            {
                                label: 'Eliminar',
                                icon: <Trash2 size={16} />,
                                onClick: () => console.log('Elemento eliminado', row),
                                danger: true,
                            },
                        ]}
                    />
                    <Pagination
                        currentPage={currentPage}
                        loading={isLoading}
                        setCurrentPage={setCurrentPage}
                        currentPageSize={pageSize}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setCurrentPage(1); // reset a primera página al cambiar tamaño
                        }}
                        totalPages={totalPages}
                    />
                </div>

                {/* Segunda tabla (conceptos del XML) con su propia paginación */}
                <div className="flex-1 min-w-[300px]">
                    <DynamicTable data={paginatedXml} />
                    {xml.length > 0 && (
                        <Pagination
                            currentPage={xmlCurrentPage}
                            loading={false}
                            setCurrentPage={setXmlCurrentPage}
                            currentPageSize={xmlPageSize}
                            onPageSizeChange={(newSize) => {
                                setXmlPageSize(newSize);
                                setXmlCurrentPage(1);
                            }}
                            totalPages={xmlTotalPages}
                        />
                    )}
                </div>
            </section>
        </main>
    );
};