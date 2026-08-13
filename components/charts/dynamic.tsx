"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useMemo } from "react";
import { useIsDarkMode } from "./use-dark";
import { ChartCard } from "./card";

// Carga dinámica de ApexCharts para evitar problemas en el servidor de Next.js
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartData {
    name: string;
    data: (number | { x: string; y: number })[];
}

interface DynamicChartProps {
    type: "pie" | "bar" | "line" | "area";
    categories: string[];
    data: ChartData[];
    /** Título mostrado en la cabecera de la tarjeta (no en el SVG del gráfico) */
    title?: string;
    /** Texto secundario debajo del título */
    subtitle?: string;
    height?: string | number;
    /** Función para formatear los valores (ej: (val) => '$' + val.toFixed(2)) */
    formatValue?: (value: number) => string;
    /** Prefijo para los valores (ej: "$") */
    valuePrefix?: string;
    /** Sufijo para los valores (ej: "%") */
    valueSuffix?: string;
    /** Número de decimales a mostrar (por defecto 2) */
    decimalPlaces?: number;
    /** Muestra un skeleton en vez del gráfico mientras cargan los datos */
    loading?: boolean;
    /** Mensaje a mostrar cuando no hay datos */
    emptyMessage?: string;
}

// Paleta compartida con TreemapChart para que ambos gráficos se sientan parte
// del mismo sistema visual, con buen contraste tanto en fondo claro como oscuro.
const CHART_COLORS = [
    "#6366f1", // indigo-500
    "#22c55e", // green-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#06b6d4", // cyan-500
    "#a855f7", // purple-500
    "#ec4899", // pink-500
    "#84cc16", // lime-500
];

const DynamicChart: React.FC<DynamicChartProps> = ({
    type,
    categories,
    data,
    title,
    subtitle,
    height = 350,
    formatValue,
    valuePrefix = "",
    valueSuffix = "",
    decimalPlaces = 2,
    loading = false,
    emptyMessage,
}) => {
    const isDark = useIsDarkMode();

    // Función de formateo por defecto
    const defaultFormatter = (value: number): string => {
        if (formatValue) return formatValue(value);
        if (value === undefined || value === null || Number.isNaN(value)) return "-";
        const formatted = value.toFixed(decimalPlaces);
        return `${valuePrefix}${formatted}${valueSuffix}`;
    };

    // Transforma cada serie a un arreglo de números en el orden de 'categories'
    const seriesData = useMemo(() => {
        return data.map((serie) => {
            const firstItem = serie.data[0];
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
    }, [data, categories]);

    const pieSeries = seriesData.length > 0 ? seriesData[0].data : [];
    const isEmpty = categories.length === 0 || seriesData.length === 0;

    // Colores dependientes del tema. ApexCharts se renderiza en SVG con
    // estilos inline, así que no basta con las clases dark: de Tailwind:
    // hay que pasarle el modo explícitamente.
    const textColor = isDark ? "#d1d5db" : "#374151"; // gray-300 / gray-700
    const mutedTextColor = isDark ? "#9ca3af" : "#6b7280"; // gray-400 / gray-500
    const gridColor = isDark ? "#3f3f46" : "#e5e7eb"; // zinc-700 / gray-200

    // Opciones comunes
    const baseOptions: ApexOptions = {
        colors: CHART_COLORS,
        chart: {
            toolbar: { show: true },
            background: "transparent",
            foreColor: textColor,
        },
        theme: { mode: isDark ? "dark" : "light" },
        dataLabels: {
            enabled: true,
            formatter: (val: number) => defaultFormatter(val),
        },
        legend: {
            position: "top",
            horizontalAlign: "left",
            labels: { colors: textColor },
        },
        grid: {
            borderColor: gridColor,
            row: {
                colors: isDark ? ["#27272a", "transparent"] : ["#f3f3f3", "transparent"],
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
        tooltip: {
            theme: isDark ? "dark" : "light",
            y: {
                formatter: (val: number) => defaultFormatter(val),
            },
        },
    };

    // Opciones específicas para gráficos de ejes (bar, line, area)
    const axisOptions: ApexOptions = {
        ...baseOptions,
        chart: {
            ...baseOptions.chart,
            type: type as "bar" | "line" | "area",
            stacked: true,
        },
        xaxis: {
            type: "category",
            categories: categories,
            labels: { style: { colors: mutedTextColor, fontSize: "12px" } },
            axisBorder: { color: gridColor },
            axisTicks: { color: gridColor },
        },
        yaxis: {
            decimalsInFloat: decimalPlaces,
            axisBorder: { show: true, color: gridColor },
            axisTicks: { show: true, color: gridColor },
            floating: false,
            forceNiceScale: true,
            tickAmount: 3,
            labels: {
                style: { colors: mutedTextColor, fontSize: "12px" },
                formatter: (val: number) => defaultFormatter(val),
            },
        },
    };

    // Opciones para gráfico de pastel
    const pieOptions: ApexOptions = {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: "pie" },
        labels: categories,
        legend: { position: "bottom", labels: { colors: textColor } },
        // Borde entre porciones: blanco en claro, del color de la card en oscuro,
        // para que no se vean rebordes blancos "flotando" sobre el fondo oscuro.
        stroke: { colors: [isDark ? "#18181b" : "#ffffff"] },
        fill: {
            type: "gradient",
            // opacityFrom/opacityTo deben ir entre 0 y 1 (antes había un 2 inválido)
            gradient: { shadeIntensity: 0.4, opacityFrom: 0.9, opacityTo: 0.6 },
        },
        dataLabels: {
            enabled: true,
            style: { colors: ["#ffffff"] },
            formatter: (val: number) => defaultFormatter(val),
        },
        tooltip: {
            theme: isDark ? "dark" : "light",
            y: {
                formatter: (val: number) => defaultFormatter(val),
            },
        },
    };

    return (
        <ChartCard
            title={title}
            subtitle={subtitle}
            height={height}
            isEmpty={isEmpty}
            loading={loading}
            emptyMessage={emptyMessage}
        >
            {type === "pie" ? (
                <Chart options={pieOptions} series={pieSeries} type="pie" height={height} />
            ) : (
                <Chart options={axisOptions} series={seriesData} type={type} height={height} />
            )}
        </ChartCard>
    );
};

export default DynamicChart;