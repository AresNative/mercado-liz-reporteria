"use client";

import { useEffect, useState } from "react";
import { useGetWithFiltersIntelisisMutation } from "@/hooks/api/api_int";
import { RefreshCw, Video, Pencil, Trash2, Plus, Link, Type, LayoutDashboard, } from "lucide-react";
import { useAppDispatch } from "@/hooks/selector";
import { Modal } from "@/components/modal";
import { MainForm } from "@/components/form/main-form";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import Pagination from "@/components/pagination";
import { useDeleteGeneralMutation, useGetWithFiltersMutation, usePutGeneralMutation } from "@/hooks/api/api";

const PageVideos = () => {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);

    /*areas */
    interface Area {
        Departamento: string;
    }
    const [areas, setAreas] = useState<Area[]>([]);
    const [getWithFilter] = useGetWithFiltersIntelisisMutation();

    /* Videos */
    const [getWithFilter2] = useGetWithFiltersMutation();
    interface Video {
        id: number;
        titulo: string;
        descripcion: string;
        link: string;
        departamento: string;
        orden: number;
    }
    const [videos, setVideos] = useState<Video[]>([]);
    const [putGeneral] = usePutGeneralMutation();
    const [deleteGeneral] = useDeleteGeneralMutation();
    // PAGINACIÓN
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    // DATOS TEMPORALES

    const totalRecords = videos.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;

    const handleRefresh = async () => {
        await loadVideos();
    };

    const loadAreas = async () => {
        try {
            const response = await getWithFilter({
                table: "Departamento",
                page: currentPage,
                pageSize: 25,
                filtros: {
                    Filtros: [],
                    FiltrosAnd: [],
                    Selects: [],
                    Order: [],
                },
            });
            if ("data" in response) {
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
            }
        } catch (error) {
            console.error(error);
        }
    };
    const loadVideos = async () => {
        try {
            setLoading(true);

            const response = await getWithFilter2({
                table: "videos",
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
                setVideos(response.data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    const eliminarVideo = async (id: number) => {
        if (!window.confirm("¿Deseas eliminar este video?")) return;
        try {
            await deleteGeneral({
                table: "videos",
                column: "id",
                id,
            }).unwrap();

            await loadVideos();

            alert("Video eliminado correctamente");
        } catch (error) {
            console.error(error);
            alert("Error al eliminar el video");
        }
    };
    useEffect(() => {
        loadAreas();
        loadVideos();
    }, [currentPage, pageSize]);
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
                                    key={item.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-300 bg-gray-50 dark:bg-gray-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-gray-700 flex items-center justify-center">
                                            <Video className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-md text-gray-800 dark:text-gray-200">
                                                {item.titulo}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {item.departamento}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {item.descripcion}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => eliminarVideo(item.id)}
                                            className="p-2 rounded-lg border border-red-400 text-red-300 hover:bg-red-500"
                                        >
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
                title=" Nuevo Video"
                modalName="modalVideosCuestionarios"
                maxWidth="xl"
            >
                <div className="px-4 py-2">
                    <p className="text-gray-500 dark:text-gray-400 ">
                        Agrega un nuevo video de capacitación
                    </p>
                    <div className="space-y-6">
                        <MainForm
                            table="videos"
                            dataForm={[
                                {
                                    require: true,
                                    type: "INPUT",
                                    label: "Titulo",
                                    name: "titulo",
                                    icon: <Type className="w-4 h-4 stroke-blue-400" />,
                                    placeholder:
                                        "Ej: Introducción a la seguridad laboral",
                                },
                                {
                                    require: false,
                                    type: "INPUT",
                                    label: "Descripción",
                                    name: "descripcion",
                                    icon: <Pencil className="w-4 h-4 stroke-pink-400" />,
                                    placeholder:
                                        "Ej: Este video cubre los conceptos básicos de seguridad laboral en el lugar de trabajo.",
                                },
                                {
                                    require: true,
                                    type: "INPUT",
                                    label: "URL del Video",
                                    name: "link",
                                    icon: <Link className="w-4 h-4 stroke-blue-400" />,
                                    placeholder:
                                        "Ej: https://www.youtube.com",
                                },
                                {
                                    require: true,
                                    type: "SELECT",
                                    label: "Area asociada",
                                    name: "departamento",
                                    icon: (
                                        <LayoutDashboard className="w-4 h-4 stroke-purple-400" />
                                    ),
                                    options: areas.map((area) => ({
                                        value: area.Departamento,
                                        label: area.Departamento,
                                    })),
                                },
                            ]}
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