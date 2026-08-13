"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { formatValue as formatValueUtil } from "@/utils/constants/format-values";
import { useIsDarkMode } from "./use-dark";
import { ChartCard } from "./card";

// Carga dinámica de ApexCharts para evitar problemas en el servidor de Next.js
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartData {
    name: string;
    data: { x: string; y: number }[];
}

interface TreemapChartProps {
    data: ChartData[]; // Datos requeridos para el gráfico de treemap
    /** Título mostrado en la cabecera de la tarjeta */
    title?: string;
    /** Texto secundario debajo del título */
    subtitle?: string;
    height?: string | number; // Altura opcional del gráfico
    /** Función para formatear los valores del tooltip (por defecto: moneda) */
    formatValue?: (value: number) => string;
    /** Muestra un skeleton en vez del gráfico mientras cargan los datos */
    loading?: boolean;
    /** Mensaje a mostrar cuando no hay datos */
    emptyMessage?: string;
}

// Misma paleta que DynamicChart para que ambos gráficos se sientan parte del
// mismo sistema visual, con buen contraste tanto en fondo claro como oscuro.
const CHART_COLORS = [
    "#6366f1",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#a855f7",
    "#ec4899",
    "#84cc16",
];

const TreemapChart: React.FC<TreemapChartProps> = ({
    data,
    title,
    subtitle,
    height = 350,
    formatValue,
    loading = false,
    emptyMessage,
}) => {
    const isDark = useIsDarkMode();

    const defaultFormatter = (value: number): string =>
        formatValue ? formatValue(value) : formatValueUtil(value, "currency");

    const isEmpty = data.length === 0 || data.every((serie) => serie.data.length === 0);

    // Colores dependientes del tema. ApexCharts se renderiza en SVG con
    // estilos inline, así que no basta con las clases dark: de Tailwind.
    const textColor = isDark ? "#d1d5db" : "#374151"; // gray-300 / gray-700

    const chartOptions: ApexOptions = {
        colors: CHART_COLORS,
        chart: {
            type: "treemap",
            height,
            toolbar: { show: false },
            background: "transparent",
            foreColor: textColor,
        },
        theme: { mode: isDark ? "dark" : "light" },
        plotOptions: {
            treemap: {
                distributed: true,
                enableShades: true,
                shadeIntensity: 0.5,
            },
        },
        dataLabels: {
            style: {
                fontSize: "12px",
                colors: ["#ffffff"],
            },
        },
        tooltip: {
            theme: isDark ? "dark" : "light",
            y: {
                formatter: (value) => defaultFormatter(value),
            },
        },
    };
    // Nota: el título ya no se define aquí (el "title" original de ApexCharts
    // nunca se mostraba porque le faltaba la propiedad "text"). Ahora el
    // título/subtítulo se muestran de forma consistente vía <ChartCard>,
    // igual que en DynamicChart.

    return (
        <ChartCard
            title={title}
            subtitle={subtitle}
            height={height}
            isEmpty={isEmpty}
            loading={loading}
            emptyMessage={emptyMessage}
        >
            <Chart options={chartOptions} series={data} type="treemap" height={height} />
        </ChartCard>
    );
};

export default TreemapChart;