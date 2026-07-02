"use client"
// diferencias entre XML y Movimientos
import {
    Building,
    CheckCircle,
    Copy,
    FileText,
    MessageCircle,
    Plus,
    User,
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"

import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersMutation } from "@/hooks/api/api"

import { LoadingSection } from "@/template/loading-screen"

import Pagination from "@/components/pagination"
import DynamicTable from "@/components/table"
import { Modal } from "@/components/modal"
import MainForm from "@/components/form/main-form"
import { Button } from "@/components/button"
import { DetallesPago } from "./components/detalles-nomina"
import Segment from "@/components/segment"
import { PreNomina } from "./pre-nomina"

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

const allCategories: string[] = ["Checador", "Pre-Nomina"];

export default function Page() {
    const dispatch = useAppDispatch();

    const [selectedCategory, setSelectedCategory] = useState("Checador");
    const [data, setData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersMutation();

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [
            /* {
                Key: "Fecha",
                Value: new Date().getUTCDate(),
                Operator: "="
            } */
        ],
        Selects: [],
        OrderBy: [
            {
                Key: "fecha",
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
                table: "Checador",
                filtros: {
                    Selects: [
                        { Key: "empleado_id" },
                        { Key: "hora_entrada" },
                        { Key: "hora_salida" },
                        { Key: "estado" },
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
                    ID: item.empleado_id,
                    Proveedor: [item.hora_entrada, item.hora_salida],
                    Importe: item.estado,
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
                        Checador
                    </h1>
                    <label className="flex gap-2 w-full content-between">
                        <p className="mt-2 text-gray-600 dark:text-gray-200">
                            Gestion de empleados y sistema de nomina    
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
                {selectedCategory === "Checador" ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
                        <article className="p-4">
                            {/* Filtros y tabla de pagos */}
                            <dt className="relative flex flex-col gap-2">
                                <dl className="flex gap-2 ml-auto">

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
                                        <Button onClick={fetchData} color="success">
                                            Reintentar
                                        </Button>
                                    </div>
                                ) : data && (
                                    <dt className="flex gap-2">
                                        <dl className="w-full my-auto">
                                            <MainForm
                                                message_button={"Registrar"}
                                                iconButton={<CheckCircle className="mr-1 size-4" />}
                                                actionType={"post-general"}
                                                table="Checador"
                                                aditionalData={{
                                                    fecha: new Date(),
                                                    hora_entrada: new Date().toTimeString().split(' ')[0],
                                                    estado:"entrada"
                                                }}
                                                dataForm={[
                                                    {
                                                        name: "empleado_id",
                                                        type: "INPUT",
                                                        label: "ID de empleado",
                                                        icon: <User className="size-4" />,
                                                        placeholder: "Ingresa tu ID...",
                                                        require: true,
                                                    },
                                                    /* {
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
                                                    }, */
                                                ]}
                                            />
                                        </dl>
                                        <dl className="flex flex-col gap-2">
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
                                        </dl>
                                    </dt>
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
                    <PreNomina />
                )}
            </main>
        </>
    );
}