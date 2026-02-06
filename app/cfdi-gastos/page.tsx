"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useAppDispatch } from "@/hooks/selector";
import {
    openModalReducer,
    closeModalReducer,
    openAlertReducer
} from "@/hooks/reducers/drop-down";
import { useGetMasivoWithFiltersMutation } from "@/hooks/api/api_int";
import Header from "@/template/header";
import Footer from "@/template/footer";
import { ChartBar, Form, RefreshCw, Share, MessageCircle } from "lucide-react";
import { Modal } from "@/components/modal";
import MainForm from "@/components/form/main-form";
import DynamicTable from "@/components/table";
import Pagination from "@/components/pagination";
import { Button } from "@/components/button";
import { safeCall } from "@/hooks/use-debounce";
import { cn } from "@/utils/functions/cn";
import { sendWhatsAppMessage } from "./hooks/send-whats";
import { BodyRequest, ParamsRequest, ApiResponse, FilterFormData, WhatsAppFormData } from "./constants/types";
import DetailsVenta from "./components/details-venta";

// Constantes
const OPERATORS = [
    { value: "=", label: "Igual a" },
    { value: "<>", label: "Diferente de" },
    { value: ">", label: "Mayor que" },
    { value: "<", label: "Menor que" },
    { value: ">=", label: "Mayor o igual que" },
    { value: "<=", label: "Menor o igual que" },
    { value: "LIKE", label: "Contiene" },
    { value: "NOT LIKE", label: "No contiene" },
    { value: "IN", label: "En lista" },
    { value: "NOT IN", label: "No en lista" },
    { value: "IS NULL", label: "Es nulo" },
    { value: "IS NOT NULL", label: "No es nulo" }
] as const;

const DEFAULT_PAGE_SIZE = 10;

// Tabla optimizada con la nueva consulta
const DEFAULT_TABLE = `
    gasto G
    INNER JOIN (
        SELECT 
            GD.ID AS GastoID,
            MAX(GD.Concepto) AS Concepto,
            SUM(GD.Precio * GD.Cantidad) AS TotalPrecio,
            SUM(GD.Cantidad) AS TotalCantidad,
            SUM(GD.Importe) AS TotalImporte,
            SUM(GD.Impuestos) AS TotalImpuestos
        FROM gastod GD
        GROUP BY GD.ID
    ) GD_Concepto ON G.ID = GD_Concepto.GastoID
    LEFT JOIN Prov P ON P.Proveedor = G.Acreedor
    LEFT JOIN (
        SELECT 
            CFDL.ModuloID,
            MIN(CFDL.UUID) AS MinUUID
        FROM CFDValidoMovLista CFDL
        WHERE CFDL.ModuloD = 'GAS'
        GROUP BY CFDL.ModuloID
    ) CFDL ON G.ID = CFDL.ModuloID
    LEFT JOIN CFDEgreso E ON E.UUID = CFDL.MinUUID
`;

const DEFAULT_BODY: BodyRequest = {
    selects: [
        { key: "G.ID" },
        { key: "G.MovID" },
        { key: "G.FechaEmision" },
        { key: "G.CLASE" },
        { key: "G.Subclase" },
        { key: "GD_Concepto.Concepto" },
        { key: "P.Nombre", alias: "Proveedor" },
        { key: "G.Acreedor" },
        { key: "GD_Concepto.TotalImporte" },
        { key: "GD_Concepto.TotalImpuestos" },
        { key: "G.Estatus" },
        { key: "G.Ejercicio" },
        { key: "E.Documento", alias: "DocumentoFiscal" },
        { key: "E.FechaTimbrado", alias: "FechaTimbrado" },
        { key: "CFDL.MinUUID", alias: "UUID" },
        { key: "GD_Concepto.TotalPrecio" },
        { key: "GD_Concepto.TotalCantidad" },
    ],
    agregaciones: [],
    order: [
        { key: "G.FechaEmision", direction: "desc" }
    ],
    filtrosAnd: [
        {
            filtros: [
                { key: "G.Estatus", operator: "=", value: 'CONCLUIDO' },
            ],
            logicalOperator: 'and' as const
        }
    ],
    filtrosOr: []
};

// Helper functions
const formatDateToISO = (dateString?: string): string | null => {
    if (!dateString) return null;
    return new Date(dateString).toISOString().split('T')[0];
};

const exportToCSV = (data: any[], filename: string): void => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).filter(key => key !== 'archivo'); // Excluir el campo archivo
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Función para obtener los datos detallados del gasto
const getGastoDetailsBody = (id: number): BodyRequest => ({
    selects: [
        { key: "gastod.Concepto", alias: "ConceptoGasto" },
        { key: "gastod.Cantidad" },
        { key: "gastod.Precio" },
        { key: "gastod.Importe" },
        { key: "gastod.Impuestos" },
        { key: "G.MovID", alias: "MovimientoGasto" },
        { key: "G.CLASE", alias: "ClaseGasto" },
        { key: "G.Subclase", alias: "SubclaseGasto" },
        { key: "G.FechaEmision", alias: "FechaGasto" },
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
            logicalOperator: 'and' as const
        }
    ],
    filtrosOr: []
});

export default function ReportingPage() {
    const dispatch = useAppDispatch();
    const [getData] = useGetMasivoWithFiltersMutation();
    const abortControllerRef = useRef<AbortController | null>(null);
    const detailsAbortControllerRef = useRef<AbortController | null>(null);

    const [table, setTable] = useState<string>(DEFAULT_TABLE);
    const [body, setBody] = useState<BodyRequest>(DEFAULT_BODY);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [reportName, setReportName] = useState<string>('Reporte de Gastos');

    // Estados para los detalles del gasto
    const [IdDetails, setIdDetails] = useState<number | undefined>();
    const [gastoDetailsData, setGastoDetailsData] = useState<any[]>([]);
    const [selectedGasto, setSelectedGasto] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsPage, setDetailsPage] = useState(1);
    const [detailsTotalPages, setDetailsTotalPages] = useState(1);

    // Helper function para notificaciones
    const showNotification = useCallback((
        type: 'success' | 'error' | 'info',
        message: string
    ) => {
        dispatch(openAlertReducer({
            icon: "alert",
            type,
            message
        }));
    }, [dispatch]);

    // Función para cancelar requests pendientes
    const abortPendingRequest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    // Función para cancelar requests de detalles
    const abortPendingDetailsRequest = useCallback(() => {
        if (detailsAbortControllerRef.current) {
            detailsAbortControllerRef.current.abort();
            detailsAbortControllerRef.current = null;
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
                showNotification('info', 'No se encontraron datos para los filtros aplicados');
                return;
            }

            // Eliminar el campo archivo de los datos
            const cleanData = responseData.data.map((item: any) => {
                const { archivo, ...rest } = item;
                return rest;
            });

            setData(cleanData);
            const records = responseData.totalRecords ? responseData.totalRecords : responseData.totalEstimated || responseData.data.length;
            setTotalPages(Math.ceil(records / params.pageSize));
        } catch (err: any) {
            if (controller.signal.aborted) return;

            const errorMessage = err.message || "Error al obtener los datos";
            setError(errorMessage);
            showNotification('error', errorMessage);
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    }, [getData, showNotification, abortPendingRequest]);

    // Función para obtener los detalles del gasto
    const fetchGastoDetails = useCallback(async (id: number) => {
        abortPendingDetailsRequest();

        const controller = new AbortController();
        detailsAbortControllerRef.current = controller;

        setDetailsLoading(true);

        try {
            const response: ApiResponse = await safeCall(
                () => getData({
                    signal: controller.signal,
                    tag: "reporting-details",
                    table: "gastod LEFT JOIN Gasto AS G ON gastod.ID = G.ID",
                    page: detailsPage,
                    pageSize: 10,
                    filtros: getGastoDetailsBody(id)
                }),
                "getGastoDetails"
            );

            if (controller.signal.aborted) return;

            if (response.error) {
                throw new Error(response.error);
            }

            const responseData = response.data;
            if (!responseData || responseData.data.length === 0) {
                setGastoDetailsData([]);
                setDetailsTotalPages(1);
                return;
            }

            setGastoDetailsData(responseData.data);
            const records = responseData.totalRecords ? responseData.totalRecords : responseData.totalEstimated || responseData.data.length;
            setDetailsTotalPages(Math.ceil(records / 10));
        } catch (err: any) {
            if (controller.signal.aborted) return;
            console.error("Error al obtener detalles del gasto:", err);
        } finally {
            setDetailsLoading(false);
            detailsAbortControllerRef.current = null;
        }
    }, [getData, detailsPage, abortPendingDetailsRequest]);

    const handleApplyFilters = useCallback((formData: FilterFormData) => {
        const { reportName, startDate, endDate, ref, clase, subclase, acreedor, ejercicio } = formData;

        if (reportName) {
            setReportName(reportName);
        }

        const formattedStartDate = startDate ? formatDateToISO(startDate) : null;
        const formattedEndDate = endDate ? formatDateToISO(endDate) : null;

        const newBody: BodyRequest = {
            ...body,
            filtrosAnd: [
                {
                    filtros: [
                        ...DEFAULT_BODY.filtrosAnd[0].filtros,
                        ...(formattedStartDate ? [{
                            key: "G.FechaEmision",
                            operator: ">=",
                            value: formattedStartDate
                        }] : []),
                        ...(formattedEndDate ? [{
                            key: "G.FechaEmision",
                            operator: "<=",
                            value: formattedEndDate
                        }] : []),
                        ...(ref ? [{
                            key: "G.MovID",
                            operator: "=",
                            value: ref
                        }] : []),
                        ...(clase ? [{
                            key: "G.CLASE",
                            operator: "=",
                            value: clase
                        }] : []),
                        ...(subclase ? [{
                            key: "G.Subclase",
                            operator: "=",
                            value: subclase
                        }] : []),
                        ...(acreedor ? [{
                            key: "G.Acreedor",
                            operator: "=",
                            value: acreedor
                        }] : []),
                        ...(ejercicio ? [{
                            key: "G.Ejercicio",
                            operator: "=",
                            value: ejercicio
                        }] : []),
                    ],
                    logicalOperator: 'and' as const
                }
            ],
            filtrosOr: []
        };

        setBody(newBody);
        setPage(1);

        fetchData({
            table,
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE
        }, newBody);

        dispatch(closeModalReducer({ modalName: "form-filter" }));
    }, [body, table, fetchData, dispatch]);

    const prepareWhatsAppMessage = useCallback((
        formData: WhatsAppFormData,
        reportData: any[]
    ): string => {
        const { message, includeSummary = true, includeSampleData = true } = formData;

        let fullMessage = message;

        if (includeSummary) {
            const totalImporte = reportData.reduce((sum, item) => sum + (parseFloat(item.TotalImporte) || 0), 0);
            const totalImpuestos = reportData.reduce((sum, item) => sum + (parseFloat(item.TotalImpuestos) || 0), 0);
            const totalGeneral = totalImporte + totalImpuestos;

            const summary = `
📊 *Reporte: ${reportName}*

📈 *Resumen del Reporte:*
• Total de gastos: ${reportData.length}
• Importe total: $${totalImporte.toFixed(2)}
• Impuestos totales: $${totalImpuestos.toFixed(2)}
• Total general: $${totalGeneral.toFixed(2)}
• Fecha generación: ${new Date().toLocaleDateString()}
• Hora: ${new Date().toLocaleTimeString()}`;

            fullMessage = summary + '\n\n' + fullMessage;
        }

        if (includeSampleData && reportData.length > 0) {
            const sampleData = reportData.slice(0, 5).map((item, index) => {
                const concepto = item.Concepto || item.ConceptoPrincipal || 'Sin concepto';
                return `\n${index + 1}. ${item.MovID || 'Sin referencia'} - ${concepto} - $${(parseFloat(item.TotalImporte) || 0).toFixed(2)}`;
            }).join('');

            fullMessage += '\n\n📋 *Gastos principales:*' + sampleData;

            if (reportData.length > 5) {
                fullMessage += `\n\n... y ${reportData.length - 5} gastos más`;
            }
        }

        return fullMessage;
    }, [reportName]);

    const handleSendWhatsApp = useCallback(async (formData: WhatsAppFormData) => {
        if (data.length === 0) {
            showNotification('error', 'No hay datos para enviar');
            return;
        }

        setLoading(true);

        try {
            const messageBody = prepareWhatsAppMessage(formData, data);
            await sendWhatsAppMessage({
                to: `${formData.phoneNumber}`,
                body: messageBody
            });

            showNotification('success', 'Mensaje enviado exitosamente');
            dispatch(closeModalReducer({ modalName: "whatsapp-modal" }));
        } catch (error: any) {
            console.error('Error enviando WhatsApp:', error);
            showNotification('error', error.message || 'Error al enviar el mensaje');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [data, prepareWhatsAppMessage, showNotification, dispatch]);

    const handleRefreshData = useCallback(() => {
        if (!table) {
            showNotification('error', 'Por favor, seleccione una tabla');
            return;
        }

        fetchData({
            table,
            page,
            pageSize: DEFAULT_PAGE_SIZE
        }, body);
    }, [table, page, body, fetchData, showNotification]);

    const handleExportData = useCallback(() => {
        if (data.length === 0) {
            showNotification('error', 'No hay datos para exportar');
            return;
        }

        exportToCSV(data, `reporte_gastos_${reportName.replace(/\s+/g, '_')}`);
        showNotification('success', 'Datos exportados exitosamente');
    }, [data, reportName, showNotification]);

    const handleViewModal = useCallback((modalType: 'form-filter' | 'whatsapp-modal' | 'details-venta') => {
        const modalName = modalType;
        dispatch(openModalReducer({ modalName }));
    }, [dispatch]);

    // Función para manejar el clic en una fila
    const handleRowClick = useCallback((item: any) => {
        setIdDetails(item.ID);
        setSelectedGasto(item);

        // Obtener los detalles del gasto
        fetchGastoDetails(item.ID);

        // Abrir el modal de detalles
        handleViewModal('details-venta');
    }, [fetchGastoDetails, handleViewModal]);

    // Obtener el XML del CFDI del gasto seleccionado
    const selectedCfdiXml = useMemo(() => {
        if (!selectedGasto) return undefined;
        return selectedGasto.DocumentoFiscal;
    }, [selectedGasto]);

    // Efecto para cargar datos iniciales
    useEffect(() => {
        if (!table) return;

        fetchData({
            table,
            page,
            pageSize: DEFAULT_PAGE_SIZE
        }, body);
    }, [table, page, body, fetchData]);

    // Efecto para recargar detalles cuando cambia la página
    useEffect(() => {
        if (IdDetails) {
            fetchGastoDetails(IdDetails);
        }
    }, [detailsPage, IdDetails, fetchGastoDetails]);

    // Limpiar abort controllers al desmontar
    useEffect(() => {
        return () => {
            abortPendingRequest();
            abortPendingDetailsRequest();
        };
    }, [abortPendingRequest, abortPendingDetailsRequest]);

    const defaultWhatsAppMessage = `Adjunto el reporte de gastos "${reportName}" generado el ${new Date().toLocaleDateString()} con ${data.length} registros.`;

    return (
        <>
            <Header />
            <main className="min-h-[70vh] bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4">
                    <div>
                        <Button
                            color="success"
                            size="small"
                            onClick={() => handleViewModal('form-filter')}
                            disabled={loading}
                        >
                            <Form className="size-4" />
                            Filtrar Reporte
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            color="indigo"
                            size="small"
                            onClick={() => showNotification('info', 'Funcionalidad en desarrollo')}
                            disabled={loading}
                        >
                            <ChartBar className="size-4" />
                            Estadísticas
                        </Button>

                        <Button
                            color="info"
                            size="small"
                            onClick={handleExportData}
                            disabled={loading || data.length === 0}
                        >
                            <Share className="size-4" />
                            Exportar
                        </Button>

                        <Button
                            color="success"
                            size="small"
                            onClick={() => handleViewModal('whatsapp-modal')}
                            disabled={loading || data.length === 0}
                        >
                            <MessageCircle className="size-4" />
                            WhatsApp
                        </Button>

                        <Button
                            color="completed"
                            size="small"
                            onClick={handleRefreshData}
                            disabled={loading}
                        >
                            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                            Recargar
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <section className="px-4 py-6">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                            {reportName}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Total registros: {data.length} | Página {page} de {totalPages}
                        </p>
                    </div>

                    <DynamicTable
                        data={data}
                        loading={loading}
                        onRowClick={handleRowClick}
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
                            No hay datos para mostrar. Aplica filtros para ver resultados.
                        </div>
                    )}
                </section>
            </main>
            <Footer />

            {/* Modal para filtros */}
            <Modal modalName="form-filter" title="Configurar Reporte de Gastos">
                <section className="w-full px-6 py-2">
                    <MainForm
                        message_button="Generar Reporte"
                        actionType=""
                        dataForm={[
                            {
                                type: "INPUT",
                                name: "reportName",
                                label: "Nombre del Reporte",
                                placeholder: "Ingrese el nombre del reporte",
                                require: true,
                                valueDefined: reportName,
                            },
                            {
                                type: "Flex",
                                elements: [
                                    {
                                        type: "DATE",
                                        name: "startDate",
                                        label: "Fecha Inicio",
                                        require: false
                                    },
                                    {
                                        type: "DATE",
                                        name: "endDate",
                                        label: "Fecha Fin",
                                        require: false
                                    }
                                ],
                                require: false,
                            },
                            {
                                type: "Flex",
                                elements: [
                                    {
                                        type: "INPUT",
                                        name: "ref",
                                        label: "Referencia (MovID)",
                                        placeholder: "GAS-000",
                                        require: false,
                                        maxLength: 20,
                                    },
                                    {
                                        type: "INPUT",
                                        name: "clase",
                                        label: "Clase",
                                        placeholder: "Ej: MANTENIMIENTO",
                                        require: false,
                                        maxLength: 50,
                                    },
                                    {
                                        type: "INPUT",
                                        name: "subclase",
                                        label: "Subclase",
                                        placeholder: "Ej: CORRECTIVO",
                                        require: false,
                                        maxLength: 50,
                                    },
                                ],
                                require: false,
                            },
                            {
                                type: "Flex",
                                elements: [
                                    {
                                        type: "INPUT",
                                        name: "acreedor",
                                        label: "Acreedor",
                                        placeholder: "Código de acreedor",
                                        require: false,
                                        maxLength: 20,
                                    },
                                    {
                                        type: "INPUT",
                                        name: "ejercicio",
                                        label: "Ejercicio",
                                        placeholder: "2025",
                                        require: false,
                                        maxLength: 4,
                                    },
                                ],
                                require: false,
                            },
                        ]}
                        onSuccess={handleApplyFilters}
                    />
                </section>
            </Modal>

            {/* Modal para WhatsApp */}
            <Modal modalName="whatsapp-modal" title="Enviar Reporte de Gastos por WhatsApp">
                <section className="w-full p-6">
                    <MainForm
                        message_button={loading ? "Enviando..." : "Enviar Mensaje"}
                        actionType=""
                        dataForm={[
                            {
                                type: "INPUT",
                                name: "phoneNumber",
                                label: "Número de WhatsApp",
                                placeholder: "Formato internacional: +521234567890",
                                require: true,
                            },
                            {
                                type: "TEXT_AREA",
                                name: "message",
                                label: "Mensaje Personalizado",
                                placeholder: "Agrega un mensaje personalizado aquí...",
                                valueDefined: defaultWhatsAppMessage,
                                require: true,
                            },
                            {
                                type: "CHECKBOX",
                                name: "includeSummary",
                                label: "Incluir resumen del reporte",
                                require: false,
                                valueDefined: true
                            },
                            {
                                type: "CHECKBOX",
                                name: "includeSampleData",
                                label: "Incluir muestra de datos (primeros 5 registros)",
                                require: false,
                                valueDefined: true
                            }
                        ]}
                        onSuccess={handleSendWhatsApp}
                    />

                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <strong>Información:</strong> Se enviará un resumen del reporte de gastos &quot;{reportName}&quot;
                            con {data.length} registros via WhatsApp.
                        </p>
                    </div>
                </section>
            </Modal>

            {/* Modal para detalles */}
            <Modal modalName="details-venta" title="Detalles del Gasto" maxWidth="5xl">
                <DetailsVenta
                    id={IdDetails}
                    gastoData={gastoDetailsData}
                    cfdiXml={selectedCfdiXml}
                    loading={detailsLoading}
                    page={detailsPage}
                    setPage={setDetailsPage}
                    totalPages={detailsTotalPages}
                />
            </Modal>
        </>
    );
}