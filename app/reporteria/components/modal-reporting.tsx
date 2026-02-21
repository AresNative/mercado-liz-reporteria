import { Modal } from "@/components/modal";
import { useCallback, useEffect, useRef, useState } from "react";
import { DateRange } from "../types/filter";
import { QUERY_CONFIGS } from "../utils/config-constants";
import { SearchColumn } from "../types/config";
import { ReportType } from "../types/consultas";
import { RequestPayload, useManagmentRead } from "@/hooks/classes/api";
import { FilterBuilder } from "../utils/filter-class";
import DynamicTable from "@/components/table";

// SearchColumn dummy para cuando no se usa búsqueda
const dummySearchColumn: SearchColumn = {
    key: "",
    label: "",
    icon: () => null,
    color: "",
    tableField: "",
};

const ALMACENES_OPCIONES = [
    { value: "ALMVGPE", label: "Guadalupe" },
    { value: "ALMMAYO", label: "Mayoreo" },
    { value: "ALMTESTE", label: "Testerazo" },
    { value: "ALMPALM", label: "Palmas" },
];

export const ModalReporting = ({ reportType }: { reportType: ReportType }) => {
    const manager = useManagmentRead();

    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
    });

    // Estados para estadísticas por hora
    const [statsForHour, setStatsForHour] = useState<any[]>([]);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    const statsForHourAbortControllerRef = useRef<AbortController | null>(null);
    const [refreshingStats, setRefreshingStats] = useState(false);

    // Estados para totales por sucursal
    const [branchTotals, setBranchTotals] = useState<any[]>([]);
    const [branchTotalsLoading, setBranchTotalsLoading] = useState(false);
    const [branchTotalsError, setBranchTotalsError] = useState<string | null>(null);
    const branchTotalsAbortControllerRef = useRef<AbortController | null>(null);

    // Función para obtener estadísticas por hora (existente)
    const fetchStatsForHourData = useCallback(
        async (forceRefresh = false) => {
            if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return;

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

                const rangosHorarios = [
                    { hora: "07:00-07:30", value: "09:00:00 AND 09:30:00" },
                    { hora: "07:30-08:00", value: "09:30:00 AND 10:00:00" },
                    { hora: "08:00-08:30", value: "10:00:00 AND 10:30:00" },
                    { hora: "08:30-09:00", value: "10:30:00 AND 11:00:00" },
                    { hora: "09:00-09:30", value: "11:00:00 AND 11:30:00" },
                    { hora: "09:30-10:00", value: "11:30:00 AND 12:00:00" },
                    { hora: "10:00-10:30", value: "12:00:00 AND 12:30:00" },
                    { hora: "10:30-11:00", value: "12:30:00 AND 13:00:00" },
                    { hora: "11:00-11:30", value: "13:00:00 AND 13:30:00" },
                    { hora: "11:30-12:00", value: "13:30:00 AND 14:00:00" },
                    { hora: "12:00-12:30", value: "14:00:00 AND 14:30:00" },
                    { hora: "12:30-13:00", value: "14:30:00 AND 15:00:00" },
                    { hora: "13:00-13:30", value: "15:00:00 AND 15:30:00" },
                    { hora: "13:30-14:00", value: "15:30:00 AND 16:00:00" },
                    { hora: "14:00-14:30", value: "16:00:00 AND 16:30:00" },
                    { hora: "14:30-15:00", value: "16:30:00 AND 17:00:00" },
                    { hora: "15:00-15:30", value: "17:00:00 AND 17:30:00" },
                    { hora: "15:30-16:00", value: "17:30:00 AND 18:00:00" },
                    { hora: "16:00-16:30", value: "18:00:00 AND 18:30:00" },
                    { hora: "16:30-17:00", value: "18:30:00 AND 19:00:00" },
                    { hora: "17:00-17:30", value: "19:00:00 AND 19:30:00" },
                    { hora: "17:30-18:00", value: "19:30:00 AND 20:00:00" },
                    { hora: "18:00-18:30", value: "20:00:00 AND 20:30:00" },
                    { hora: "18:30-19:00", value: "20:30:00 AND 21:00:00" },
                    { hora: "19:00-19:30", value: "21:00:00 AND 21:30:00" },
                    { hora: "19:30-20:00", value: "21:30:00 AND 22:00:00" },
                    { hora: "20:00-20:30", value: "22:00:00 AND 22:30:00" },
                    { hora: "20:30-21:00", value: "22:30:00 AND 23:00:00" },
                    { hora: "21:00-21:30", value: "23:00:00 AND 23:30:00" },
                    { hora: "21:30-22:00", value: "23:30:00 AND 23:59:59" },
                    { hora: "22:00-22:30", value: "01:00:00 AND 01:30:00" },
                ];

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

    // Nueva función para obtener totales por sucursal
    const fetchBranchTotals = useCallback(
        async (forceRefresh = false) => {
            if (!QUERY_CONFIGS[reportType] || reportType !== "ventas") return;

            if (branchTotalsAbortControllerRef.current) {
                branchTotalsAbortControllerRef.current.abort();
            }

            setBranchTotalsError(null);
            setBranchTotalsLoading(!forceRefresh);

            const controller = new AbortController();
            branchTotalsAbortControllerRef.current = controller;

            try {
                const queryConfig = QUERY_CONFIGS[reportType];

                // Crear promesas para cada sucursal
                const promesas = ALMACENES_OPCIONES.map(async (almacen) => {
                    // Construir filtros con el almacén específico
                    const builder = new FilterBuilder({
                        quickMode: true,
                        filterGroups: [],
                        searchTerm: "",
                        searchColumn: dummySearchColumn,
                        almacenFilter: almacen.value, // Filtro por sucursal
                        dateRange,
                        reportType,
                        searchApplied: false,
                        includeSearchTerm: false,
                    });
                    const { filtrosAnd, filtrosOr } = builder.build();

                    const payload: RequestPayload = {
                        table: queryConfig.table,
                        filtros: {
                            agregaciones: [
                                { Key: "(ventad.Precio * ventad.Cantidad)", Alias: "totalVentas", Operation: "SUM" },
                                { Key: "(ventad.Costo * ventad.Cantidad)", Alias: "totalCosto", Operation: "SUM" },
                                { Key: "venta.ID", Alias: "totalTikets", Operation: "COUNT DISTINCT" },
                            ],
                            FiltrosAnd: filtrosAnd,
                            ...(filtrosOr.length > 0 && { FiltrosOr: filtrosOr }),
                        },
                        signal: controller.signal,
                    };

                    const { promise } = manager.execute(payload);
                    const response = await promise;

                    if (response.error) {
                        if (response.error.name === "AbortError") return null;
                        console.error(`Error en totales para ${almacen.label}:`, response.error);
                        return null;
                    }

                    const statsData = response.data?.data?.[0] || {};
                    const totalVentas = statsData.totalVentas || 0;
                    const totalCosto = statsData.totalCosto || 0;
                    const utilidad = totalVentas - totalCosto;
                    const margen = totalVentas ? (utilidad / totalVentas) * 100 : 0;

                    return {
                        sucursal: almacen.label,
                        codigo: almacen.value,
                        totalVentas,
                        totalCosto,
                        totalTikets: statsData.totalTikets || 0,
                        utilidad,
                        margen,
                    };
                });

                const resultados = await Promise.all(promesas);
                const totals = resultados.filter(Boolean);
                setBranchTotals(totals);
            } catch (error: any) {
                if (
                    error.name === "AbortError" ||
                    error.message?.includes("aborted") ||
                    error.code === "ERR_CANCELLED"
                ) {
                    return;
                }
                if (!controller.signal.aborted) {
                    setBranchTotalsError(error.message || "Error al cargar los totales por sucursal");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setBranchTotalsLoading(false);
                }
            }
        },
        [reportType, dateRange, manager]
    );

    // Cargar ambos conjuntos de datos al montar o cuando cambie el rango de fechas
    useEffect(() => {
        fetchStatsForHourData();
        fetchBranchTotals();
    }, [fetchStatsForHourData, fetchBranchTotals]); // Dependencias incluyen dateRange gracias a useCallback

    return (
        <Modal modalName="reporting" maxWidth="5xl" title="Separación de datos por sucursal">
            <section style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* Sección de totales por sucursal */}
                <div>
                    <h3>Totales por Sucursal</h3>
                    {branchTotalsLoading && <p>Cargando totales por sucursal...</p>}
                    {branchTotalsError && <p style={{ color: "red" }}>Error: {branchTotalsError}</p>}
                    {!branchTotalsLoading && !branchTotalsError && (
                        <DynamicTable data={branchTotals} />
                    )}
                </div>

                {/* Sección de estadísticas por hora (opcional, se mantiene) */}
                <div>
                    <h3>Estadísticas por Hora</h3>
                    {statsLoading && <p>Cargando estadísticas por hora...</p>}
                    {statsError && <p style={{ color: "red" }}>Error: {statsError}</p>}
                    {!statsLoading && !statsError && (
                        <DynamicTable data={statsForHour} />
                    )}
                </div>
            </section>
        </Modal>
    );
};