"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { formatValue } from "@/utils/constants/format-values";
import { ChartData } from "@/utils/data/sql/format-filter";

// Carga dinámica de ApexCharts para evitar problemas en el servidor de Next.js
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Tipado para las props del componente
interface DynamicChartProps {
    type: "pie" | "bar" | "line" | "area"; // Tipos válidos de gráficos
    categories: string[]; // Categorías para el eje x o etiquetas
    data: ChartData[]; // Datos de la serie
    height?: string | number; // Altura opcional del gráfico
}

const DynamicChart: React.FC<DynamicChartProps> = ({
    type,
    categories,
    data,
    height = 350,
}) => {
    // Configuración común para los gráficos
    const chartOptions: ApexOptions =
        type === "pie"
            ? {
                chart: {
                    type: "pie",
                    stacked: true
                },
                labels: categories,
                legend: { position: "bottom" },
                fill: {
                    type: "gradient",
                    gradient: { shadeIntensity: 0, opacityFrom: 2, opacityTo: 1 },
                },
                tooltip: {
                    y: {
                        formatter: (value) => (formatValue(value, "currency")),
                    },
                },
            }
            : {
                chart: {
                    type, toolbar: { show: true },
                },
                xaxis: {
                    type: 'category',
                    categories: categories,
                },
                yaxis: {
                    decimalsInFloat: 2,
                    axisBorder: {
                        show: true,
                        color: "#fff",
                    },
                    axisTicks: {
                        show: true,
                        color: "#fff",
                    },
                    floating: false,
                    forceNiceScale: true,
                    tickAmount: 3,
                    labels: { style: { fontSize: "12px" } },
                },
                dataLabels: {
                    enabled: true,
                    formatter: (value: number) => formatValue(value, "currency"), // Formateo en las etiquetas de la tabla
                },

                tooltip: {
                    y: {
                        formatter: (value) => (formatValue(value, "currency")),
                    },
                },
                legend: { position: "top", horizontalAlign: "left" },
                grid: {
                    borderColor: "#e7e7e7",
                    row: {
                        colors: ["#f3f3f3", "transparent"], // Alternar colores de fila
                        opacity: 0.5,
                    },
                },
                responsive: [{
                    breakpoint: 480,
                    options: {
                        chart: { width: 300 },
                        legend: { position: "bottom" },
                    },
                }],

            };
    // Convertir datos al formato requerido para las series del gráfico
    const series =
        type === "pie"
            ? data.flatMap((d) => d.data.map((item) => item.y))
            : data.map(d => {
                const fullData = Array(categories.length).fill(0); // Llenar con 0 en lugar de null
                d.data.forEach((item: any) => {
                    fullData[item.order - 1] = item.y;
                });
                return {
                    name: d.name,
                    data: fullData
                };
            });
    //console.log(series, categories, data);

    return <Chart options={chartOptions} series={series} type={type} height={height} />;
};

export default DynamicChart;