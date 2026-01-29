import { useGetMasivoWithFiltersMutation } from "@/hooks/api/api_int";
import { safeCall } from "@/hooks/use-debounce";
import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { ParamsRequest, BodyRequest, ApiResponse } from "../constants/types";
import DynamicTable from "@/components/table";
import Pagination from "@/components/pagination";

const DEFAULT_TABLE = `ventad 
  INNER JOIN ART AS ART ON ventad.Articulo = ART.Articulo`;

export default function DetailsVenta({ id }: { id?: number }) {

    const DEFAULT_BODY: BodyRequest = useMemo(() => ({
        selects: [
            { key: "ART.Descripcion1", alias: "Nombre" },
            { key: "ventad.Articulo" },
            { key: "ventad.Unidad" },
            { key: "ventad.Cantidad" },
            { key: "ventad.Factor" },
            { key: "ventad.Precio" },
            { key: "ventad.Costo" },
            { key: "((ventad.Precio * ventad.Cantidad) - (ventad.Costo * ventad.Cantidad))", alias: "Diferencia" }
        ],
        agregaciones: [],
        order: [
            { key: "ventad.Articulo", direction: "desc" }
        ],
        filtrosAnd: [
            {
                filtros: [
                    { key: "ventad.ID", operator: "=", value: `${id}` },
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
        fetchData({
            table: DEFAULT_TABLE,
            page: page,
            pageSize: 10
        }, DEFAULT_BODY);
    }, [id, page])


    return (
        <main>
            <DynamicTable data={data} loading={loading} />
            <Pagination
                currentPage={page}
                setCurrentPage={setPage}
                loading={loading}
                totalPages={totalPages}
            />
        </main>
    );
}