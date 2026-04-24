"use client";
import DynamicTable from "@/components/table";
import { RequestPayload } from "@/hooks/classes/api";
import { useManagmentRead } from "@/hooks/classes/api";
import Footer from "@/template/footer";
import Header from "@/template/header";
import { useEffect, useState } from "react";
import { TableData } from "../reporteria/page";
import Pagination from "@/components/pagination";

const pageRedes = () => {
    const manager = useManagmentRead();

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(1)

    const [redes, setRedes] = useState <TableData[]>([])

    async function getDataWeb() {
        const payload: RequestPayload = {
            table: "Prov",
            filtros: {
                Filtros: [
                    {
                        Key: "ProvCuenta",
                        Operator: "IS NULL"
                    }
                ],
            },
            page: currentPage,
            pageSize: pageSize,
        };
        const { promise } = manager.execute(payload);
        const response = await promise;

        console.log("Respuesta de getDataWeb:", response);
        if (response.error) {
            console.error("Error en getDataWeb:", response.error);
        } else {         
            setRedes(response.data?.data || []);
            setTotalPages(response.data?.totalRecords || 1);
        }
    }
    useEffect(() => {
        getDataWeb();
    }, [pageSize, currentPage])
    return (
        <>
            <Header />
            <section className="p-3 md:p-4 min-h-[70vh]">
                <DynamicTable
                    data={redes}
                    loading={false}
                />
                <Pagination
                    currentPage={currentPage}
                    currentPageSize={pageSize}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                    onPageSizeChange={(newPageSize) => {
                        setPageSize(newPageSize);
                        setCurrentPage(1); // Reiniciar a la primera página al cambiar el tamaño de página
                    }}
                    loading={false}
                />   
            </section>
            <Footer />
        </>
    )
}
     export default pageRedes; 