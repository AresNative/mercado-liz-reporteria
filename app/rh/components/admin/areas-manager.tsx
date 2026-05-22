"use client";

import { useState } from "react";
import { Pencil,Trash2} from "lucide-react";
import { useAppDispatch } from "@/hooks/selector";

const AreasManager = () => {
    const dispatch = useAppDispatch();

    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleRefresh = async () => {
        try {
            setLoading(true);

            // lógica futura
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        Panel de Areas
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Solo estaran disponibles las areas con cuentionarios activos
                    </p>
                </div>
            </div>

            <div className="w-full">
                {/* CONTENIDO */}
                <div className="rounded-2xl border bg-white dark:bg-gray-900 p-6 min-h-[400px]">
                    <div className="space-y-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="flex items-center justify-between p-4 rounded-xl border bg-gray-50 dark:bg-gray-800"
                            >
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                        Nombre del Área
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Descripción del área
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 rounded-lg border text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AreasManager;