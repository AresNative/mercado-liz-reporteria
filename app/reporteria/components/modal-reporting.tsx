import { Modal } from "@/components/modal"
import { useGetMasivoWithFiltersMutation } from "@/hooks/api/api_int";
import { safeCall } from "@/hooks/use-debounce";
import { useCallback, useRef, useState } from "react";
import { formatDateISOString } from "@/utils/constants/format-values";
import { buildFiltros } from "../hooks/build-filter";
import { ApiResponse, ReportType } from "../types/consultas";
import { DateRange } from "../types/sample";
import { QUERY_CONFIGS } from "../utils/config";

export const ModalReporting = (reportType: ReportType) => {
    const [getData] = useGetMasivoWithFiltersMutation();
    // Nuevo estado para filtro de fechas
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date()
    });

    const [statsForHour, setStatsForHour] = useState<any[]>([]);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    const statsForHourAbortControllerRef = useRef<AbortController | null>(null);
    const [refreshingStats, setRefreshingStats] = useState(false);

    const fetchStatsForHourData = useCallback(async (forceRefresh = false) => {
        if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return;

        // Cancelar peticiones pendientes de estadísticas por hora
        if (statsForHourAbortControllerRef.current) {
            statsForHourAbortControllerRef.current.abort();
        }

        // Limpiar errores antes de cargar
        setStatsError(null);
        setStatsLoading(!forceRefresh);
        if (forceRefresh) setRefreshingStats(true);

        const controller = new AbortController();
        statsForHourAbortControllerRef.current = controller;

        try {
            const queryConfig = QUERY_CONFIGS[reportType];
            const { filtrosAnd: baseFiltrosAnd, filtrosOr } = buildFiltros({ includeSearchTerm: true, searchTerm: "", searchColumn: null, searchApplied: false, almacenFilter: null, dateRange, reportType });

            // Definir los rangos horarios
            const rangosHorarios = [
                { hora: "07:00-08:00", value: "09:00:00 AND 10:00:00" },
                { hora: "08:00-09:00", value: "10:00:00 AND 11:00:00" },
                { hora: "09:00-10:00", value: "11:00:00 AND 12:00:00" },
                { hora: "10:00-11:00", value: "12:00:00 AND 13:00:00" },
                { hora: "11:00-12:00", value: "13:00:00 AND 14:00:00" },
                { hora: "12:00-13:00", value: "14:00:00 AND 15:00:00" },
                { hora: "13:00-14:00", value: "15:00:00 AND 16:00:00" },
                { hora: "14:00-15:00", value: "16:00:00 AND 17:00:00" },
                { hora: "15:00-16:00", value: "17:00:00 AND 18:00:00" },
                { hora: "16:00-17:00", value: "18:00:00 AND 19:00:00" },
                { hora: "17:00-18:00", value: "19:00:00 AND 20:00:00" },
                { hora: "18:00-19:00", value: "20:00:00 AND 21:00:00" },
                { hora: "19:00-20:00", value: "21:00:00 AND 22:00:00" },
                { hora: "20:00-21:00", value: "22:00:00 AND 23:00:00" },
                { hora: "21:00-22:00", value: "23:00:00 AND 23:59:59" },
                { hora: "22:00-23:00", value: "01:00:00 AND 02:00:00" },
            ];

            // Crear array de promesas para todas las peticiones por hora
            const promesas = rangosHorarios.map(async (rango) => {
                try {
                    const requestData: any = {
                        table: queryConfig.table,
                        filtros: {
                            agregaciones: [
                                { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
                                { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
                                { Key: "venta.ID", Alias: "totalTikets", Operation: "COUNT DISTINCT" }
                            ],
                        },
                        signal: controller.signal
                    };

                    // Construir filtros: base + filtro de hora específico
                    const filtrosPorHora = [...baseFiltrosAnd];
                    filtrosPorHora.push({
                        Filtros: [
                            {
                                Key: "venta.FechaRegistro",
                                Operator: "TIME_BETWEEN",
                                Value: rango.value
                            }
                        ],
                        OperadorLogico: "AND"
                    });

                    if (filtrosPorHora.length > 0) {
                        requestData.filtros.FiltrosAnd = filtrosPorHora;
                    }
                    if (filtrosOr.length > 0) {
                        requestData.filtros.FiltrosOr = filtrosOr;
                    }

                    const response: ApiResponse = await safeCall(() => getData(requestData), `getStatsForHour_${rango.hora}`);

                    if (response.error) {
                        if (response.error.name === 'AbortError' ||
                            response.error.message?.includes('aborted') ||
                            response.error.code === 'ERR_CANCELLED') {
                            return null;
                        }
                        console.error(`Error en estadísticas para ${rango.hora}:`, response.error);
                        return null;
                    }

                    const statsData = response.data?.data?.[0] || {};
                    return {
                        hora: rango.hora,
                        totalVentas: statsData.totalVentas || 0,
                        totalCosto: statsData.totalCosto || 0,
                        totalTikets: statsData.totalTikets || 0,
                        utilidad: (statsData.totalVentas || 0) - (statsData.totalCosto || 0),
                        margen: statsData.totalVentas ?
                            (((statsData.totalVentas - (statsData.totalCosto || 0)) / statsData.totalVentas) * 100) : 0
                    };
                } catch (error) {
                    console.error(`Error en petición para ${rango.hora}:`, error);
                    return null;
                }
            });

            // Esperar todas las peticiones
            const resultados = await Promise.all(promesas);

            // Filtrar resultados nulos y actualizar estado
            const statsPorHora = resultados.filter(Boolean);

            // Calcular totales generales de las estadísticas por hora
            const totales = statsPorHora.reduce((acc, stats) => ({
                totalVentas: (acc.totalVentas || 0) + (stats?.totalVentas || 0),
                totalCosto: (acc.totalCosto || 0) + (stats?.totalCosto || 0),
                totalTikets: (acc.totalTikets || 0) + (stats?.totalTikets || 0)
            }), { totalVentas: 0, totalCosto: 0, totalTikets: 0 });

            // Calcular utilidad y margen general
            const utilidadGeneral = (totales.totalVentas || 0) - (totales.totalCosto || 0);
            const margenGeneral = totales.totalVentas ?
                ((utilidadGeneral / totales.totalVentas) * 100) : 0;

            // Actualizar estadísticas manteniendo las existentes y agregando por hora
            setStatsForHour(statsPorHora);

        } catch (error: any) {
            // Ignorar errores de aborto
            if (error.name === 'AbortError' ||
                error.message?.includes('aborted') ||
                error.code === 'ERR_CANCELLED') {
                return;
            }

            // Solo mostrar error si no fue abortado
            if (!controller.signal.aborted) {
                setStatsError(error.message || "Error al cargar las estadísticas por hora");
            }
        } finally {
            // Solo limpiar estados si no fue abortado
            if (!controller.signal.aborted) {
                setStatsLoading(false);
                setRefreshingStats(false);
            }
        }
    }, [reportType, getData, buildFiltros]);
    return (
        <Modal modalName="reporting" title="Separacion de datos por sucural">
            <>
            </>
        </Modal>
    )
}