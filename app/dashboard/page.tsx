"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAppDispatch } from "@/hooks/selector";
import { getCookieinPage } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { useGetWithFiltersGeneralMutation } from "@/hooks/reducers/api";
import { LoadingSection } from "@/template/loading-screen";
import Card from "@/components/card"; // Tu componente personalizado
import { TrendingUp, Users, Package, DollarSign, ShoppingCart, BarChart3, RefreshCw } from "lucide-react";

// ✅ ApexCharts con carga dinámica (Next.js)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Interfaces para tipado fuerte
interface DashboardStats {
    totalVentas: number;
    totalCompras: number;
    totalEmpleados: number;
    nominasPendientes: number;
    productosStockBajo: number;
    valorInventario: number;
}

interface VentasMensuales {
    mes: string;
    ventas: number;
    compras: number;
}

interface ProductoStockBajo {
    id: number;
    nombre: string;
    cantidad: number;
    stockMinimo: number;
}

export default function DashboardGeneral() {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const dispatch = useAppDispatch();
    const [getWithFilter] = useGetWithFiltersGeneralMutation();

    const [stats, setStats] = useState<DashboardStats>({
        totalVentas: 0,
        totalCompras: 0,
        totalEmpleados: 0,
        nominasPendientes: 0,
        productosStockBajo: 0,
        valorInventario: 0
    });

    const [ventasMensuales, setVentasMensuales] = useState<VentasMensuales[]>([]);
    const [productosStockBajo, setProductosStockBajo] = useState<ProductoStockBajo[]>([]);

    // 🔁 Cargar el rol del usuario en el cliente
    useEffect(() => {
        const loadUserRole = async () => {
            try {
                const role = await getCookieinPage("user-role") ?? getLocalStorageItem("user-role") ?? "none";
                setUserRole(role);
            } catch (error) {
                console.error("Error loading user role:", error);
                setUserRole("none");
            } finally {
                setIsLoading(false);
            }
        };

        loadUserRole();
    }, []);

    // 🔁 Cargar datos del dashboard
    const loadDashboardData = useCallback(async () => {
        if (!userRole) return;

        setIsLoadingData(true);
        try {
            // Ejecutar todas las consultas en paralelo
            const [
                ventasResponse,
                comprasResponse,
                empleadosResponse,
                nominasResponse,
                inventarioResponse,
                ventasMensualesResponse,
                stockBajoResponse
            ] = await Promise.all([
                // Total ventas del mes
                userRole === 'admin' || userRole === 'ventas' ? getWithFilter({
                    table: "ventas",
                    pageSize: "1",
                    page: 1,
                    filtros: {
                        Selects: [],
                        /* Agregaciones: [
                            { Key: "total", Operation: "SUM", Alias: "total_ventas" }
                        ], */
                        Filtros: [
                            {
                                Key: "fecha",
                                Value: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                                Operator: ">="
                            }
                        ]
                    }
                }) : Promise.resolve({ data: { data: [{ total_ventas: 0 }] } }),

                // Total compras del mes
                userRole === 'admin' ? getWithFilter({
                    table: "compras",
                    pageSize: "1",
                    page: 1,
                    filtros: {
                        Selects: [],
                        /* Agregaciones: [
                            { Key: "total", Operation: "SUM", Alias: "total_compras" }
                        ], */
                        Filtros: [
                            {
                                Key: "fecha",
                                Value: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                                Operator: ">="
                            }
                        ]
                    }
                }) : Promise.resolve({ data: { data: [{ total_compras: 0 }] } }),

                // Total empleados activos
                userRole === 'admin' ? getWithFilter({
                    table: "empleados",
                    pageSize: "1",
                    page: 1,
                    filtros: {
                        Selects: [],
                        /* Agregaciones: [
                            { Key: "id", Operation: "COUNT", Alias: "total_empleados" }
                        ], */
                        Filtros: [
                            { Key: "estado", Value: "Activo", Operator: "=" }
                        ]
                    }
                }) : Promise.resolve({ data: { data: [{ total_empleados: 0 }] } }),

                // Nóminas pendientes
                userRole === 'admin' ? getWithFilter({
                    table: "nominas",
                    pageSize: "1",
                    page: 1,
                    filtros: {
                        Selects: [],
                        /* Agregaciones: [
                            { Key: "id", Operation: "COUNT", Alias: "nominas_pendientes" }
                        ], */
                        Filtros: [
                            { Key: "estado", Value: "pendiente", Operator: "=" }
                        ]
                    }
                }) : Promise.resolve({ data: { data: [{ nominas_pendientes: 0 }] } }),

                // Valor total del inventario
                userRole === 'admin' ? getWithFilter({
                    table: "inventario",
                    pageSize: "1",
                    page: 1,
                    filtros: {
                        Selects: [],
                        /* Agregaciones: [
                            {
                                Key: "(inventario.cantidad * historia_costos.costo)",
                                Operation: "SUM",
                                Alias: "valor_inventario"
                            }
                        ], */
                        Filtros: []
                    }
                }) : Promise.resolve({ data: { data: [{ valor_inventario: 0 }] } }),

                // Ventas mensuales para gráfica (últimos 6 meses)
                userRole === 'admin' || userRole === 'ventas' ? getWithFilter({
                    table: "ventas",
                    pageSize: "100",
                    page: 1,
                    filtros: {
                        Selects: [
                            { Key: "MONTH(fecha)", Alias: "mes" },
                            { Key: "YEAR(fecha)", Alias: "año" }
                        ],
                        /* Agregaciones: [
                            { Key: "total", Operation: "SUM", Alias: "ventas_mensuales" }
                        ], */
                        Filtros: [
                            {
                                Key: "fecha",
                                Value: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1).toISOString(),
                                Operator: ">="
                            }
                        ],
                        Order: [
                            { Key: "año", Direction: "ASC" },
                            { Key: "mes", Direction: "ASC" }
                        ]
                    }
                }) : Promise.resolve({ data: { data: [] } }),

                // Productos con stock bajo
                userRole === 'admin' ? getWithFilter({
                    table: "inventario",
                    pageSize: "10",
                    page: 1,
                    filtros: {
                        Selects: [
                            { Key: "articulos.id" },
                            { Key: "articulos.nombre" },
                            { Key: "inventario.cantidad" },
                            { Key: "articulos.stock_minimo" }
                        ],
                        Filtros: [
                            {
                                Key: "inventario.cantidad",
                                Value: 10,
                                Operator: "<="
                            },
                            {
                                Key: "inventario.cantidad",
                                Value: 0,
                                Operator: ">"
                            }
                        ],
                        Order: [
                            { Key: "inventario.cantidad", Direction: "ASC" }
                        ]
                    }
                }) : Promise.resolve({ data: { data: [] } })
            ]);

            // Procesar estadísticas
            const ventasData = 'data' in ventasResponse ? ventasResponse.data?.data?.[0] : { total_ventas: 0 };
            const comprasData = 'data' in comprasResponse ? comprasResponse.data?.data?.[0] : { total_compras: 0 };
            const empleadosData = 'data' in empleadosResponse ? empleadosResponse.data?.data?.[0] : { total_empleados: 0 };
            const nominasData = 'data' in nominasResponse ? nominasResponse.data?.data?.[0] : { nominas_pendientes: 0 };
            const inventarioData = 'data' in inventarioResponse ? inventarioResponse.data?.data?.[0] : { valor_inventario: 0 };
            const stockBajoData = 'data' in stockBajoResponse ? stockBajoResponse.data?.data : [];

            setStats({
                totalVentas: ventasData.total_ventas || 0,
                totalCompras: comprasData.total_compras || 0,
                totalEmpleados: empleadosData.total_empleados || 0,
                nominasPendientes: nominasData.nominas_pendientes || 0,
                productosStockBajo: stockBajoData.length,
                valorInventario: inventarioData.valor_inventario || 0
            });

            // Procesar datos para gráfica de ventas mensuales
            if ('data' in ventasMensualesResponse && ventasMensualesResponse.data?.data) {
                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                const ventasMensualesData = ventasMensualesResponse.data.data.map((item: any) => ({
                    mes: `${meses[item.mes - 1]} ${item.año}`,
                    ventas: item.ventas_mensuales || 0,
                    compras: 0 // Se podría agregar consulta similar para compras
                }));
                setVentasMensuales(ventasMensualesData);
            }

            // Procesar productos con stock bajo
            if ('data' in stockBajoResponse && stockBajoResponse.data?.data) {
                setProductosStockBajo(stockBajoResponse.data.data.map((item: any) => ({
                    id: item.id,
                    nombre: item.nombre,
                    cantidad: item.cantidad,
                    stockMinimo: item.stock_minimo
                })));
            }

        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setIsLoadingData(false);
        }
    }, [userRole, getWithFilter]);

    useEffect(() => {
        if (userRole) {
            loadDashboardData();
        }
    }, [userRole, loadDashboardData]);

    // 🔐 Verificación de acceso basada en el layout
    if (isLoading) {
        return <LoadingSection message="Cargando dashboard..." />;
    }

    if (userRole !== "admin" && userRole !== "ventas") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso no autorizado</h1>
                    <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-6 space-y-6"
        >
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard General</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                        Resumen completo de la operación de la empresa
                    </p>
                </div>
                <button
                    onClick={loadDashboardData}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    disabled={isLoadingData}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                    {isLoadingData ? "Actualizando..." : "Actualizar"}
                </button>
            </div>

            {isLoadingData ? (
                <LoadingSection message="Cargando datos del dashboard..." />
            ) : (
                <>
                    {/* Estadísticas Principales - USANDO TU COMPONENTE CARD */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Ventas */}
                        {(userRole === 'admin' || userRole === 'ventas') && (
                            <Card
                                title="Ventas del Mes"
                                value={`$${stats.totalVentas.toLocaleString()}`}
                                subText="+12% vs mes anterior"
                                icon={<TrendingUp className="h-6 w-6 text-white" />}
                            />
                        )}

                        {/* Compras */}
                        {userRole === 'admin' && (
                            <Card
                                title="Compras del Mes"
                                value={`$${stats.totalCompras.toLocaleString()}`}
                                subText="+8% vs mes anterior"
                                icon={<ShoppingCart className="h-6 w-6 text-white" />}
                            />
                        )}

                        {/* Empleados */}
                        {userRole === 'admin' && (
                            <Card
                                title="Empleados Activos"
                                value={stats.totalEmpleados}
                                subText="+2 este mes"
                                icon={<Users className="h-6 w-6 text-white" />}
                            />
                        )}

                        {/* Stock Bajo */}
                        {userRole === 'admin' && (
                            <Card
                                title="Stock Bajo"
                                value={stats.productosStockBajo}
                                subText="Necesitan reabastecimiento"
                                icon={<Package className="h-6 w-6 text-white" />}
                            />
                        )}

                        {/* Nóminas Pendientes */}
                        {userRole === 'admin' && (
                            <Card
                                title="Nóminas Pendientes"
                                value={stats.nominasPendientes}
                                subText="Por procesar"
                                icon={<DollarSign className="h-6 w-6 text-white" />}
                            />
                        )}

                        {/* Valor Inventario */}
                        {userRole === 'admin' && (
                            <Card
                                title="Valor Inventario"
                                value={`$${stats.valorInventario.toLocaleString()}`}
                                subText="Valor total en stock"
                                icon={<Package className="h-6 w-6 text-white" />}
                            />
                        )}
                    </div>

                    {/* Gráficas y Tablas */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gráfica de Ventas Mensuales */}
                        {(userRole === 'admin' || userRole === 'ventas') && ventasMensuales.length > 0 && (
                            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-hidden shadow rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ventas Mensuales</h3>
                                <Chart
                                    options={{
                                        chart: {
                                            type: 'line',
                                            toolbar: { show: false },
                                            foreColor: '#6B7280'
                                        },
                                        xaxis: {
                                            categories: ventasMensuales.map(v => v.mes)
                                        },
                                        colors: ['#8B5CF6'],
                                        stroke: {
                                            curve: 'smooth'
                                        },
                                        theme: {
                                            mode: 'light'
                                        }
                                    }}
                                    series={[{
                                        name: 'Ventas',
                                        data: ventasMensuales.map(v => v.ventas)
                                    }]}
                                    type="line"
                                    height={300}
                                />
                            </div>
                        )}

                        {/* Productos con Stock Bajo */}
                        {userRole === 'admin' && productosStockBajo.length > 0 && (
                            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-hidden shadow rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Productos con Stock Bajo</h3>
                                <div className="space-y-3">
                                    {productosStockBajo.map((producto) => (
                                        <div key={producto.id} className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm text-gray-900 dark:text-white">{producto.nombre}</p>
                                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                                    Stock: {producto.cantidad} / Mín: {producto.stockMinimo}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${producto.cantidad === 0
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                }`}>
                                                {producto.cantidad === 0 ? 'Agotado' : 'Bajo Stock'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resumen para Ventas */}
                    {userRole === 'ventas' && (
                        <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-hidden shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumen de Ventas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card
                                    title="Ventas Totales"
                                    value={`$${stats.totalVentas.toLocaleString()}`}
                                    icon={<TrendingUp className="h-6 w-6 text-white" />}
                                />
                                <Card
                                    title="Meses Analizados"
                                    value={ventasMensuales.length}
                                    icon={<BarChart3 className="h-6 w-6 text-white" />}
                                />
                                <Card
                                    title="Promedio Mensual"
                                    value={`$${(stats.totalVentas / ventasMensuales.length || 0).toLocaleString()}`}
                                    icon={<DollarSign className="h-6 w-6 text-white" />}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
}