"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { formatValue } from "@/utils/constants/format-values";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
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
    const savedTheme = getLocalStorageItem("theme") || "light";
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
                colors: ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316"],
                tooltip: {
                    y: {
                        formatter: (value) => (formatValue(value, "currency")),
                    },
                },
            }
            : {
                chart: { type, /* toolbar: { show: true }, */ background: "transparent" },
                xaxis: {
                    categories,
                    labels: { style: { colors: savedTheme === "light" ? "#64748b" : "#fff", fontSize: "12px" } },
                },
                stroke: {
                    curve: type === "area" || type === "line" ? "smooth" : "straight",
                    width: 2,
                },
                fill: {
                    type: type === "area" ? "gradient" : "solid",
                    gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 },
                },
                plotOptions: {
                    bar: { borderRadius: 4, distributed: true, horizontal: type === "bar" && categories.length > 4 },
                },
                colors: ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316"],
                dataLabels: {
                    enabled: true,
                    formatter: (value: number) => formatValue(value, "currency"), // Formateo en las etiquetas de la tabla
                    style: {
                        colors: type === "bar" ? ['#fff'] : ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316"], // Color de los valores
                        fontSize: "10px"
                    },
                },
                tooltip: {
                    y: {
                        formatter: (value) => (formatValue(value, "currency")),
                    },
                },
                legend: { position: "bottom" },
            };

    // Convertir datos al formato requerido para las series del gráfico
    const series =
        type === "pie"
            ? data.flatMap((d) => d.data.map((item) => item.y))
            : data.map((d) => ({
                name: d.name,
                data: d.data.map((item) => item.y),
            }));

    return <Chart options={chartOptions} series={series} type={type} height={height} />;
};

export default DynamicChart;