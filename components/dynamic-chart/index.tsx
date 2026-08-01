"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { formatValue } from "@/utils/constants/format-values";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartData {
    name: string;
    data: (number | { x: string; y: number })[];
}

interface DynamicChartProps {
    type: "pie" | "bar" | "line" | "area";
    categories: string[];
    data: ChartData[];
    height?: string | number;
}

const DynamicChart: React.FC<DynamicChartProps> = ({
    type,
    categories,
    data,
    height = 350,
}) => {
    // Transforma cada serie a un arreglo de números en el orden de 'categories'
    const seriesData = data.map((serie) => {
        const firstItem = serie.data[0];
        // Si el primer elemento es un número, asumimos que ya están en orden
        if (typeof firstItem === "number") {
            return {
                name: serie.name,
                data: serie.data as number[],
            };
        }
        // Si son objetos {x, y}, los alineamos con categories
        const items = serie.data as { x: string; y: number }[];
        const aligned = categories.map((cat) => {
            const found = items.find((item) => item.x === cat);
            return found ? found.y : 0;
        });
        return {
            name: serie.name,
            data: aligned,
        };
    });

    // Para gráficos de tipo pie, usamos la primera serie como valores
    const pieSeries = seriesData.length > 0 ? seriesData[0].data : [];

    // Opciones comunes
    const baseOptions: ApexOptions = {
        chart: {
            toolbar: { show: true },
        },
        dataLabels: {
            enabled: true,
            formatter: (value: number) => formatValue(value, "currency"),
        },
        tooltip: {
            y: {
                formatter: (value) => formatValue(value, "currency"),
            },
        },
        legend: { position: "top", horizontalAlign: "left" },
        grid: {
            borderColor: "#e7e7e7",
            row: {
                colors: ["#f3f3f3", "transparent"],
                opacity: 0.5,
            },
        },
        responsive: [
            {
                breakpoint: 480,
                options: {
                    chart: { width: 300 },
                    legend: { position: "bottom" },
                },
            },
        ],
    };

    // Opciones específicas para gráficos de ejes (bar, line, area)
    const axisOptions: ApexOptions = {
        ...baseOptions,
        chart: {
            ...baseOptions.chart,
            type: type as "bar" | "line" | "area",
        },
        xaxis: {
            type: "category",
            categories: categories,
        },
        yaxis: {
            decimalsInFloat: 2,
            axisBorder: { show: true, color: "#fff" },
            axisTicks: { show: true, color: "#fff" },
            floating: false,
            forceNiceScale: true,
            tickAmount: 3,
            labels: { style: { fontSize: "12px" } },
        },
    };

    // Opciones para gráfico de pastel
    const pieOptions: ApexOptions = {
        chart: {
            type: "pie",
        },
        labels: categories,
        legend: { position: "bottom" },
        fill: {
            type: "gradient",
            gradient: { shadeIntensity: 0, opacityFrom: 2, opacityTo: 1 },
        },
        tooltip: {
            y: {
                formatter: (value) => formatValue(value, "currency"),
            },
        },
    };

    if (type === "pie") {
        return (
            <Chart
                options={pieOptions}
                series={pieSeries}
                type="pie"
                height={height}
            />
        );
    }

    return (
        <Chart
            options={axisOptions}
            series={seriesData}
            type={type}
            height={height}
        />
    );
};

export default DynamicChart;