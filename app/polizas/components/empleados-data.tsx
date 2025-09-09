import { BentoGrid, BentoItem } from "@/components/bento-grid";

export const EmpleadosData = () => {
    return (
        <BentoGrid cols={3}>
            <BentoItem>
                <div className="flex flex-col gap-2">
                    <span className="text-sm text-gray-500">ID Empleado</span>
                    <span className="font-medium text-lg">12345</span>
                </div>
                <span className="text-green-600 font-bold text-2xl">Activo</span>
                <footer className="text-sm text-gray-400">Desde: 01/01/2020</footer>
            </BentoItem>
        </BentoGrid>
    );
};