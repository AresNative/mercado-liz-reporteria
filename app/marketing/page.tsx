"use client";
import { Button } from "@/components/button";
import DynamicTable from "@/components/table";
import { RequestPayload } from "@/hooks/classes/api";
import { useManagmentWeb } from "@/hooks/classes/api-liz";
import Footer from "@/template/footer";
import Header from "@/template/header";
import { useEffect, useState } from "react";
import ModalRedes from "./components/modal-redes";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import { TableData } from "../reporteria/page";
import { RefreshCw } from "lucide-react";

const pageRedes = () => {
    const manager = useManagmentWeb();
    const dispatch = useAppDispatch();     

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);
    const [redes, setRedes] = useState<TableData[]>([]);

    async function getDataWeb() {
        setLoading(true);
        const payload: RequestPayload = {
            table: "redes_sociales",
            filtros: {
                selects: [{ Key: "url" }, { Key: "icon" }, { Key: "red_social" }],
            },
            page: currentPage,
            pageSize: pageSize,
        };

        const { promise } = manager.execute(payload);
        const response = await promise;

        if (!response.error) {
            setRedes(response.data?.data || []);
        }
        setLoading(false);
    }
    useEffect(() => {
        getDataWeb();
    }, [pageSize, currentPage]);

    return (
        <>
            <Header />
            <section className="p-3 md:p-4 min-h-[80vh]">
                <ul className="md:hidden mb-4">
                    <li className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                            Redes Sociales
                        </h1>
                        <Button
                            color="success"
                            label="Crear"
                            onClick={() =>
                                dispatch(openModalReducer({ modalName: "modalMarketingRedes" }))
                            }
                        />
                    </li>
                </ul>

                <ul className="hidden md:flex justify-between items-center mb-4">
                    <li className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                            Gestión de Redes Sociales
                        </h1>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Administra los links e íconos de tus redes
                        </span>
                    </li>

                    <li className="flex gap-2">
                        <button
                            onClick={getDataWeb}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Recargar
                        </button>

                        <Button
                            color="success"
                            label="Crear"
                            onClick={() =>
                                dispatch(openModalReducer({ modalName: "modalMarketingRedes" }))
                            }
                        />
                    </li>
                </ul>

                {/*Contenedor tipo card */}
                <article className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">

                    {/* Tabla */}
                    <div className="overflow-x-auto">
                        <DynamicTable
                            data={redes}
                            loading={false}
                        />
                    </div>

                    {/* Paginación básica */}
                    <div className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                        <span>Página {currentPage}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                className="px-3 py-1 border rounded"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setCurrentPage((p) => p + 1)}
                                className="px-3 py-1 border rounded"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </article>
            </section>
            <Footer />
            <ModalRedes />
        </>
    );
};

export default pageRedes;