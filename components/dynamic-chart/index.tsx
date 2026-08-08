"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

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
    /** Función para formatear los valores (ej: (val) => '$' + val.toFixed(2)) */
    formatValue?: (value: number) => string;
    /** Prefijo para los valores (ej: "$") */
    valuePrefix?: string;
    /** Sufijo para los valores (ej: "%") */
    valueSuffix?: string;
    /** Número de decimales a mostrar (por defecto 2) */
    decimalPlaces?: number;
}

const DynamicChart: React.FC<DynamicChartProps> = ({
    type,
    categories,
    data,
    height = 450,
    formatValue,
    valuePrefix = "",
    valueSuffix = "",
    decimalPlaces = 2,
}) => {
    // Función de formateo por defecto
    const defaultFormatter = (value: number): string => {
        if (formatValue) return formatValue(value);
        // Si hay prefijo o sufijo, los aplicamos
        const formatted = value.toFixed(decimalPlaces);
        return `${valuePrefix}${formatted}${valueSuffix}`;
    };

    // Transforma cada serie a un arreglo de números en el orden de 'categories'
    const seriesData = data.map((serie) => {
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

    const pieSeries = seriesData.length > 0 ? seriesData[0].data : [];

    // Opciones comunes
    const baseOptions: ApexOptions = {
        chart: {
            toolbar: { show: true },
        },
        dataLabels: {
            enabled: true,
            formatter: (val: number) => defaultFormatter(val),
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
        tooltip: {
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
        },
        yaxis: {
            decimalsInFloat: decimalPlaces,
            axisBorder: { show: true, color: "#fff" },
            axisTicks: { show: true, color: "#fff" },
            floating: false,
            forceNiceScale: true,
            tickAmount: 3,
            labels: {
                style: { fontSize: "12px" },
                formatter: (val: number) => defaultFormatter(val),
            },
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
        dataLabels: {
            formatter: (val: number) => defaultFormatter(val),
        },
        tooltip: {
            y: {
                formatter: (val: number) => defaultFormatter(val),
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