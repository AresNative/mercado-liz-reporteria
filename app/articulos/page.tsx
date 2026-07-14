"use client"
import {
    Building,
    Clock,
    Copy,
    Edit,
    FileText,
    Filter,
    Image,
    ImageDown,
    MessageCircle,
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
import { Button } from "@/components/button"
import MainForm from "@/components/form/main-form"
import { formatValue } from "@/utils/constants/format-values"
import { ModalDetallesArticulo } from "./components/detalles-articulo";
import { useGetWithFiltersMutation } from "@/hooks/api/api"
import { ModalActualizarArticulo } from "./components/actualizar-articulo"
interface Response {
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
    FiltrosOther: Filtro[];
    Selects: any[];
    OrderBy: any | null;
    sum: boolean;
    distinct: boolean;
}
interface FiltrosForm {
    search: string;
    estatus: string;
    estado: string;
    puesto: string;
}
export default function Page() {
    const dispatch = useAppDispatch();

    const [data, setData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [articuloSeleccionado, setArticuloSeleccionado] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const [getIntWithFilter] = useGetWithFiltersIntelisisMutation();
    const [getWithFilter] = useGetWithFiltersMutation();

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [],
        FiltrosOther: [],
        Selects: [],
        OrderBy: [],
        sum: false,
        distinct: false
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response_int = await getIntWithFilter({
                table: "Art AS art LEFT JOIN ( SELECT Articulo, Unidad, Precio, STRING_AGG(Lista, ', ') AS Listas FROM ListaPreciosDUnidad WHERE Precio > 0 GROUP BY Articulo, Unidad, Precio ) AS lpu ON art.Articulo = lpu.Articulo AND art.Unidad = lpu.Unidad",
                filtros: {
                    Selects: [
                        { key: "art.Articulo" },
                        { key: "art.Descripcion1" },
                        { key: "art.Descripcion2" },
                        { key: "art.NombreCorto" },
                        { key: "art.Grupo" },
                        { key: "art.Categoria" },
                        { key: "art.Familia" },
                        { key: "art.Linea" },
                        { key: "art.Proveedor" },
                        { key: "art.Fabricante" },
                        { key: "art.Unidad" },
                        { key: "art.UnidadCompra" },
                        { key: "art.UnidadTraspaso" },
                        { key: "art.Factor" },
                        { key: "lpu.Precio" },
                        { key: "lpu.Listas" },   /* <--- Campo actualizado (concatenado) */
                        { key: "art.CostoEstandar" },
                        { key: "art.Impuesto1" },
                        { key: "art.TipoImpuesto1" },
                        { key: "art.Impuesto2" },
                        { key: "art.TipoImpuesto2" },
                        { key: "art.Estatus" },
                        { key: "art.SeCompra" },
                        { key: "art.SeVende" },
                        { key: "art.TieneCaducidad" }
                    ],
                    FiltrosAnd: [
                        { Filtros: activeFilters.Filtros, OperadorLogico: "OR" },
                        { Filtros: activeFilters.FiltrosOther, OperadorLogico: "AND" }
                    ],
                    Order: activeFilters.OrderBy ? activeFilters.OrderBy : []
                },
                pageSize,
                page: currentPage,
            });

            if ('data' in response_int) {
                const data = response_int.data as Response;

                const formattedData = await Promise.all(
                    data.data.map(async (item: any) => {
                        const {
                            Articulo,
                            Descripcion1,
                            Descripcion2,
                            NombreCorto,
                            Grupo,
                            Categoria,
                            Familia,
                            Linea,
                            Proveedor,
                            Fabricante,
                            Unidad,
                            UnidadCompra,
                            UnidadTraspaso,
                            Factor,
                            Precio,
                            CostoEstandar,
                            Impuesto1,
                            TipoImpuesto1,
                            Impuesto2,
                            TipoImpuesto2,
                            Estatus,
                            SeCompra,
                            SeVende,
                            TieneCaducidad,
                            SincroID,
                            SincroC,
                            ...rest
                        } = item;

                        // 🔹 CONSULTA 2: Obtener la última imagen del artículo
                        const responseImg = await getWithFilter({
                            table: `imagenes`,
                            filtros: {
                                Selects: [
                                    { key: "imagenes.url" },
                                ],
                                Filtros: [
                                    { Key: "imagenes.id_ref", Operator: "=", Value: Articulo },
                                ],
                                Order: [{ Key: "id", Direction: "DESC" }],
                            },
                            pageSize: 1,
                            page: 1,
                        });

                        let imagenUrl = null;
                        if ('data' in responseImg) {
                            imagenUrl = responseImg.data?.data?.[0]?.url ?? null;
                        }

                        // 🔹 Ahora combinamos: IdRef desde la primera consulta, Imagen/Url desde la segunda
                        const isEmptyValue = (value: any): boolean => {
                            if (value === null || value === undefined) return true;
                            if (Array.isArray(value)) {
                                if (value.length === 0) return true;
                                return value.every(v => v === null || v === undefined || v === '');
                            }
                            if (typeof value === 'string') return value.trim() === '';
                            return false;
                        };

                        const full: Record<string, any> = {
                            Imagen: [
                                imagenUrl ? <p className="flex gap-2 text-green-600 items-center"> <Image className="size-4" /> Con Imagen</p> : <p className="flex gap-2 text-red-600 items-center"> <ImageDown className="size-4" /> Sin Imagen</p>,
                                imagenUrl
                            ],
                            Articulo: [
                                NombreCorto || Descripcion1,
                                Articulo,
                            ].filter(Boolean),
                            Descripcion: [
                                Descripcion1,
                                Descripcion2
                            ].filter(Boolean),
                            Categoria: [
                                Categoria,
                                Grupo,
                                Familia,
                                Linea
                            ].filter(Boolean),
                            Proveedor: [
                                Proveedor,
                                Fabricante
                            ].filter(Boolean),
                            Unidad: [
                                Unidad,
                                ...(Factor && Factor > 1 ? [`x${Factor}`] : []),
                                UnidadCompra ? `Compra: ${UnidadCompra}` : null,
                                UnidadTraspaso ? `Traspaso: ${UnidadTraspaso}` : null
                            ].filter(Boolean),
                            Precio: [
                                Precio ? formatValue(Precio, "currency") : null,
                                TipoImpuesto1 ? `${TipoImpuesto1} ${Impuesto1}%` : null,
                                TipoImpuesto2 ? `${TipoImpuesto2} ${Impuesto2}%` : null
                            ].filter(Boolean),
                            Costo: [
                                CostoEstandar ? formatValue(CostoEstandar, "currency") : null,
                            ].filter(Boolean),
                            Estatus: [
                                Estatus,
                                SeCompra && SeVende ? "Compra y Venta" : SeCompra ? "Solo Compra" : SeVende ? "Solo Venta" : null,
                                TieneCaducidad ? "Con Caducidad" : null
                            ].filter(Boolean),
                            ...rest,
                        };

                        const nonEmptyFull = Object.fromEntries(
                            Object.entries(full).filter(([_, value]) => !isEmptyValue(value))
                        );

                        return nonEmptyFull;
                    })
                );

                setData(formattedData);
                setTotalPages(data.totalPages);
                setTotalRecords(data.totalRecords);
            } else if ('error' in response_int) {
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
        fetchData();
    }, [fetchData]);

    const loadFiltros = (data: FiltrosForm) => {
        const filtrosOr: any[] = [];
        const filtrosOther: any[] = [];

        if (data.search) {
            filtrosOr.push( { Key: "Articulo", Value: data.search, Operator: "like" },);
            filtrosOr.push({ Key: "Descripcion1", Value: data.search, Operator: "like" },);
            filtrosOr.push({ Key: "Descripcion2", Value: data.search, Operator: "like" },);
        }

        if (data.estatus) {
            filtrosOther.push({ Key: "estatus", Value: data.estatus, Operator: "=" });
        }

        setCurrentPage(1);
        setActiveFilters(prev => ({
            ...prev,
            Filtros: filtrosOr,
            FiltrosOther: filtrosOther
        }));
    };

    const limpiarFiltros = () => {
        setActiveFilters(prev => ({ ...prev, Filtros: [] }));
        setCurrentPage(1);
    };

    const handleOpenModal = (modalName: string, pago?: any) => {
        dispatch(openModalReducer({ modalName }));
    };

    const handleRefetchAll = () => {
        fetchData();
    };

    return (
        <>
            <Header />
            <main className="min-h-screen mx-auto p-4 md:p-6 text-gray-900">
                <header className="mb-8">
                    <h1 className="flex items-center text-2xl font-bold md:text-3xl dark:text-white">
                        Articulos de intelisis
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-100 dark:dark:text-gray-300">
                        Gestion masiva de articulos    
                    </p>
                </header>

                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                    <article className="p-4">
                        <span className="mr-4 flex justify-between">
                                <label>
                                    <h2 className="text-lg font-semibold dark:text-white">Gestión de articulos</h2>
                                <p className="text-sm text-gray-500 dark:dark:text-gray-300">
                                    Mostrando {data.length} de {totalRecords} articulos
                                    </p>
                                </label>
                        </span>
                        <dt className="relative flex flex-col gap-2">
                            <MainForm
                                message_button={"Filtrar"}
                                onSuccess={loadFiltros}
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
                                                placeholder: "Busar por nombre, articulo...",
                                                require: true,
                                            },
                                            {
                                                name: "estatus",
                                                type: "SELECT",
                                                label: "Selecciona la estatus",
                                                icon: <Building className="size-4" />,
                                                options: [
                                                    { label: "Alta", value: "ALTA" },
                                                    { label: "Descontinuado", value: "DESCONTINUADO" },
                                                    { label: "Bloquado", value: "BLOQUEADO" },
                                                ],
                                                placeholder: "Todas los estatus",
                                                require: false,
                                            },
                                        ],
                                    },
                                ]} />
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
                                        onClick={fetchData}
                                        color="success"
                                    >
                                        Reintentar
                                    </Button>
                                </div>
                            ) : data.length > 0 ? (
                                <dt className="flex flex-col gap-2">
                                    <DynamicTable
                                        data={data}
                                        contextMenuItems={(row, selected) => {
                                            const targetRows = selected || [row];
                                            return[
                                                {
                                                    label: 'Copiar',
                                                    icon: <Copy size={16} />,
                                                    onClick: () => navigator.clipboard.writeText(row.Articulo?.[1] || ''),
                                                },
                                                {
                                                    label: 'Ver detalles',
                                                    icon: <FileText size={16} />,
                                                    onClick: () => {
                                                        setArticuloSeleccionado(row);
                                                        dispatch(openModalReducer({ modalName: 'detalles-articulo' }));
                                                    },
                                                },
                                                {
                                                    label: 'Editar',
                                                    icon: <Edit size={16} />,
                                                    onClick: () => {
                                                        setArticuloSeleccionado(targetRows);
                                                        dispatch(openModalReducer({ modalName: 'actualizar-articulo' }));
                                                    },/*  targetRows.map(r => console.log(r)), */
                                                },
                                            ]
                                        }}
                                        onRowClick={(row) => {
                                            setArticuloSeleccionado(row);
                                            dispatch(openModalReducer({ modalName: 'detalles-articulo' }));
                                        }}
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
                    modalName="detalles-articulo"
                    title="Detalles del Artículo"
                    maxWidth="4xl"
                >
                    <ModalDetallesArticulo selectedArticulo={articuloSeleccionado} refetch={()=> fetchData()} />
                </Modal>
                <Modal
                    modalName="actualizar-articulo"
                    title="Actualizar Artículo"
                    maxWidth="4xl"
                >
                    <ModalActualizarArticulo selectedArticulo={articuloSeleccionado} refetch={()=> fetchData()} />
                </Modal>
            </main>
            <Footer />
        </>
    )
}