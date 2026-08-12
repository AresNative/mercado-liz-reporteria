"use client";

import { useEffect, useState } from "react";
import { Type, Pencil, Binary, Video, Trash2, HelpCircle } from "lucide-react";
import { useAppDispatch } from "@/hooks/selector";
import { Modal } from "@/components/modal";
import { usePutGeneralMutation, useDeleteGeneralMutation, useGetWithFiltersMutation, } from "@/hooks/api/api";
import { openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down";

interface Props {
    quiz: any;
    videos: any[];
    onUpdated: () => void;
    onDeleted: () => void;
    onEditarPregunta: (pregunta: any) => void; // abrir modal de pregunta para editara o elimanr
}

export const ModalEditarCuestionario = ({
    quiz,
    videos,
    onUpdated,
    onDeleted,
    onEditarPregunta,
}: Props) => {
    const dispatch = useAppDispatch();
    const [putGeneral] = usePutGeneralMutation();
    const [deleteGeneral] = useDeleteGeneralMutation();
    const [getWithFilters] = useGetWithFiltersMutation();

    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [calificacion, setCalificacion] = useState("");
    const [videoId, setVideoId] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [eliminando, setEliminando] = useState(false);

    //listado de preguntas del duestionario
    const [preguntas, setPreguntas] = useState<any[]>([]);
    const [cargandoPreguntas, setCargandoPreguntas] = useState(false);
    const [eliminandoPreguntaId, setEliminandoPreguntaId] = useState<number | null>(null);

    useEffect(() => {
        if (quiz) {
            setNombre(quiz.nombre ?? "");
            setDescripcion(quiz.descripcion ?? "");
            setCalificacion(String(quiz.calificacion ?? ""));
            setVideoId(String(quiz.videos_id ?? ""));
            cargarPreguntas();
        }
    }, [quiz]);

    const cargarPreguntas = async () => {
        setCargandoPreguntas(true);
        try {
            const response = await getWithFilters({
                table: "preguntas",
                filtros: {
                    Filtros: [
                        { Key: "cuestionario_id", Operator: "=", Value: quiz.id },
                    ],
                },
            }).unwrap();
            // Quitar duplicados por id 
            const unicas = Array.from(
                new Map(response.data.map((p: any) => [p.id, p])).values()
            );
            setPreguntas(unicas);
        } catch (error) {
            console.error(error);
        } finally {
            setCargandoPreguntas(false);
        }
    };
    const cerrar = () => {
        dispatch(openModalReducer({ modalName: "modalEditarCuestionario" }));
    };
    const guardarCambios = async () => {
        if (!nombre || !descripcion || !calificacion || !videoId) {
            dispatch(
                openAlertReducer({
                    type: "warning",
                    icon: "alert",
                    title: "Campos requeridos",
                    message: "Completa todos los campos.",
                    duration: 2000,
                })
            );
            return;
        }
        setGuardando(true);
        try {
            await putGeneral({
                table: "cuestionarios",
                data: {
                    Filtros: [
                        { Key: "id", Value: String(quiz.id), Operator: "=" },
                    ],
                    Data: {
                        nombre,
                        descripcion,
                        calificacion: Number(calificacion),
                        videos_id: Number(videoId),
                    },
                },
            }).unwrap();
            dispatch(
                openAlertReducer({
                    type: "success",
                    icon: "archivo",
                    title: "Cuestionario actualizado",
                    message: "Los cambios se guardaron correctamente.",
                    duration: 1500,
                })
            );
            onUpdated();
            cerrar();
        } catch (error) {
            console.error(error);
        } finally {
            setGuardando(false);
        }
    };

    const eliminarCuestionario = async () => {
        if (!quiz) return;
        setEliminando(true);
        try {
            await putGeneral({
                table: "cuestionarios",
                data: {
                    Data: { activo: false },
                    Filtros: [{ Key: "id", Value: quiz.id, Operator: "=" }],
                },
            }).unwrap();
            dispatch(
                openAlertReducer({
                    type: "success",
                    icon: "archivo",
                    title: "Cuestionario eliminado",
                    message: "El cuestionario se eliminó correctamente.",
                    duration: 3000,
                })
            );
            onDeleted();
            cerrar();
        } catch (error) {
            console.error(error);
            dispatch(
                openAlertReducer({
                    type: "error",
                    icon: "alert",
                    title: "Error",
                    message: "No fue posible eliminar el cuestionario.",
                    duration: 2000,
                })
            );
        } finally {
            setEliminando(false);
        }
    };

    // eliminar una pregunta directamente desde el listado
    const eliminarPregunta = async (pregunta: any) => {
        setEliminandoPreguntaId(pregunta.id);
        try {
            // Eliminar respuestas con el id de la pregutna
            const respuestas = await getWithFilters({
                table: "respuestas",
                filters: { id_preguntas: pregunta.id },
            }).unwrap();
            for (const r of respuestas.data) {
                await deleteGeneral({ table: "respuestas", id: r.id }).unwrap();
            }
            await deleteGeneral({ table: "preguntas", id: pregunta.id }).unwrap();
            dispatch(
                openAlertReducer({
                    type: "success",
                    icon: "archivo",
                    title: "Pregunta eliminada",
                    message: "La pregunta fue eliminada correctamente.",
                    duration: 1500,
                })
            );
            cargarPreguntas();
            onUpdated();
        } catch (error) {
            console.error(error);
        } finally {
            setEliminandoPreguntaId(null);
        }
    };

    return (
        <Modal title="Editar Cuestionario" modalName="modalEditarCuestionario" maxWidth="xl">
            <div className="px-4 py-2 flex flex-col gap-4">
                {/* DATOS DEL CUESTIONARIO */}
                <div>
                    <label className="block text-sm font-medium mb-2">Título</label>
                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                        <Type className="w-4 h-4 stroke-blue-400" />
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full outline-none bg-transparent"
                            placeholder="Ej: Evaluación de Seguridad Industrial"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Descripción</label>
                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                        <Pencil className="w-4 h-4 stroke-pink-400" />
                        <input
                            type="text"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="w-full outline-none bg-transparent"
                            placeholder="Descripción del cuestionario"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">Puntaje mínimo</label>
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                            <Binary className="w-4 h-4 stroke-green-400" />
                            <input
                                type="number"
                                value={calificacion}
                                onChange={(e) => setCalificacion(e.target.value)}
                                className="w-full outline-none bg-transparent"
                                placeholder="70"
                            />
                        </div>
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">Video</label>
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                            <Video className="w-4 h-4 stroke-blue-400" />
                            <select
                                value={videoId}
                                onChange={(e) => setVideoId(e.target.value)}
                                className="w-full outline-none bg-transparent"
                            >
                                <option value="">Selecciona un video</option>
                                {videos.map((video) => (
                                    <option key={video.id} value={String(video.id)}>
                                        {video.titulo}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => {
                            cerrar(); // cierra el modal de edición primero, igual que en videos
                            dispatch(
                                openAlertReducer({
                                    type: "warning",
                                    icon: "alert",
                                    title: "Eliminar cuestionario",
                                    message: "¿Deseas eliminar este cuestionario? Esta acción no se puede deshacer.",
                                    buttonText: "Eliminar",
                                    action: () => eliminarCuestionario(),
                                })
                            );
                        }}
                        disabled={eliminando}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-500 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        {eliminando ? "Eliminando..." : "Eliminar cuestionario"}
                    </button>

                    <button
                        type="button"
                        onClick={guardarCambios}
                        disabled={guardando}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {guardando ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>

                {/* LISTADO DE PREGUNTAS */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <HelpCircle className="w-4 h-4 text-gray-500" />
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                            Preguntas del cuestionario ({preguntas.length})
                        </h4>
                    </div>
                    {cargandoPreguntas ? (
                        <div className="py-6 text-center text-gray-500 text-sm">
                            Cargando preguntas...
                        </div>
                    ) : preguntas.length === 0 ? (
                        <div className="py-6 text-center text-gray-500 text-sm">
                            Este cuestionario no tiene preguntas aún.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {preguntas.map((pregunta) => (
                                <div
                                    key={pregunta.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                                >
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate pr-2">
                                        {pregunta.pregunta}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => onEditarPregunta(pregunta)}
                                            className="p-1.5 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900"
                                        >
                                            <Pencil className="w-4 h-4 text-blue-600" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => eliminarPregunta(pregunta)}
                                            disabled={eliminandoPreguntaId === pregunta.id}
                                            className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};