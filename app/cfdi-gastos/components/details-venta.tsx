import { useMemo } from "react";
import DynamicTable from "@/components/table";
import { formatDateToISO, formatValue } from "@/utils/constants/format-values";

// Interface para los datos del CFDI parseados
interface CFDIData {
    version?: string;
    serie?: string;
    folio?: string;
    fecha?: string;
    formaPago?: string;
    metodoPago?: string;
    moneda?: string;
    subTotal?: string;
    total?: string;
    tipoComprobante?: string;
    lugarExpedicion?: string;
    emisor?: {
        rfc?: string;
        nombre?: string;
        regimenFiscal?: string;
    };
    receptor?: {
        rfc?: string;
        nombre?: string;
        domicilioFiscal?: string;
        regimenFiscal?: string;
        usoCFDI?: string;
    };
    timbre?: {
        uuid?: string;
        fechaTimbrado?: string;
        rfcProvCertif?: string;
    };
    conceptos?: Array<{
        claveProdServ?: string;
        noIdentificacion?: string;
        cantidad?: string;
        claveUnidad?: string;
        unidad?: string;
        descripcion?: string;
        valorUnitario?: string;
        importe?: string;
        objetoImp?: string;
    }>;
    impuestos?: {
        totalImpuestosTrasladados?: string;
        traslados?: Array<{
            base?: string;
            impuesto?: string;
            tipoFactor?: string;
            tasaOCuota?: string;
            importe?: string;
        }>;
    };
}

interface DetailsVentaProps {
    id?: number;
    // Nuevas props para recibir datos desde el componente padre
    gastoData?: any[]; // Datos del gasto principal
    cfdiXml?: string; // XML del CFDI
    loading?: boolean;
    page?: number;
    setPage?: (page: number) => void;
    totalPages?: number;
}

// Función para parsear XML del CFDI
const parseCFDIXml = (xmlString?: string): CFDIData | null => {
    if (!xmlString) return null;

    try {
        // Limpiar el XML si tiene espacios o saltos de línea al inicio
        const cleanXml = xmlString.trim();

        // Crear un parser de XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(cleanXml, "text/xml");

        // Obtener el elemento Comprobante
        const comprobante = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0];
        if (!comprobante) return null;

        // Extraer datos básicos del comprobante
        const data: CFDIData = {
            version: comprobante.getAttribute("Version") || "",
            serie: comprobante.getAttribute("Serie") || "",
            folio: comprobante.getAttribute("Folio") || "",
            fecha: comprobante.getAttribute("Fecha") || "",
            formaPago: comprobante.getAttribute("FormaPago") || "",
            metodoPago: comprobante.getAttribute("MetodoPago") || "",
            moneda: comprobante.getAttribute("Moneda") || "",
            subTotal: comprobante.getAttribute("SubTotal") || "",
            total: comprobante.getAttribute("Total") || "",
            tipoComprobante: comprobante.getAttribute("TipoDeComprobante") || "",
            lugarExpedicion: comprobante.getAttribute("LugarExpedicion") || "",
        };

        // Extraer datos del emisor
        const emisor = xmlDoc.getElementsByTagName("cfdi:Emisor")[0];
        if (emisor) {
            data.emisor = {
                rfc: emisor.getAttribute("Rfc") || "",
                nombre: emisor.getAttribute("Nombre") || "",
                regimenFiscal: emisor.getAttribute("RegimenFiscal") || "",
            };
        }

        // Extraer datos del receptor
        const receptor = xmlDoc.getElementsByTagName("cfdi:Receptor")[0];
        if (receptor) {
            data.receptor = {
                rfc: receptor.getAttribute("Rfc") || "",
                nombre: receptor.getAttribute("Nombre") || "",
                domicilioFiscal: receptor.getAttribute("DomicilioFiscalReceptor") || "",
                regimenFiscal: receptor.getAttribute("RegimenFiscalReceptor") || "",
                usoCFDI: receptor.getAttribute("UsoCFDI") || "",
            };
        }

        // Extraer datos del timbre fiscal
        const timbre = xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0];
        if (timbre) {
            data.timbre = {
                uuid: timbre.getAttribute("UUID") || "",
                fechaTimbrado: timbre.getAttribute("FechaTimbrado") || "",
                rfcProvCertif: timbre.getAttribute("RfcProvCertif") || "",
            };
        }

        // Extraer conceptos
        const conceptosElements = xmlDoc.getElementsByTagName("cfdi:Concepto");
        if (conceptosElements.length > 0) {
            data.conceptos = Array.from(conceptosElements).map(concepto => ({
                claveProdServ: concepto.getAttribute("ClaveProdServ") || "",
                noIdentificacion: concepto.getAttribute("NoIdentificacion") || "",
                cantidad: concepto.getAttribute("Cantidad") || "",
                claveUnidad: concepto.getAttribute("ClaveUnidad") || "",
                unidad: concepto.getAttribute("Unidad") || "",
                descripcion: concepto.getAttribute("Descripcion") || "",
                valorUnitario: concepto.getAttribute("ValorUnitario") || "",
                importe: concepto.getAttribute("Importe") || "",
                objetoImp: concepto.getAttribute("ObjetoImp") || "",
            }));
        }

        // Extraer impuestos
        const impuestos = xmlDoc.getElementsByTagName("cfdi:Impuestos")[0];
        if (impuestos) {
            data.impuestos = {
                totalImpuestosTrasladados: impuestos.getAttribute("TotalImpuestosTrasladados") || "0.00",
            };

            // Extraer traslados
            const trasladosElements = xmlDoc.getElementsByTagName("cfdi:Traslado");
            if (trasladosElements.length > 0) {
                data.impuestos.traslados = Array.from(trasladosElements).map(traslado => ({
                    base: traslado.getAttribute("Base") || "",
                    impuesto: traslado.getAttribute("Impuesto") || "",
                    tipoFactor: traslado.getAttribute("TipoFactor") || "",
                    tasaOCuota: traslado.getAttribute("TasaOCuota") || "",
                    importe: traslado.getAttribute("Importe") || "",
                }));
            }
        }

        return data;
    } catch (error) {
        console.error("Error al parsear XML del CFDI:", error);
        return null;
    }
};

export default function DetailsVenta({
    id,
    gastoData = [],
    cfdiXml,
    loading = false,
    page = 1,
    setPage,
    totalPages = 1
}: DetailsVentaProps) {

    // Usar los datos proporcionados
    const data = useMemo(() => gastoData || [], [gastoData]);

    // Parsear el XML del CFDI
    const cfdiData = useMemo(() => {
        return parseCFDIXml(cfdiXml);
    }, [cfdiXml]);

    // Calcular totales a partir de los datos proporcionados
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

    // Función para determinar el tipo de comprobante
    const getTipoComprobanteText = (tipo?: string) => {
        switch (tipo) {
            case 'I': return 'Ingreso';
            case 'E': return 'Egreso';
            case 'T': return 'Traslado';
            case 'N': return 'Nómina';
            case 'P': return 'Pago';
            default: return tipo || 'N/A';
        }
    };

    // Función para determinar el uso CFDI
    const getUsoCFDIText = (uso?: string) => {
        switch (uso) {
            case 'G01': return 'Adquisición de mercancías';
            case 'G02': return 'Devoluciones, descuentos o bonificaciones';
            case 'G03': return 'Gastos en general';
            case 'P01': return 'Por definir';
            default: return uso || 'N/A';
        }
    };

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
                        {cfdiData ? (
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3">
                                    Información del CFDI
                                </h4>

                                {/* Información del comprobante */}
                                <div className="mb-4 p-3 bg-white dark:bg-gray-700 rounded-lg">
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Datos del Comprobante</h5>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Versión:</span>
                                            <p className="font-medium">{cfdiData.version}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Serie:</span>
                                            <p className="font-medium">{cfdiData.serie || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Folio:</span>
                                            <p className="font-medium">{cfdiData.folio || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                                            <p className="font-medium">{formatDateToISO(cfdiData.fecha)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                                            <p className="font-medium">{getTipoComprobanteText(cfdiData.tipoComprobante)}</p>
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
                                    {cfdiData.emisor && (
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
                                    )}

                                    {cfdiData.receptor && (
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
                                                Uso CFDI: {getUsoCFDIText(cfdiData.receptor.usoCFDI)}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Régimen Fiscal: {cfdiData.receptor.regimenFiscal}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Timbre Fiscal */}
                                {cfdiData.timbre && (
                                    <div className="mb-4 p-3 bg-white dark:bg-gray-700 rounded-lg">
                                        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Timbre Fiscal Digital</h5>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">UUID:</span>
                                                <p className="font-medium truncate">{cfdiData.timbre.uuid}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">Fecha Timbrado:</span>
                                                <p className="font-medium">{formatDateToISO(cfdiData.timbre.fechaTimbrado)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">RFC PAC:</span>
                                                <p className="font-medium">{cfdiData.timbre.rfcProvCertif}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Conceptos */}
                                {cfdiData.conceptos && cfdiData.conceptos.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Conceptos ({cfdiData.conceptos.length})
                                        </h5>
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
                                                    {cfdiData.conceptos.map((concepto, index) => (
                                                        <tr key={index} className="border-t dark:border-gray-600">
                                                            <td className="px-3 py-2 text-sm">
                                                                <div className="font-medium">{concepto.descripcion}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    Clave: {concepto.claveProdServ}
                                                                    {concepto.noIdentificacion && ` | ID: ${concepto.noIdentificacion}`}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2 text-sm">
                                                                {concepto.cantidad} {concepto.unidad}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm">
                                                                {formatValue(concepto.valorUnitario, "currency")}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm font-medium">
                                                                {formatValue(concepto.importe, "currency")}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Totales del CFDI */}
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
                        ) : (
                            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <p className="text-yellow-700 dark:text-yellow-300">
                                    No hay información de CFDI disponible para este gasto.
                                </p>
                            </div>
                        )}

                        {/* Totales del gasto */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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

                    {/* Partidas del gasto */}
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                            Partidas del Gasto
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Total de partidas: {data.length}
                        </p>
                    </div>

                    <DynamicTable
                        data={data}
                        loading={loading}
                    />

                    {/* {!loading && data.length > 0 && setPage && (
                        <Pagination
                            currentPage={page}
                            setCurrentPage={setPage}
                            loading={loading}
                            totalPages={totalPages}
                        />
                    )} */}

                    {!loading && data.length === 0 && (
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