"use client"
// diferencias entre XML y Movimientos
import {
    Building,
    Clock,
    Copy,
    FileText,
    Filter,
    MessageCircle,
    Plus,
    RefreshCw,
    Search,
    Share2,
    Trash2
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
import Segment from "@/components/segment"

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
    search: any;
    sucursal: string;
    date: string;
}
const allCategories:any = ["Pagos", "Transferencias"]
export default function Pago() {
    const dispatch = useAppDispatch();

    const [selectedCategory, setSelectedCategory] = useState("Pagos");

    const [pago, setPago] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersIntelisisMutation();

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [],
        Selects: [],
        OrderBy: [{
            Key: "ID",
            Direction: "DESC"
        }],
        sum: false,
        distinct: false
    });

    const fetchPago = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getWithFilter({
                table: "POSJobErrores",
                filtros: {
                    Selects: [
                        
                    ],
                    FiltrosAnd: [{
                        Filtros: activeFilters.Filtros,
                        OperadorLogico: "OR"
                    }],
                    Order: activeFilters.OrderBy ? activeFilters.OrderBy : []
                },
                pageSize: pageSize,
                page: currentPage,
            });

            if ('data' in response) {
                const pagoData = response.data as PagoResponse;
                const formattedData = pagoData.data;
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
    }, [currentPage, activeFilters, setActiveFilters, pageSize]);

    useEffect(() => {
        fetchPago();
    }, [currentPage, activeFilters, pageSize]);

    const [pagoseleccionado, setPagoseleccionado] = useState<any | null>(null);

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
                        Errores de intelisis
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-100">
                        Visor de errores intelisis    
                    </p>
                </header>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <article className="p-4">
                        <span className="mr-4 flex justify-between">
                                <label>
                                    <h2 className="text-lg font-semibold">Gestión de Errores</h2>
                                    <p className="text-sm text-gray-500">
                                        Mostrando {pago.length} de {totalRecords} errores
                                    </p>
                                </label>
                        </span>
                        <dt className="relative flex flex-col gap-2">
                            <dl className="flex gap-2 ml-auto">
                                <Button
                                    onClick={() => handleOpenModal('chat-general')}
                                    color="info"
                                >
                                    Chat <MessageCircle className="size-4" />
                                </Button>

                                <Button
                                    onClick={handleRefetchAll}
                                    color="success"
                                >
                                    Actualizar <RefreshCw className="size-4" />
                                </Button>
                            </dl>
                        </dt>

                        <section className="overflow-x-auto">
                            {isLoading ? (
                                <LoadingSection message="Cargando pago..." />
                            ) : error ? (
                                <div className="p-4 text-center">
                                    <p className="text-red-500 mb-2">{error}</p>
                                    <Button
                                        onClick={fetchPago}
                                        color="success"
                                    >
                                        Reintentar
                                    </Button>
                                </div>
                            ) : pago.length > 0 ? (
                                <dt className="flex flex-col gap-2">
                                    <DynamicTable
                                        data={pago}
                                        onRowClick={(pago) => handleOpenModal('detalles-pago', pago.ID[0])}
                                        contextMenuItems={(row) => [
                                                {
                                                    label: 'Copiar',
                                                    icon: <Copy size={16} />,
                                                    onClick: () => console.log('Copiado'),
                                                },
                                                {
                                                    label: 'Ver detalles',
                                                    icon: <FileText size={16} />,
                                                    onClick: () => console.log('Mostrar detalles'),
                                                },
                                            ]}
                                    />
                                    <Pagination
                                        currentPage={currentPage}
                                        loading={isLoading}
                                        setCurrentPage={setCurrentPage}
                                        currentPageSize={pageSize}
                                        onPageSizeChange={setPageSize}
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
                        <></>
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