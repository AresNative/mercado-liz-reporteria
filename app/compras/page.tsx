"use client";
import { useEffect, useState } from "react";
import {
    ShoppingCart, Package, Building,
    Calendar, Plus,
    Save, Search,
    AlertCircle, X, Hash,
    FileText, Truck,
    Copy, Share2, Send, Store,
    ListChecks, MapPin, Phone,
    Mail, BarChart3, Eye, Filter,
    Shield, Clock, Edit
} from "lucide-react";
import Header from "@/template/header";
import Footer from "@/template/footer";
import DynamicTable from "@/components/table";
import MainForm from "@/components/form/main-form";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import PurchaseOrderGenerator from "./components/order-generator";
import { Field } from "@/utils/types/interfaces";
import { formatCurrency, formatDate } from "./utils/formatters";

// Interfaces reutilizables desde purchase-order-PDF.ts
interface PurchaseOrderItem {
    id: string;
    productCode: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    stock: number;
    minStock: number;
    reorderPoint: number;
    supplierCode?: string;
    expirationDate?: string;
    batchNumber?: string;
}

interface PurchaseOrderData {
    orderNumber: string;
    orderDate: string;
    deliveryDate: string;
    validityDate: string;
    supplier: {
        code: string;
        name: string;
        address: string;
        phone: string;
        email: string;
        rfc: string;
    };
    warehouse: {
        code: string;
        name: string;
        address: string;
    };
    items: PurchaseOrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    terms: string;
    notes: string;
    createdBy: string;
    approvedBy?: string;
}

export default function GenerarOrdenCompra() {
    // Estados de UI
    const [busqueda, setBusqueda] = useState("");
    const [itemsOrden, setItemsOrden] = useState<PurchaseOrderItem[]>([
        {
            id: "1",
            productCode: "ART-001",
            description: "Tornillo hexagonal 1/2\" galvanizado",
            quantity: 50,
            unit: "PZA",
            unitPrice: 5.50,
            total: 275.00,
            stock: 12,
            minStock: 20,
            reorderPoint: 5,
            supplierCode: "PROV-001"
        },
        {
            id: "2",
            productCode: "ART-002",
            description: "Tuerca de seguridad 1/2\"",
            quantity: 100,
            unit: "PZA",
            unitPrice: 2.30,
            total: 230.00,
            stock: 8,
            minStock: 30,
            reorderPoint: 10,
            supplierCode: "PROV-001"
        },
        {
            id: "3",
            productCode: "ART-003",
            description: "Pintura blanca mate 4L",
            quantity: 10,
            unit: "BOTE",
            unitPrice: 250.00,
            total: 2500.00,
            stock: 3,
            minStock: 5,
            reorderPoint: 2,
            supplierCode: "PROV-001"
        }
    ]);

    const [proveedorSeleccionado] = useState({
        id: "PROV-001",
        nombre: "Distribuidora Industrial S.A. de C.V.",
        rfc: "DIA950101XXX",
        telefono: "555-123-4567",
        email: "ventas@distribuidora.com",
        direccion: "Av. Industrial #123, Zona Industrial",
        plazoPago: 30,
        condiciones: "Pago a 30 días neto"
    });

    const [condiciones, setCondiciones] = useState("Pago a 30 días neto, entrega en almacén central. Factura electrónica obligatoria.");
    const [notas, setNotas] = useState("Favor de incluir certificado de calidad y hojas de seguridad.");

    // Fechas
    const [fechaOrden] = useState(new Date());
    const [fechaEntrega] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
    });
    const [fechaValidez] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
    });

    // Número de orden generado automáticamente
    const useClientSideNumeroOrden = () => {
        const [numeroOrden, setNumeroOrden] = useState<string>("");

        useEffect(() => {
            const hoy = new Date();
            const anio = hoy.getFullYear();
            const mes = String(hoy.getMonth() + 1).padStart(2, '0');
            const dia = String(hoy.getDate()).padStart(2, '0');
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            setNumeroOrden(`OC-${anio}${mes}${dia}-${random}`);
        }, []);

        return numeroOrden;
    };

    // En tu componente:
    const numeroOrden = useClientSideNumeroOrden();

    // Datos de ejemplo para búsqueda
    const resultadosBusqueda = [
        {
            id: "4",
            productCode: "ART-004",
            description: "Cemento gris 50kg",
            categoria: "Construcción",
            unit: "BULTO",
            unitPrice: 120.00,
            stock: 15,
            minStock: 10,
            reorderPoint: 5,
            fabricante: "Cemex"
        },
        {
            id: "5",
            productCode: "ART-005",
            description: "Varilla corrugada 3/8\" 6m",
            categoria: "Construcción",
            unit: "PZA",
            unitPrice: 85.50,
            stock: 25,
            minStock: 15,
            reorderPoint: 8,
            fabricante: "Deacero"
        },
        {
            id: "6",
            productCode: "ART-006",
            description: "Lámpara LED 18W",
            categoria: "Eléctrico",
            unit: "PZA",
            unitPrice: 45.00,
            stock: 40,
            minStock: 20,
            reorderPoint: 10,
            fabricante: "Philips"
        }
    ];

    const categorias = ["Ferretería", "Pinturas", "Construcción", "Eléctrico", "Plomería", "Herramientas"];
    const almacenes = ["ALM-001", "ALM-002", "ALM-003", "ALM-004"];

    // Calcular totales
    const calcularTotales = () => {
        const subtotal = itemsOrden.reduce((sum, item) => sum + item.total, 0);
        const iva = subtotal * 0.16;
        const total = subtotal + iva;

        return { subtotal, iva, total };
    };

    const { subtotal, iva, total } = calcularTotales();

    // Función para determinar estado de stock
    const getEstadoStock = (stock: number, minStock: number, reorderPoint: number) => {
        const needed = Math.max(0, minStock + reorderPoint - stock);

        if (needed > 0) {
            if (stock <= minStock) return { texto: "CRÍTICO", color: "text-red-600", bg: "bg-red-100" };
            return { texto: "BAJO", color: "text-yellow-600", bg: "bg-yellow-100" };
        }
        return { texto: "OK", color: "text-green-600", bg: "bg-green-100" };
    };

    // Handler para agregar artículo
    const handleAgregarArticulo = (articulo: any) => {
        const nuevoItem: PurchaseOrderItem = {
            id: articulo.id,
            productCode: articulo.productCode,
            description: articulo.description,
            quantity: 1,
            unit: articulo.unit,
            unitPrice: articulo.unitPrice,
            total: articulo.unitPrice,
            stock: articulo.stock || 0,
            minStock: articulo.minStock || 0,
            reorderPoint: articulo.reorderPoint || 0,
            supplierCode: proveedorSeleccionado.id
        };
        setItemsOrden([...itemsOrden, nuevoItem]);
    };

    // Handler para actualizar condiciones
    const handleUpdateCondiciones = (data: any) => {
        if (data.condiciones !== undefined) {
            setCondiciones(data.condiciones);
        }
        if (data.notas !== undefined) {
            setNotas(data.notas);
        }
    };

    // Handler para eliminar artículo
    const handleEliminarArticulo = (id: string) => {
        setItemsOrden(itemsOrden.filter(item => item.id !== id));
    };

    // Handler para actualizar cantidad
    const handleActualizarCantidad = (id: string, nuevaCantidad: number) => {
        setItemsOrden(itemsOrden.map(item => {
            if (item.id === id) {
                const cantidad = Math.max(1, nuevaCantidad);
                const total = cantidad * item.unitPrice;
                return { ...item, quantity: cantidad, total };
            }
            return item;
        }));
    };

    // Handler para actualizar precio unitario
    const handleActualizarPrecio = (id: string, nuevoPrecio: number) => {
        setItemsOrden(itemsOrden.map(item => {
            if (item.id === id) {
                const unitPrice = Math.max(0, nuevoPrecio);
                const total = item.quantity * unitPrice;
                return { ...item, unitPrice, total };
            }
            return item;
        }));
    };

    // Preparar datos para PurchaseOrderGenerator
    const preparePurchaseOrderData = (): PurchaseOrderData => {
        return {
            orderNumber: numeroOrden,
            orderDate: fechaOrden.toISOString(),
            deliveryDate: fechaEntrega.toISOString(),
            validityDate: fechaValidez.toISOString(),
            supplier: {
                code: proveedorSeleccionado.id,
                name: proveedorSeleccionado.nombre,
                address: proveedorSeleccionado.direccion,
                phone: proveedorSeleccionado.telefono,
                email: proveedorSeleccionado.email,
                rfc: proveedorSeleccionado.rfc
            },
            warehouse: {
                code: "ALM-001",
                name: "Almacén Principal",
                address: "Av. Industrial #123, Zona Industrial, CDMX"
            },
            items: itemsOrden,
            subtotal: subtotal,
            tax: iva,
            total: total,
            currency: "MXN",
            terms: condiciones,
            notes: notas,
            createdBy: "Admin",
            approvedBy: undefined
        };
    };

    // Handler para descarga exitosa del PDF
    const handlePDFDownloadSuccess = () => {
        console.log("PDF generado exitosamente");
        // Aquí podrías agregar notificaciones o seguimiento
    };

    // Formulario de búsqueda usando MainForm
    const busquedaFormFields: Field[] = [
        {
            id: 0,
            type: "SELECT",
            name: "categoria",
            label: "Categoría",
            options: ["Todas las categorías"/* , ...categorias */],
            require: false,
        },
        {
            id: 1,
            type: "SELECT",
            name: "almacen",
            label: "Almacén",
            options: ["Todos los almacenes"/* , ...almacenes */],
            require: false,
        },
        {
            id: 2,
            type: "SEARCH",
            name: "busqueda",
            label: "Buscar artículos",
            placeholder: "Buscar por código, descripción, categoría...",
            require: false,
        }
    ];

    // Formulario de condiciones y notas usando MainForm
    const condicionesFormFields: Field[] = [
        {
            id: 0,
            type: "TEXT_AREA",
            name: "condiciones",
            label: "Condiciones de Pago y Entrega",
            placeholder: "Especifica las condiciones de pago, entrega, garantías, etc.",
            valueDefined: condiciones ? condiciones : "",
            require: false,
        },
        {
            id: 1,
            type: "TEXT_AREA",
            name: "notas",
            label: "Notas Internas y Observaciones",
            placeholder: "Agrega notas internas, observaciones, instrucciones especiales...",
            valueDefined: notas ? notas : "",
            require: false,
        }
    ];

    // Columnas para la tabla
    const tableColumns = [
        {
            key: "productCode",
            label: "Código",
            render: (value: string) => (
                <span className="font-mono text-sm">{value}</span>
            )
        },
        {
            key: "description",
            label: "Descripción",
            render: (value: string) => (
                <span className="font-medium">{value}</span>
            )
        },
        {
            key: "quantity",
            label: "Cantidad",
            render: (value: number, item: PurchaseOrderItem) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleActualizarCantidad(item.id, value - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100"
                    >
                        -
                    </button>
                    <span className="w-12 text-center">{value}</span>
                    <button
                        onClick={() => handleActualizarCantidad(item.id, value + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100"
                    >
                        +
                    </button>
                </div>
            )
        },
        {
            key: "unit",
            label: "Unidad"
        },
        {
            key: "unitPrice",
            label: "Precio Unit.",
            render: (value: number, item: PurchaseOrderItem) => (
                <div className="flex items-center gap-1">
                    <span>{formatCurrency(value)}</span>
                    <button
                        onClick={() => {
                            const nuevoPrecio = parseFloat(prompt("Nuevo precio:", value.toString()) || value.toString());
                            if (!isNaN(nuevoPrecio)) {
                                handleActualizarPrecio(item.id, nuevoPrecio);
                            }
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Editar precio"
                    >
                        <Edit className="h-3 w-3" />
                    </button>
                </div>
            )
        },
        {
            key: "total",
            label: "Importe",
            render: (value: number) => (
                <span className="font-semibold">{formatCurrency(value)}</span>
            )
        },
        {
            key: "stock",
            label: "Stock",
            render: (value: number, item: PurchaseOrderItem) => {
                const estado = getEstadoStock(value, item.minStock, item.reorderPoint);
                return (
                    <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded text-xs ${estado.bg} ${estado.color}`}>
                            {value} {estado.texto}
                        </span>
                        {estado.texto !== "OK" && (
                            <span className="text-xs text-gray-500">
                                Mín: {item.minStock + item.reorderPoint}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: "actions",
            label: "Acciones",
            render: (_: any, item: PurchaseOrderItem) => (
                <button
                    onClick={() => handleEliminarArticulo(item.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                >
                    <X className="h-4 w-4" />
                </button>
            )
        }
    ];

    // Verificar si hay artículos con stock bajo
    const getLowStockItems = () => {
        return itemsOrden.filter(item => {
            const estado = getEstadoStock(item.stock, item.minStock, item.reorderPoint);
            return estado.texto !== "OK";
        });
    };

    // Verificar si hay artículos con fechas de expiración próximas
    const getExpiringItems = () => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        return itemsOrden.filter(item => {
            if (!item.expirationDate) return false;
            const expDate = new Date(item.expirationDate);
            return expDate <= thirtyDaysFromNow;
        });
    };

    const lowStockItems = getLowStockItems();
    const expiringItems = getExpiringItems();

    return (
        <>
            <Header />
            <section className="p-3 md:p-4 min-h-[70vh]">
                {/* Header principal */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <ShoppingCart className="h-6 w-6" />
                                Generar Orden de Compra
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Crea y gestiona órdenes de compra para tus proveedores
                            </p>
                        </div>
                    </div>
                </div>

                {/* Estadísticas con BentoGrid */}
                <BentoGrid cols={3} className="mb-6">
                    <BentoItem
                        title={`Orden #${numeroOrden}`}
                        description="En proceso de creación"
                        icon={<FileText className="h-5 w-5 text-blue-600" />}
                        className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800"
                    />

                    <BentoItem
                        title="Proveedor Asignado"
                        description={proveedorSeleccionado.nombre}
                        icon={<Building className="h-5 w-5 text-green-600" />}
                        className="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800"
                    />

                    <BentoItem
                        title={`${itemsOrden.length} Artículos`}
                        description={`Total: ${formatCurrency(total)}`}
                        icon={<Package className="h-5 w-5 text-purple-600" />}
                        className="bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800"
                    />
                </BentoGrid>

                {/* Componente de generación de PDF */}
                <div className="mb-6">
                    <PurchaseOrderGenerator
                        orderData={preparePurchaseOrderData()}
                        showPreview={true}
                        onDownload={handlePDFDownloadSuccess}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna izquierda - Información general */}
                    <div className="lg:col-span-1 space-y-6">
                        <BentoGrid cols={1}>
                            {/* Información de la orden */}
                            <BentoItem
                                title="Información de la Orden"
                                icon={<FileText className="h-5 w-5 text-blue-600" />}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="space-y-4">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">No. Orden</span>
                                            <Hash className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <div className="font-mono font-bold text-lg text-gray-800 dark:text-gray-200">
                                            {numeroOrden}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Calendar className="h-4 w-4" />
                                                <span>Fecha Orden</span>
                                            </div>
                                            <div className="font-medium">
                                                {formatDate(fechaOrden.toISOString())}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Truck className="h-4 w-4" />
                                                <span>Fecha Entrega</span>
                                            </div>
                                            <div className="font-medium">
                                                {formatDate(fechaEntrega.toISOString())}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Calendar className="h-4 w-4" />
                                            <span>Validez Hasta</span>
                                        </div>
                                        <div className="font-medium">
                                            {formatDate(fechaValidez.toISOString())}
                                        </div>
                                    </div>
                                </div>
                            </BentoItem>

                            {/* Proveedor */}
                            <BentoItem
                                title="Proveedor"
                                icon={<Building className="h-5 w-5 text-green-600" />}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-800 dark:text-gray-200">
                                                {proveedorSeleccionado.nombre}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">RFC: {proveedorSeleccionado.rfc}</p>
                                        </div>
                                        <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                            Activo
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <Phone className="h-3 w-3" />
                                            <span>{proveedorSeleccionado.telefono}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <Mail className="h-3 w-3" />
                                            <span>{proveedorSeleccionado.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">{proveedorSeleccionado.direccion}</span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Plazo de pago:</span>
                                            <span className="font-medium">{proveedorSeleccionado.plazoPago} días</span>
                                        </div>
                                    </div>
                                </div>
                            </BentoItem>

                            {/* Almacén de destino */}
                            <BentoItem
                                title="Almacén de Destino"
                                icon={<Store className="h-5 w-5 text-purple-600" />}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium">Almacén Principal</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Código: ALM-001</p>
                                        </div>
                                        <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                            Principal
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <MapPin className="h-3 w-3" />
                                        <span>Av. Industrial #123, Zona Industrial, CDMX</span>
                                    </div>

                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">Capacidad:</span>
                                            <span className="text-sm">85% ocupado</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </BentoItem>

                            {/* Estadísticas rápidas */}
                            <BentoItem
                                title="Resumen"
                                icon={<BarChart3 className="h-5 w-5 text-orange-600" />}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Artículos:</span>
                                        <span className="font-medium">{itemsOrden.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Unidades totales:</span>
                                        <span className="font-medium">
                                            {itemsOrden.reduce((sum, item) => sum + item.quantity, 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">IVA (16%):</span>
                                        <span className="font-medium">{formatCurrency(iva)}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <span className="font-semibold">Total:</span>
                                        <span className="font-bold text-lg text-green-600">{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </BentoItem>
                        </BentoGrid>
                    </div>

                    {/* Columna derecha - Búsqueda y artículos */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Panel de búsqueda usando MainForm */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Search className="h-5 w-5 text-blue-600" />
                                Buscar Artículos para Orden
                            </h3>

                            <MainForm
                                actionType="custom"
                                table="busqueda-articulos"
                                dataForm={busquedaFormFields}
                                message_button="Buscar"
                                onSuccess={(data: any) => {
                                    console.log("Búsqueda:", data);
                                    setBusqueda(data.busqueda || "");
                                }}
                            />

                            {/* Resultados de búsqueda */}
                            {busqueda && (
                                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">
                                                {resultadosBusqueda.length} resultados encontrados
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Haga clic para agregar
                                            </span>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-gray-200">
                                        {resultadosBusqueda.map((articulo) => {
                                            const estadoStock = getEstadoStock(articulo.stock, articulo.minStock, articulo.reorderPoint);

                                            return (
                                                <div
                                                    key={articulo.id}
                                                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => handleAgregarArticulo(articulo)}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                                <Package className="h-5 w-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-800">
                                                                    {articulo.description}
                                                                </h4>
                                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                                                    <span className="flex items-center gap-1">
                                                                        <Hash className="h-3 w-3" />
                                                                        {articulo.productCode}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Filter className="h-3 w-3" />
                                                                        {articulo.categoria}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Building className="h-3 w-3" />
                                                                        {articulo.fabricante}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <div className="font-semibold text-green-600">
                                                                {formatCurrency(articulo.unitPrice)}
                                                            </div>
                                                            <div className="text-sm mt-1">
                                                                <span className={`px-2 py-1 rounded ${estadoStock.bg} ${estadoStock.color}`}>
                                                                    Stock: {articulo.stock} {estadoStock.texto}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-3">
                                                        <div className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                                            {articulo.unit}
                                                        </div>
                                                        <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1">
                                                            <Plus className="h-3 w-3" />
                                                            Agregar a orden
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Lista de artículos en la orden con DynamicTable */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <ListChecks className="h-5 w-5 text-green-600" />
                                        Artículos en la Orden
                                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                            {itemsOrden.length} items
                                        </span>
                                    </h3>

                                    <div className="flex items-center gap-2">
                                        <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 flex items-center gap-1 text-sm">
                                            <Copy className="h-3 w-3" />
                                            Copiar
                                        </button>
                                        <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 flex items-center gap-1 text-sm">
                                            <Share2 className="h-3 w-3" />
                                            Compartir
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla de artículos usando DynamicTable */}
                            <section className="p-4">
                                <DynamicTable
                                    data={itemsOrden}
                                    loading={false}
                                />
                            </section>

                            {/* Alertas de stock y totales */}
                            <div className="p-5 border-t border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Alertas */}
                                    <div>
                                        <h4 className="font-medium mb-3 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                                            Alertas del Sistema
                                        </h4>
                                        <div className="space-y-2">
                                            {lowStockItems.length > 0 && (
                                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                        <span className="text-sm font-medium text-red-800">
                                                            {lowStockItems.length} productos con stock bajo
                                                        </span>
                                                    </div>
                                                    <ul className="mt-2 text-xs text-red-700">
                                                        {lowStockItems.slice(0, 3).map(item => (
                                                            <li key={item.id} className="truncate">
                                                                • {item.description}: Stock {item.stock}, mínimo {item.minStock + item.reorderPoint}
                                                            </li>
                                                        ))}
                                                        {lowStockItems.length > 3 && (
                                                            <li className="text-red-600">... y {lowStockItems.length - 3} más</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                            {expiringItems.length > 0 && (
                                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                        <span className="text-sm font-medium text-yellow-800">
                                                            {expiringItems.length} productos por expirar (≤ 30 días)
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {lowStockItems.length === 0 && expiringItems.length === 0 && (
                                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                        <span className="text-sm font-medium text-green-800">
                                                            No hay alertas críticas
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Totales */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">IVA (16%):</span>
                                            <span className="font-medium">{formatCurrency(iva)}</span>
                                        </div>
                                        <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <span className="font-bold text-lg">Total:</span>
                                            <span className="font-bold text-2xl text-green-600">{formatCurrency(total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Condiciones y notas usando MainForm */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-purple-600" />
                                Condiciones y Notas
                            </h3>

                            <MainForm
                                actionType="custom"
                                table=""
                                dataForm={condicionesFormFields}
                                message_button="Guardar"
                                onSuccess={handleUpdateCondiciones}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Shield className="h-3 w-3" />
                                    <span>Estas condiciones se incluirán en el PDF de la orden</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Eye className="h-3 w-3" />
                                    <span>Solo visible para el equipo interno</span>
                                </div>
                            </div>
                        </div>

                        {/* Botones de acción adicionales */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
                            <div className="flex flex-wrap gap-3 justify-between items-center w-full">


                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        Guardar Borrador
                                    </button>
                                    <button
                                        type="button"
                                        className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <Send className="h-4 w-4" />
                                        Enviar al Proveedor
                                    </button>
                                </div>
                            </div>

                            {/* Estado del documento */}
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 w-full">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Última actualización: Hoy, 14:30
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                            <span className="text-yellow-600 font-medium">Borrador</span>
                                        </div>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500">Creado por: Admin</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    );
}