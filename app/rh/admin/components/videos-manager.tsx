"use client";

import { useEffect, useState } from "react";
import { useGetWithFiltersIntelisisMutation } from "@/hooks/api/api_int";
import { RefreshCw, Video, Pencil, Trash2, Plus, Link, Type, LayoutDashboard, } from "lucide-react";
import { useAppDispatch } from "@/hooks/selector";
import { Modal } from "@/components/modal";
import { MainForm } from "@/components/form/main-form";
import { openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down";
import Pagination from "@/components/pagination";
import { useGetWithFiltersMutation, usePutGeneralMutation } from "@/hooks/api/api";

const PageVideos = () => {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    // areas
    interface Area {
        Departamento: string;
    }
    const [areas, setAreas] = useState<Area[]>([]);
    const [getWithFilter] = useGetWithFiltersIntelisisMutation();
    // Videos 
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

    // PAGINACION
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const totalRecords = videos.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    // estado para editr video
    const [videoSeleccionado, setVideoSeleccionado] = useState<Video | null>(null);
    const [tituloEdit, setTituloEdit] = useState("");
    const [descripcionEdit, setDescripcionEdit] = useState("");
    const [linkEdit, setLinkEdit] = useState("");
    const [departamentoEdit, setDepartamentoEdit] = useState("");
    const [guardandoEdit, setGuardandoEdit] = useState(false);

    const handleRefresh = async () => {
        await loadVideos();
    };

    const loadAreas = async () => {
        try {
            const response = await getWithFilter({
                table: "Departamento",
                page: currentPage,
                pageSize: 25,
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
                    Filtros: [{ Key: "activo", Operator: "=", Value: true },],
                    Order: [{ Key: "id", Direction: "DESC" }],
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
        try {
            // ver si se usa en cuestionariios 
            const cuestionariosResponse = await getWithFilter2({
                table: "cuestionarios",
                filtros: {
                    Filtros: [
                        { Key: "videos_id", Operator: "=", Value: id },
                        { Key: "activo", Operator: "=", Value: true },
                    ],
                },
            });
            const cuestionariosUsandoVideo =
                "data" in cuestionariosResponse
                    ? cuestionariosResponse.data.data || []
                    : [];
            if (cuestionariosUsandoVideo.length > 0) {
                dispatch(openAlertReducer({
                    type: "warning",
                    icon: "alert",
                    title: "No se puede eliminar",
                    message: `Este video está siendo usado por ${cuestionariosUsandoVideo.length} cuestionario${cuestionariosUsandoVideo.length > 1 ? "s" : ""}. Elimina o reasigna esos cuestionarios primero.`,
                    duration: 4000,
                })
                );
                return;
            }
            // marcar el eliminado el video
            await putGeneral({
                table: "videos",
                data: {
                    Data: { activo: false },
                    Filtros: [{ Key: "id", Value: id, Operator: "=" }],
                },
            }).unwrap();
            await loadVideos();
            dispatch(
                openAlertReducer({
                    type: "success",
                    icon: "archivo",
                    title: "Video eliminado",
                    message: "El video se eliminó correctamente.",
                    duration: 1500,
                })
            );
        } catch (error) {
            console.error(error);
            dispatch(
                openAlertReducer({
                    type: "error",
                    icon: "alert",
                    title: "Error",
                    message: "No fue posible eliminar el video.",
                    duration: 2000,
                })
            );
        }
    };

    const abrirEditarVideo = (video: Video) => {
        setVideoSeleccionado(video);
        setTituloEdit(video.titulo ?? "");
        setDescripcionEdit(video.descripcion ?? "");
        setLinkEdit(video.link ?? "");
        setDepartamentoEdit(video.departamento ?? "");
        dispatch(openModalReducer({ modalName: "modalEditarVideo" }));
    };

    const guardarEdicionVideo = async () => {
        if (!videoSeleccionado) return;
        if (!tituloEdit || !linkEdit || !departamentoEdit) {
            dispatch(openAlertReducer({
                type: "warning",
                icon: "alert",
                title: "Campos requeridos",
                message: "Completa título, link y área.",
                duration: 3000,
            })
            );
            return;
        }
        setGuardandoEdit(true);
        try {
            await putGeneral({
                table: "videos",
                data: {
                    Data: {
                        titulo: tituloEdit,
                        descripcion: descripcionEdit,
                        link: linkEdit,
                        departamento: departamentoEdit,
                    },
                    Filtros: [{ Key: "id", Value: videoSeleccionado.id, Operator: "=" }],
                },
            }).unwrap();
            dispatch(openAlertReducer({
                type: "success",
                icon: "archivo",
                title: "Video actualizado",
                message: "Los cambios se guardaron correctamente.",
                duration: 1500,
            })
            );
            await loadVideos();
            dispatch(openModalReducer({ modalName: "modalEditarVideo" }));
        } catch (error) {
            console.error(error);
            dispatch(openAlertReducer({
                type: "error",
                icon: "alert",
                title: "Error",
                message: "No fue posible actualizar el video.",
                duration: 2000,
            })
            );
        } finally {
            setGuardandoEdit(false);
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
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200"> Panel de Videos </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400"> Gestión y creación de videos para capacitación </p>
                </div>
                {/* ACCIONES */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Recargar
                    </button>
                    <button
                        onClick={() =>
                            dispatch(
                                openModalReducer({
                                    modalName: "modalVideosCuestionarios",
                                })
                            )
                        }
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">
                        <Plus className="w-4 h-4" /> Nuevo Video
                    </button>
                </div>
            </div>
            {/* CONTENIDO */}
            <div className="rounded-2xl border border-gray-300 bg-white dark:bg-gray-900 p-6 min-h-400px">
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
                                        {/*boton editar */}
                                        <button
                                            onClick={() => abrirEditarVideo(item)}
                                            className="p-2 rounded-lg border border-amber-400 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                dispatch(
                                                    openAlertReducer({
                                                        type: "warning",
                                                        icon: "alert",
                                                        title: "Eliminar video",
                                                        message: "¿Deseas eliminar este video? Esta acción no se puede deshacer.",
                                                        buttonText: "Eliminar",
                                                        action: () => eliminarVideo(item.id),
                                                    })
                                                )
                                            }
                                            className="p-2 rounded-lg border border-red-400 text-red-300 hover:bg-red-500">
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
            {/* MODAL CREAR VIDEO */}
            <Modal
                title=" Nuevo Video"
                modalName="modalVideosCuestionarios"
                maxWidth="xl"
            >
                <div className="px-4 py-2">
                    <p className="text-gray-500 dark:text-gray-400 "> Agrega un nuevo video de capacitación </p>
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
                                    placeholder: "Ej: Introducción a la seguridad laboral",
                                },
                                {
                                    require: false,
                                    type: "INPUT",
                                    label: "Descripción",
                                    name: "descripcion",
                                    icon: <Pencil className="w-4 h-4 stroke-pink-400" />,
                                    placeholder: "Ej: Este video cubre los conceptos básicos de seguridad laboral en el lugar de trabajo.",
                                },
                                {
                                    require: true,
                                    type: "INPUT",
                                    label: "URL del Video",
                                    name: "link",
                                    icon: <Link className="w-4 h-4 stroke-blue-400" />,
                                    placeholder: "Ej: https://www.youtube.com",
                                },
                                {
                                    require: true,
                                    type: "SELECT",
                                    label: "Area asociada",
                                    name: "departamento",
                                    icon: (<LayoutDashboard className="w-4 h-4 stroke-purple-400" />),
                                    options: areas.map((area) => ({
                                        value: area.Departamento,
                                        label: area.Departamento,
                                    }))
                                },]}
                            actionType="post-general"
                            message_button="Crear Video"
                            onSuccess={() => loadVideos()}
                        />
                    </div>
                </div>
            </Modal>
            {/* NUEVO: MODAL EDITAR VIDEO */}
            <Modal
                title="Editar Video"
                modalName="modalEditarVideo"
                maxWidth="xl"
            >
                <div className="px-4 py-2 flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Título</label>
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                            <Type className="w-4 h-4 stroke-blue-400" />
                            <input
                                type="text"
                                value={tituloEdit}
                                onChange={(e) => setTituloEdit(e.target.value)}
                                className="w-full outline-none bg-transparent"
                                placeholder="Ej: Introducción a la seguridad laboral"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Descripción</label>
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                            <Pencil className="w-4 h-4 stroke-pink-400" />
                            <input
                                type="text"
                                value={descripcionEdit}
                                onChange={(e) => setDescripcionEdit(e.target.value)}
                                className="w-full outline-none bg-transparent"
                                placeholder="Descripción del video"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">URL del Video</label>
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                            <Link className="w-4 h-4 stroke-blue-400" />
                            <input
                                type="text"
                                value={linkEdit}
                                onChange={(e) => setLinkEdit(e.target.value)}
                                className="w-full outline-none bg-transparent"
                                placeholder="Ej: https://www.youtube.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Área asociada</label>
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                            <LayoutDashboard className="w-4 h-4 stroke-purple-400" />
                            <select
                                value={departamentoEdit}
                                onChange={(e) => setDepartamentoEdit(e.target.value)}
                                className="w-full outline-none bg-transparent">
                                <option value="">Selecciona un área</option>
                                {areas.map((area, i) => (
                                    <option key={i} value={area.Departamento}>
                                        {area.Departamento}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (!videoSeleccionado) return;
                                dispatch(openModalReducer({ modalName: "modalEditarVideo" }));
                                dispatch(
                                    openAlertReducer({
                                        type: "warning",
                                        icon: "alert",
                                        title: "Eliminar video",
                                        message: "¿Deseas eliminar este video? Esta acción no se puede deshacer.",
                                        buttonText: "Eliminar",
                                        action: () => eliminarVideo(videoSeleccionado.id),
                                    })
                                );
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-500 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" /> Eliminar video
                        </button>
                        <button
                            type="button"
                            onClick={guardarEdicionVideo}
                            disabled={guardandoEdit}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                            {guardandoEdit ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default PageVideos;