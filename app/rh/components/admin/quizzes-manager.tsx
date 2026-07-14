"use client";

import { useEffect, useState } from "react";
import { RefreshCw, FileQuestion, Pencil, Trash2, Plus, Type, Video, CircleHelp, Binary, CircleCheckBig, } from "lucide-react";
import { useAppDispatch } from "@/hooks/selector";
import { Modal } from "@/components/modal";
import { MainForm } from "@/components/form/main-form";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import Pagination from "@/components/pagination";
import { useGetWithFiltersMutation } from "@/hooks/api/api";

const PageQuizzes = () => {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);

    /* Consulta Videos */
    const [videos, setVideos] = useState<any[]>([]);
    const [getVideos] = useGetWithFiltersMutation();

    const loadVideos = async () => {
        try {
            const response = await getVideos({
                table: "videos",
            }).unwrap();

            setVideos(response.data);
        } catch (error) {
            console.error(error);
        }
    };
    useEffect(() => {
        loadVideos();
    }, []);

    // PAGINACIÓN
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // DATOS TEMPORALES
    const quizzes = [1, 2, 3];
    const totalRecords = quizzes.length;
    const totalPages =
        Math.ceil(totalRecords / pageSize) || 1;

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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 ">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 ">
                        Panel de Cuestionarios
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gestiona cuestionarios y preguntas
                    </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-100 dark:border-gray-600"
                    >
                        <RefreshCw className={`w-4 h-4  ${loading ? "animate-spin" : ""}`} /> Recargar
                    </button>
                    <button
                        onClick={() =>
                            dispatch(
                                openModalReducer({
                                    modalName:
                                        "modalCuestionarios",
                                })
                            )
                        }
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Cuestionario
                    </button>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="rounded-2xl border border-gray-300 bg-white dark:bg-gray-700 p-6 min-h-[400px]">
                {loading ? (
                    <div className="py-10 text-center text-gray-500">
                        Cargando cuestionarios...
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">
                        No hay cuestionarios registrados
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {quizzes.map((item) => (
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
                                                Video asociado- 5 preguntas
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 rounded-lg border text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-500 dark:border-gray-100 dark:text-gray-100">
                                            <Pencil className="w-4 h-4" />
                                        </button>

                                        <button className="p-2 rounded-lg border text-red-500 hover:bg-red-50 dark:hover:bg-red-800">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* PAGINACIÓN */}
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                loading={loading}
                                setCurrentPage={setCurrentPage}
                                totalItems={totalRecords}
                                itemsPerPage={pageSize}
                                currentPageSize={pageSize}
                                onPageSizeChange={(newSize) => {
                                    setPageSize(newSize);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* MODAL CUESTIONARIO */}
            <Modal
                title="Nuevo Cuestionario"
                modalName="modalCuestionarios"
                maxWidth="xl"
            >
                <div className="px-4 py-2">
                    <div className="mb-2">
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Crea un cuestionario asociado a un video
                        </p>
                    </div>
                    <div className="flex justify-end mb-4">
                        <button
                            type="button"
                            onClick={() =>
                                dispatch(
                                    openModalReducer({
                                        modalName: "modalPreguntas",
                                    })
                                )
                            }
                            className="flex items-center gap-2 px-2 py-2 rounded-lg border border-green-100 bg-green-100"
                        >
                            <Plus className="w-4 h-4 stroke-green-500 " />
                            Agregar Preguntas
                        </button>
                    </div>

                    <MainForm
                        table="cuestionarios"
                        dataForm={[
                            {
                                require: true,
                                type: "INPUT",
                                label: "Título",
                                name: "nombre",
                                icon: <Type className="w-4 h-4 stroke-blue-400" />,
                                placeholder:
                                    "Ej: Evaluación de Seguridad Industrial",
                            },
                            {
                                require: true,
                                type: "INPUT",
                                label: "Descripcion del cuestionario",
                                name: "descripcion",
                                icon: <Pencil className="w-4 h-4 stroke-pink-400" />,
                                placeholder:
                                    "Ej: Este cuestionario evalúa el conocimiento de los empleados sobre las normas de seguridad industrial.",
                            },
                            {
                                require: true,
                                type: "NUMBER",
                                label: "Puntaje mínimo",
                                name: "calificacion",
                                icon: <Binary className="w-4 h-4 stroke-green-400" />,
                                placeholder:
                                    "70",
                            },
                            /* Consultar tabla de videos */
                            {
                                require: true,
                                type: "SELECT",
                                name: "videos_id",
                                icon: <Video className="w-4 h-4 stroke-blue-400" />,
                                options: 
                                    videos.map((video) => ({
                                    value: String(video.id),
                                        label: video.titulo,
                                    
                                    })),
                                
                                
                            },
                        ]}
                        actionType="post-general"
                        message_button="Crear Cuestionario"
                    />
                </div>
            </Modal>

            {/* MODAL PREGUNTAS */}
            <Modal
                title="Nueva Pregunta"
                modalName="modalPreguntas"
                maxWidth="lg"
            >
                <div className="px-4 py-1">
                    <MainForm
                        table="preguntas"
                        dataForm={[
                            {
                                require: true,
                                type: "INPUT",
                                label: "Pregunta",
                                name: "pregunta",
                                icon: <CircleHelp className="w-4 h-4 stroke-blue-400" />,
                            },
                            {
                                require: false,
                                type: "RADIO",
                                label: "Respuestas",
                                name: "respuestas",
                                icon: <CircleCheckBig className="w-4 h-4 stroke-green-400" />,
                            },
                        ]}
                        actionType="post-general"
                        message_button="Guardar Pregunta"
                    />
                </div>
            </Modal>
        </>
    );
};

export default PageQuizzes;