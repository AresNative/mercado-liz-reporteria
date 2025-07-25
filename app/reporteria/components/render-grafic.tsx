import DynamicChart from "@/components/dynamic-chart";
import TreemapChart from "@/components/term-grafic";
import { ChartData } from "@/utils/data/sql/format-filter";

export interface RenderChartProps {
    type: "pie" | "bar" | "line" | "area" | "treemap";
    barData: ChartData[];
    treemapData: ChartData[];
    Categories: string[];
}

export function RenderChart({ type, barData, treemapData, Categories }: RenderChartProps) {

    switch (type) {
        case "treemap":
            return treemapData ? <TreemapChart data={treemapData} /> : <p>No hay datos disponibles</p>;
        default:
            return barData ? (
                <DynamicChart type={type} categories={Categories} data={barData} />
            ) : (
                <p>No hay datos disponibles</p>
            );
    }
}