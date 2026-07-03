"use client"

import {
    Building,
    Clock,
    Filter,
    MessageCircle,
    RefreshCw,
    Search
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"

import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersIntelisisMutation } from "@/hooks/api/api_int"

import { LoadingSection } from "@/template/loading-screen"

import Pagination from "@/components/pagination"
import DynamicTable from "@/components/table"
import { Modal } from "@/components/modal"
import { ModalDetallesEmpleado } from "./components/detalles-empleado"
import Footer from "@/template/footer"
import Header from "@/template/header"
import MainForm from "@/components/form/main-form"
import { Button } from "@/components/button"


interface EmpleadosResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: any[];
}

interface Filtro {
    Key: string;
    Value: any;
    Operator: string;
}

interface ActiveFilters {
    Filtros: Filtro[];
    FiltrosAnd: Filtro[];
    Selects: any[];
    OrderBy: any | null;
    sum: boolean;
    distinct: boolean;
}

interface FiltrosForm {
    search: string;
    departamento: string;
    estado: string;
    puesto: string;
}

export default function Empleados() {
    const dispatch = useAppDispatch();
    const [empleados, setEmpleados] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersIntelisisMutation();

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [],
        FiltrosAnd: [],
        Selects: [],
        OrderBy: null,
        sum: false,
        distinct: false
    });

    const fetchEmpleados = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        console.log(activeFilters);

        try {
            const response = await getWithFilter({
                table: "personal",
                pageSize: pageSize,
                page: currentPage,
                filtros: {
                    Filtros: activeFilters.Filtros,
                    FiltrosAnd: activeFilters.FiltrosAnd,
                    Selects: activeFilters.Selects,
                    Order: activeFilters.OrderBy ? [activeFilters.OrderBy] : []
                }
            });

            if ('data' in response) {
                const empleadosData = response.data as EmpleadosResponse;
                setEmpleados(empleadosData.data);
                setTotalPages(empleadosData.totalPages);
                setTotalRecords(empleadosData.totalRecords);
            } else if ('error' in response) {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (err) {
            console.error("Error fetching empleados:", err);
            setError("No se pudieron cargar los empleados. Intente nuevamente.");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activeFilters, setActiveFilters, pageSize]);

    useEffect(() => {
        fetchEmpleados();
    }, [fetchEmpleados]);

    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any | null>(null);

    const loadEmpleados = (data: FiltrosForm) => {
        const nuevosFiltros: any[] = [];
        const nuevosFiltrosAnd: any[] = [];

        if (data.search) {
            nuevosFiltrosAnd.push({
                Filtros: [
                    { Key: "Nombre", Value: data.search, Operator: "like" },
                    { Key: "ApellidoPaterno", Value: data.search, Operator: "like" },
                    { Key: "ApellidoMaterno", Value: data.search, Operator: "like" },
                    { Key: "Personal", Value: data.search, Operator: "like" },
                ], OperadorLogico: "OR"
            } as any);
        }

        if (data.departamento) {
            nuevosFiltros.push({ Key: "SucursalTrabajo", Value: data.departamento, Operator: "=" });
        }

        if (data.puesto) {
            nuevosFiltros.push({ Key: "Puesto", Value: data.puesto, Operator: "=" });
        }

        if (data.estado) {
            nuevosFiltros.push({ Key: "Estatus", Value: data.estado, Operator: "=" });
        }

        setActiveFilters(prev => ({
            ...prev,
            FiltrosAnd: nuevosFiltrosAnd,
            Filtros: nuevosFiltros
        }));
    };

    const limpiarFiltros = () => {
        setActiveFilters(prev => ({ ...prev, Filtros: [] }));
        setCurrentPage(1);
    };

    const handleOpenModal = (modalName: string, empleado?: any) => {
        if (modalName === 'detalles-empleado' && empleado) {
            setEmpleadoSeleccionado(empleado);
        }
        dispatch(openModalReducer({ modalName }));
    };

    const handleRefetchAll = () => {
        fetchEmpleados();
    };

    return (
        <>
            <Header />
            <main className="min-h-screen mx-auto p-4 md:p-6 text-gray-900">
                <header className="mb-8">
                    <h1 className="flex items-center text-2xl font-bold md:text-3xl dark:text-white">
                        Portal de Empleados
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                        Gestiona y visualiza todos los empleados de la organización
                    </p>
                </header>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                    <article className="p-4">
                        <span className="mr-4">
                            <h2 className="text-lg font-semibold dark:text-white">Gestión de Empleados</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                                Mostrando {empleados.length} de {totalRecords} empleados
                            </p>
                        </span>
                        <dt className="relative flex flex-col gap-2">
                            <MainForm
                                message_button={"Filtrar"}
                                onSuccess={loadEmpleados}
                                iconButton={<Filter className="mr-1 h-4 w-4" />}
                                actionType={""}
                                flexDirection="flex-row"
                                dataForm={[
                                    {
                                        type: "Flex",
                                        require: false,
                                        elements: [
                                            {
                                                name: "search",
                                                type: "SEARCH",
                                                label: "Busqueda rapida",
                                                icon: <Search className="size-4" />,
                                                placeholder: "Busar por nombre, apellidos, num. personal...",
                                                require: true,
                                            },
                                            {
                                                name: "departamento",
                                                type: "SELECT",
                                                label: "Selecciona la sucursal",
                                                icon: <Building className="size-4" />,
                                                options: [
                                                    { label: "Mayoreo", value: "4" },
                                                    { label: "Guadalupe", value: "1" },
                                                    { label: "Testerazo", value: "2" },
                                                    { label: "Palmas", value: "3" },
                                                ],
                                                placeholder: "Todas las sucursales",
                                                require: false,
                                            },
                                        ],
                                    },
                                ]} />
                            <dl className="flex gap-2 ml-auto">
                                <Button
                                    onClick={handleRefetchAll}
                                    color="success"
                                >
                                    Actualizar <RefreshCw className="h-4 w-4" />
                                </Button>

                                <Button
                                    onClick={() => handleOpenModal('chat-general')}
                                    color="info"
                                >
                                    Chat <MessageCircle className="size-4" />
                                </Button>
                            </dl>
                        </dt>

                        <section className="overflow-x-auto">
                            {isLoading ? (
                                <LoadingSection message="Cargando empleados..." />
                            ) : error ? (
                                <div className="p-4 text-center">
                                    <p className="text-red-500 mb-2">{error}</p>
                                    <Button
                                        onClick={fetchEmpleados}
                                        color="success"
                                        size="small"
                                    >
                                        Reintentar
                                    </Button>
                                </div>
                            ) : empleados.length > 0 ? (
                                <>
                                    <DynamicTable
                                        data={empleados}
                                        onRowClick={(empleado) => handleOpenModal('detalles-empleado', empleado)}
                                    />
                                    <Pagination
                                        currentPage={currentPage}
                                        currentPageSize={pageSize}
                                        loading={isLoading}
                                        setCurrentPage={setCurrentPage}
                                        onPageSizeChange={setPageSize}
                                        totalPages={totalPages}
                                    />
                                </>
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-gray-500 mb-4">No se encontraron empleados con los filtros aplicados.</p>
                                    <button
                                        onClick={limpiarFiltros}
                                        className="text-green-600 hover:text-green-800 underline"
                                    >
                                        Ver todos los empleados
                                    </button>
                                </div>
                            )}
                        </section>
                    </article>
                </div>

                {/* Modales */}
                <Modal
                    modalName="detalles-empleado"
                    title="Detalles del Empleado"
                    maxWidth="lg"
                >
                    {empleadoSeleccionado && <ModalDetallesEmpleado selectedEmpleado={empleadoSeleccionado as any} />}
                </Modal>

                <Modal
                    modalName="nuevo-empleado"
                    title="Agregar Nuevo Empleado"
                    maxWidth="lg"
                >
                    <></>
                </Modal>

                <Modal
                    modalName="chat-general"
                    title="Chat General"
                    maxWidth="xl"
                >
                    <></>
                </Modal>
            </main>
            <Footer />
        </>
    )
}