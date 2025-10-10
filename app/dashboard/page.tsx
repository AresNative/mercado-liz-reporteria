"use client";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { getCookieinPage } from "@/utils/functions/cookies";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { useEffect, useState } from "react";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { BarChart3, CalendarCheck, DollarSign, TrendingUp } from "lucide-react";
import { useGetWithFiltersGeneralMutation } from "@/hooks/reducers/api";
import Badge from "@/components/badge";
import { LoadingScreen } from "@/template/loading-screen";

// ✅ ApexCharts con carga dinámica (Next.js)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function DashboardGeneral() {
    const [role, setrole] = useState("none");
    const [getWithFilter, { isLoading, data }] = useGetWithFiltersGeneralMutation();

    async function obtenerDatosSegunRol() {
        // Aquí puedes definir diferentes conjuntos de datos según el rol
        const userRole = await getCookieinPage("user-role") ?? getLocalStorageItem("user-role") ?? "none";
        userRole && setrole(userRole);
    }
    useEffect(() => {
        obtenerDatosSegunRol();
        getWithFilter({
            table: `articulos
                    left join codigos_barras on articulos.id = codigos_barras.articulo_id
                    left join historia_costos on articulos.id = historia_costos.articulo_id
                    left join categorias on articulos.categoria_id = categorias.id
                    left join unidades on articulos.unidad_id = unidades.id
                    left join inventario on articulos.id = inventario.articulo_id
                    left join imagenes on articulos.id = imagenes.id_ref and imagenes.tabla = 'articulos'`,
            pageSize: 10,
            page: 1,
            tag: 'test',
            filtros: {
                Selects: [
                    { key: "articulos.id" },
                    { key: "articulos.nombre" },
                    { key: "articulos.descripcion" },
                    { key: "articulos.precio" },
                    { key: "historia_costos.costo" },
                    { key: "inventario.cantidad" },
                    { key: "unidades.nombre", alias: "unidad_nombre" },
                    { key: "categorias.nombre", alias: "categoria_nombre" },
                    { key: "codigos_barras.codigo_barras" },
                    { key: "imagenes.url" }
                ],
                Order: [
                    { Key: "articulos.nombre", Direction: "Asc" }
                ]
            }
        });
    }, []);
    if (isLoading) return <LoadingScreen />;
    console.log(data);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-6 space-y-6"
        >
            {/* Header */}
            <section className="flex flex-col gap-4 md:gap-0">
                <header>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resumen diario</h1>
                    <Badge
                        text={role === "admin" ? "Administración" : role === "ventas" ? "Ventas" : role === "compras" ? "Compras" : role === "almacen" ? "Almacén" : "Usuario"}
                        color="yellow" />
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mt-6"
                >
                    <BentoGrid cols={4} rows={7}>
                        <BentoItem
                            iconRight
                            title="Gestión de Proyectos"
                            icon={<TrendingUp className="size-6 text-green-600" />}
                            className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                        >
                            <div className="absolute bottom-1 right-4">
                                {/* <a href="/proyectos" className="inline-flex hover:underline items-center text-green-600">
                                    Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                                </a> */}
                            </div>
                        </BentoItem>
                        <BentoItem
                            iconRight
                            title="Gestión de Proyectos"
                            icon={<DollarSign className="size-6 text-green-600" />}
                            className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                        >
                            <div className="absolute bottom-1 right-4">
                                {/* <a href="/proyectos" className="inline-flex hover:underline items-center text-green-600">
                                    Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                                </a> */}
                            </div>
                        </BentoItem>
                        <BentoItem
                            iconRight
                            title="Gestión de Proyectos"
                            icon={<BarChart3 className="size-6 text-green-600" />}
                            className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                        >
                            <div className="absolute bottom-1 right-4">
                                {/* <a href="/proyectos" className="inline-flex hover:underline items-center text-green-600">
                                    Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                                </a> */}
                            </div>
                        </BentoItem>
                        <BentoItem
                            iconRight
                            title="Gestión de Proyectos"
                            icon={<CalendarCheck className="size-6 text-green-600" />}
                            className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                        >
                            <div className="absolute bottom-1 right-4">
                                {/* <a href="/proyectos" className="inline-flex hover:underline items-center text-green-600">
                                    Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                                </a> */}
                            </div>
                        </BentoItem>
                        <BentoItem
                            colSpan={2}
                            rowSpan={2}
                            title="Gestión de Proyectos"
                            className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                        >
                            <div className="absolute bottom-1 right-4">
                                {/* <a href="/proyectos" className="inline-flex hover:underline items-center text-green-600">
                                    Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                                </a> */}
                            </div>
                        </BentoItem>
                        <BentoItem
                            colSpan={2}
                            rowSpan={2}
                            title="Gestión de Proyectos"
                            className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                        >
                            <div className="absolute bottom-1 right-4">
                                {/* <a href="/proyectos" className="inline-flex hover:underline items-center text-green-600">
                                    Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                                </a> */}
                            </div>
                        </BentoItem>

                        <BentoItem
                            colSpan={4}
                            rowSpan={2}
                            title="Gestión de Proyectos"
                            className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                        >
                            <div className="absolute bottom-1 right-4">
                                {/* <a href="/proyectos" className="inline-flex hover:underline items-center text-green-600">
                                    Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                                </a> */}
                            </div>
                        </BentoItem>

                        {(role === "admin" || role === "ventas") ? (
                            <>
                                <BentoItem
                                    iconRight
                                    colSpan={2}
                                    rowSpan={2}
                                    title="Gestión de Proyectos"
                                    icon={<CalendarCheck className="size-6 text-green-600" />}
                                    className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                                >
                                    <div className="absolute bottom-1 right-4">
                                        {/* <a href="/proyectos" className="inline-flex hover:underline items-center text-green-600">
                    Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a> */}
                                    </div>
                                </BentoItem>
                                <BentoItem
                                    iconRight
                                    colSpan={2}
                                    rowSpan={2}
                                    title="Gestión de Proyectos"
                                    icon={<CalendarCheck className="size-6 text-green-600" />}
                                    className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                                >
                                    <div className="absolute bottom-1 right-4">
                                        {/* <a href="/proyectos" className="inline-flex hover:underline items-center text-green-600">
                    Explorar <ArrowRightIcon className="ml-1 h-4 w-4" />
                </a> */}
                                    </div>
                                </BentoItem>
                            </>
                        ) : null}
                    </BentoGrid>
                </motion.div>

            </section>
        </motion.div>
    );
}