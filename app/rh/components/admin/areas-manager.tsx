"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useGetWithFiltersGeneralInIntelisisMutation } from "@/hooks/api/api_int";

interface Area {
    Departamento: string;
}

const AreasManager = () => {
    const [loading, setLoading] = useState(false);
    const [areas, setAreas] = useState<Area[]>([]);

    // PAGINACIÓN
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [hasMore, setHasMore] = useState(true);

    const [getWithFilter] =
        useGetWithFiltersGeneralInIntelisisMutation();

    const loadAreas = async () => {
        try {
            setLoading(true);

            const response = await getWithFilter({
                table: "Departamento",
                page: currentPage,
                pageSize: pageSize,
                filtros: {
                    Filtros: [],
                    FiltrosAnd: [],
                    Selects: [],
                    Order: [],
                },
            });

            if ("data" in response) {
                // ELIMINA DUPLICADOS
                const uniqueAreas: Area[] = Array.from(
                    new Map<string, Area>(
                        (response.data.data || []).map(
                            (item: Area) => [
                                item.Departamento,
                                item,
                            ]
                        )
                    ).values()
                );

                setAreas(uniqueAreas);
                setHasMore(
                    (response.data.data || []).length ===
                    pageSize
                );
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAreas();
    }, [pageSize, currentPage]);

    return (
        <>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        Panel de Areas
                    </h1>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Solo estaran disponibles las areas
                        con cuestionarios activos
                    </p>
                </div>
            </div>

            <div className="w-full">
                <div className="rounded-2xl border border-gray-300 bg-white dark:bg-gray-100 p-6 min-h-[400px]">
                    <div className="space-y-3">
                        {loading ? (
                            <p>Cargando áreas...</p>
                        ) : areas.length > 0 ? (
                            <>
                                {areas.map((area, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-xl border border-gray-300 bg-gray-50 dark:bg-gray-800"
                                    >
                                        <div>
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                                {area.Departamento}
                                            </h3>

                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Áreas con cuestionarios activos
                                            </p>
                                        </div>


                                    </div>
                                ))}

                                {/* PAGINACIÓN */}
                                <div className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                    <span>

                                    </span>
                                    <div className="flex gap-2">
                                         <button
                                            onClick={() =>
                                                setCurrentPage(
                                                    (p) => Math.max(p - 1, 1)
                                                )}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Anterior
                                        </button>
                                        <span>
                                            Página  {currentPage}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setCurrentPage(
                                                    (p) => p + 1
                                                )}
                                            disabled={!hasMore}
                                            className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p>No hay áreas disponibles</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AreasManager;