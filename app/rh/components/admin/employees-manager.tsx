"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Shield, User, RefreshCw } from "lucide-react";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";

import { Modal } from "@/components/modal";
import { ModalDetallesEmpleado } from "./detalles-empleado";
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/api/api_int";

interface Empleado {
    Nombre: string;
    ApellidoPaterno: string;
    Estatus: string;
    Personal: number;
    Departamento: string;
    Puesto: string;
    SucursalTrabajo: string;
}

const EmployeesManager = () => {
    const dispatch = useAppDispatch();

    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<Empleado[]>([]);
    const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);

    const [sucursal, setSucursal] = useState("sucursales");

    const [getWithFilter] = useGetWithFiltersGeneralInIntelisisMutation();

    const loadEmployees = async () => {
        try {
            setLoading(true);

            const response = await getWithFilter({
                table: "personal",
                pageSize: "1000",
                page: 1,
                filtros: {
                    Filtros: [{
                        Key: "Estatus",
                        Operator: '=',
                        Value: "alta"
                    }

                    ],
                    FiltrosAnd: [],
                    Selects: [],
                    Order: [],
                },
            });

            if ("data" in response) {
                setEmployees(response.data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        await loadEmployees();
    };

    const handleOpenEmployee = (employee: Empleado) => {
        setSelectedEmpleado(employee);

        dispatch(
            openModalReducer({
                modalName: "detalles-empleado",
            })
        );
    };

    const handleSucursalChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        setSucursal(e.target.value);
    };

    const empleadosFiltrados =
        sucursal === "sucursales"
            ? employees
            : employees.filter((employee) =>
                employee.SucursalTrabajo?.toString() === sucursal
            );

    useEffect(() => {
        loadEmployees();
    }, []);

    return (
        <>
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        Gestión de Empleados
                    </h1>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Administración de empleados
                    </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Recargar
                    </button>

                    <select
                        value={sucursal}
                        onChange={handleSucursalChange}
                        className="border border-gray-300 rounded-lg px-3 py-2.5 dark:bg-gray-700 dark:border-gray-600 text-base">
                        <option value="sucursales">Todas las Sucursales </option>
                        <option value="0"> Administracion</option>
                        <option value="1">Valle de guadalupe </option>
                        <option value="3">Palmas</option>
                        <option value="2">Testerazo</option>
                        <option value="4">Mayoreo</option>
                    </select>
                </div>
            </div>

            {/* LISTADO */}
            <div className="rounded-2xl border bg-white dark:bg-gray-900 p-6">
                {loading ? (
                    <div className="py-10 text-center text-gray-500">
                        Cargando empleados...
                    </div>
                ) : empleadosFiltrados.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">
                        No hay empleados registrados
                    </div>
                ) : (
                    <div className="space-y-3">
                        {empleadosFiltrados.map((employee) => (
                            <div
                                key={employee.Personal}
                                onClick={() =>
                                    handleOpenEmployee(employee)
                                }
                                className="flex items-center justify-between p-4 rounded-xl border bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-gray-700 flex items-center justify-center">
                                        {employee.Puesto?.toLowerCase().includes(
                                            "admin"
                                        ) ? (
                                            <Shield className="w-5 h-5" />
                                        ) : (
                                            <User className="w-5 h-5" />
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                            {employee.Nombre}{" "}
                                            {employee.ApellidoPaterno}
                                        </h3>

                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            #{employee.Personal} -{" "}
                                            {employee.Departamento} -{" "}
                                            {employee.Puesto} -{" "}
                                            {employee.SucursalTrabajo}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button className="p-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <Pencil className="w-4 h-4" />
                                    </button>

                                    <button className="p-2 rounded-lg border text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                modalName="detalles-empleado"
                title="Detalles del Empleado"
                maxWidth="lg"
            >
                <ModalDetallesEmpleado
                    selectedEmpleado={selectedEmpleado}
                />
            </Modal>
        </>
    );
};

export default EmployeesManager;