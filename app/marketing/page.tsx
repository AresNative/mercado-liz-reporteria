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

const pageRedes = () => {
    const manager = useManagmentWeb();
    const dispatch = useAppDispatch();

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [redes, setRedes] = useState <TableData[]>([])

    async function getDataWeb() {
        const payload: RequestPayload = {
            table: "redes_sociales",
            filtros: {
                selects: [{ Key: "url" }, { Key: "icon" }],
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
        }
    }
    useEffect(() => {
        getDataWeb();
    }, [pageSize, currentPage])
    return (
        <>
            <Header />
            <Button color="indigo" label="Crear" onClick={() => dispatch(openModalReducer({modalName:"modalMarketingRedes"}))} />
            <DynamicTable
                data={redes}
                loading={false}
            />
            
            <Footer />
            <ModalRedes/>
        </>
    )
}
     export default pageRedes; 