"use client"

import {
    Filter,
    MessageCircle,
    Search,
} from "lucide-react"
import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetMutation } from "@/hooks/reducers/api"
import { useEffect, useState } from "react"
import { TablaPickUp } from "./components/table"
import { LoadingSection } from "@/template/loading-screen"

import ModalPedidos from "./components/modal"
import { ModalChat } from "./components/modal-chat"
import Pagination from "@/components/pagination"
import { useForm } from "react-hook-form"

type Filtro = { Key: string; Value: any; Operator: string };
type ActiveFilters = {
    Filtros: Filtro[];
    Selects: any[];
    OrderBy: any | null;
    sum: boolean;
    distinct: boolean;
};

export default function PickUp() {
    const [pedidos, setpedidos] = useState([])
    const [IdLista, setIdLista] = useState(0)
    const [IdPedido, setIdPedido] = useState(0)
    const [IdCliente, setIdCliente] = useState(0)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [getWithFilter] = useGetMutation();

    // Estado inicial incluye filtro base
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [
            { Key: "Estado", Value: "listo", Operator: "<>" }
        ],
        Selects: [],
        OrderBy: null,
        sum: false,
        distinct: false
    });

    const {
        handleSubmit,
        register,
        formState: { errors },
    } = useForm();

    const onSubmit = (data: any) => {
        // Mantener filtro base + agregar búsqueda si existe
        setActiveFilters(prev => ({
            ...prev,
            Filtros: [
                { Key: "Estado", Value: "listo", Operator: "<>" },
                ...(data.search ? [{ Key: "id_cliente", Value: data.search, Operator: "like" }] : [])
            ]
        }));
        setCurrentPage(1);
    }

    const dispatch = useAppDispatch();

    // Carga inicial y cuando cambian los filtros/página
    useEffect(() => {
        async function getPedidos() {
            setIsLoading(true);
            try {
                // Usar activeFilters en la petición
                const { data: Pedidos } = await getWithFilter({
                    url: "citas",
                    pageSize: "5",
                    sum: activeFilters.sum,
                    distinct: activeFilters.distinct,
                    page: currentPage,
                    filters: {
                        Filtros: activeFilters.Filtros,
                        Selects: activeFilters.Selects,
                        Order: activeFilters.OrderBy ? [activeFilters.OrderBy] : []
                    }
                });

                setTotalPage(Pedidos.totalPages);
                const idClientes = Pedidos.data.map((row: any) => ({ "Key": "id", "Value": row.id_cliente }))

                const { data: Clientes } = await getWithFilter({
                    url: "clientes",
                    sum: false,
                    distinct: false,
                    page: "1",
                    filters: {
                        Filtros: idClientes,
                        Selects: [{ "Key": "" }],
                        Order: [{ "Key": "", "Direction": "" }]
                    }
                });

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
            } catch (error) {
                console.error("Error fetching pedidos:", error);
            } finally {
                setIsLoading(false);
            }
        }
        getPedidos();
    }, [currentPage, activeFilters])

    function handleOpenModal(idLista: number, idPedidos: number, idCliente: number) {
        setIdLista(idLista)
        setIdPedido(idPedidos);
        setIdCliente(idCliente)
        dispatch(openModalReducer({ modalName: "pedido" }))
    }

    return (
        <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
            <header className="mb-8">
                <h1 className="flex items-center text-2xl font-bold md:text-3xl">Portal de Pick Up</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-100">Gestiona y visualiza todos los pedidos</p>
            </header>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <article className="p-4">
                    <header className="mb-4 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <h2 className="text-lg font-semibold">Pedidos Agendados</h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-center gap-2">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    {...register("search", { required: false })}
                                    placeholder="Buscar cliente..."
                                    className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                />
                            </div>

                            <button type="submit" className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium bg-green-600 text-white">
                                <Filter className="mr-1 h-4 w-4" />
                                Filtrar
                            </button>

                            <button
                                onClick={() => {
                                    dispatch(openModalReducer({ modalName: 'general' }))
                                }}
                                className="flex gap-1 items-center bg-purple-500 text-white text-xs px-3 py-2 rounded-md cursor-pointer">
                                <MessageCircle className="h-4 w-4" />
                            </button>
                        </form>
                    </header>

                    <section className="overflow-x-auto">
                        {isLoading ? (<LoadingSection message="Cargando datos" />)
                            : pedidos.length ? (<> <TablaPickUp data={pedidos} handleOpenModal={handleOpenModal} />
                                <div className="p-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        loading={isLoading}
                                        setCurrentPage={setCurrentPage}
                                        totalPages={totalPage}
                                    />
                                </div></>)
                                :
                                (<div className="p-4 text-center">
                                    <p className="text-gray-500">No se encontraron pedidos.</p>
                                </div>)}
                    </section>
                </article>
            </div>
            <ModalChat telefonoClient={'general'} />
            <ModalPedidos name="pedido" title="Detalles del pedido" idPedido={IdPedido} idCliente={IdCliente} idListas={IdLista} />
        </main >
    )
}