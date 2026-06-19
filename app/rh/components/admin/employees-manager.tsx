"use client";

import { useEffect, useState } from "react";
import { Shield, User, RefreshCw, Eye } from "lucide-react";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import { Modal } from "@/components/modal";
import { ModalDetallesEmpleado } from "./detalles-empleado";
import { useGetWithFiltersIntelisisMutation } from "@/hooks/api/api_int";
import Pagination from "@/components/pagination";

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
    const [selectedEmpleado, setSelectedEmpleado] =
        useState<Empleado | null>(null);
    /* 
    ! hay que cambiar el compoente de paginacion por  Pagination de 'components\pagination\index.tsx' se volio a crear un componente ya existente
    ! la seccion de 'SUCURSAL' deberia de aplicarse desde un main-form 'components\form\main-form.tsx' para poder aplicar diversos filtros
    ! no es necesario aplicar employees.map si utilizas el componente DynamicTable 'components\table\index.tsx' que ya tiene la estructura de tabla y paginacion integrada, solo hay que pasarle los datos y configuraciones necesarias
    ! de no querer usar DynamicTable usa Card 'components\card\index.tsx' o BentoGrid 'components\bento-grid\index.tsx' para mostrar mejor estructurada la pantalla y la informacion
    */
    // SUCURSAL
    const [sucursal, setSucursal] = useState("sucursales");

    // PAGINACIÓN
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [getWithFilter] =
        useGetWithFiltersIntelisisMutation();

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const response = await getWithFilter({
                table: "personal",
                page: currentPage,
                pageSize: pageSize,
                filtros: {
                    Filtros: [
                        {
                            Key: "Estatus",
                            Operator: "=",
                            Value: "alta",
                        },
                        ...(sucursal !== "sucursales"
                            ? [
                                {
                                    Key: "SucursalTrabajo",
                                    Operator: "=",
                                    Value: sucursal,
                                },
                            ]
                            : []),
                    ],
                    FiltrosAnd: [],
                    Selects: [],
                    Order: [],
                },
            });

            if ("data" in response) {
                const data = response.data.data || [];
                setEmployees(data);
                setTotalPages(response.data.totalPages || 1);
                setTotalItems(response.data.totalItems || 0);
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
        setCurrentPage(1);
    };

    useEffect(() => {
        loadEmployees();
    }, [pageSize, currentPage, sucursal]);

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
                        <RefreshCw
                            className={`w-4 h-4 ${loading ? "animate-spin" : ""
                                }`}
                        />
                        Recargar
                    </button>
                    {/* SUCURSAL */}
                    <select
                        value={sucursal}
                        onChange={handleSucursalChange}
                        className="border border-gray-300 rounded-lg px-3 py-2.5 dark:bg-gray-700 dark:border-gray-600 text-base"
                    >
                        <option value="sucursales">Todas las Sucursales </option>
                        <option value="0">Administracion </option>
                        <option value="1"> Valle de Guadalupe</option>
                        <option value="2">Testerazo</option>
                        <option value="3"> Palmas </option>
                        <option value="4"> Mayoreo</option>
                    </select>
                </div>
            </div>

            {/* LISTADO */}
            <div className="rounded-2xl border border-gray-300 bg-white dark:bg-gray-900 p-6">
                {loading ? (
                    <div className="py-10 text-center text-gray-500">
                        Cargando empleados...
                    </div>
                ) : employees.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">
                        No hay empleados registrados
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {employees.map((employee) => (
                                <div
                                    key={employee.Personal}
                                    onClick={() =>
                                        handleOpenEmployee(employee)
                                    }
                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-300 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
                                                # {employee.Personal} -{" "}
                                                {employee.Departamento}{" "}
                                                - {employee.Puesto} -{" "}
                                                {employee.SucursalTrabajo}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 rounded-lg  border border-gray-300 hover:bg-purple-200 dark:hover:bg-gray-100">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* PAGINACIÓN */}
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                loading={loading}
                                setCurrentPage={setCurrentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                itemsPerPage={pageSize}
                                currentPageSize={pageSize}
                                onPageSizeChange={(newPageSize) => {
                                    setPageSize(newPageSize);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
            {/* MODAL */}
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