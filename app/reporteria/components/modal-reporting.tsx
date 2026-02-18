import { Modal } from "@/components/modal";
import { useCallback, useRef, useState } from "react";
import { formatDateISOString } from "@/utils/constants/format-values";
import { ApiResponse, ReportType } from "../types/consultas";
import { DateRange } from "../types/sample";
import { QUERY_CONFIGS } from "../utils/config";
import { SearchColumn } from "../types/config";
import { RequestPayload, useManagmentRead } from "../class/api";
import { FilterBuilder } from "../class/filter";

// SearchColumn dummy para cuando no se usa búsqueda
const dummySearchColumn: SearchColumn = {
    key: "",
    label: "",
    icon: () => null,
    color: "",
    tableField: "",
};

export const ModalReporting = (reportType: ReportType) => {
    const manager = useManagmentRead();

    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });

    const [statsForHour, setStatsForHour] = useState<any[]>([]);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    const statsForHourAbortControllerRef = useRef<AbortController | null>(null);
    const [refreshingStats, setRefreshingStats] = useState(false);

    const fetchStatsForHourData = useCallback(
        async (forceRefresh = false) => {
            if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return;

            // Cancelar peticiones pendientes
            if (statsForHourAbortControllerRef.current) {
                statsForHourAbortControllerRef.current.abort();
            }

            setStatsError(null);
            setStatsLoading(!forceRefresh);
            if (forceRefresh) setRefreshingStats(true);

            const controller = new AbortController();
            statsForHourAbortControllerRef.current = controller;

            try {
                const queryConfig = QUERY_CONFIGS[reportType];

                // Construir filtros base usando FilterBuilder (sin búsqueda, modo rápido)
                const builder = new FilterBuilder({
                    quickMode: true,
                    filterGroups: [],
                    searchTerm: "",
                    searchColumn: dummySearchColumn,
                    almacenFilter: "",
                    dateRange,
                    reportType,
                    searchApplied: false,
                    includeSearchTerm: false,
                });
                const { filtrosAnd: baseFiltrosAnd, filtrosOr } = builder.build();

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

                // Crear array de promesas
                const promesas = rangosHorarios.map(async (rango) => {
                    const payload: RequestPayload = {
                        table: queryConfig.table,
                        filtros: {
                            agregaciones: [
                                { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
                                { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
                                { Key: "venta.ID", Alias: "totalTikets", Operation: "COUNT DISTINCT" },
                            ],
                            FiltrosAnd: [
                                ...baseFiltrosAnd,
                                {
                                    Filtros: [
                                        {
                                            Key: "venta.FechaRegistro",
                                            Operator: "TIME_BETWEEN",
                                            Value: rango.value,
                                        },
                                    ],
                                    OperadorLogico: "AND",
                                },
                            ],
                            ...(filtrosOr.length > 0 && { FiltrosOr: filtrosOr }),
                        },
                        signal: controller.signal,
                    };

                    const { promise } = manager.execute(payload);
                    const response = await promise;

                    if (response.error) {
                        if (response.error.name === "AbortError") return null;
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
                        margen: statsData.totalVentas
                            ? ((statsData.totalVentas - (statsData.totalCosto || 0)) / statsData.totalVentas) * 100
                            : 0,
                    };
                });

                const resultados = await Promise.all(promesas);
                const statsPorHora = resultados.filter(Boolean);
                setStatsForHour(statsPorHora);
            } catch (error: any) {
                if (
                    error.name === "AbortError" ||
                    error.message?.includes("aborted") ||
                    error.code === "ERR_CANCELLED"
                ) {
                    return;
                }
                if (!controller.signal.aborted) {
                    setStatsError(error.message || "Error al cargar las estadísticas por hora");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setStatsLoading(false);
                    setRefreshingStats(false);
                }
            }
        },
        [reportType, dateRange, manager]
    );

    return (
        <Modal modalName="reporting" title="Separación de datos por sucursal">
            <>
            </>
        </Modal>
    );
};