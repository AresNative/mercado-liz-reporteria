"use client"

import {
    Filter,
    Search,
} from "lucide-react"
import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetMutation } from "@/hooks/reducers/api"
import { useEffect, useState } from "react"
import { TablaPickUp } from "./components/table"
import { LoadingSection } from "@/template/loading-screen"

import ModalPedidos from "./components/modal"

export default function PickUp() {
    const [pedidos, setpedidos] = useState([])
    const [IdLista, setIdLista] = useState(0)
    const [IdPedido, setIdPedido] = useState(0)
    const [getWithFilter, { isLoading: isLoadingPedidos }] = useGetMutation();
    const dispatch = useAppDispatch();
    async function getPedidos() {
        // Obtener pedidos
        const { data: Pedidos } = await getWithFilter({
            url: "citas",
            sum: false,
            distinct: false,
            page: "1",
            filters: {
                "Filtros": [{ "Key": "Estado", "Value": "listo", "Operator": "<>" }],
                "Selects": [{ "Key": "" }],
                "Order": [{ "Key": "", "Direction": "" }]
            },
            pageSize: "5"
        });

        const idClientes = Pedidos.data.map((row: any) => ({ "Key": "id", "Value": row.id_cliente }))
        // Obtener clientes
        const { data: Clientes } = await getWithFilter({
            url: "clientes",
            sum: false,
            distinct: false,
            page: "1",
            filters: {
                "Filtros": idClientes,
                "Selects": [{ "Key": "" }],
                "Order": [{ "Key": "", "Direction": "" }]
            }
        });

        // Combinar datos
        const pedidosCombinados = Pedidos.data.map((pedido: any) => {
            const cliente = Clientes.data.find((c: any) => c.id === pedido.id_cliente);
            return {
                ...pedido,
                cliente: cliente || {
                    nombre: "Cliente no encontrado",
                    telefono: "N/A",
                    id: pedido.id_cliente
                }
            };
        });

        setpedidos(pedidosCombinados);
    }

    useEffect(() => {
        getPedidos()
    }, [])

    function handleOpenModal(idLista: number, idPedidos: number) {
        setIdLista(idLista)
        setIdPedido(idPedidos);
        dispatch(openModalReducer({ modalName: "pedido" }))
    }

    return (
        <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
            <header className="mb-8">
                <h1 className="flex items-center text-2xl font-bold md:text-3xl">Portal de Pick Up</h1>
                <p className="mt-2 text-gray-600">Gestiona y visualiza todos los pedidos</p>
            </header>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <article className="p-4">
                    <header className="mb-4 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <h2 className="text-lg font-semibold">Pedidos Agendados</h2>
                        <section className="flex flex-wrap items-center gap-2">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente o ID..."
                                    className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                />
                            </div>
                            <button className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium bg-green-600 text-white">
                                <Filter className="mr-1 h-4 w-4" />
                                Filtrar
                            </button>
                        </section>
                    </header>

                    <section className="overflow-x-auto">
                        {isLoadingPedidos ? (<LoadingSection message="Cargando datos" />)
                            : (<TablaPickUp data={pedidos} handleOpenModal={handleOpenModal} />)}
                    </section>
                </article>
            </div>

            <ModalPedidos name="pedido" title="Detalles del pedido" idPedido={IdPedido} idListas={IdLista} />
        </main >
    )
}