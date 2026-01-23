"use client";

import { useState } from "react";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer, closeModalReducer } from "@/hooks/reducers/drop-down";
import { useGetMasivoWithFiltersMutation } from "@/hooks/api/api_int";
import Header from "@/template/header";
import Footer from "@/template/footer";
import { BarChart3, ChartBar, Form, LoaderCircle, RefreshCw, Share, X } from "lucide-react";
import { Modal } from "@/components/modal";
import MainForm from "@/components/form/main-form";
import DynamicTable from "@/components/table";
import Pagination from "@/components/pagination";
import { Button } from "@/components/button";

interface Filter {
    key: string;
    value: string;
    operator: string;
}

interface Select {
    key: string;
    alias: string;
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
    filters: Filter[];
    logicalOperator: 'and' | 'or' | string;
}

interface BodyRequest {
    filters: Filter[];
    selects: Select[];
    aggregations: Aggregation[];
    order: Order[];
    filtersAnd: LogicalFilterGroup[];
    filtersOr: LogicalFilterGroup[];
}

interface ParamsRequest {
    table: string,
    page: number,
    pageSize: number
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

    const [table, setTable] = useState<string | null>(null)
    const [data, setdata] = useState([]);
    const [loading, setloading] = useState(false);
    const [error, seterror] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);

    function handleViewModal() {
        dispatch(openModalReducer({ modalName: "form-filter" }))
    }

    function handleCloseModal() {
        dispatch(closeModalReducer({ modalName: "form-filter" }))
    }

    async function fetchData(params: ParamsRequest, body: BodyRequest) {
        const controller = new AbortController();
        setloading(true);
        const requestData: any = {
            filtros: {},
            signal: controller.signal, ...params
        };

        console.log(requestData);

        getData({ params, body })
            .unwrap()
            .then((response) => {
                // Verificar si la petición fue abortada
                if (controller.signal.aborted) {
                    return;
                }

                setdata(response.data);
                setTotalPage(response.totalPages);
                setloading(false);
            })
            .catch((err) => {
                // Verificar si la petición fue abortada
                if (controller.signal.aborted) {
                    return;
                }

                seterror(err);
                setloading(false);
            });
    }

    function handleApplyFilters(filters: BodyRequest) {
        if (!table) return;
        const params: ParamsRequest = {
            table,
            page,
            pageSize: 10
        };
        fetchData(params, filters);
        handleCloseModal();
    }

    function handleRefreshData() {
        if (!table) return;
        const params: ParamsRequest = {
            table,
            page,
            pageSize: 10
        };
        const body: BodyRequest = {
            filters: [],
            selects: [],
            aggregations: [],
            order: [],
            filtersAnd: [],
            filtersOr: []
        };
        fetchData(params, body);
    }

    return (
        <>
            <Header />
            <main className="min-h-[70vh] bg-gray-50 dark:bg-gray-900">
                <ul className="flex justify-between p-4">
                    <Button color="success" size="small" onClick={handleViewModal}>
                        <Form className="size-4" /> Filtrar Reporte
                    </Button>
                    <li className="flex gap-2">

                        <Button color="indigo" size="small" onClick={handleViewModal}>
                            <ChartBar className="size-4" /> Estadisticas
                        </Button>
                        <Button color="info" size="small" onClick={handleViewModal}>
                            <Share className="size-4" /> Exportar
                        </Button>
                        <Button color="completed" size="small" onClick={handleRefreshData}>
                            <LoaderCircle className="size-4" /> Recargar
                        </Button>

                    </li>
                </ul>

                <section className="px-4 py-6">
                    <DynamicTable data={data} loading={loading} />
                    {data.length > 0 && <Pagination currentPage={page} setCurrentPage={setPage} loading={loading} totalPages={totalPage} />}
                </section>
            </main>
            <Footer />

            <Modal modalName="form-filter" title="">
                <section className="w-full p-6">
                    <MainForm
                        message_button="Generar Reporte"
                        actionType=""
                        dataForm={[
                            {
                                type: "INPUT",
                                name: "Nombre del Reporte",
                                placeholder: "Ingrese el nombre del reporte",
                                require: true
                            }
                        ]}
                        onSuccess={() => {

                        }}
                    />
                </section>
            </Modal>
        </>
    );
}