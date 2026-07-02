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
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"

import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersIntelisisMutation } from "@/hooks/api/api_int"

import { LoadingSection } from "@/template/loading-screen"

import Pagination from "@/components/pagination"
import DynamicTable from "@/components/table"
import { Modal } from "@/components/modal"
import Footer from "@/template/footer"
import Header from "@/template/header"
import MainForm from "@/components/form/main-form"
import { Button } from "@/components/button"
import { DetallesPago } from "./components/detalles-pago"
import Segment from "@/components/segment"
import { TransferenciaContent } from "./transferencia-page" // <-- import del contenido reutilizable

interface PagoItem {
    ID: number;
    OrigenID: number;
    Proveedor: number;
    Nombre: string;
    Sucursal: string;
    Importe: number;
    Saldo: number;
    Impuestos: number;
    IVAFiscal: number;
    IEPSFiscal: number;
    FechaEmision: string;
}

interface PagoResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: PagoItem[];
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
    sucursal: string;
    date: string;
}

const allCategories: string[] = ["Pagos", "Transferencias"];

export default function Page() {
    const dispatch = useAppDispatch();

    const [selectedCategory, setSelectedCategory] = useState("Pagos");
    const [data, setData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize, setPageSize] = useState(10);
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
        OrderBy: [
            {
                Key: "CXP.FechaEmision",
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
                table: "CXP INNER JOIN Prov ON CXP.Proveedor = Prov.Proveedor INNER JOIN (SELECT DISTINCT ID FROM CXPD) AS CXPD_Unico ON CXP.ID = CXPD_Unico.ID INNER JOIN COMPRA ON COMPRA.Mov = CXP.Origen AND CXP.OrigenID = COMPRA.MovID",
                filtros: {
                    Selects: [
                        { Key: "CXP.ID" },
                        { Key: "CXP.OrigenID" },
                        { Key: "CXP.Proveedor" },
                        { Key: "Prov.Nombre" },
                        { Key: "CXP.Sucursal" },
                        { Key: "CXP.Importe", Alias: "Importe" },
                        { Key: "CXP.Saldo" },
                        { Key: "CXP.Impuestos" },
                        { Key: "CXP.IVAFiscal" },
                        { Key: "CXP.IEPSFiscal" },
                        { Key: "CXP.FechaEmision" },
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
                    ID: [item.ID, item.OrigenID],
                    Sucursal: item.Sucursal,
                    Proveedor: [item.Proveedor, item.Nombre],
                    Importe: [item.Importe, item.Saldo],
                    Impuestos: item.Impuestos,
                    IVAFiscal: item.IVAFiscal && (item.Importe / (item.IVAFiscal * 100)),
                    IEPSFiscal: item.IEPSFiscal && (item.Importe / (item.IEPSFiscal * 100)),
                    FechaEmision: item.FechaEmision || "N/A",
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
            nuevosFiltrosAnd.push({ Key: "CXP.Proveedor", Value: data.search, Operator: "LIKE" });
            nuevosFiltrosAnd.push({ Key: "Prov.Nombre", Value: data.search, Operator: "LIKE" });
            const searchStr = data.search.toString().trim();
            if (/^\d+$/.test(searchStr)) {
                nuevosFiltrosAnd.push({ Key: "CXP.ID", Value: searchStr, Operator: "=" });
                nuevosFiltrosAnd.push({ Key: "Importe", Value: searchStr, Operator: "=" });
            }
        }
        if (data.sucursal) nuevosFiltrosAnd.push({ Key: "CXP.Sucursal", Value: data.sucursal, Operator: "LIKE" });
        if (data.date) {
            nuevosFiltrosAnd.push({
                Key: "FechaEmision",
                Value: data.date,
                Operator: data.date.includes("AND") ? "BETWEEN" : "="
            });
        }

        setCurrentPage(1);
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
        if (modalName === 'detalles-pago' && pago) {
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
            <main className="min-h-screen mx-auto p-4 md:p-6 text-gray-900">
                <header className="mb-8">
                    <h1 className="flex items-center text-2xl font-bold md:text-3xl dark:text-white">
                        Boveda de pagos
                    </h1>
                    <label className="flex gap-2 content-between">
                        <p className="mt-2 text-gray-600 dark:text-gray-200">
                            Gestiona y visualiza todos los pagos realizados, con detalles completos de cada transacción. Utiliza los filtros para encontrar rápidamente la información que necesitas.
                        </p>
                        <p className="flex items-center gap-2 dark:text-gray-200">
                            Seccion:
                            <Segment
                                items={allCategories.map((cat) => ({ value: cat, label: cat }))}
                                value={selectedCategory}
                                onValueChange={setSelectedCategory}
                            />
                        </p>
                    </label>
                </header>

                {/* Contenido condicional */}
                {selectedCategory === "Pagos" ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
                        <article className="p-4">
                            <span className="mr-4 flex justify-between">
                                <label>
                                    <h2 className="text-lg font-semibold dark:text-white">Gestión de Pagos</h2>
                                    <p className="text-sm text-gray-500">
                                        Mostrando {data.length} de {totalRecords} pagos
                                    </p>
                                </label>
                            
                            </span>
                                    {/* Filtros y tabla de pagos */}
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
                                            ]}
                                        />
                                        <dl className="flex gap-2 ml-auto">
                                            <Button
                                                onClick={() => handleOpenModal('nuevo-pago')}
                                                color="success"
                                            >
                                                Nuevo pago <Plus className="size-4" />
                                            </Button>

                                            <Button
                                                onClick={() => handleOpenModal('chat-general')}
                                                color="info"
                                            >
                                                Chat <MessageCircle className="size-4" />
                                            </Button>

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
                                                <Button onClick={fetchData} color="success">
                                                    Reintentar
                                                </Button>
                                            </div>
                                        ) : data.length > 0 ? (
                                            <dt className="flex flex-col gap-2">
                                                <DynamicTable
                                                    data={data}
                                                    onRowClick={(data) => handleOpenModal('detalles-pago', data.ID[0])}
                                                    contextMenuItems={(row) => [
                                                        {
                                                            label: 'Copiar',
                                                            icon: <Copy size={16} />,
                                                            onClick: () => handleCopyId(row.ID[0]),
                                                        },
                                                        {
                                                            label: 'Ver detalles',
                                                            icon: <FileText size={16} />,
                                                            onClick: () => handleOpenModal('detalles-pago', row.ID[0]),
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

                                    {/* Modales exclusivos de pagos */}
                                    <Modal
                                        modalName="detalles-pago"
                                        title="Detalles del Pago"
                                        maxWidth="5xl"
                                    >
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
                        </article>
                    </div>
                ) : (
                    <TransferenciaContent />
                )}
            </main>
        </>
    );
}