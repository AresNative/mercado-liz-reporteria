"use client";

import { useState } from "react";
import {
    FileQuestion,
    Pencil,
    Trash2,
    Plus,
} from "lucide-react";
import { useAppDispatch } from "@/hooks/selector";
import Pagination from "@/components/pagination";

const PageQuizzes = () => {
    const dispatch = useAppDispatch();

    const [loading, setLoading] = useState(false);

    const [isDialogOpen, setIsDialogOpen] =
        useState(false);

    const [
        isQuestionDialogOpen,
        setIsQuestionDialogOpen,
    ] = useState(false);

    // PAGINACIÓN
    const [currentPage, setCurrentPage] =
        useState(1);

    const [pageSize, setPageSize] =
        useState(10);

    const [totalPages, setTotalPages] =
        useState(1);

    const [totalItems, setTotalItems] =
        useState(3);

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
                        Panel de Cuestionarios
                    </h1>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gestiona cuestionarios y preguntas
                    </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() =>
                            setIsDialogOpen(true)
                        }
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Cuestionario
                    </button>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="rounded-2xl border border-gray-300 bg-white dark:bg-gray-900 p-6 min-h-[400px]">
                <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="flex items-center justify-between p-4 rounded-xl border border-gray-300 bg-gray-50 dark:bg-gray-800"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center">
                                    <FileQuestion className="w-5 h-5" />
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                        Nombre del cuestionario
                                    </h3>

                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Video asociado - 5 preguntas
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

                    {/* PAGINACIÓN */}
                    <div className="mt-6">
                        <Pagination
                            currentPage={currentPage}
                            loading={loading}
                            setCurrentPage={
                                setCurrentPage
                            }
                            totalPages={totalPages}
                            totalItems={totalItems}
                            itemsPerPage={pageSize}
                            currentPageSize={pageSize}
                            onPageSizeChange={(
                                newPageSize
                            ) => {
                                setPageSize(
                                    newPageSize
                                );
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* MODAL CUESTIONARIO */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                    <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                Nuevo Cuestionario
                            </h2>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Crea un cuestionario para un
                                video
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Título
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="Título del cuestionario"
                                        className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Puntaje mínimo
                                    </label>

                                    <input
                                        type="number"
                                        placeholder="70"
                                        className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Video Asociado
                                </label>

                                <select className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-800">
                                    <option>
                                        Selecciona un video
                                    </option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                        Preguntas
                                    </label>

                                    <button
                                        onClick={() =>
                                            setIsQuestionDialogOpen(
                                                true
                                            )
                                        }
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Agregar
                                        Pregunta
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {[1, 2].map(
                                        (item) => (
                                            <div
                                                key={
                                                    item
                                                }
                                                className="flex items-center justify-between p-3 rounded-xl border bg-gray-50 dark:bg-gray-800"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        Pregunta
                                                        de
                                                        ejemplo
                                                    </p>

                                                    <p className="text-xs text-gray-500">
                                                        4
                                                        opciones
                                                        -
                                                        Correcta:
                                                        A
                                                    </p>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button className="p-2 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>

                                                    <button className="p-2 rounded-lg border text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() =>
                                    setIsDialogOpen(
                                        false
                                    )
                                }
                                className="px-4 py-2 rounded-lg border"
                            >
                                Cancelar
                            </button>

                            <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                                Crear Cuestionario
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PREGUNTA */}
            {isQuestionDialogOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                Nueva Pregunta
                            </h2>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Define la pregunta y
                                respuestas
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Pregunta
                                </label>

                                <input
                                    type="text"
                                    placeholder="Escribe la pregunta"
                                    className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-800"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium">
                                    Opciones
                                </label>

                                {["A", "B", "C", "D"].map(
                                    (
                                        letter,
                                        index
                                    ) => (
                                        <div
                                            key={
                                                index
                                            }
                                            className="flex items-center gap-2"
                                        >
                                            <button className="flex h-8 w-8 items-center justify-center rounded-full border">
                                                {
                                                    letter
                                                }
                                            </button>

                                            <input
                                                type="text"
                                                placeholder={`Opción ${letter}`}
                                                className="flex-1 rounded-lg border px-3 py-2 bg-white dark:bg-gray-800"
                                            />
                                        </div>
                                    )
                                )}

                                <p className="text-xs text-gray-500">
                                    Selecciona la
                                    respuesta correcta
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() =>
                                    setIsQuestionDialogOpen(
                                        false
                                    )
                                }
                                className="px-4 py-2 rounded-lg border"
                            >
                                Cancelar
                            </button>

                            <button className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white">
                                Guardar Pregunta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PageQuizzes;