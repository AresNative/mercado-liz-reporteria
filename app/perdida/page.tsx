"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer, closeModalReducer, openAlertReducer } from "@/hooks/reducers/drop-down";
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

// Interfaces existentes...
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
    direction: 'asc' | 'desc' | string;
}

interface LogicalFilterGroup {
    filtros: Filter[];
    logicalOperator: 'and' | 'or' | string;
}

interface BodyRequest {
    selects: Select[];
    agregaciones: Aggregation[];
    order: Order[];
    filtrosAnd: LogicalFilterGroup[];
    filtrosOr: LogicalFilterGroup[];
}

interface ParamsRequest {
    table: string,
    page: number,
    pageSize: number
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

// Nueva interfaz para el formulario de WhatsApp
interface WhatsAppFormData {
    phoneNumber: string;
    message: string;
    reportName?: string;
}

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
];

export default function ReportingPage() {
    const dispatch = useAppDispatch();
    const [getData] = useGetMasivoWithFiltersMutation();

    const [table, setTable] = useState<string | null>(`venta 
            INNER JOIN VENTAD AS ventad ON ventad.ID = venta.ID
            INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo`);

    const [body, setBody] = useState<BodyRequest>({
        selects: [
            { key: "venta.MOVID" },
            { key: "venta.importe" },
            { key: "venta.costoTotal" },
            { key: "venta.PrecioTotal" },
            { key: "venta.Estatus" },
            { key: "venta.Mov" },
            { key: "venta.FechaEmision" },
        ],
        agregaciones: [],
        order: [],
        filtrosAnd: [
            {
                filtros: [
                    { key: "venta.Estatus", operator: "=", value: 'CONCLUIDO' },
                    { key: "venta.Mov", operator: "IN", value: 'Factura,Factura Credito,Nota' }
                ],
                logicalOperator: 'and'
            }
        ],
        filtrosOr: []
    });

    const [data, setdata] = useState<any[]>([]);
    const [loading, setloading] = useState(false);
    const [error, seterror] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState<number>(1);
    const [reportName, setReportName] = useState<string>('');

    // Función para mostrar notificaciones (puedes usar tu propia implementación)
    function showNotification(type: 'success' | 'error' | 'info', message: string) {
        // Ejemplo básico con alert (puedes reemplazar con tu implementación)
        dispatch(openAlertReducer({
            icon: "alert",
            type: type,
            message: message
        }));
    }

    // Función para enviar datos por WhatsApp usando Twilio
    async function sendMessage(data: WhatsAppFormData, reportData: any[]) {
        try {
            // Preparar el mensaje con los datos del reporte
            const reportSummary = `
                📊 *Reporte: ${data.reportName || 'Sin nombre'}*

                📈 *Resumen del Reporte:*
                • Total de registros: ${reportData.length}
                • Fecha generación: ${new Date().toLocaleDateString()}
                • Hora: ${new Date().toLocaleTimeString()}

                ${data.message}

                📋 *Datos principales:*`;

            // Agregar primeros 5 registros como ejemplo
            const sampleData = reportData.slice(0, 5).map((item, index) => {
                const mainFields = Object.entries(item)
                    .slice(0, 3) // Tomar solo los primeros 3 campos
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                return `\n${index + 1}. ${mainFields}`;
            }).join('');

            const fullMessage = reportSummary + sampleData +
                (reportData.length > 5 ? `\n\n... y ${reportData.length - 5} registros más` : '');

            // Enviar a tu API backend que se comunicará con Twilio
            await sendWhatsAppMessage({
                to: `whatsapp:${data.phoneNumber}`,
                body: fullMessage
            });

            showNotification('success', 'Mensaje enviado exitosamente');
        } catch (error: any) {
            console.error('Error enviando WhatsApp:', error);
            showNotification('error', error.message || 'Error al enviar el mensaje');
            throw error;
        }
    }
    function handleViewModal(modalType: 'filter' | 'whatsapp') {
        dispatch(openModalReducer({
            modalName: modalType === 'filter' ? "form-filter" : "whatsapp-modal"
        }));
    }

    function handleCloseModal() {
        dispatch(closeModalReducer({ modalName: "form-filter" }));
        dispatch(closeModalReducer({ modalName: "whatsapp-modal" }));
    }

    const fetchData = useCallback(async (params: ParamsRequest, body: BodyRequest) => {
        const controller = new AbortController();
        setloading(true);
        seterror(null);

        const requestData: any = {
            signal: controller.signal,
            tag: "reporting-data",
            ...params,
            filtros: body
        };

        try {
            const response: ApiResponse = await safeCall(() => getData(requestData), "getTableData");

            if (controller.signal.aborted) {
                return;
            }

            if (response.error) {
                throw new Error(response.error);
            }

            if (!response.data || response.data.data.length === 0) {
                setdata([]);
                setTotalPage(1);
                showNotification('info', 'No se encontraron datos para los filtros aplicados');
                return;
            }

            setdata(response.data?.data || []);
            setTotalPage(Math.ceil((response.data?.totalRecords || 1) / params.pageSize));
            showNotification('success', `Datos cargados: ${response.data?.data.length} registros`);
        } catch (err: any) {
            if (controller.signal.aborted) {
                return;
            }

            const errorMessage = err.message || "Error al obtener los datos";
            seterror(errorMessage);
            showNotification('error', errorMessage);
        } finally {
            setloading(false);
        }
    }, [getData]);

    function handleApplyFilters(formData: any) {

        if (formData.reportName) {
            setReportName(formData.reportName);
        }

        // Convertir fechas al formato correcto (si es necesario)
        const formattedStartDate = formData.startDate ?
            new Date(formData.startDate).toISOString().split('T')[0] : null;
        const formattedEndDate = formData.endDate ?
            new Date(formData.endDate).toISOString().split('T')[0] : null;

        // Crear un nuevo objeto body con los filtros
        const newBody: BodyRequest = {
            ...body,
            filtrosAnd: [
                {
                    filtros: [
                        // Filtros existentes
                        ...body.filtrosAnd[0]?.filtros || [],

                        // Nuevos filtros del formulario
                        ...(formattedStartDate ? [
                            {
                                key: "venta.FechaEmision",
                                operator: ">=",
                                value: formattedStartDate
                            }
                        ] : []),
                        ...(formattedEndDate ? [
                            {
                                key: "venta.FechaEmision",
                                operator: "<=",
                                value: formattedEndDate
                            }
                        ] : [])
                    ],
                    logicalOperator: 'and'
                }
            ],
            // Limpiar filtrosOr o agregar según sea necesario
            filtrosOr: []
        };

        setBody(newBody);

        const params: ParamsRequest = {
            table: table ?? '',
            page: 1, // Resetear a primera página
            pageSize: 10
        };

        setPage(1);
        fetchData(params, newBody);
        handleCloseModal();
    }

    async function handleSendWhatsApp(formData: WhatsAppFormData) {
        if (data.length === 0) {
            showNotification('error', 'No hay datos para enviar');
            return;
        }

        try {
            setloading(true);
            await sendMessage({
                ...formData,
                reportName: reportName || formData.reportName || 'Reporte'
            }, data);
            handleCloseModal();
        } catch (error) {
            // El error ya se maneja en sendMessage
        } finally {
            setloading(false);
        }
    }

    function handleRefreshData() {
        if (!table) {
            showNotification('error', 'Por favor, seleccione una tabla');
            return;
        }

        const params: ParamsRequest = {
            table,
            page,
            pageSize: 10
        };
        fetchData(params, body);
    }

    function handleExportData() {
        if (data.length === 0) {
            showNotification('error', 'No hay datos para exportar');
            return;
        }

        // Exportar a CSV
        const headers = Object.keys(data[0] || {});
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                // Escapar comas y comillas
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_${reportName || 'datos'}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('success', 'Datos exportados exitosamente');
    }

    useEffect(() => {
        if (!table) return;
        const params: ParamsRequest = {
            table,
            page,
            pageSize: 10
        };
        fetchData(params, body);
    }, [table, page]);

    return (
        <>
            <Header />
            <main className="min-h-[70vh] bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-between items-center p-4">
                    <div>
                        <Button
                            color="success"
                            size="small"
                            onClick={() => handleViewModal('filter')}
                            disabled={loading}
                        >
                            <Form className="size-4" /> Filtrar Reporte
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            color="indigo"
                            size="small"
                            onClick={() => showNotification('info', 'Funcionalidad en desarrollo')}
                            disabled={loading}
                        >
                            <ChartBar className="size-4" /> Estadísticas
                        </Button>

                        <Button
                            color="info"
                            size="small"
                            onClick={handleExportData}
                            disabled={loading || data.length === 0}
                        >
                            <Share className="size-4" /> Exportar
                        </Button>

                        <Button
                            color="success"
                            size="small"
                            onClick={() => handleViewModal('whatsapp')}
                            disabled={loading || data.length === 0}
                        >
                            <MessageCircle className="size-4" /> WhatsApp
                        </Button>

                        <Button
                            color="completed"
                            size="small"
                            onClick={handleRefreshData}
                            disabled={loading}
                        >
                            <RefreshCw className={cn("size-4", loading ? "animate-spin" : "")} /> Recargar
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <section className="px-4 py-6">
                    {reportName && (
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                {reportName}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total registros: {data.length} | Página {page} de {totalPage}
                            </p>
                        </div>
                    )}

                    <DynamicTable data={data} loading={loading} />

                    {!loading && data.length > 0 && (
                        <Pagination
                            currentPage={page}
                            setCurrentPage={setPage}
                            loading={loading}
                            totalPages={totalPage}
                        />
                    )}

                    {!loading && data.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No hay datos para mostrar. Aplica filtros para ver resultados.
                        </div>
                    )}
                </section>
            </main>
            <Footer />

            {/* Modal para filtros */}
            <Modal modalName="form-filter" title="Configurar Reporte">
                <section className="w-full p-6">
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
                                type: "DATE",
                                name: "startDate",
                                label: "Fecha Inicio",
                                require: true
                            },
                            {
                                type: "DATE",
                                name: "endDate",
                                label: "Fecha Fin",
                                require: true
                            }
                        ]}
                        onSuccess={handleApplyFilters}
                    />
                </section>
            </Modal>

            {/* Modal para WhatsApp */}
            <Modal modalName="whatsapp-modal" title="Enviar por WhatsApp">
                <section className="w-full p-6">
                    <MainForm
                        message_button="Enviar Mensaje"
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
                                valueDefined: `Adjunto el reporte "${reportName}" generado el ${new Date().toLocaleDateString()} con ${data.length} registros.`,
                                require: true,
                            },
                            {
                                type: "CHECKBOX",
                                name: "includeSummary",
                                label: "Incluir resumen del reporte",
                                require: false
                            },
                            {
                                type: "CHECKBOX",
                                name: "includeSampleData",
                                label: "Incluir muestra de datos (primeros 5 registros)",
                                require: false
                            }
                        ]}
                        onSuccess={handleSendWhatsApp}
                    />

                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <strong>Información:</strong> Se enviará un resumen del reporte "{reportName}"
                            con {data.length} registros via WhatsApp.
                        </p>
                    </div>
                </section>
            </Modal>
        </>
    );
}