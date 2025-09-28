// app/articulos/page.tsx
"use client"

import {
    Filter,
    Search,
    Plus,
    RefreshCw,
    Image,
    Package
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"

import { openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { useGetWithFiltersGeneralMutation, usePostMutation } from "@/hooks/reducers/api"

import { LoadingSection } from "@/template/loading-screen"
import { useForm } from "react-hook-form"

import Pagination from "@/components/pagination"
import DynamicTable from "@/components/table"
import { Modal } from "@/components/modal"
import { BentoGrid, BentoItem } from "@/components/bento-grid"
import { ModalDetallesArticulo } from "./components/detalles-articulo"
import MainForm from "@/components/form/main-form"
import { Field } from "@/utils/types/interfaces"

// Definir interfaces
interface Articulo {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    categoria: string;
    precio_compra: number;
    precio_venta: number;
    stock: number;
    stock_minimo: number;
    unidad_medida: string;
    marca: string;
    modelo: string;
    estado: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

interface ArticulosResponse {
    totalRecords: number;
    totalPages: number;
    pageSize: number;
    page: number;
    data: Articulo[];
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
    categoria: string;
    estado: string;
    marca: string;
}

interface EstadisticasArticulos {
    totalRecords: number;
    articulosActivos: number;
    articulosInactivos: number;
    stockBajo: number;
    topCategorias: [string, number][];
}

// Componente para el formulario de filtros
const FiltrosArticulos = ({ onSubmit, register }: {
    onSubmit: () => void;
    register: any;
}) => {
    return (
        <form onSubmit={onSubmit} className="w-full">
            <div className="hidden md:flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        {...register("search")}
                        placeholder="Buscar por código, nombre..."
                        className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                </div>

                {/* <select
                    {...register("categoria")}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 min-w-[180px]"
                >
                    <option value="">Todas las categorías</option>
                    <option value="ELECTRONICA">Electrónica</option>
                    <option value="HOGAR">Hogar</option>
                    <option value="OFICINA">Oficina</option>
                    <option value="DEPORTES">Deportes</option>
                    <option value="ROPA">Ropa</option>
                </select>

                <select
                    {...register("marca")}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 min-w-[150px]"
                >
                    <option value="">Todas las marcas</option>
                    <option value="SONY">Sony</option>
                    <option value="SAMSUNG">Samsung</option>
                    <option value="LG">LG</option>
                    <option value="APPLE">Apple</option>
                    <option value="GENERICO">Genérico</option>
                </select>

                <select
                    {...register("estado")}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 min-w-[140px]"
                >
                    <option value="">Todos los estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                </select> */}

                <button type="submit" className="flex w-20 text-center items-center rounded-md px-3 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors whitespace-nowrap">
                    <Filter className="mr-1 h-4 w-4" />
                    Filtrar
                </button>
            </div>

            {/* Versión móvil */}
            <div className="md:hidden space-y-3">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        {...register("search")}
                        placeholder="Buscar por código, nombre..."
                        className="w-full rounded-md border border-gray-300 pl-8 pr-4 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <select
                        {...register("categoria")}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    >
                        <option value="">Todas categorías</option>
                        <option value="ELECTRONICA">Electrónica</option>
                        <option value="HOGAR">Hogar</option>
                        <option value="OFICINA">Oficina</option>
                    </select>

                    <select
                        {...register("marca")}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    >
                        <option value="">Todas marcas</option>
                        <option value="SONY">Sony</option>
                        <option value="SAMSUNG">Samsung</option>
                        <option value="LG">LG</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <select
                        {...register("estado")}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    >
                        <option value="">Todos estados</option>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                    </select>

                    <button type="submit" className="flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors">
                        <Filter className="mr-1 h-4 w-4" />
                        Filtrar
                    </button>
                </div>
            </div>
        </form>
    );
};

// Hook personalizado para la gestión de artículos
const useArticulos = () => {
    const [articulos, setArticulos] = useState<Articulo[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersGeneralMutation();

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [],
        Selects: [],
        OrderBy: null,
        sum: false,
        distinct: false
    });

    const fetchArticulos = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getWithFilter({
                table: "articulos",
                pageSize: "10",
                page: currentPage,
                filtros: {
                    Filtros: activeFilters.Filtros,
                    Selects: activeFilters.Selects,
                    Order: activeFilters.OrderBy ? [activeFilters.OrderBy] : []
                }
            });

            if ('data' in response) {
                const articulosData = response.data as ArticulosResponse;
                setArticulos(articulosData.data);
                setTotalPages(articulosData.totalPages);
                setTotalRecords(articulosData.totalRecords);
            } else if ('error' in response) {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (err) {
            console.error("Error fetching articulos:", err);
            setError("No se pudieron cargar los artículos. Intente nuevamente.");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activeFilters, getWithFilter]);

    useEffect(() => {
        fetchArticulos();
    }, [fetchArticulos]);

    return {
        articulos,
        currentPage,
        totalPages,
        totalRecords,
        isLoading,
        error,
        setCurrentPage,
        setActiveFilters,
        refetch: fetchArticulos
    };
};

// Hook para estadísticas
const useEstadisticasArticulos = () => {
    const [estadisticas, setEstadisticas] = useState<EstadisticasArticulos | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [getWithFilter] = useGetWithFiltersGeneralMutation();

    const fetchEstadisticas = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getWithFilter({
                table: "articulos",
                pageSize: "10000",
                page: 1,
                filtros: {
                    Filtros: [],
                    Selects: [],
                    Order: []
                }
            });

            if ('data' in response) {
                const articulosData = response.data as ArticulosResponse;
                const todosArticulos = articulosData.data;

                const articulosActivos = todosArticulos.filter(a => a.estado === "Activo").length;
                const articulosInactivos = todosArticulos.filter(a => a.estado === "Inactivo").length;
                const stockBajo = todosArticulos.filter(a => a.stock <= a.stock_minimo).length;

                const porCategoria = todosArticulos.reduce((acc, art) => {
                    acc[art.categoria] = (acc[art.categoria] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const topCategorias = Object.entries(porCategoria)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4);

                setEstadisticas({
                    totalRecords: articulosData.totalRecords,
                    articulosActivos,
                    articulosInactivos,
                    stockBajo,
                    topCategorias
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

// Componente para estadísticas
const EstadisticasArticulos = ({ estadisticas }: { estadisticas: EstadisticasArticulos }) => {
    return (
        <BentoGrid cols={4} className="mb-6">
            <BentoItem
                title="Total de Artículos"
                description="Artículos en el sistema"
                className="bg-blue-50 border-blue-200"
            >
                <div className="text-3xl font-bold text-blue-600">{estadisticas.totalRecords}</div>
            </BentoItem>

            <BentoItem
                title="Artículos Activos"
                description="Disponibles para venta"
                className="bg-green-50 border-green-200"
            >
                <div className="text-3xl font-bold text-green-600">{estadisticas.articulosActivos}</div>
            </BentoItem>

            <BentoItem
                title="Stock Bajo"
                description="Necesitan reposición"
                className="bg-yellow-50 border-yellow-200"
            >
                <div className="text-3xl font-bold text-yellow-600">{estadisticas.stockBajo}</div>
            </BentoItem>

            <BentoItem
                title="Top Categorías"
                description="Con más artículos"
                className="bg-purple-50 border-purple-200"
            >
                <div className="space-y-1">
                    {estadisticas.topCategorias.map(([categoria, count]) => (
                        <div key={categoria} className="flex justify-between text-sm">
                            <span className="capitalize">{categoria.toLowerCase()}:</span>
                            <span className="font-medium">{count}</span>
                        </div>
                    ))}
                </div>
            </BentoItem>
        </BentoGrid>
    );
};

// Configuración de columnas para la tabla
const articulosTableColumns = [
    { key: "codigo", header: "Código" },
    { key: "nombre", header: "Nombre" },
    { key: "categoria", header: "Categoría" },
    { key: "marca", header: "Marca" },
    {
        key: "precio_venta",
        header: "Precio Venta",
        transform: (value: number) => new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(value)
    },
    { key: "stock", header: "Stock" },
    {
        key: "estado",
        header: "Estado",
        transform: (value: string) => (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                {value}
            </span>
        )
    }
];

// Configuración del formulario para artículos
const articuloFormConfig: Field[] = [
    {
        type: "H1",
        label: "Información Básica del Artículo",
        require: false
    },
    {
        type: "Flex",
        require: true,
        elements: [
            {
                type: "INPUT",
                name: "codigo",
                label: "Código del Artículo",
                placeholder: "ART-001",
                require: true
            },
            {
                type: "INPUT",
                name: "nombre",
                label: "Nombre del Artículo",
                placeholder: "Nombre descriptivo",
                require: true
            }
        ]
    },
    {
        type: "Flex",
        require: true,
        elements: [
            {
                type: "SELECT",
                name: "categoria",
                label: "Categoría",
                options: [
                    { value: "ELECTRONICA", label: "Electrónica" },
                    { value: "HOGAR", label: "Hogar" },
                    { value: "OFICINA", label: "Oficina" },
                    { value: "DEPORTES", label: "Deportes" },
                    { value: "ROPA", label: "Ropa" }
                ],
                require: true
            },
            {
                type: "SELECT",
                name: "unidad_medida",
                label: "Unidad de Medida",
                options: [
                    { value: "PIEZA", label: "Pieza" },
                    { value: "KILO", label: "Kilogramo" },
                    { value: "LITRO", label: "Litro" },
                    { value: "METRO", label: "Metro" },
                    { value: "CAJA", label: "Caja" }
                ],
                require: true
            }
        ]
    },
    {
        type: "TEXT_AREA",
        name: "descripcion",
        label: "Descripción",
        placeholder: "Descripción detallada del artículo...",
        require: false,
    },
    {
        type: "Flex",
        require: false,
        elements: [
            {
                type: "INPUT",
                name: "marca",
                label: "Marca",
                require: false,
                placeholder: "Marca del producto"
            },
            {
                type: "INPUT",
                name: "modelo",
                label: "Modelo",
                require: false,
                placeholder: "Modelo específico"
            }
        ]
    },
    {
        type: "H1",
        require: false,
        label: "Precios y Stock"
    },
    {
        type: "Flex",
        require: false,
        elements: [
            {
                type: "NUMBER",
                name: "precio_compra",
                label: "Precio de Compra",
                placeholder: "0.00",
                require: true
            },
            {
                type: "NUMBER",
                name: "precio_venta",
                label: "Precio de Venta",
                placeholder: "0.00",
                require: true
            }
        ]
    },
    {
        type: "Flex",
        require: false,
        elements: [
            {
                type: "NUMBER",
                name: "stock",
                label: "Stock Inicial",
                placeholder: "0",
                require: true
            },
            {
                type: "NUMBER",
                name: "stock_minimo",
                label: "Stock Mínimo",
                placeholder: "0",
                require: true
            }
        ]
    },
    {
        type: "H1",
        require: false,
        label: "Imágenes del Producto"
    },
    {
        type: "FILE",
        name: "imagenes",
        label: "Imágenes del Artículo",
        multiple: true,
        require: false,
    }
];

export default function Articulos() {
    const dispatch = useAppDispatch();
    const {
        articulos,
        currentPage,
        totalPages,
        totalRecords,
        isLoading,
        error,
        setCurrentPage,
        setActiveFilters,
        refetch
    } = useArticulos();

    const {
        estadisticas,
        isLoading: isLoadingEstadisticas,
        error: errorEstadisticas,
        refetch: refetchEstadisticas
    } = useEstadisticasArticulos();

    const [articuloSeleccionado, setArticuloSeleccionado] = useState<Articulo | null>(null);
    const [post] = usePostMutation();

    const { handleSubmit, register, reset } = useForm<FiltrosForm>();

    const onSubmit = (data: FiltrosForm) => {
        const nuevosFiltros: Filtro[] = [];

        if (data.search) {
            nuevosFiltros.push(
                { Key: "codigo", Value: data.search, Operator: "like" },
                { Key: "nombre", Value: data.search, Operator: "like" },
                { Key: "descripcion", Value: data.search, Operator: "like" }
            );
        }

        if (data.categoria) {
            nuevosFiltros.push({ Key: "categoria", Value: data.categoria, Operator: "=" });
        }

        if (data.marca) {
            nuevosFiltros.push({ Key: "marca", Value: data.marca, Operator: "=" });
        }

        if (data.estado) {
            nuevosFiltros.push({ Key: "estado", Value: data.estado, Operator: "=" });
        }

        setActiveFilters(prev => ({
            ...prev,
            Filtros: nuevosFiltros
        }));
        setCurrentPage(1);
    };

    const limpiarFiltros = () => {
        reset();
        setActiveFilters(prev => ({ ...prev, Filtros: [] }));
        setCurrentPage(1);
    };

    const handleOpenModal = (modalName: string, articulo?: Articulo) => {
        if (modalName === 'detalles-articulo' && articulo) {
            setArticuloSeleccionado(articulo);
        }
        dispatch(openModalReducer({ modalName }));
    };

    const handleRefetchAll = () => {
        refetch();
        refetchEstadisticas();
    };

    const handleSuccessSubmit = async (result: any, data: any) => {
        // Subir imágenes si existen
        if (data.imagenes && data.imagenes.length > 0 && result.id) {
            try {
                for (const imagen of data.imagenes) {
                    const formData = new FormData();
                    formData.append('IdRef', result.id);
                    formData.append('Tabla', 'articulos');
                    formData.append('File', imagen);
                    formData.append('Descripcion', `Imagen para ${data.nombre}`);

                    await post({
                        url: 'api/v1/recursos/imagenes/upload',
                        data: formData
                    });
                }
            } catch (error) {
                console.error('Error subiendo imágenes:', error);
            }
        }

        refetch();
        refetchEstadisticas();
        dispatch(openModalReducer({ modalName: 'nuevo-articulo' }));
    };

    return (
        <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
            <header className="mb-8">
                <h1 className="flex items-center text-2xl font-bold md:text-3xl">
                    <Package className="mr-2 h-8 w-8" />
                    Gestión de Artículos
                </h1>
                <p className="mt-2 text-gray-600">
                    Administra y visualiza todos los artículos del inventario
                </p>
            </header>

            {/* Estadísticas */}
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
                <EstadisticasArticulos estadisticas={estadisticas} />
            ) : null}

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <article className="p-4">
                    <header className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div className="mr-4">
                            <h2 className="text-lg font-semibold">Lista de Artículos</h2>
                            <p className="text-sm text-gray-500">
                                Mostrando {articulos.length} de {totalRecords} artículos
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <FiltrosArticulos
                                onSubmit={handleSubmit(onSubmit)}
                                register={register}
                            />

                            <div className="flex items-center gap-2">
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
                                    onClick={() => handleOpenModal('nuevo-articulo')}
                                    className="flex w-40 text-center items-center gap-1 bg-green-600 text-white text-sm px-4 py-2 rounded-md cursor-pointer hover:bg-green-700 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nuevo Artículo
                                </button>
                            </div>
                        </div>
                    </header>

                    <section className="overflow-x-auto">
                        {isLoading ? (
                            <LoadingSection message="Cargando artículos..." />
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
                        ) : articulos.length > 0 ? (
                            <>
                                <DynamicTable
                                    data={articulos}
                                    onRowClick={(articulo) => handleOpenModal('detalles-articulo', articulo)}
                                />
                                <div className="p-4">
                                    <Pagination
                                        currentPage={currentPage}
                                        loading={isLoading}
                                        setCurrentPage={setCurrentPage}
                                        totalPages={totalPages}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-gray-500 mb-4">No se encontraron artículos con los filtros aplicados.</p>
                                <button
                                    onClick={limpiarFiltros}
                                    className="text-green-600 hover:text-green-800 underline"
                                >
                                    Ver todos los artículos
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
                maxWidth="lg"
            >
                <ModalDetallesArticulo selectedArticulo={articuloSeleccionado} />
            </Modal>

            <Modal
                modalName="nuevo-articulo"
                title="Agregar Nuevo Artículo"
                maxWidth="xl"
            >
                <div className="p-4">
                    <MainForm
                        message_button="Crear Artículo"
                        dataForm={articuloFormConfig}
                        actionType="articulos"
                        onSuccess={handleSuccessSubmit}
                        formName="articulo"
                        iconButton={<Plus className="h-4 w-4" />}
                    />
                </div>
            </Modal>
        </main>
    );
}