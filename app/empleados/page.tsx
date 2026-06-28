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

// Definir interfaces para tipado fuerte basado en los datos reales
interface Empleado {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    direccion: string | null;
    fecha_nacimiento: string;
    fecha_ingreso: string;
    puesto: string;
    departamento: string;
    salario: number;
    estado: string;
    rfc: string;
    curp: string;
    nss: string;
    cuenta_bancaria: string | null;
    banco: string | null;
    clabe: string | null;
    usuario_id: number;
    num_empleado: number;
}

interface EmpleadosResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: Empleado[];
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
// Hook personalizado para la gestión de empleados
const useEmpleados = () => {
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
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
                pageSize: "10",
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
    }, [currentPage, activeFilters, setActiveFilters]);

    useEffect(() => {
        fetchEmpleados();
    }, [fetchEmpleados]);

    return {
        empleados,
        currentPage,
        totalPages,
        totalRecords,
        isLoading,
        error,
        setCurrentPage,
        setActiveFilters,
        refetch: fetchEmpleados
    };
};

export default function Empleados() {
    const dispatch = useAppDispatch();
    const {
        empleados,
        currentPage,
        totalPages,
        totalRecords,
        isLoading,
        error,
        setCurrentPage,
        setActiveFilters,
        refetch
    } = useEmpleados();

    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);

    const loadEmpleados = (data: FiltrosForm) => {
        const nuevosFiltros: any[] = [];
        const nuevosFiltrosAnd: any[] = [];

        if (data.search) {
            nuevosFiltrosAnd.push({
                Filtros: [
                    { Key: "Nombre", Value: data.search, Operator: "like" },
                    { Key: "ApellidoPaterno", Value: data.search, Operator: "like" },
                    { Key: "ApellidoMaterno", Value: data.search, Operator: "like" },
                    { Key: "personal", Value: data.search, Operator: "like" },
                ], OperadorLogico: "OR"
            } as any);
        }

        if (data.departamento) {
            nuevosFiltros.push({ Key: "departamento", Value: data.departamento, Operator: "=" });
        }

        if (data.puesto) {
            nuevosFiltros.push({ Key: "puesto", Value: data.puesto, Operator: "=" });
        }

        if (data.estado) {
            nuevosFiltros.push({ Key: "estado", Value: data.estado, Operator: "=" });
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

    const handleOpenModal = (modalName: string, empleado?: Empleado) => {
        if (modalName === 'detalles-empleado' && empleado) {
            setEmpleadoSeleccionado(empleado);
        }
        dispatch(openModalReducer({ modalName }));
    };

    const handleRefetchAll = () => {
        refetch();
    };

    return (
        <>
            <Header />
            <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
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
                                                name: "sucursal",
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
                                            {
                                                name: "date",
                                                type: "DATE_RANGE",
                                                label: "Fecha de Puesto",
                                                icon: <Clock className="size-4" />,
                                                require: false,
                                            },
                                        ],
                                    },
                                ]} />
                            <dl className="flex gap-2 ml-auto">
                                <Button
                                    onClick={limpiarFiltros}
                                    color="success"
                                >
                                    Limpiar
                                </Button>

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
                                    <button
                                        onClick={refetch}
                                        className="text-green-600 hover:text-green-800 underline"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            ) : empleados.length > 0 ? (
                                <>
                                    <DynamicTable
                                        data={empleados}
                                        onRowClick={(empleado) => handleOpenModal('detalles-empleado', empleado)}
                                    />
                                    <Pagination
                                        currentPage={currentPage}
                                        loading={isLoading}
                                        setCurrentPage={setCurrentPage}
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
                    <ModalDetallesEmpleado selectedEmpleado={empleadoSeleccionado} />
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