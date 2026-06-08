"use client"
// diferencias entre XML y Movimientos
import {
    Building,
    Clock,
    Filter,
    MessageCircle,
    Plus,
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

export default function Pago() {
    const dispatch = useAppDispatch();
    const [pago, setPago] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersIntelisisMutation();

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [
            {
                Key: "CXP.MOV",
                Value: "Pago",
                Operator: "="
            }, {
                Key: "CXP.Origen",
                Value: "Entrada Compra",
                Operator: "="
            }, {
                Key: "CXP.Estatus",
                Value: "CONCLUIDO",
                Operator: "="
            },
        ],
        Selects: [],
        OrderBy: null,
        sum: false,
        distinct: false
    });

    const fetchPago = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getWithFilter({
                table: "CXP INNER JOIN Prov ON CXP.Proveedor = Prov.Proveedor",// INNER JOIN CXPD ON CXPD.Aplica = 'Entrada Compra' AND CXP.ID = CXPD.ID AND CXP.Estatus = 'CONCLUIDO'
                pageSize: "10",
                page: currentPage,
                filtros: {
                    Selects: [
                        {
                            Key: "CXP.ID",
                        },
                        {
                            Key: "CXP.Proveedor"
                        },
                        {
                            Key: "Prov.Nombre"
                        },
                        {
                            Key: "CXP.Sucursal"
                        },
                        {
                            Key: "CXP.Importe",
                            Alias: "Importe"
                        },
                        {
                            Key: "CXP.Saldo"
                        },
                        {
                            Key: "CXP.Impuestos"
                        },
                        {
                            Key: "CXP.Retencion"
                        },
                        {
                            Key: "CXP.Retencion2"
                        },
                        {
                            Key: "CXP.Retencion3"
                        },
                        {
                            Key: "CXP.FechaEmision"
                        },

                    ],
                    Filtros: activeFilters.Filtros,
                    Order: activeFilters.OrderBy ? [activeFilters.OrderBy] : []
                }
            });

            if ('data' in response) {
                const pagoData = response.data as PagoResponse;
                const formattedData = pagoData.data.map((item) => {
                    console.log(item);
                    
                    return ({
                        ID: item.ID,
                        Sucursal: item.Sucursal,
                        Proveedor: [item.Proveedor, item.Nombre],
                        Importe: [item.Importe, item.Saldo ],
                        Impuestos: item.Impuestos || 0,
                        Retencion:[ item.Retencion, item.Retencion2, item.Retencion3],
                        FechaEmision: item.FechaEmision || "N/A",
                    })
                });
                setPago(formattedData);
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
    }, [currentPage, activeFilters]);

    const [pagoseleccionado, setPagoseleccionado] = useState<any | null>(null);

    const loadPago = (data: FiltrosForm) => {
        const nuevosFiltrosAnd: any[] = [];

        if (data.search) {
            nuevosFiltrosAnd.push({ Key: "email", Value: data.search, Operator: "like" });
        }

        setActiveFilters(prev => ({
            ...prev,
            Filtros: nuevosFiltrosAnd
        })); setCurrentPage(1);
    };

    const limpiarFiltros = () => {
        setActiveFilters(prev => ({ ...prev, Filtros: [] }));
        setCurrentPage(1);
    };

    const handleOpenModal = (modalName: string, pago?: any) => {
        if (modalName === 'detalles-pago' && pago) {
            setPagoseleccionado(pago);
        }
        dispatch(openModalReducer({ modalName }));
    };

    const handleRefetchAll = () => {
        fetchPago();
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
                        <dt className="relative mb-6 flex flex-col gap-4">
                            <MainForm
                                message_button={"Filtrar"}
                                onSuccess={loadPago}
                                iconButton={<Filter className="mr-1 h-4 w-4" />}
                                actionType={"search"}
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
                                                placeholder: "Busar por proveedor, importe, saldo...",
                                                require: true,
                                            },
                                            {
                                                name: "sucursal",
                                                type: "SELECT",
                                                label: "Selecciona la sucursal",
                                                icon: <Building className="size-4" />,
                                                options: [
                                                    { label: "Mayoreo", value: "" },
                                                    { label: "Guadalupe", value: "" },
                                                    { label: "Testerazo", value: "" },
                                                    { label: "Palmas", value: "" },
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
                                <LoadingSection message="Cargando pago..." />
                            ) : error ? (
                                <div className="p-4 text-center">
                                    <p className="text-red-500 mb-2">{error}</p>
                                    <button
                                        onClick={fetchPago}
                                        className="text-green-600 hover:text-green-800 underline"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            ) : pago.length > 0 ? (
                                <dt className="flex flex-col gap-2">
                                    <DynamicTable
                                        data={pago}
                                        onRowClick={(pago) => handleOpenModal('detalles-pago', pago.ID)}
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
                    maxWidth="5xl">
                    {pagoseleccionado ? (
                        <DetallesPago selectedPago={pagoseleccionado} />
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