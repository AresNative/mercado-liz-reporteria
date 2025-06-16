import Badge from "@/components/badge";
import { ArrowUpDown, User } from "lucide-react";
import { branches } from "../constants/sucursales";

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

export const TablaPickUp = ({ data, handleOpenModal }: { data: any, handleOpenModal: any }) => {
    return (
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
            <tbody>{
                data.map((row: any, key: any) => {
                    const formatted = formatDate(row.fecha);
                    return (
                        <tr
                            key={key}
                            onClick={() => handleOpenModal(row.id_lista, row.id)} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-3 text-sm">#{row.id}</td>
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
                                <Badge text={row.estado} color="green" />
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
                }
                )
            }
            </tbody>
        </table>
    )
};