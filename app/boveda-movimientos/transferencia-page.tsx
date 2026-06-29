"use client"
// diferencias entre XML y Movimientos
import {
    Clock,
    Copy,
    DollarSign,
    FileText,
    Filter,
    LucideFileText,
    MessageCircle,
    Plus,
    RefreshCw,
    Search,
    User
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"

import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersMutation } from "@/hooks/api/api"

import { LoadingSection } from "@/template/loading-screen"

import Pagination from "@/components/pagination"
import DynamicTable from "@/components/table"
import { Modal } from "@/components/modal"
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
    search: any;
    sucursal: string;
    date: string;
}

export function TransferenciaContent() {
    const dispatch = useAppDispatch();

    const [data, setData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersMutation();

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [],
        Selects: [],
        OrderBy: [
            {
                Key: "Fecha",
                Direction: "DESC"
            }
        ],
        sum: false,
        distinct: false
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getWithFilter({
                table: "pagos INNER JOIN proveedores as prov ON prov.id = pagos.proveedor_id",
                filtros: {
                    Selects: [
                        { Key: "pagos.id" },
                        { Key: "prov.clave", Alias: "Proveedor" },
                        { Key: "prov.nombre", Alias: "Nombre" },
                        { Key: "monto" },
                        { Key: "fecha" },
                        { Key: "metodo_pago" },
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
                const formattedData = pagoData.data.map((item) => ({
                    ID: item.id,
                    FechaEmision: item.Fecha || "N/A",
                    Proveedor: [item.proveedor_id, item.Nombre],
                    Monto: item.monto,
                    'Metodo Pago': item.metodo_pago,
                }));
                setData(formattedData);
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
    }, [currentPage, activeFilters, pageSize, getWithFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const [pagoseleccionado, setPagoseleccionado] = useState<any | null>(null);

    const loadPago = (data: FiltrosForm) => {
        const nuevosFiltrosAnd: any[] = [];

        if (data.search) {
            nuevosFiltrosAnd.push({ Key: "Proveedor", Value: data.search, Operator: "LIKE" });
            nuevosFiltrosAnd.push({ Key: "Nombre", Value: data.search, Operator: "LIKE" });
            const searchStr = data.search.toString().trim();
            if (/^\d+$/.test(searchStr)) {
                nuevosFiltrosAnd.push({ Key: "ID", Value: searchStr, Operator: "=" });
                nuevosFiltrosAnd.push({ Key: "Monto", Value: searchStr, Operator: "=" });
            }
        }
        if (data.date) {
            nuevosFiltrosAnd.push({
                Key: "FechaEmision",
                Value: data.date,
                Operator: data.date.includes("AND") ? "BETWEEN" : "="
            });
        }

        setCurrentPage(1); // <-- reinicia la página al filtrar
        setActiveFilters(prev => ({
            ...prev,
            Filtros: nuevosFiltrosAnd
        }));
    };

    const limpiarFiltros = () => {
        setActiveFilters(prev => ({ ...prev, Filtros: [] }));
        setCurrentPage(1);
    };

    const handleOpenModal = (modalName: string, pago?: any) => {
        if (modalName === 'detalles-transferencia' && pago) {
            setPagoseleccionado(pago);
        }
        dispatch(openModalReducer({ modalName }));
    };

    const handleRefetchAll = () => {
        fetchData();
    };

    const handleCopyId = async (id: number) => {
        try {
            await navigator.clipboard.writeText(String(id));
        } catch (err) {
            console.error("No se pudo copiar al portapapeles:", err);
        }
    };

    return (
        <>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
                <article className="p-4">
                    <span className="mr-4 flex justify-between">
                        <label>
                            <h2 className="text-lg font-semibold dark:text-white">Gestión de Transferencias</h2>
                            <p className="text-sm text-gray-500">
                                Mostrando {data.length} de {totalRecords} transferencias
                            </p>
                        </label>
                    </span>
                    <dt className="relative flex flex-col gap-2">
                        <MainForm
                            message_button={"Filtrar"}
                            onSuccess={loadPago}
                            iconButton={<Filter className="mr-1 size-4" />}
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
                                            placeholder: "Buscar por proveedor, importe, ID...",
                                            require: true,
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
                            ]}
                        />
                        <dl className="flex gap-2 ml-auto">
                            <Button
                                onClick={() => handleOpenModal('chat-transferencia')}
                                color="info"
                            >
                                Chat <MessageCircle className="size-4" />
                            </Button>

                            <Button
                                onClick={() => handleOpenModal('nueva-transferencia')}
                                color="success"
                            >
                                Nueva transferencia <Plus className="size-4" />
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
                            <LoadingSection message="Cargando transferencias..." />
                        ) : error ? (
                            <div className="p-4 text-center">
                                <p className="text-red-500 mb-2">{error}</p>
                                <Button onClick={fetchData} color="success">
                                    Reintentar
                                </Button>
                            </div>
                        ) : data.length > 0 ? (
                            <dt className="flex flex-col gap-2">
                                <DynamicTable
                                    data={data}
                                    onRowClick={(data) => handleOpenModal('detalles-transferencia', data.ID)}
                                    contextMenuItems={(row) => [
                                        {
                                            label: 'Copiar',
                                            icon: <Copy size={16} />,
                                            onClick: () => handleCopyId(row.ID),
                                        },
                                        {
                                            label: 'Ver detalles',
                                            icon: <FileText size={16} />,
                                            onClick: () => handleOpenModal('detalles-transferencia', row.ID),
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
                                <p className="text-gray-500 mb-4">No se encontraron transferencias con los filtros aplicados.</p>
                                <button
                                    onClick={limpiarFiltros}
                                    className="text-green-600 hover:text-green-800 underline"
                                >
                                    Ver todas las transferencias
                                </button>
                            </div>
                        )}
                    </section>
                </article>
            </div>

            {/* Modales con nombres únicos para transferencias */}
            <Modal
                modalName="detalles-transferencia"
                title="Detalles de la Transferencia"
                maxWidth="5xl"
            >
                {pagoseleccionado ? (
                    <DetallesPago selectedPago={pagoseleccionado} />
                ) : (
                    <div className="p-4 text-center">
                        <p className="text-gray-500">No se ha seleccionado ninguna transferencia.</p>
                    </div>
                )}
            </Modal>

            <Modal
                modalName="nueva-transferencia"
                title="Agregar nueva transferencia"
                maxWidth="2xl"
            >
                <MainForm
                    message_button={"Registrar"}
                    onSuccess={fetchData} // <-- ahora refresca la tabla al registrar
                    iconButton={<Plus className="size-4" />}
                    actionType={"post-general"}
                    table="pagos"
                    dataForm={[
                        {
                            type: "Flex",
                            require: false,
                            elements: [
                                {
                                    name: "proveedor_id",
                                    type: "SEARCH",
                                    label: "Proveedor",
                                    icon: <User className="size-4" />,
                                    placeholder: "PR-0000000",
                                    options: [{ value: "", label: "" }],
                                    require: true,
                                },
                                {
                                    name: "monto",
                                    type: "NUMBER",
                                    label: "Monto de pago",
                                    icon: <DollarSign className="size-4" />,
                                    placeholder: "$0,000.00",
                                    minLength: 0,
                                    require: true,
                                },
                            ],
                        },
                        {
                            name: "file",
                            type: "FILE",
                            label: "Documento",
                            icon: <LucideFileText className="size-4" />,
                            require: false,
                        },
                    ]}
                />
            </Modal>

            <Modal
                modalName="chat-transferencia"
                title="Chat General"
                maxWidth="xl"
            >
                <></>
            </Modal>
        </>
    );
}

// Página completa para el rol "pagos"
export default function Transferencia() {
    return (
        <>
            <main className="min-h-screen mx-auto p-4 md:p-6 text-gray-900 dark:text-white">
                <header className="mb-8">
                    <h1 className="flex items-center text-2xl font-bold md:text-3xl">
                        Boveda de transferencias
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-100">
                        Gestiona y visualiza todas las transferencias realizadas, con detalles completos de cada transacción. Utiliza los filtros para encontrar rápidamente la información que necesitas.
                    </p>
                </header>
                <TransferenciaContent />
            </main>
        </>
    );
}