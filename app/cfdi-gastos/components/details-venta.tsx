import { useGetMasivoWithFiltersMutation } from "@/hooks/api/api_int";
import { safeCall } from "@/hooks/use-debounce";
import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { ParamsRequest, BodyRequest, ApiResponse } from "../constants/types";
import DynamicTable from "@/components/table";
import Pagination from "@/components/pagination";
import { formatDateToISO, formatValue } from "@/utils/constants/format-values";

const DEFAULT_TABLE = `gastod 
  LEFT JOIN Gasto AS G ON gastod.ID = G.ID`;
/*  LEFT JOIN Prov AS P ON gastod.Acreedor = P.Proveedor
    LEFT JOIN ART AS ART ON gastod.Articulo = ART.Articulo  */
export default function DetailsVenta({ id }: { id?: number }) {

    const DEFAULT_BODY: BodyRequest = useMemo(() => ({
        selects: [
            // Información de las partidas del gasto
            /* { key: "ART.Descripcion1", alias: "NombreArticulo" }, */
            /* { key: "gastod.Articulo" }, */
            { key: "gastod.Concepto", alias: "ConceptoGasto" },
            /* { key: "gastod.Unidad" }, */
            { key: "gastod.Cantidad" },
            { key: "gastod.Precio" },
            { key: "gastod.Importe" },
            { key: "gastod.Impuestos" },
            /* { key: "gastod.Acreedor" }, */
            /* { key: "P.Nombre", alias: "NombreProveedor" }, */

            // Información del encabezado del gasto
            { key: "G.MovID", alias: "MovimientoGasto" },
            { key: "G.CLASE", alias: "ClaseGasto" },
            { key: "G.Subclase", alias: "SubclaseGasto" },
            { key: "G.FechaEmision", alias: "FechaGasto" },

            // Campo calculado
            { key: "(gastod.Importe + gastod.Impuestos)", alias: "TotalLinea" }
        ],
        agregaciones: [],
        order: [
            { key: "gastod.Renglon", direction: "asc" }
        ],
        filtrosAnd: [
            {
                filtros: [
                    { key: "gastod.ID", operator: "=", value: `${id}` },
                ],
                logicalOperator: 'and'
            }
        ],
        filtrosOr: []
    }), [id]);

    const [getData] = useGetMasivoWithFiltersMutation();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [cfdiData, setCfdiData] = useState<any>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    // Función para cancelar requests pendientes
    const abortPendingRequest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    const fetchData = useCallback(async (
        params: ParamsRequest,
        requestBody: BodyRequest
    ) => {
        abortPendingRequest();

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        setError(null);
        setCfdiData(null);

        try {
            const response: ApiResponse = await safeCall(
                () => getData({
                    signal: controller.signal,
                    tag: "reporting-data",
                    ...params,
                    filtros: requestBody
                }),
                "getTableData"
            );

            if (controller.signal.aborted) return;

            if (response.error) {
                throw new Error(response.error);
            }

            const responseData = response.data;
            if (!responseData || responseData.data.length === 0) {
                setData([]);
                setTotalPages(1);
                return;
            }

            setData(responseData.data);

            // Simular que recibimos datos del CFDI (en realidad vendrían del XML)
            // Aquí normalmente obtendrías el XML de alguna fuente
            // Por ahora, crearemos datos de ejemplo basados en el XML que compartiste

            // Datos de ejemplo extraídos del XML proporcionado
            setCfdiData({
                version: "4.0",
                serie: "cGT",
                folio: "16515520",
                fecha: "2024-06-11T00:00:01",
                formaPago: "03",
                metodoPago: "PUE",
                moneda: "MXN",
                subTotal: "3118.33",
                total: "3367.80",
                tipoComprobante: "I",
                lugarExpedicion: "21460",

                emisor: {
                    rfc: "GTI4608032K2",
                    nombre: "cOMPAÑIA DE GAS DE TIJUANA",
                    regimenFiscal: "601"
                },

                receptor: {
                    rfc: "sME2211306B7",
                    nombre: "sUPERMERCADOS MEJIA",
                    domicilioFiscal: "22750",
                    regimenFiscal: "601",
                    usoCFDI: "G01"
                },

                timbre: {
                    uuid: "ac3b8ad8-dcfe-4b3d-8347-bf108aecd760",
                    fechaTimbrado: "2024-06-11T19:49:16",
                    rfcProvCertif: "DIG130917F9A"
                },

                conceptos: [
                    {
                        claveProdServ: "15111510",
                        noIdentificacion: "LP/14791/DIST/PLA/2016-TR0003541218",
                        cantidad: "333.333",
                        claveUnidad: "LTR",
                        unidad: "L(Litro)",
                        descripcion: "GAS LP",
                        valorUnitario: "9.35500",
                        importe: "3118.33"
                    }
                ],

                impuestos: {
                    totalImpuestosTrasladados: "249.47",
                    traslados: [
                        {
                            base: "3118.33",
                            impuesto: "002",
                            tipoFactor: "Tasa",
                            tasaOCuota: "0.080000",
                            importe: "249.47"
                        }
                    ]
                }
            });

            const records = responseData.totalRecords ? responseData.totalRecords : responseData.totalEstimated || responseData.data.length;
            setTotalPages(Math.ceil(records / params.pageSize));
        } catch (err: any) {
            if (controller.signal.aborted) return;

            const errorMessage = err.message || "Error al obtener los datos";
            setError(errorMessage);
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    }, [getData, abortPendingRequest, id]);

    useEffect(() => {
        if (!id) return;

        fetchData({
            table: DEFAULT_TABLE,
            page: page,
            pageSize: 10
        }, DEFAULT_BODY);
    }, [id, page, fetchData, DEFAULT_BODY]);

    // Calcular totales
    const totales = useMemo(() => {
        if (data.length === 0) return { importe: 0, impuestos: 0, total: 0 };

        return data.reduce((acc, item) => ({
            importe: acc.importe + (item.Importe || 0),
            impuestos: acc.impuestos + (item.Impuestos || 0),
            total: acc.total + (item.TotalLinea || 0)
        }), { importe: 0, impuestos: 0, total: 0 });
    }, [data]);

    // Obtener información del encabezado del gasto desde el primer registro
    const headerInfo = useMemo(() => {
        if (data.length === 0) return null;
        const firstItem = data[0];
        return {
            movID: firstItem.MovimientoGasto,
            clase: firstItem.ClaseGasto,
            subclase: firstItem.SubclaseGasto,
            fecha: firstItem.FechaGasto
        };
    }, [data]);

    return (
        <main className="p-4">
            {id ? (
                <>
                    {/* Sección de información general del gasto */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                            Detalles del Gasto ID: {id}
                        </h3>

                        {headerInfo && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Movimiento</p>
                                    <p className="text-md font-medium text-gray-800 dark:text-gray-200">
                                        {headerInfo.movID || 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Clase</p>
                                    <p className="text-md font-medium text-gray-800 dark:text-gray-200">
                                        {headerInfo.clase || 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Subclase</p>
                                    <p className="text-md font-medium text-gray-800 dark:text-gray-200">
                                        {headerInfo.subclase || 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Fecha</p>
                                    <p className="text-md font-medium text-gray-800 dark:text-gray-200">
                                        {headerInfo.fecha ? new Date(headerInfo.fecha).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Sección de información del CFDI */}
                        {cfdiData && (
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
                                    Información del CFDI
                                </h4>

                                {/* Información del comprobante */}
                                <div className="mb-4 p-3 bg-white dark:bg-gray-700 rounded-lg">
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Datos del Comprobante</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Serie:</span>
                                            <p className="font-medium">{cfdiData.serie}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Folio:</span>
                                            <p className="font-medium">{cfdiData.folio}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                                            <p className="font-medium">{formatDateToISO(cfdiData.fecha)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                                            <p className="font-medium">{cfdiData.tipoComprobante === 'I' ? 'Ingreso' : cfdiData.tipoComprobante}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Forma Pago:</span>
                                            <p className="font-medium">{cfdiData.formaPago}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Método Pago:</span>
                                            <p className="font-medium">{cfdiData.metodoPago}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Moneda:</span>
                                            <p className="font-medium">{cfdiData.moneda}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Lugar Expedición:</span>
                                            <p className="font-medium">{cfdiData.lugarExpedicion}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Emisor y Receptor */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Emisor</h5>
                                        <p className="font-medium">{cfdiData.emisor.nombre}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            RFC: {cfdiData.emisor.rfc}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Régimen Fiscal: {cfdiData.emisor.regimenFiscal}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Receptor</h5>
                                        <p className="font-medium">{cfdiData.receptor.nombre}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            RFC: {cfdiData.receptor.rfc}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Domicilio: {cfdiData.receptor.domicilioFiscal}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Uso CFDI: {cfdiData.receptor.usoCFDI}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Régimen Fiscal: {cfdiData.receptor.regimenFiscal}
                                        </p>
                                    </div>
                                </div>

                                {/* Timbre Fiscal */}
                                <div className="mb-4 p-3 bg-white dark:bg-gray-700 rounded-lg">
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Timbre Fiscal Digital</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">UUID:</span>
                                            <p className="font-medium truncate">{cfdiData.timbre.uuid}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Fecha Timbrado:</span>
                                            <p className="font-medium">{cfdiData.timbre.fechaTimbrado}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">RFC PAC:</span>
                                            <p className="font-medium">{cfdiData.timbre.rfcProvCertif}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Conceptos */}
                                <div className="mb-4">
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Conceptos</h5>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white dark:bg-gray-700 rounded-lg">
                                            <thead>
                                                <tr className="bg-gray-100 dark:bg-gray-800">
                                                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Descripción</th>
                                                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Cantidad</th>
                                                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Valor Unitario</th>
                                                    <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300">Importe</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cfdiData.conceptos.map((concepto: any, index: number) => (
                                                    <tr key={index} className="border-t dark:border-gray-600">
                                                        <td className="px-3 py-2 text-sm">
                                                            {concepto.descripcion}
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                Clave: {concepto.claveProdServ}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-sm">
                                                            {concepto.cantidad} {concepto.unidad}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm">
                                                            ${concepto.valorUnitario}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm font-medium">
                                                            ${concepto.importe}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Totales */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">SubTotal</p>
                                        <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                            {formatValue(cfdiData.subTotal, "currency")}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Impuestos</p>
                                        <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                            {formatValue(cfdiData.impuestos?.totalImpuestosTrasladados || '0.00', "currency")}
                                        </p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                            {formatValue(cfdiData.total, "currency")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Totales del gasto */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Importe Total Gasto</p>
                                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                    {formatValue(totales.importe, "currency")}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Impuestos Gasto</p>
                                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                    {formatValue(totales.impuestos, "currency")}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total General Gasto</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {formatValue(totales.total, "currency")}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Partidas del Gasto
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Total de partidas: {data.length}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    <DynamicTable
                        data={data}
                        loading={loading}
                    />

                    {!loading && data.length > 0 && (
                        <Pagination
                            currentPage={page}
                            setCurrentPage={setPage}
                            loading={loading}
                            totalPages={totalPages}
                        />
                    )}

                    {!loading && data.length === 0 && !error && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No hay detalles disponibles para este gasto.
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Seleccione un gasto para ver los detalles.
                </div>
            )}
        </main>
    );
}