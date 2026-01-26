"use client";

import { useCallback, useEffect, useState, useRef } from "react";
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

// Tipos mejorados
interface Filter {
    key: string;
    value: string;
    operator: string;
}

interface Select {
    key: string;
    alias?: string;
}

interface Aggregation {
    key: string;
    operation: string;
    alias: string;
}

interface Order {
    key: string;
    direction: 'asc' | 'desc';
}

interface LogicalFilterGroup {
    filtros: Filter[];
    logicalOperator: 'and' | 'or';
}

interface BodyRequest {
    selects: Select[];
    agregaciones: Aggregation[];
    order: Order[];
    filtrosAnd: LogicalFilterGroup[];
    filtrosOr: LogicalFilterGroup[];
}

interface ParamsRequest {
    table: string;
    page: number;
    pageSize: number;
}

interface ApiResponse {
    data?: {
        data: any[];
        page?: number;
        totalRecords?: number;
        totalEstimated?: number;
    };
    error?: any;
}

interface WhatsAppFormData {
    phoneNumber: string;
    message: string;
    includeSummary?: boolean;
    includeSampleData?: boolean;
}

interface FilterFormData {
    reportName: string;
    startDate?: string;
    endDate?: string;
    ref?: string;
    almacen?: string;
    movimiento?: string;
}

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
const DEFAULT_TABLE = `venta`;
/* 
  INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID
  INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo
*/

const DEFAULT_BODY: BodyRequest = {
    selects: [
        { key: "venta.MOVID" },
        { key: "venta.Almacen" },
        { key: "venta.importe" },
        { key: "venta.costoTotal" },
        { key: "venta.PrecioTotal" },
        { key: "venta.Estatus" },
        { key: "venta.Mov" },
        { key: "venta.FechaEmision" },
    ],
    agregaciones: [
        /* { key: "(venta.PrecioTotal * venta.costoTotal)", alias: "perdida", operation: "SUM" }, */
    ],
    order: [
        { key: "venta.FechaEmision", direction: "desc" }
    ],
    filtrosAnd: [
        {
            filtros: [
                { key: "venta.Estatus", operator: "=", value: 'CONCLUIDO' },
                { key: "venta.Mov", operator: "IN", value: 'Factura,Factura Credito,Factura Global,Nota' },
            ],
            logicalOperator: 'and'
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

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                return `"${String(value).replace(/"/g, '"   "')}"`;
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

export default function ReportingPage() {
    const dispatch = useAppDispatch();
    const [getData] = useGetMasivoWithFiltersMutation();
    const abortControllerRef = useRef<AbortController | null>(null);

    const [table, setTable] = useState<string>(DEFAULT_TABLE);
    const [body, setBody] = useState<BodyRequest>(DEFAULT_BODY);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [reportName, setReportName] = useState<string>('Reporte de perdidas');

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

            setData(responseData.data);
            const records = responseData.totalRecords || responseData.data.length;
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

    const handleApplyFilters = useCallback((formData: FilterFormData) => {
        const { reportName, startDate, endDate, ref, almacen, movimiento } = formData;

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
                            key: "venta.FechaEmision",
                            operator: ">=",
                            value: formattedStartDate
                        }] : []),
                        ...(formattedEndDate ? [{
                            key: "venta.FechaEmision",
                            operator: "<=",
                            value: formattedEndDate
                        }] : []),
                        ...(ref ? [{
                            key: "venta.MovID",
                            operator: "=",
                            value: ref
                        }] : []),
                        ...(almacen ? [{
                            key: "venta.Almacen",
                            operator: "=",
                            value: almacen
                        }] : []),
                        ...(movimiento ? [{
                            key: "venta.Mov",
                            operator: "=",
                            value: movimiento
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
            const summary = `
                        📊 *Reporte: ${reportName}*

                        📈 *Resumen del Reporte:*
                        • Total de registros: ${reportData.length}
                        • Fecha generación: ${new Date().toLocaleDateString()}
                        • Hora: ${new Date().toLocaleTimeString()}`;

            fullMessage = summary + '\n\n' + fullMessage;
        }

        if (includeSampleData && reportData.length > 0) {
            const sampleData = reportData.slice(0, 5).map((item, index) => {
                const mainFields = Object.entries(item)
                    .slice(0, 3)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                return `\n${index + 1}. ${mainFields}`;
            }).join('');

            fullMessage += '\n\n📋 *Datos principales:*' + sampleData;

            if (reportData.length > 5) {
                fullMessage += `\n\n... y ${reportData.length - 5} registros más`;
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
                to: `whatsapp:${formData.phoneNumber}`,
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

        exportToCSV(data, `reporte_${reportName.replace(/\s+/g, '_')}`);
        showNotification('success', 'Datos exportados exitosamente');
    }, [data, reportName, showNotification]);

    const handleViewModal = useCallback((modalType: 'filter' | 'whatsapp') => {
        const modalName = modalType === 'filter' ? "form-filter" : "whatsapp-modal";
        dispatch(openModalReducer({ modalName }));
    }, [dispatch]);

    // Efecto para cargar datos iniciales
    useEffect(() => {
        if (!table) return;

        fetchData({
            table,
            page,
            pageSize: DEFAULT_PAGE_SIZE
        }, body);
    }, [table, page, body, fetchData]);

    // Limpiar abort controller al desmontar
    useEffect(() => {
        return () => {
            abortPendingRequest();
        };
    }, [abortPendingRequest]);

    const defaultWhatsAppMessage = `Adjunto el reporte "${reportName}" generado el ${new Date().toLocaleDateString()} con ${data.length} registros.`;

    return (
        <>
            <Header />
            <main className="min-h-[70vh] bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4">
                    <div>
                        <Button
                            color="success"
                            size="small"
                            onClick={() => handleViewModal('filter')}
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
                            onClick={() => handleViewModal('whatsapp')}
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

                    <DynamicTable data={data} loading={loading} />

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
            <Modal modalName="form-filter" title="Configurar Reporte">
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
                                        type: "SELECT",
                                        name: "almacen",
                                        label: "Almacén",
                                        options: [
                                            { value: "ALMMAYO", label: "Mayoreo" },
                                            { value: "ALMVGPE", label: "Guadalupe" },
                                            { value: "ALMPALM", label: "Palmas" },
                                            { value: "ALMTESTE", label: "Testerazo" },
                                        ],
                                        require: false,
                                        maxLength: 20,
                                    },
                                    {
                                        type: "INPUT",
                                        name: "ref",
                                        label: "Referencia (MOVID)",
                                        placeholder: "MAY-000",
                                        require: false,
                                        maxLength: 20,
                                    },
                                    {
                                        type: "SELECT",
                                        name: "movimiento",
                                        label: "Movimiento",
                                        options: [
                                            { value: "Nota", label: "Nota" },
                                            { value: "Factura", label: "Factura" },
                                            { value: "Factura Credito", label: "Factura Credito" },
                                            { value: "Factura Global", label: "Factura Global" },
                                        ],
                                        require: false,
                                        maxLength: 20,
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
            <Modal modalName="whatsapp-modal" title="Enviar por WhatsApp">
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
                            <strong>Información:</strong> Se enviará un resumen del reporte &quot;{reportName}&quot;
                            con {data.length} registros via WhatsApp.
                        </p>
                    </div>
                </section>
            </Modal>
        </>
    );
}