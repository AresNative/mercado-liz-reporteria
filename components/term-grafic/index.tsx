"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { formatValue } from "@/utils/constants/format-values";
import { ChartData } from "@/utils/data/sql/format-filter";

// Carga dinámica de ApexCharts para evitar problemas en el servidor de Next.js
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Tipado para las props del componente
interface TreemapChartProps {
    data: ChartData[]; // Datos requeridos para el gráfico de treemap
    height?: string | number; // Altura opcional del gráfico
}

const TreemapChart: React.FC<TreemapChartProps> = ({ data, height = 350 }) => {
    const chartOptions: ApexOptions = {
        chart: {
            type: "treemap",
            height: height,
            toolbar: { show: false },
        },
        plotOptions: {
            treemap: {
                distributed: true,
                enableShades: true,
                shadeIntensity: 0.5,
            },
        },
        title: {
            align: "center",
            style: {
                fontSize: "20px",
                fontWeight: "bold"
            },
        },
        tooltip: {
            y: {
                formatter: (value) => (formatValue(value, "currency")),
            },
        },
    };

    return <Chart options={chartOptions} series={data} type="treemap" height={height} />;
};

export default TreemapChart;