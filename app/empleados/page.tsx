"use client"

import {
    Filter,
    MessageCircle,
    Plus,
    RefreshCw
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"

import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersGeneralMutation } from "@/hooks/api/api"

import { LoadingSection } from "@/template/loading-screen"

import Pagination from "@/components/pagination"
import DynamicTable from "@/components/table"
import { Modal } from "@/components/modal"
import { BentoGrid, BentoItem } from "@/components/bento-grid"
import { ModalDetallesEmpleado } from "./components/detalles-empleado"
import Footer from "@/template/footer"
import Header from "@/template/header"
import MainForm from "@/components/form/main-form"

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

interface EstadisticasEmpleados {
    totalRecords: number;
    empleadosActivos: number;
    empleadosInactivos: number;
    topDepartamentos: [string, number][];
}
// Hook personalizado para la gestión de empleados
const useEmpleados = () => {
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersGeneralMutation();

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
                table: "empleados",
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
    }, [currentPage, activeFilters, getWithFilter]);

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

// Hook personalizado para obtener estadísticas de todos los empleados
const useEstadisticasEmpleados = () => {
    const [estadisticas, setEstadisticas] = useState<EstadisticasEmpleados | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersGeneralMutation();

    const fetchEstadisticas = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Consulta para obtener todos los empleados (sin paginación)
            const response = await getWithFilter({
                table: "empleados",
                pageSize: "10000", // Número alto para obtener todos los registros
                page: 1,
                filtros: {
                    Filtros: [],
                    Selects: [],
                    Order: []
                }
            });

            if ('data' in response) {
                const empleadosData = response.data as EmpleadosResponse;
                const todosEmpleados = empleadosData.data;

                // Calcular estadísticas
                const empleadosActivos = todosEmpleados.filter(e => e.estado === "Activo").length;
                const empleadosInactivos = todosEmpleados.filter(e => e.estado === "Inactivo").length;

                const porDepartamento = todosEmpleados.reduce((acc, emp) => {
                    acc[emp.departamento] = (acc[emp.departamento] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                // Obtener los 3 departamentos más grandes
                const topDepartamentos = Object.entries(porDepartamento)
                    .filter((rows: any) => rows.estado !== "Inactivo")
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4);

                setEstadisticas({
                    totalRecords: empleadosData.totalRecords,
                    empleadosActivos,
                    empleadosInactivos,
                    topDepartamentos
                });
            } else if ('error' in response) {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (err) {
            console.error("Error fetching estadísticas:", err);
            setError("No se pudieron cargar las estadísticas.");
        } finally {
            setIsLoading(false);
        }
    }, [getWithFilter]);

    useEffect(() => {
        fetchEstadisticas();
    }, [fetchEstadisticas]);

    return {
        estadisticas,
        isLoading,
        error,
        refetch: fetchEstadisticas
    };
};

// Componente para estadísticas de empleados
const EstadisticasEmpleados = ({ estadisticas }: { estadisticas: EstadisticasEmpleados }) => {
    return (
        <BentoGrid cols={4} className="mb-6">
            <BentoItem
                title="Total de Empleados"
                description="Empleados en el sistema"
                className="bg-blue-50 border-blue-200"
            >
                <div className="text-3xl font-bold text-blue-600">{estadisticas.totalRecords}</div>
            </BentoItem>

            <BentoItem
                title="Empleados Activos"
                description="Actualmente trabajando"
                className="bg-green-50 border-green-200"
            >
                <div className="text-3xl font-bold text-green-600">{estadisticas.empleadosActivos}</div>
            </BentoItem>

            <BentoItem
                title="Empleados Inactivos"
                description="No activos en el sistema"
                className="bg-red-50 border-red-200"
            >
                <div className="text-3xl font-bold text-red-600">{estadisticas.empleadosInactivos}</div>
            </BentoItem>

            <BentoItem
                title="Top Departamentos"
                description="Con más empleados"
                className="bg-purple-50 border-purple-200"
            >
                <div className="space-y-1">
                    {estadisticas.topDepartamentos.map(([depto, count]) => (
                        <div key={depto} className="flex justify-between text-sm">
                            <span className="capitalize">{depto.toLowerCase()}:</span>
                            <span className="font-medium">{count}</span>
                        </div>
                    ))}
                </div>
            </BentoItem>
        </BentoGrid>
    );
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

    const {
        estadisticas,
        isLoading: isLoadingEstadisticas,
        error: errorEstadisticas,
        refetch: refetchEstadisticas
    } = useEstadisticasEmpleados();

    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);

    const onSubmit = (data: FiltrosForm) => {
        const nuevosFiltros: any[] = [];
        const nuevosFiltrosAnd: any[] = [];

        if (data.search) {
            nuevosFiltrosAnd.push({
                Filtros: [
                    { Key: "nombre", Value: data.search, Operator: "like" },
                    { Key: "apellido", Value: data.search, Operator: "like" },
                    { Key: "email", Value: data.search, Operator: "like" }
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
        console.log(nuevosFiltros, data);
        
        setActiveFilters(prev => ({
            ...prev,
            FiltrosAnd: nuevosFiltrosAnd,
            Filtros: nuevosFiltros
        }));
        setCurrentPage(1);
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
        refetchEstadisticas();
    };

    return (
        <>
            <Header />
            <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
                <header className="mb-8">
                    <h1 className="flex items-center text-2xl font-bold md:text-3xl">
                        Portal de Empleados
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-100">
                        Gestiona y visualiza todos los empleados de la organización
                    </p>
                </header>

                {/* Estadísticas - ahora con datos completos */}
                {isLoadingEstadisticas ? (
                    <div className="mb-6">
                        <LoadingSection message="Cargando estadísticas..." />
                    </div>
                ) : errorEstadisticas ? (
                    <div className="mb-6 p-4 bg-red-50 rounded-lg text-center">
                        <p className="text-red-500 mb-2">{errorEstadisticas}</p>
                        <button
                            onClick={refetchEstadisticas}
                            className="text-green-600 hover:text-green-800 underline"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : estadisticas ? (
                    <EstadisticasEmpleados estadisticas={estadisticas} />
                ) : null}

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <article className="p-4">
                        <header className="mb-6 flex flex-col gap-2 space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <div className="mr-4">
                                <h2 className="text-lg font-semibold">Gestión de Empleados</h2>
                                <p className="text-sm text-gray-500">
                                    Mostrando {empleados.length} de {totalRecords} empleados
                                </p>
                            </div>
                            <MainForm
                                message_button={"Filtrar"}
                                onSuccess={onSubmit}
                                iconButton={<Filter className="mr-1 h-4 w-4" />}
                                actionType={"search"}
                                dataForm={[
                                    {
                                        name: "search",
                                        type: "SEARCH",
                                        label: "",
                                        icon: <></>,
                                        placeholder: "Busar por nombre, email...",
                                        require: true,
                                    },
                                    {
                                        type: "Flex",
                                        require: false,
                                        elements: [
                                            {
                                                name: "departamento",
                                                type: "SELECT",
                                                label: "",
                                                icon: <></>,
                                                options: [
                                                    { label: "Todos los departamentos", value: "" },
                                                    { label: "Mayoreo Cajas", value: "MAYOREO CAJAS" },
                                                    { label: "Administración", value: "ADMINISTRACION" },
                                                    { label: "Ventas", value: "VENTAS" },
                                                    { label: "Logística", value: "LOGISTICA" },
                                                    { label: "Recursos Humanos", value: "RECURSOS HUMANOS" },
                                                ],
                                                placeholder: "Todos los departamentos",
                                                require: false,
                                            }, {
                                                name: "puesto",
                                                type: "SELECT",
                                                label: "",
                                                icon: <></>,
                                                options: [
                                                    { label: "Todos los puestos", value: "" },
                                                    { label: "Cajera", value: "CAJERA" },
                                                    { label: "Gerente", value: "GERENTE" },
                                                    { label: "Asesor", value: "ASESOR" },
                                                    { label: "Auxiliar", value: "AUXILIAR" },
                                                    { label: "Supervisor", value: "SUPERVISOR" },
                                                ],
                                                placeholder: "Todos los puestos",
                                                require: false,
                                            }, {
                                                name: "estado",
                                                type: "SELECT",
                                                label: "",
                                                icon: <></>,
                                                options: [
                                                    { label: "Todos los estados", value: "" },
                                                    { label: "Activo", value: "Activo" },
                                                    { label: "Inactivo", value: "Inactivo" },
                                                ],
                                                placeholder: "Todos los estados",
                                                require: false,
                                            },
                                        ],
                                    },
                                ]} />
                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={limpiarFiltros}
                                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                                >
                                    Limpiar
                                </button>

                                <button
                                    onClick={handleRefetchAll}
                                    className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                                    title="Actualizar"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={() => handleOpenModal('chat-general')}
                                    className="flex items-center bg-purple-500 text-white text-sm px-3 py-2 rounded-md cursor-pointer hover:bg-purple-600 transition-colors"
                                    title="Chat general"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={() => handleOpenModal('nuevo-empleado')}
                                    className="flex items-center gap-1 bg-green-600 text-white text-sm px-4 py-2 rounded-md cursor-pointer hover:bg-green-700 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nuevo
                                </button>
                            </div>
                        </header>

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