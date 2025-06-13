"use client"

import {
    Filter,
    Search,
    User,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
} from "lucide-react"
import Badge from "@/components/badge"
import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetMutation } from "@/hooks/reducers/api"
import { useEffect, useState } from "react"
import ModalPedidos from "../components/modal"
import { branches } from "../constants/sucursales"

export default function AdminDashboard() {
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
                "Filtros": [{ "Key": "", "Value": "", "Operator": "" }],
                "Selects": [{ "Key": "" }],
                "Order": [{ "Key": "", "Direction": "" }]
            },
            pageSize: "10"
        });
        const idClientes = Pedidos.data.map((row: any) => ({ "Key": "id", "Value": row.id_cliente, "Operator": "" }))
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
            },
            pageSize: "10"
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
    const formatDate = (fecha: any) => {
        const date = new Date(fecha);

        const optionsDate: any = {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        };

        const optionsTime: any = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };

        return {
            date: date.toLocaleDateString('en-GB', optionsDate),
            time: date.toLocaleTimeString('en-US', optionsTime)
        };
    };

    function handleOpenModal(idLista: number, idPedidos: number) {
        setIdLista(idLista)
        setIdPedido(idPedidos);

        dispatch(openModalReducer({ modalName: "pedido" }))
    }

    return (
        <div className="min-h-screen text-gray-900">
            <div className="mx-auto max-w-7xl p-4 md:p-6">
                <header className="mb-8">
                    <h1 className="flex items-center text-2xl font-bold md:text-3xl">Portal de Pick Up</h1>
                    <p className="mt-2 text-gray-600">Gestiona y visualiza todos los pedidos</p>
                </header>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="p-4">
                        <header className="mb-4 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <h2 className="text-lg font-semibold">Pedidos Agendadas</h2>
                            <section className="flex flex-wrap items-center gap-2">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar paciente o ID..."
                                        className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                                <button className="flex items-center rounded-md px-3 py-2 text-sm font-medium bg-purple-600 text-white">
                                    <Filter className="mr-1 h-4 w-4" />
                                    Filtrar
                                </button>
                            </section>
                        </header>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 text-gray-500 text-left text-sm">
                                        <th className="px-4 py-3 font-medium">
                                            <div className="flex items-center">
                                                ID
                                                <ArrowUpDown className="ml-1 h-4 w-4" />
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 font-medium">Cliente</th>
                                        <th className="px-4 py-3 font-medium">Fecha y Hora</th>
                                        <th className="px-4 py-3 font-medium">Servicio</th>
                                        <th className="px-4 py-3 font-medium">Estado</th>
                                        <th className="px-4 py-3 font-medium">Sucursal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedidos.map((row: any, key) => {
                                        const formatted = formatDate(row.fecha);
                                        return (
                                            <tr
                                                key={key}
                                                onClick={() => handleOpenModal(row.id_lista, row.id)} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                                                <td className="px-4 py-3 text-sm">#1234</td>
                                                <td className="px-4 py-3">
                                                    <section className="flex items-center">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <span className="ml-2">
                                                            <p className="text-sm font-medium">{row.cliente.nombre}</p>
                                                            <p className="text-xs text-gray-500">{row.cliente.telefono}</p>
                                                        </span>
                                                    </section>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <section className="flex flex-col">
                                                        <span className="text-sm">{formatted.date}</span>
                                                        <span className="text-xs text-gray-500">{formatted.time}</span>
                                                    </section>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge text={row.plan} color="blue" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge text={row.estado} color="purple" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    {branches.map((branch: any, keyBranch) => (branch.precio === row.sucursal ? (
                                                        <section key={keyBranch} className="flex items-center space-x-2">
                                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                                                                <branch.icon className="h-4 w-4" />
                                                            </span>
                                                            <p className="text-sm font-medium">{branch.name}</p>
                                                        </section>) : (<div key={keyBranch}></div>)))}
                                                </td>
                                            </tr>)
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <footer className="mt-4 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                Mostrando 1 a 1
                            </span>
                            <div className="flex items-center space-x-2">
                                <button className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-600 text-white">
                                    1
                                </button>
                                <button className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>

                <ModalPedidos name="pedido" title="Detalles del pedido" idPedido={IdPedido} idListas={IdLista} />

            </div>
        </div >
    )
}