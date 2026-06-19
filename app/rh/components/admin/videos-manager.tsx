"use client";

import { useState } from "react";
import {
    RefreshCw,
    Video,
    Pencil,
    Trash2,
    Plus,
    Link,
    Type,
} from "lucide-react";
import { useAppDispatch } from "@/hooks/selector";
import { Modal } from "@/components/modal";
import { MainForm } from "@/components/form/main-form";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import Pagination from "@/components/pagination";

const PageVideos = () => {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    // PAGINACIÓN
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    // DATOS TEMPORALES
    const videos = [1, 2, 3];
    const totalRecords = videos.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;

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
                {/* ACCIONES */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600"
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${loading ? "animate-spin" : ""
                                }`}
                        />
                        Recargar
                    </button>

                    <select className="px-4 py-2 rounded-lg border bg-white dark:bg-gray-800">
                        <option>Todas las áreas</option>
                    </select>

                    <button
                        onClick={() =>
                            dispatch(
                                openModalReducer({
                                    modalName: "modalVideosCuestionarios",
                                })
                            )
                        }
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Video
                    </button>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="rounded-2xl border border-gray-300 bg-white dark:bg-gray-900 p-6 min-h-[400px]">
                {loading ? (
                    <div className="py-10 text-center text-gray-500">
                        Cargando videos...
                    </div>
                ) : videos.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">
                        No hay videos registrados
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {videos.map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-300 bg-gray-50 dark:bg-gray-800"
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

            {/* MODAL */}
            <Modal
                title=""
                modalName="modalVideosCuestionarios"
                maxWidth="xl"
            >
                <div className="px-4 py-2">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Nuevo Video
                        </h2>

                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Agrega un nuevo video de capacitación
                        </p>
                    </div>

                    <div className="space-y-6">
                        <MainForm
                            table="videos"
                            dataForm={[
                                {
                                    require: true,
                                    type: "INPUT",
                                    label: "Titulo",
                                    name: "titulo",
                                    icon: <Type className="w-4 h-4" />,
                                    placeholder:
                                        "Ej: Introducción a la seguridad laboral",
                                },
                                {
                                    require: false,
                                    type: "INPUT",
                                    label: "Descripción",
                                    name: "descripcion",
                                    icon: <Pencil className="w-4 h-4" />,
                                    placeholder:
                                        "Ej: Este video cubre los conceptos básicos de seguridad laboral en el lugar de trabajo.",
                                },
                                {
                                    require: true,
                                    type: "INPUT",
                                    label: "URL del Video (YouTube Embed)",
                                    name: "url",
                                    icon: <Link className="w-4 h-4" />,
                                    placeholder:
                                        "Ej: https://www.youtube.com/embed/VIDEO_ID",
                                },
                            ]}
                           /*  aditionalData={{
                                fecha: new Date(),
                            }}*/
                            actionType="post-general"
                            message_button="Crear Video" 
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default PageVideos;