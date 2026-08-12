"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useAppDispatch } from "@/hooks/selector";
import { Modal } from "@/components/modal";
import {
    usePutGeneralMutation, useDeleteGeneralMutation,
    useGetWithFiltersMutation, usePostGeneralMutation,
} from "@/hooks/api/api";
import { openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down";

interface Opcion {
    id?: number;
    texto: string;
    correcta: boolean;
}

interface Props {
    pregunta: any; // pregunta seleccionada (id, pregunta, cuestionario_id )
    onUpdated: () => void;
    onDeleted: () => void;
}

export const ModalEditarPregunta = ({ pregunta, onUpdated, onDeleted }: Props) => {
    const dispatch = useAppDispatch();
    const [putGeneral] = usePutGeneralMutation();
    const [deleteGeneral] = useDeleteGeneralMutation();
    const [postGeneral] = usePostGeneralMutation();
    const [getWithFilters] = useGetWithFiltersMutation();

    const [textoPregunta, setTextoPregunta] = useState("");
    const [opciones, setOpciones] = useState<Opcion[]>([]);
    const [opcionesEliminadas, setOpcionesEliminadas] = useState<number[]>([]);
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [eliminando, setEliminando] = useState(false);

    // Cargar la pregunta + sus respuestas al abrir
    useEffect(() => {
        if (!pregunta) return;
        setTextoPregunta(pregunta.pregunta ?? "");
        cargarRespuestas();
        setOpcionesEliminadas([]);
    }, [pregunta]);

    const cargarRespuestas = async () => {
        setCargando(true);
        try {
            const response = await getWithFilters({
                table: "respuestas",
                filtros: {
                    Filtros: [ { Key: "id_preguntas", Operator: "=", Value: pregunta.id },],
                },
            }).unwrap();
            setOpciones(
                response.data.map((r: any) => ({
                    id: r.id,
                    texto: r.opcion,
                    correcta: r.respuesta,
                }))
            );
        } catch (error) {
            console.error(error);
        } finally {
            setCargando(false);
        }
    };

    const cerrar = () => {
        dispatch(openModalReducer({ modalName: "modalEditarPregunta" }));
    };

    const agregarOpcion = () => {
        setOpciones((prev) => [...prev, { texto: "", correcta: false }]);
    };

    const eliminarOpcion = (index: number) => {
        if (opciones.length <= 2) return;
        const opcion = opciones[index];
        if (opcion.id) {
            setOpcionesEliminadas((prev) => [...prev, opcion.id as
                number]);
        }
        setOpciones(opciones.filter((_, i) => i !== index));
    };

    const cambiarTexto = (index: number, texto: string) => {
        const copia = [...opciones];
        copia[index].texto = texto;
        setOpciones(copia);
    };

    const seleccionarCorrecta = (index: number) => {
        setOpciones(opciones.map((o, i) => ({ ...o, correcta: i === index })));
    };

    const guardarCambios = async () => {
        if (!textoPregunta) {
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
        const validas = opciones.filter((o) => o.texto !== "");
        if (validas.length < 2) {
            dispatch(
                openAlertReducer({
                    type: "warning",
                    icon: "alert",
                    title: "Respuestas insuficientes",
                    message: "Agrega mínimo dos respuestas.",
                    duration: 2000,
                })
            );
            return;
        }
        setGuardando(true);
        try {
            // Actualiza el texto de la prefgunta
            await putGeneral({
                table: "preguntas",
                data: {
                    Filtros: [
                        { Key: "id", Value: String(pregunta.id), Operator: "=" },
                    ],
                    Data: {
                        pregunta: textoPregunta,
                    },
                },
            }).unwrap();
            // Eliminar respuestas 
            for (const idEliminar of opcionesEliminadas) {
                await deleteGeneral({
                    table: "respuestas",
                    id: idEliminar,
                }).unwrap();
            }
            //  Actualizar y tmbien crear nuevas
            for (const opcion of validas) {
                if (opcion.id) {
                    await putGeneral({
                        table: "respuestas",
                        data: {
                            Filtros: [
                                { Key: "id", Value: String(opcion.id), Operator: "=" },
                            ],
                            Data: {
                                opcion: opcion.texto,
                                respuesta: opcion.correcta,
                            },
                        },
                    }).unwrap();
                }
            }
            dispatch(
                openAlertReducer({
                    type: "success",
                    icon: "archivo",
                    title: "Pregunta actualizada",
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

    const eliminarPregunta = async () => {
        setEliminando(true);
        try {
            // Elimina respuestas
            for (const opcion of opciones) {
                if (opcion.id) {
                    await deleteGeneral({ table: "respuestas", id: opcion.id }).unwrap();
                }
            }
            await deleteGeneral({ table: "preguntas", id: pregunta.id }).unwrap();
            dispatch(
                openAlertReducer({
                    type: "success",
                    icon: "archivo",
                    title: "Pregunta eliminada",
                    message: "La pregunta fue eliminada correctamente.",
                    duration: 3000,
                })
            );
            onDeleted();
            cerrar();
        } catch (error) {
            console.error(error);
        } finally {
            setEliminando(false);
        }
    };

    return (
        <Modal title="Editar Pregunta" modalName="modalEditarPregunta" maxWidth="lg">
            <div className="px-4 py-1">
                {cargando ? (
                    <div className="py-10 text-center text-gray-500">Cargando pregunta...</div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Pregunta</label>
                            <input
                                type="text"
                                value={textoPregunta}
                                onChange={(e) => setTextoPregunta(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                placeholder="Escribe la pregunta"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="font-medium">Respuestas</label>
                                <button
                                    type="button"
                                    onClick={agregarOpcion}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                                >
                                    <Plus className="w-4 h-4" />  Agregar
                                </button>
                            </div>
                            <div className="space-y-3">
                                {opciones.map((opcion, index) => (
                                    <div key={opcion.id ?? `nueva-${index}`} className="flex items-center gap-3">
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
                                            <button type="button" onClick={() => eliminarOpcion(index)} className="text-red-500">
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <button
                                type="button"
                                onClick={eliminarPregunta}
                                disabled={eliminando}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-500 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                {eliminando ? "Eliminando..." : "Eliminar pregunta"}
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
                    </div>
                )}
            </div>
        </Modal>
    );
};