import { Loader2, TrendingDown, TrendingUp } from "lucide-react";

export const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    subtext?: string;
    isLoading?: boolean;
    trend?: "up" | "down" | "neutral";
    trendValue?: number;
    variant?: "default" | "success" | "warning" | "danger" | "info";
}> = ({ title, value, icon, subtext, isLoading = false, trend, trendValue, variant = "default" }) => {
    const variantColors: Record<string, string> = {
        default: "bg-white border-gray-200",
        success: "bg-green-50 border-green-200",
        warning: "bg-yellow-50 border-yellow-200",
        danger: "bg-red-50 border-red-200",
        info: "bg-blue-50 border-blue-200"
    };

    const trendIcons: Record<string, React.ReactNode> = {
        up: <TrendingUp className="h-3 w-3 text-green-600" />,
        down: <TrendingDown className="h-3 w-3 text-red-600" />,
        neutral: null
    };

    return (
        <div className={`p-3 rounded shadow-sm border ${variantColors[variant]} transition-all duration-200 ${isLoading ? 'opacity-70' : 'opacity-100'}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-medium text-gray-700">{title}</span>
                </div>
                <div className="flex items-center gap-1">
                    {trend && trendValue !== undefined && !isLoading && (
                        <div className="flex items-center gap-1 text-xs">
                            {trendIcons[trend]}
                            <span className={trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"}>
                                {Math.abs(trendValue).toFixed(1)}%
                            </span>
                        </div>
                    )}
                    {isLoading && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                </div>
            </div>
            <div className="mt-2 text-xl font-semibold text-gray-900">
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-500">Cargando...</span>
                    </div>
                ) : value}
            </div>
            {subtext && !isLoading && <div className="text-xs text-gray-400 mt-1">{subtext}</div>}
        </div>
    );
};