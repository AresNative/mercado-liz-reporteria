import { Modal } from "@/components/modal";
import {
    useManagmentRead,
    type RequestPayload,
} from "@/hooks/classes/api"; // Ajusta la ruta si es necesario
import { useCallback, useEffect, useRef, useState } from "react";
import { QUERY_CONFIGS } from "../utils/config-scorecard";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import DynamicTable from "@/components/table";

// Definimos la interfaz para la configuración de cada query (puede venir de QUERY_CONFIGS)
interface QueryConfig {
    table: string;
    // Agrega otras propiedades si las hay
}

// Identificadores de las consultas
const QUERY_KEYS = ["PERIODOS", "SEMANAL", "PROVEEDORES", "80-20"] as const;
type QueryKey = (typeof QUERY_KEYS)[number];

// Estado de cada consulta
interface QueryState {
    data: any[]; // Reemplazar `any` con un tipo más específico si se conoce la forma de los datos
    loading: boolean;
    error: string | null;
}

// Elemento del grid
interface GridItem {
    key: QueryKey;
    colSpan: number;
    rowSpan: number;
    title: string;
}

const ScoreCard = ({ open }: { open: boolean }) => {
    if (!open) return null;

    const manager = useManagmentRead();
    const controllerRef = useRef<AbortController | null>(null);

    // Estado inicial para cada clave
    const [queriesState, setQueriesState] = useState<Record<QueryKey, QueryState>>(
        () => {
            const initial: Record<string, QueryState> = {};
            QUERY_KEYS.forEach((key) => {
                initial[key] = { data: [], loading: true, error: null };
            });
            return initial;
        }
    );

    const fetchAllData = useCallback(async () => {
        // Cancelar petición anterior
        if (controllerRef.current) {
            controllerRef.current.abort();
        }

        const controller = new AbortController();
        controllerRef.current = controller;

        // Reiniciar estados a loading
        setQueriesState((prev) => {
            const newState = { ...prev };
            QUERY_KEYS.forEach((key) => {
                newState[key] = { ...newState[key], loading: true, error: null };
            });
            return newState;
        });

        try {
            // Disparar todas las consultas en paralelo
            const promises = QUERY_KEYS.map(async (key) => {

                // Construir payload SIN signal (execute lo añadirá internamente)
                const payload: RequestPayload = {
                    table: QUERY_CONFIGS[key].table, // o la tabla que corresponda
                    filtros: {
                        selects: [
                        ],
                        agregaciones: [
                            { Key: "venta.ID", Alias: "totalTickets", Operation: "COUNT DISTINCT" },
                            { Key: "venta.Paquetes", Alias: "totalProductos", Operation: "COUNT DISTINCT" },
                            { Key: "venta.PrecioTotal", Alias: "totalIngresos", Operation: "COUNT DISTINCT" },
                            { Key: "(venta.CostoTotal * venta.Paquetes)", Alias: "totalCostos", Operation: "COUNT DISTINCT" },
                            /* { Key: "venta.FechaRegistro", Alias: "fecha" }, */
                        ],
                        FiltrosAnd: [
                            {
                                Filtros: [
                                    { Key: "venta.FechaRegistro", Operator: ">=", Value: "2026-03-01" },
                                ],
                                OperadorLogico: "AND"
                            }
                        ],
                        Order: [] // No necesario para agregaciones, pero se puede omitir
                    },
                    signal: controller.signal,
                    page: 1,
                    pageSize: 10,
                };

                const { promise } = manager.execute<any>(payload);
                const response = await promise;

                if (response.error) {
                    throw response.error;
                }

                return { key, data: response.data?.data ?? [] };
            });

            const results = await Promise.all(promises);

            // Actualizar estados con los datos
            setQueriesState((prev) => {
                const newState = { ...prev };
                results.forEach(({ key, data }) => {
                    newState[key] = { data, loading: false, error: null };
                });
                return newState;
            });

        } catch (error: unknown) {
            if (error instanceof Error && error.name === "AbortError") return;

            // Si hay error, marcar todas las consultas con error
            setQueriesState((prev) => {
                const newState = { ...prev };
                QUERY_KEYS.forEach((key) => {
                    newState[key] = {
                        ...newState[key],
                        loading: false,
                        error: error instanceof Error ? error.message : "Error desconocido",
                    };
                });
                return newState;
            });
            console.error("Error fetching score data:", error);
        }
    }, [manager]);

    useEffect(() => {
        if (open) {
            fetchAllData();
        }

        return () => {
            controllerRef.current?.abort();
        };
    }, [open, fetchAllData]);

    const gridItems: GridItem[] = [
        { key: "PERIODOS", colSpan: 2, rowSpan: 1, title: "Periodos" },
        { key: "SEMANAL", colSpan: 1, rowSpan: 1, title: "Semanal" },
        { key: "PROVEEDORES", colSpan: 3, rowSpan: 1, title: "Proveedores" },
        { key: "80-20", colSpan: 1, rowSpan: 1, title: "80-20" },
    ];

    return (
        <Modal modalName="scorecard" maxWidth="full" title="Score Card">
            <BentoGrid cols={3} className="p-2">
                {gridItems.map((item) => {
                    const state = queriesState[item.key];
                    return (
                        <BentoItem
                            key={item.key}
                            colSpan={item.colSpan}
                            rowSpan={item.rowSpan}
                            title={item.title}
                            className="overflow-hidden"
                        >
                            <DynamicTable
                                data={state?.data ?? []}
                                loading={state?.loading ?? false} // Aseguramos booleano
                            />
                        </BentoItem>
                    );
                })}
            </BentoGrid>
        </Modal>
    );
};

export default ScoreCard;