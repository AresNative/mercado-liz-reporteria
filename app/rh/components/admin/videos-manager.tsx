"use client";
import { useState } from "react";
import {
    RefreshCw,
    Video,
    Pencil,
    Trash2,
    Plus,
} from "lucide-react";
import { useAppDispatch } from "@/hooks/selector";

const PageVideos = () => {
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
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        Panel de Videos
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gestiona videos de capacitación
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600"
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                        />

                        Recargar
                    </button>
                    <select className="px-4 py-2 rounded-lg border bg-white dark:bg-gray-800">
                        <option>Todas las áreas</option>
                    </select>
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Video
                    </button>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="rounded-2xl border bg-white dark:bg-gray-900 p-6 min-h-[400px]">
                <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="flex items-center justify-between p-4 rounded-xl border bg-gray-50 dark:bg-gray-800"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-gray-700 flex items-center justify-center">
                                    <Video className="w-5 h-5" />
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                        Nombre del video
                                    </h3>

                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Área asociada - Orden: 1
                                    </p>
                                </div>
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

            {/* MODAL */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                    <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                Nuevo Video
                            </h2>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Agrega un nuevo video de capacitación
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    placeholder="Título del video"
                                    className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    placeholder="Descripción del contenido"
                                    rows={3}
                                    className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    URL del Video
                                </label>
                                <input
                                    type="text"
                                    placeholder="https://youtube.com/embed/..."
                                    className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-800"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Usa el formato embed de YouTube
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Área
                                    </label>
                                    <select className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-800">
                                        <option>Selecciona un área</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Orden
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="1"
                                        className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-800"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setIsDialogOpen(false)}
                                className="px-4 py-2 rounded-lg border"
                            >
                                Cancelar
                            </button>
                            <button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">
                                Crear Video
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PageVideos;