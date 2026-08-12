"use client";

import { useEffect, useState } from "react";
import { NotebookTabs, X } from "lucide-react";
import { RefreshCw, Pencil, Plus, Type, Video, Binary } from "lucide-react";
import { useAppDispatch } from "@/hooks/selector";
import { Modal } from "@/components/modal";
import { MainForm } from "@/components/form/main-form";
import Pagination from "@/components/pagination";
import { useGetWithFiltersMutation, usePostGeneralMutation } from "@/hooks/api/api";
import { openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down";
import { ModalEditarCuestionario } from "./detalle-quizzes";
import { ModalEditarPregunta } from "./detalle-pregunta-quizz";

const PageQuizzes = () => {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    const [postGeneral] = usePostGeneralMutation();
    const [quizSeleccionado, setQuizSeleccionado] = useState<any>(null);
    const [preguntaSeleccionada, setPreguntaSeleccionada] = useState<any>(null);
    /* Consulta Videos */
    const [videos, setVideos] = useState<any[]>([]);
    const [getVideos] = useGetWithFiltersMutation();
    const loadVideos = async () => {
        try {
            const response = await getVideos({
                table: "videos",
                filtros: {
                    Filtros: [{ Key: "activo", Operator: "=", Value: true },],
                },
            }).unwrap();
            setVideos(response.data);
        } catch (error) {
            console.error(error);
        }
    };
    useEffect(() => {
        loadVideos();
        loadQuizzes();
    }, []);

    const [idCuestionario, setIdCuestionario] = useState<number | null>(null);
    const [pregunta, setPregunta] = useState("");
    const [opciones, setOpciones] = useState([
        { texto: "", correcta: true },
        { texto: "", correcta: false },
    ]);
    const [guardandoPregunta, setGuardandoPregunta] = useState(false);

    // PAGINACIÓN
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [preguntas, setPreguntas] = useState<any[]>([]);
    const totalRecords = quizzes.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;

    const loadQuizzes = async () => {
        try {
            const [respCuestionarios, respPreguntas] = await Promise.all([
                getVideos({
                    table: "cuestionarios",
                    filtros: {
                        Filtros: [ { Key: "activo", Operator: "=", Value: true },],
                    },
                }).unwrap(),
                getVideos({
                    table: "preguntas",
                }).unwrap(),
            ]);

            const cuestionarios = respCuestionarios.data;
            const preguntasData = respPreguntas.data;
            const data = cuestionarios.map((q: any) => ({
                ...q,
                totalPreguntas: preguntasData.filter(
                    (p: any) => p.cuestionario_id === q.id
                ).length,
            }));
            setQuizzes(data);
            setPreguntas(preguntasData);
        } catch (error) {
            console.error(error);
        }
    };

    const handleRefresh = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadVideos(),
                loadQuizzes(),
            ]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    const agregarOpcion = () => {
        setOpciones((prev) => [
            ...prev,
            {
                texto: "",
                correcta: false
            }
        ]);
    };

    const eliminarOpcion = (index: number) => {
        if (opciones.length <= 2) return;
        setOpciones(
            opciones.filter((_, i) => i !== index)
        );
    };
    const cambiarTexto = (index: number, texto: string) => {
        const copia = [...opciones];
        copia[index].texto = texto;
        setOpciones(copia);
    };
    const seleccionarCorrecta = (index: number) => {
        const copia = opciones.map((item, i) => ({
            ...item,
            correcta: i === index
        }));
        setOpciones(copia);
    };
    const guardarPregunta = async () => {
        if (!pregunta) {
            dispatch(
                openAlertReducer({
                    type: "warning",
                    icon: "alert",
                    title: "Campo requerido",
                    message: "Escribe la pregunta.",
                    duration: 2000,
                })
            );
            return;
        }
        const respuestasValidas = opciones.filter(opc => opc.texto != "");
        if (respuestasValidas.length < 2) {
            dispatch(
                openAlertReducer({
                    type: "warning",
                    icon: "alert",
                    title: "Respuestas insuficientes",
                    message: "Agrega mínimo dos respuestas.",
                    duration: 1500,
                })
            );
            return;
        }
        setGuardandoPregunta(true);
        try {
            const respuestaPregunta = await postGeneral({
                table: "preguntas",
                data: {
                    cuestionario_id: idCuestionario,
                    pregunta: pregunta
                }
            }).unwrap();
            const idPregunta = respuestaPregunta.data.id;
            for (const opcion of respuestasValidas) {
                await postGeneral({
                    table: "respuestas",
                    data: {
                        id_preguntas: idPregunta,
                        opcion: opcion.texto,
                        respuesta: opcion.correcta
                    }
                }).unwrap();
            }
            setPregunta("");
            setOpciones([
                {
                    texto: "",
                    correcta: true
                },
                {
                    texto: "",
                    correcta: false
                }
            ]);
            dispatch(
                openAlertReducer({
                    type: "success",
                    icon: "archivo",
                    title: "Pregunta guardada",
                    message: "La pregunta ha sido guardada correctamente.",
                    duration: 1500,
                })
            );
            loadQuizzes();
        }
        catch (error) {
            console.log(error);
        }
        finally {
            setGuardandoPregunta(false);
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
                    <p className="text-sm text-gray-500 dark:text-gray-400"> Gestión y creación de cuestionarios para capacitación </p>
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
                        onClick={() => {
                            setIdCuestionario(null);
                            dispatch(
                                openModalReducer({
                                    modalName: "modalCuestionarios",
                                })
                            );
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4" />
                        Nuevo Cuestionario
                    </button>
                </div>
            </div>
            {/* CONTENIDO */}
            <div className="rounded-2xl border border-gray-300 bg-white dark:bg-gray-700 p-6 min-h-100">
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
                            {quizzes.map((quiz) => (
                                <div
                                    key={quiz.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-300 bg-gray-50 dark:bg-gray-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center">
                                            <NotebookTabs className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                                {quiz.nombre}
                                            </h3>
                                            <h3 className="text-sm text-gray-600 dark:text-gray-400">
                                                {quiz.descripcion}  {videos.find((v) => v.id === quiz.videos_id)?.departamento ? ` - ${videos.find((v) => v.id === quiz.videos_id)?.departamento}` : ""}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {quiz.totalPreguntas} {quiz.totalPreguntas === 1 ? "pregunta" : "preguntas"} - Calificación Minima: {quiz.calificacion}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setQuizSeleccionado(quiz);
                                                dispatch(
                                                    openModalReducer({
                                                        modalName: "modalEditarCuestionario"
                                                    })
                                                );
                                            }}
                                            className="p-2 rounded-lg border border-amber-400 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900">
                                            <Pencil className="w-4 h-4 text-amber-400" />
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

            {/* MODAL CUESTIONARIO (CREAR) */}
            <Modal
                title="Nuevo Cuestionario"
                modalName="modalCuestionarios"
                maxWidth="xl"
            >
                <div className="px-4 py-2">
                    <div className="mb-1">
                        <p className="text-gray-500 dark:text-gray-400 "> Crea un cuestionario asociado a un video </p>
                    </div>
                    <div className="flex justify-end mb-2">
                        <button
                            type="button"
                            disabled={!idCuestionario}
                            onClick={() =>
                                dispatch(
                                    openModalReducer({
                                        modalName: "modalPreguntas",
                                    })
                                )}
                            className={`flex items-center gap-2 px-2 py-2 rounded-lg transition ${idCuestionario ? "border-green-100 bg-green-100 hover:bg-green-200" : "border-gray-300 bg-gray-200 opacity-50 cursor-not-allowed"
                                }`}
                        >
                        </button>
                    </div>
                    <MainForm
                        table="cuestionarios"
                        actionType="post-general"
                        message_button="Crear Cuestionario"
                        onSuccess={(result) => {
                            setIdCuestionario(result.data.id);
                            dispatch(
                                openModalReducer({
                                    modalName: "modalPreguntas"
                                })
                            );
                        }}
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
                            {
                                // Consultar tabla de videos 
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
                    />
                </div>
            </Modal>
            {/* //MODAL PREGUNTAS tras crear cuestionario  */}
            <Modal
                title="Nueva Pregunta"
                modalName="modalPreguntas"
                maxWidth="lg"
            >
                <div className="px-4 py-1">
                    <div className="flex flex-col gap-4">
                        {/* Pregunta */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Pregunta
                            </label>
                            <input
                                type="text"
                                value={pregunta}
                                onChange={(e) => setPregunta(e.target.value)}
                                className="w-full rounded-lg border border-gray-300  px-3 py-2"
                                placeholder="Escribe la pregunta"
                            />
                        </div>
                        {/* Respuestas */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="font-medium"> Respuestas </label>
                                <button
                                    type="button"
                                    onClick={agregarOpcion}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                >
                                    <Plus className="w-4 h-4" /> Agregar
                                </button>
                            </div>
                            <div className="space-y-3">
                                {opciones.map((opcion, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3"
                                    >
                                        <input
                                            type="radio"
                                            checked={opcion.correcta}
                                            onChange={() => seleccionarCorrecta(index)}
                                        />
                                        <input
                                            type="text"
                                            value={opcion.texto}
                                            onChange={(e) => cambiarTexto(index, e.target.value)}
                                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                                            placeholder={`Respuesta ${index + 1}`}
                                        />
                                        {opciones.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => eliminarOpcion(index)}
                                                className="text-red-500"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={guardarPregunta}
                                disabled={guardandoPregunta}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                            >
                                {guardandoPregunta ? "Guardando..." : "Guardar y agregar otra"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setPregunta("");
                                    setOpciones([
                                        {
                                            texto: "",
                                            correcta: true
                                        },
                                        {
                                            texto: "",
                                            correcta: false
                                        }
                                    ]);
                                    setIdCuestionario(null);
                                }}
                                className="px-4 py-2 rounded-lg bg-green-600 text-white"
                            >
                                Finalizar
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal para editar cuestionario */}
            {quizSeleccionado && (
                <ModalEditarCuestionario
                    quiz={quizSeleccionado}
                    videos={videos}
                    onUpdated={loadQuizzes}
                    onDeleted={loadQuizzes}
                    onEditarPregunta={(preguntaSel: any) => {
                        setPreguntaSeleccionada(preguntaSel);
                        dispatch(
                            openModalReducer({
                                modalName: "modalEditarPregunta",
                            })
                        );
                    }}
                />
            )}
            {preguntaSeleccionada && (
                <ModalEditarPregunta
                    pregunta={preguntaSeleccionada}
                    onUpdated={loadQuizzes}
                    onDeleted={loadQuizzes}
                />
            )}
        </>
    );
};

export default PageQuizzes;