import { Loader2 } from "lucide-react";

export const LoadingBlock: React.FC<{ message?: string }> = ({ message = "Cargando..." }) => (
    <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <div className="mt-3 text-gray-600">{message}</div>
    </div>
);