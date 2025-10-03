"use client"

import { useState, useEffect, useCallback } from 'react';
import {
    Package,
    Search,
    Filter,
    Plus,
    Upload,
    Download,
    RefreshCw,
    Edit,
    Trash2,
    Image as ImageIcon,
    BarChart3,
    Layers,
    Settings,
    Save,
    X
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import {
    useGetWithFiltersGeneralMutation,
    usePutGeneralMutation,
    usePostGeneralMutation,
    usePostImgMutation,
    useDeleteGeneralMutation
} from "@/hooks/reducers/api";
import { LoadingSection } from "@/template/loading-screen";
import { Modal } from "@/components/modal";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import Pagination from "@/components/pagination";
import { Field } from '@/utils/types/interfaces';
import MainForm from '@/components/form/main-form';

// Interfaces basadas en tu consulta SQL
interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    costo: number;
    cantidad: number;
    unidad_nombre: string;
    categoria_nombre: string;
    codigo_barras: string;
    imagenes?: string[];
}

interface EstadisticasProductos {
    total_productos: number;
    productos_sin_stock: number;
    productos_bajo_stock: number;
    valor_total_inventario: number;
    productos_sin_imagen: number;
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

export default function AdministracionProductos() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [vistaActiva, setVistaActiva] = useState<'productos' | 'inventario' | 'actualizacion' | 'imagenes'>('productos');
    const [productosSeleccionados, setProductosSeleccionados] = useState<number[]>([]);
    const [modoEdicionMasiva, setModoEdicionMasiva] = useState(false);

    const [getWithFilter] = useGetWithFiltersGeneralMutation();
    const [putGeneral] = usePutGeneralMutation();
    const [postGeneral] = usePostGeneralMutation();
    const [postImg] = usePostImgMutation();
    const [deleteGeneral] = useDeleteGeneralMutation();

    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        Filtros: [],
        Selects: [],
        OrderBy: null,
        sum: false,
        distinct: false
    });

    const [estadisticas, setEstadisticas] = useState<EstadisticasProductos>({
        total_productos: 0,
        productos_sin_stock: 0,
        productos_bajo_stock: 0,
        valor_total_inventario: 0,
        productos_sin_imagen: 0
    });

    const { handleSubmit, register, reset, watch } = useForm();
    const dispatch = useAppDispatch();

    // Consulta SQL convertida a filtros
    const fetchProductos = useCallback(async () => {
        setIsLoading(true);
        try {
            const filtros: any = {
                Selects: [
                    { key: "articulos.id" },
                    { key: "articulos.nombre" },
                    { key: "articulos.descripcion" },
                    { key: "articulos.precio" },
                    { key: "historia_costos.costo" },
                    { key: "inventario.cantidad" },
                    { key: "unidades.nombre", alias: "unidad_nombre" },
                    { key: "categorias.nombre", alias: "categoria_nombre" },
                    { key: "codigos_barras.codigo_barras" }
                ],
                Order: [
                    { Key: "articulos.nombre", Direction: "Asc" }
                ]
            };

            if (activeFilters.Filtros.length > 0) {
                filtros.Filtros = activeFilters.Filtros;
            }

            const response = await getWithFilter({
                table: `articulos
                    left join codigos_barras on articulos.id = codigos_barras.articulo_id
                    left join historia_costos on articulos.id = historia_costos.articulo_id
                    left join categorias on articulos.categoria_id = categorias.id
                    left join unidades on articulos.unidad_id = unidades.id
                    left join inventario on articulos.id = inventario.articulo_id`,
                pageSize: 10,
                page: currentPage,
                tag: 'Productos',
                filtros: filtros
            }).unwrap();

            if (response && response.data) {
                setTotalPages(response.TotalPages || 1);
                setTotalItems(response.TotalRecords || response.data.length);

                const productosProcesados: Producto[] = response.data.map((item: any) => ({
                    id: item.id,
                    nombre: item.nombre,
                    descripcion: item.descripcion,
                    precio: item.precio || 0,
                    costo: item.costo || 0,
                    cantidad: item.cantidad || 0,
                    unidad_nombre: item.unidad_nombre || 'N/A',
                    categoria_nombre: item.categoria_nombre || 'Sin categoría',
                    codigo_barras: item.codigo_barras || 'N/A'
                }));

                setProductos(productosProcesados);
                calcularEstadisticas(productosProcesados);
            }
        } catch (error) {
            console.error("Error fetching productos:", error);
            setProductos([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activeFilters, getWithFilter]);

    useEffect(() => {
        fetchProductos();
    }, [fetchProductos]);

    const calcularEstadisticas = (listaProductos: Producto[]) => {
        const stats: EstadisticasProductos = {
            total_productos: listaProductos.length,
            productos_sin_stock: listaProductos.filter(p => p.cantidad === 0).length,
            productos_bajo_stock: listaProductos.filter(p => p.cantidad > 0 && p.cantidad <= 10).length,
            valor_total_inventario: listaProductos.reduce((sum, p) => sum + (p.costo * p.cantidad), 0),
            productos_sin_imagen: listaProductos.filter(p => !p.imagenes || p.imagenes.length === 0).length
        };
        setEstadisticas(stats);
    };

    const handleOpenModal = (producto: Producto) => {
        setProductoSeleccionado(producto);
        dispatch(openModalReducer({ modalName: "detalle_producto" }));
    };

    const handleEditarProducto = (producto: Producto) => {
        setProductoSeleccionado(producto);
        dispatch(openModalReducer({ modalName: "editar_producto" }));
    };

    const handleEliminarProducto = async (productoId: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            try {
                await deleteGeneral({
                    table: "articulos",
                    id: productoId
                }).unwrap();

                fetchProductos();
            } catch (error) {
                console.error("Error eliminando producto:", error);
            }
        }
    };

    const handleToggleSeleccion = (productoId: number) => {
        setProductosSeleccionados(prev =>
            prev.includes(productoId)
                ? prev.filter(id => id !== productoId)
                : [...prev, productoId]
        );
    };

    const handleSeleccionarTodos = () => {
        if (productosSeleccionados.length === productos.length) {
            setProductosSeleccionados([]);
        } else {
            setProductosSeleccionados(productos.map(p => p.id));
        }
    };

    // Actualización masiva usando MainForm
    const handleActualizacionMasiva = async (data: any) => {
        try {
            const updates = productosSeleccionados.map(id =>
                putGeneral({
                    table: "articulos",
                    id: id,
                    data: {
                        precio: data.precio !== undefined ? parseFloat(data.precio) : undefined,
                        costo: data.costo !== undefined ? parseFloat(data.costo) : undefined,
                        descripcion: data.descripcion || undefined,
                    }
                })
            );

            await Promise.all(updates);
            setModoEdicionMasiva(false);
            setProductosSeleccionados([]);
            fetchProductos();
        } catch (error) {
            console.error("Error en actualización masiva:", error);
        }
    };

    // Crear nuevo producto usando MainForm
    const handleCrearProducto = async (data: any) => {
        try {
            await postGeneral({
                table: "articulos",
                data: {
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    precio: parseFloat(data.precio),
                    categoria_id: data.categoria_id,
                    unidad_id: data.unidad_id
                }
            }).unwrap();

            fetchProductos();
            dispatch(openModalReducer({ modalName: "crear_producto" }));
        } catch (error) {
            console.error("Error creando producto:", error);
        }
    };

    // Editar producto usando MainForm
    const handleGuardarEdicion = async (data: any) => {
        if (!productoSeleccionado) return;

        try {
            await putGeneral({
                table: "articulos",
                id: productoSeleccionado.id,
                data: {
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    precio: parseFloat(data.precio),
                    categoria_id: data.categoria_id,
                    unidad_id: data.unidad_id
                }
            }).unwrap();

            fetchProductos();
            setProductoSeleccionado(null);
            dispatch(openModalReducer({ modalName: "editar_producto" }));
        } catch (error) {
            console.error("Error editando producto:", error);
        }
    };

    const limpiarFiltros = () => {
        reset();
        setActiveFilters(prev => ({ ...prev, Filtros: [] }));
        setCurrentPage(1);
    };

    const onSubmitFiltros = (data: any) => {
        const nuevosFiltros: Filtro[] = [];

        if (data.search) {
            nuevosFiltros.push({
                Key: "articulos.nombre",
                Value: data.search,
                Operator: "contains"
            });
        }

        if (data.categoria) {
            nuevosFiltros.push({
                Key: "categorias.nombre",
                Value: data.categoria,
                Operator: "="
            });
        }

        if (data.stock_min) {
            nuevosFiltros.push({
                Key: "inventario.cantidad",
                Value: parseInt(data.stock_min),
                Operator: ">="
            });
        }

        if (data.stock_max) {
            nuevosFiltros.push({
                Key: "inventario.cantidad",
                Value: parseInt(data.stock_max),
                Operator: "<="
            });
        }

        setActiveFilters(prev => ({
            ...prev,
            Filtros: nuevosFiltros
        }));
        setCurrentPage(1);
    };

    // Definición de formularios para MainForm
    const formCrearProducto: Field[] = [
        { type: "H1", label: "Crear Nuevo Producto", require: false },
        {
            type: "INPUT",
            name: "nombre",
            label: "Nombre del Producto",
            placeholder: "Ingresa el nombre del producto",
            require: true
        },
        {
            type: "TEXT_AREA",
            name: "descripcion",
            label: "Descripción",
            placeholder: "Describe el producto",
            require: false
        },
        {
            type: "NUMBER",
            name: "precio",
            label: "Precio",
            placeholder: "0.00",
            require: true
        },
        {
            type: "NUMBER",
            name: "costo",
            label: "Costo",
            placeholder: "0.00",
            require: false
        },
        {
            type: "SELECT",
            name: "categoria_id",
            label: "Categoría",
            options: ["Electrónicos", "Ropa", "Hogar", "Deportes", "Otros"],
            require: true
        },
        {
            type: "SELECT",
            name: "unidad_id",
            label: "Unidad",
            options: ["Pieza", "Kilogramo", "Litro", "Metro", "Caja"],
            require: true
        }
    ];

    const formEditarProducto: Field[] = productoSeleccionado ? [
        { type: "H1", label: `Editar: ${productoSeleccionado.nombre}`, require: false },
        {
            type: "INPUT",
            name: "nombre",
            label: "Nombre del Producto",
            placeholder: "Ingresa el nombre del producto",
            require: true,
            valueDefined: productoSeleccionado.nombre
        },
        {
            type: "TEXT_AREA",
            name: "descripcion",
            label: "Descripción",
            placeholder: "Describe el producto",
            require: false,
            valueDefined: productoSeleccionado.descripcion
        },
        {
            type: "NUMBER",
            name: "precio",
            label: "Precio",
            placeholder: "0.00",
            require: true,
            valueDefined: productoSeleccionado.precio
        },
        {
            type: "NUMBER",
            name: "costo",
            label: "Costo",
            placeholder: "0.00",
            require: false,
            valueDefined: productoSeleccionado.costo
        },
        {
            type: "SELECT",
            name: "categoria_id",
            label: "Categoría",
            options: ["Electrónicos", "Ropa", "Hogar", "Deportes", "Otros"],
            require: true,
            valueDefined: productoSeleccionado.categoria_nombre
        }
    ] : [];

    const formActualizacionMasiva: Field[] = [
        { type: "H1", label: "Actualización Masiva", require: false },
        {
            type: "NUMBER",
            name: "precio",
            label: "Nuevo Precio",
            placeholder: "Dejar vacío para no modificar",
            require: false
        },
        {
            type: "NUMBER",
            name: "costo",
            label: "Nuevo Costo",
            placeholder: "Dejar vacío para no modificar",
            require: false
        },
        {
            type: "TEXT_AREA",
            name: "descripcion",
            label: "Nueva Descripción",
            placeholder: "Dejar vacío para no modificar",
            require: false
        }
    ];

    const EstadisticasComponent = ({ stats }: { stats: EstadisticasProductos }) => (
        <BentoGrid cols={5} className="mb-6">
            <BentoItem
                title="Total Productos"
                description="En el sistema"
                className="bg-blue-50 border-blue-200"
                icon={<Package className="h-6 w-6 text-blue-600" />}
            >
                <div className="text-2xl font-bold text-blue-600">{stats.total_productos}</div>
            </BentoItem>

            <BentoItem
                title="Sin Stock"
                description="Agotados"
                className="bg-red-50 border-red-200"
                icon={<Package className="h-6 w-6 text-red-600" />}
            >
                <div className="text-2xl font-bold text-red-600">{stats.productos_sin_stock}</div>
            </BentoItem>

            <BentoItem
                title="Bajo Stock"
                description="≤ 10 unidades"
                className="bg-orange-50 border-orange-200"
                icon={<Package className="h-6 w-6 text-orange-600" />}
            >
                <div className="text-2xl font-bold text-orange-600">{stats.productos_bajo_stock}</div>
            </BentoItem>

            <BentoItem
                title="Valor Inventario"
                description="Costo total"
                className="bg-green-50 border-green-200"
                icon={<BarChart3 className="h-6 w-6 text-green-600" />}
            >
                <div className="text-2xl font-bold text-green-600">
                    ${stats.valor_total_inventario.toLocaleString()}
                </div>
            </BentoItem>

            <BentoItem
                title="Sin Imagen"
                description="Por subir"
                className="bg-purple-50 border-purple-200"
                icon={<ImageIcon className="h-6 w-6 text-purple-600" />}
            >
                <div className="text-2xl font-bold text-purple-600">{stats.productos_sin_imagen}</div>
            </BentoItem>
        </BentoGrid>
    );

    const NavegacionVistas = () => (
        <div className="flex border-b border-gray-200 mb-6">
            <button
                onClick={() => setVistaActiva('productos')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${vistaActiva === 'productos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
            >
                <Package className="w-4 h-4 inline mr-2" />
                Productos
            </button>
            <button
                onClick={() => setVistaActiva('inventario')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${vistaActiva === 'inventario'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
            >
                <Layers className="w-4 h-4 inline mr-2" />
                Inventario
            </button>
            <button
                onClick={() => setVistaActiva('actualizacion')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${vistaActiva === 'actualizacion'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
            >
                <Settings className="w-4 h-4 inline mr-2" />
                Actualización Masiva
            </button>
            <button
                onClick={() => setVistaActiva('imagenes')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${vistaActiva === 'imagenes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
            >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Gestión de Imágenes
            </button>
        </div>
    );

    return (
        <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
            <header className="mb-8">
                <h1 className="flex items-center text-2xl font-bold md:text-3xl">
                    <Package className="mr-2 h-8 w-8 text-blue-600" />
                    Administración de Productos
                </h1>
                <p className="mt-2 text-gray-600">
                    Gestiona productos, inventario y actualizaciones masivas
                </p>
            </header>

            <EstadisticasComponent stats={estadisticas} />
            <NavegacionVistas />

            {/* Filtros y Búsqueda */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <form onSubmit={handleSubmit(onSubmitFiltros)} className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            {...register("search")}
                            placeholder="Buscar productos..."
                            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <input
                        type="text"
                        {...register("categoria")}
                        placeholder="Categoría"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />

                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            {...register("stock_min")}
                            placeholder="Stock mín"
                            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="number"
                            {...register("stock_max")}
                            placeholder="Stock máx"
                            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                        <Filter className="h-4 w-4" />
                        Filtrar
                    </button>

                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                        Limpiar
                    </button>

                    <button
                        type="button"
                        onClick={fetchProductos}
                        className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </form>
            </div>

            {/* Contenido según vista activa */}
            {vistaActiva === 'productos' && (
                <VistaProductos
                    productos={productos}
                    isLoading={isLoading}
                    onViewDetails={handleOpenModal}
                    onEdit={handleEditarProducto}
                    onDelete={handleEliminarProducto}
                    onCrearProducto={() => dispatch(openModalReducer({ modalName: "crear_producto" }))}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />
            )}

            {vistaActiva === 'inventario' && (
                <VistaInventario
                    productos={productos}
                    isLoading={isLoading}
                />
            )}

            {vistaActiva === 'actualizacion' && (
                <VistaActualizacionMasiva
                    productos={productos}
                    productosSeleccionados={productosSeleccionados}
                    onToggleSeleccion={handleToggleSeleccion}
                    onSeleccionarTodos={handleSeleccionarTodos}
                    onActualizacionMasiva={handleActualizacionMasiva}
                    modoEdicionMasiva={modoEdicionMasiva}
                    setModoEdicionMasiva={setModoEdicionMasiva}
                />
            )}

            {vistaActiva === 'imagenes' && (
                <VistaGestionImagenes
                    productos={productos}
                    onSubirImagen={postImg}
                />
            )}

            {/* Modales con MainForm */}
            <Modal
                modalName="crear_producto"
                title="Crear Nuevo Producto"
                maxWidth="2xl"
            >
                <MainForm
                    message_button="Crear Producto"
                    actionType="post"
                    dataForm={formCrearProducto}
                    onSuccess={(result: any, formData: any) => {
                        handleCrearProducto(formData);
                    }}
                    iconButton={<Plus className="size-4" />}
                />
            </Modal>

            <Modal
                modalName="editar_producto"
                title="Editar Producto"
                maxWidth="2xl"
            >
                {productoSeleccionado && (
                    <MainForm
                        message_button="Guardar Cambios"
                        actionType="put"
                        dataForm={formEditarProducto}
                        onSuccess={(result: any, formData: any) => {
                            handleGuardarEdicion(formData);
                        }}
                        iconButton={<Save className="size-4" />}
                    />
                )}
            </Modal>

            <ModalDetalleProducto
                producto={productoSeleccionado}
                onClose={() => setProductoSeleccionado(null)}
            />
        </main>
    );
}

// Componentes de vistas específicas
const VistaProductos = ({
    productos,
    isLoading,
    onViewDetails,
    onEdit,
    onDelete,
    onCrearProducto,
    currentPage,
    totalPages,
    setCurrentPage
}: any) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Lista de Productos</h2>
                <button
                    onClick={onCrearProducto}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Producto
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
            {isLoading ? (
                <LoadingSection message="Cargando productos..." />
            ) : productos.length > 0 ? (
                <>
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Categoría
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Precio
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Costo
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {productos.map((producto: Producto) => (
                                <tr key={producto.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">{producto.nombre}</div>
                                            <div className="text-sm text-gray-500">{producto.descripcion}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        {producto.categoria_nombre}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        ${producto.precio.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                        ${producto.costo.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${producto.cantidad === 0
                                            ? 'bg-red-100 text-red-800'
                                            : producto.cantidad <= 10
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-green-100 text-green-800'
                                            }`}>
                                            {producto.cantidad} {producto.unidad_nombre}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onViewDetails(producto)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Ver
                                            </button>
                                            <button
                                                onClick={() => onEdit(producto)}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(producto.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-4 border-t border-gray-200">
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
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron productos.</p>
                </div>
            )}
        </div>
    </div>
);

const VistaInventario = ({ productos, isLoading }: any) => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Control de Inventario</h2>
        </div>
        <div className="overflow-x-auto">
            {isLoading ? (
                <LoadingSection message="Cargando inventario..." />
            ) : (
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Producto
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock Actual
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock Mínimo
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Valor en Inventario
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {productos.map((producto: Producto) => (
                            <tr key={producto.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4">
                                    <div className="font-medium text-gray-900">{producto.nombre}</div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">
                                    {producto.cantidad} {producto.unidad_nombre}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">
                                    10 {/* Stock mínimo fijo, puedes hacerlo dinámico */}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${producto.cantidad === 0
                                        ? 'bg-red-100 text-red-800'
                                        : producto.cantidad <= 10
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                        {producto.cantidad === 0 ? 'Agotado' :
                                            producto.cantidad <= 10 ? 'Bajo Stock' : 'Disponible'}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">
                                    ${(producto.costo * producto.cantidad).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    </div>
);

const VistaActualizacionMasiva = ({
    productos,
    productosSeleccionados,
    onToggleSeleccion,
    onSeleccionarTodos,
    onActualizacionMasiva,
    modoEdicionMasiva,
    setModoEdicionMasiva
}: any) => {
    const formActualizacionMasiva: Field[] = [
        { type: "H1", label: "Actualización Masiva", require: false },
        {
            type: "NUMBER",
            name: "precio",
            label: "Nuevo Precio",
            placeholder: "Dejar vacío para no modificar",
            require: false
        },
        {
            type: "NUMBER",
            name: "costo",
            label: "Nuevo Costo",
            placeholder: "Dejar vacío para no modificar",
            require: false
        },
        {
            type: "TEXT_AREA",
            name: "descripcion",
            label: "Nueva Descripción",
            placeholder: "Dejar vacío para no modificar",
            require: false
        }
    ];

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Actualización Masiva</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                            {productosSeleccionados.length} productos seleccionados
                        </span>
                        {modoEdicionMasiva ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setModoEdicionMasiva(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <X className="h-4 w-4" />
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setModoEdicionMasiva(true)}
                                disabled={productosSeleccionados.length === 0}
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <Settings className="h-4 w-4" />
                                Editar Seleccionados
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {modoEdicionMasiva && (
                <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                    <MainForm
                        message_button={`Aplicar a ${productosSeleccionados.length} productos`}
                        actionType="put"
                        dataForm={formActualizacionMasiva}
                        onSuccess={(result: any, formData: any) => {
                            onActualizacionMasiva(formData);
                        }}
                        iconButton={<Save className="size-4" />}
                    />
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                    type="checkbox"
                                    checked={productosSeleccionados.length === productos.length && productos.length > 0}
                                    onChange={onSeleccionarTodos}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Producto
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Precio Actual
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {productos.map((producto: Producto) => (
                            <tr key={producto.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4">
                                    <input
                                        type="checkbox"
                                        checked={productosSeleccionados.includes(producto.id)}
                                        onChange={() => onToggleSeleccion(producto.id)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="font-medium text-gray-900">{producto.nombre}</div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">
                                    ${producto.precio.toFixed(2)}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900">
                                    {producto.cantidad} {producto.unidad_nombre}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const VistaGestionImagenes = ({ productos, onSubirImagen }: any) => {
    const formSubirImagen: Field[] = [
        { type: "H1", label: "Subir Imágenes", require: false },
        {
            type: "FILE",
            name: "file",
            label: "Seleccionar Imágenes",
            multiple: true,
            require: true
        }
    ];

    const handleSubirImagenProducto = async (productoId: number, formData: any) => {
        try {
            const fileData = new FormData();
            if (Array.isArray(formData.file)) {
                formData.file.forEach((file: File) => {
                    fileData.append('file', file);
                });
            } else {
                fileData.append('file', formData.file);
            }

            await onSubirImagen({
                idRef: productoId,
                tabla: 'articulos',
                descripcion: `Imagenes para producto ${productoId}`,
                file: fileData
            }).unwrap();

            alert('Imágenes subidas correctamente');
        } catch (error) {
            console.error("Error subiendo imágenes:", error);
            alert('Error al subir las imágenes');
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Gestión de Imágenes</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Sube imágenes para tus productos. Formatos soportados: JPG, PNG, GIF.
                </p>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {productos.map((producto: Producto) => (
                        <div key={producto.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
                                    <p className="text-sm text-gray-500">{producto.categoria_nombre}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${producto.imagenes && producto.imagenes.length > 0
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {producto.imagenes && producto.imagenes.length > 0
                                        ? `${producto.imagenes.length} imagen(es)`
                                        : 'Sin imágenes'
                                    }
                                </span>
                            </div>

                            {/* Vista previa de imágenes existentes */}
                            {producto.imagenes && producto.imagenes.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Imágenes existentes:</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {producto.imagenes.map((img, index) => (
                                            <img
                                                key={index}
                                                src={img}
                                                alt={`Imagen ${index + 1} de ${producto.nombre}`}
                                                className="w-full h-16 object-cover rounded border"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Formulario de subida de imágenes */}
                            <MainForm
                                message_button="Subir Imágenes"
                                actionType="post"
                                dataForm={formSubirImagen}
                                onSuccess={(result: any, formData: any) => {
                                    handleSubirImagenProducto(producto.id, formData);
                                }}
                                iconButton={<Upload className="size-4" />}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Modal de detalle (sin cambios)
const ModalDetalleProducto = ({ producto, onClose }: any) => (
    <Modal modalName="detalle_producto" title="Detalle del Producto" maxWidth="lg">
        {producto && (
            <div className="p-6">
                <h2 className="text-xl font-bold mb-4">{producto.nombre}</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Descripción</label>
                        <p className="text-gray-900">{producto.descripcion}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Categoría</label>
                        <p className="text-gray-900">{producto.categoria_nombre}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Precio</label>
                        <p className="text-gray-900">${producto.precio.toFixed(2)}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Costo</label>
                        <p className="text-gray-900">${producto.costo.toFixed(2)}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Stock</label>
                        <p className="text-gray-900">{producto.cantidad} {producto.unidad_nombre}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Código Barras</label>
                        <p className="text-gray-900">{producto.codigo_barras}</p>
                    </div>
                </div>
            </div>
        )}
    </Modal>
);