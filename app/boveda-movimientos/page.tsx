"use client"
// diferencias entre XML y Movimientos
import {
    Filter,
    MessageCircle,
    Plus,
    RefreshCw
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"

import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersIntelisisMutation } from "@/hooks/api/api_int"

import { LoadingSection } from "@/template/loading-screen"

import Pagination from "@/components/pagination"
import DynamicTable from "@/components/table"
import { Modal } from "@/components/modal"
import { BentoGrid, BentoItem } from "@/components/bento-grid"
import Footer from "@/template/footer"
import Header from "@/template/header"
import MainForm from "@/components/form/main-form"
import { Button } from "@/components/button"
import { DetallesPago } from "./components/detalles-pago"

interface PagoResponse {
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
// Hook personalizado para la gestión de pago
const usePago = () => {
    const [pago, setPago] = useState<any[]>([]);
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

    const fetchPago = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        console.log(activeFilters);

        try {
            const response = await getWithFilter({
                table: "CXPD INNER JOIN CXP ON CXPD.Aplica = 'Entrada Compra' AND CXP.ID = CXPD.ID",
                pageSize: "10",
                page: currentPage,
                filtros: {
                    Selects: [
                        {
                            Key: "CXP.ID",
                        },
                        {
                            Key: "CXPD.ID",
                            Alias: "ID Relacion",
                        },
                        {
                            Key: "CXPD.Importe"
                        },

                    ],
                    Filtros: activeFilters.Filtros,
                    FiltrosAnd: activeFilters.FiltrosAnd,
                    Order: activeFilters.OrderBy ? [activeFilters.OrderBy] : []
                }
            });

            if ('data' in response) {
                const pagoData = response.data as PagoResponse;
                setPago(pagoData.data);
                setTotalPages(pagoData.totalPages);
                setTotalRecords(pagoData.totalRecords);
            } else if ('error' in response) {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (err) {
            console.error("Error fetching pago:", err);
            setError("No se pudieron cargar los pago. Intente nuevamente.");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activeFilters, setActiveFilters]);

    useEffect(() => {
        fetchPago();
    }, []);

    return {
        pago,
        currentPage,
        totalPages,
        totalRecords,
        isLoading,
        error,
        setCurrentPage,
        setActiveFilters,
        refetch: fetchPago
    };
};

export default function Pago() {
    const dispatch = useAppDispatch();
    const {
        pago,
        currentPage,
        totalPages,
        totalRecords,
        isLoading,
        error,
        setCurrentPage,
        setActiveFilters,
        refetch
    } = usePago();

    const [pagoeleccionado, setPagoeleccionado] = useState<any | null>(null);

    const loadPago = (data: FiltrosForm) => {
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
        })); setCurrentPage(1);
    };

    const limpiarFiltros = () => {
        setActiveFilters(prev => ({ ...prev, Filtros: [] }));
        setCurrentPage(1);
    };

    const handleOpenModal = (modalName: string, empleado?: any) => {
        if (modalName === 'detalles-empleado' && empleado) {
            setPagoeleccionado(empleado);
        }
        dispatch(openModalReducer({ modalName }));
    };

    const handleRefetchAll = () => {
        refetch();
        /*  refetchEstadisticas(); */
    };

    return (
        <>
            <Header />
            <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
                <header className="mb-8">
                    <h1 className="flex items-center text-2xl font-bold md:text-3xl">
                        Boveda de pagos
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-100">
                        Gestiona y visualiza todos los pagos realizados, con detalles completos de cada transacción. Utiliza los filtros para encontrar rápidamente la información que necesitas.
                    </p>
                </header>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <article className="p-4">
                            <span className="mr-4">
                                <h2 className="text-lg font-semibold">Gestión de Pagos</h2>
                                <p className="text-sm text-gray-500">
                                    Mostrando {pago.length} de {totalRecords} pagos
                                </p>
                            </span>
                        <dt className="mb-6 flex flex-col gap-2 space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <MainForm
                                message_button={"Filtrar"}
                                onSuccess={loadPago}
                                iconButton={<Filter className="mr-1 h-4 w-4" />}
                                actionType={"search"}
                                flexDirection="flex-col"
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
                            <dl className="flex flex-col items-center gap-4">
                                <Button
                                    onClick={limpiarFiltros}
                                    color="success"
                                    size="small"
                                >
                                    Limpiar
                                </Button>

                                <Button
                                    onClick={handleRefetchAll}
                                    color="success"
                                    size="small"
                                >
                                    Actualizar <RefreshCw className="h-4 w-4" />
                                </Button>

                                <Button
                                    onClick={() => handleOpenModal('chat-general')}
                                    color="info"
                                    size="small"
                                >
                                    Chat <MessageCircle className="size-4" />
                                </Button>
                            </dl>
                        </dt>

                        <section className="overflow-x-auto">
                            {isLoading ? (
                                <LoadingSection message="Cargando pago..." />
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
                            ) : pago.length > 0 ? (
                                <dt className="flex flex-col gap-2">
                                    <DynamicTable
                                        data={pago}
                                        onRowClick={(pago) => handleOpenModal('detalles-pago', pago)}
                                    />
                                    <Pagination
                                        currentPage={currentPage}
                                        loading={isLoading}
                                        setCurrentPage={setCurrentPage}
                                        totalPages={totalPages}
                                    />
                                </dt>
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-gray-500 mb-4">No se encontraron pago con los filtros aplicados.</p>
                                    <button
                                        onClick={limpiarFiltros}
                                        className="text-green-600 hover:text-green-800 underline"
                                    >
                                        Ver todos los pago
                                    </button>
                                </div>
                            )}
                        </section>
                    </article>
                </div>

                {/* Modales */}
                <Modal
                    modalName="detalles-pago"
                    title="Detalles del Pago"
                    maxWidth="lg">
                    {pagoeleccionado ? (
                        <DetallesPago selectedPago={pagoeleccionado} />
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-gray-500">No se ha seleccionado ningún pago.</p>
                        </div>
                    )}
               </Modal>
                <Modal
                    modalName="nuevo-pago"
                    title="Agregar Nuevo Pago"
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