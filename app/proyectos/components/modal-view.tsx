"use client"

import { Modal } from "@/components/modal";
import { Hourglass, AlertCircle, User, CalendarDays, RefreshCw, Tag, Send } from "lucide-react";
import { useCommentService } from "../services/commentService";
import { useEffect, useRef, useState, useMemo } from "react";
import { type Task } from "@/app/proyectos/services/taskService";
import { cn } from "@/utils/functions/cn";

// Tipo para comentario (ajusta según tu servicio)
interface Comment {
    id: string;
    contenido: string;
    usuario_id?: string;
    fecha: string;
}

interface ModalViewProps {
    nameModal: string;
    task: Task | null;
}

// Funciones auxiliares de formato (podrían ir en utils)
const formatDate = (dateString: string): string => {
    if (!dateString) return "Fecha no disponible";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Fecha inválida";
        return date.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    } catch {
        return "Fecha inválida";
    }
};

const formatTime = (dateString: string): string => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "";
    }
};

// Componente para cada tarjeta de información
const InfoCard = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <li className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
            <Icon className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">{title}</span>
        </div>
        {children}
    </li>
);

// Badge de prioridad
const PriorityBadge = ({ priority }: { priority: string }) => {
    const colorMap: Record<string, string> = {
        high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    };
    const labelMap: Record<string, string> = {
        high: "Alta",
        medium: "Media",
        low: "Baja",
    };
    return (
        <span className={cn("px-3 py-1 rounded-full text-sm font-medium", colorMap[priority] || "bg-gray-100 text-gray-800")}>
            {labelMap[priority] || priority}
        </span>
    );
};

// Badge de estado
const EstadoBadge = ({ estado }: { estado: string }) => {
    const config: Record<string, { label: string; className: string }> = {
        done: { label: "Completado", className: "bg-green-600 text-white" },
        todo: { label: "Por hacer", className: "bg-yellow-500 text-white" },
        "in-progress": { label: "En progreso", className: "bg-blue-500 text-white" },
        backlog: { label: "Backlog", className: "bg-gray-500 text-white" },
    };
    const { label, className } = config[estado] || { label: estado, className: "bg-gray-500 text-white" };
    return <span className={cn("px-3 py-1 rounded-full text-sm font-medium", className)}>{label}</span>;
};

// Componente de comentarios
const CommentSection = ({ taskId }: { taskId: string }) => {
    const [newComment, setNewComment] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { comments, addComment } = useCommentService(taskId);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await addComment(newComment);
            setNewComment("");
        } catch (error) {
            console.error("Error al enviar comentario:", error);
        }
    };

    return (
        <section className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Comentarios</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4 pr-1">
                {comments.length === 0 ? (
                    <p className="text-gray-500 italic text-sm">No hay comentarios aún. ¡Sé el primero en comentar!</p>
                ) : (
                    comments.map((comment: any, index: number) => {
                        const keyId = String(comment.id ?? index);
                        return (
                            <div key={keyId} className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                    {comment.usuario_id ? `Usuario ${comment.usuario_id}` : "Anónimo"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {formatDate(comment.fecha)} {formatTime(comment.fecha)}
                                </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-100 text-sm mt-1">{comment.contenido}</p>
                        </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-1"
                >
                    <Send size={16} />
                    Enviar
                </button>
            </form>
        </section>
    );
};

export const ModalView: React.FC<ModalViewProps> = ({ nameModal, task }) => {
    const tags = useMemo(() => {
        if (!task?.tags) return [];
        try {
            return JSON.parse(task.tags) as string[];
        } catch {
            return [];
        }
    }, [task?.tags]);

    if (!task) {
        return (
            <Modal title="Informe de tarea" modalName={nameModal} maxWidth="md">
                <main className="p-6 text-center">
                    <span className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-500" />
                    </span>
                    <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">Tarea no disponible</h3>
                    <p className="text-gray-500">No se encontraron datos para esta tarea.</p>
                </main>
            </Modal>
        );
    }

    return (
        <Modal title="Informe de tarea" modalName={nameModal} maxWidth="lg">
            <main className="space-y-6 max-h-[80vh] overflow-y-auto p-1 custom-scrollbar">
                {/* Encabezado */}
                <article className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{task.title}</h2>
                    {task.description && (
                        <p className="text-gray-600 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg text-sm">
                            {task.description}
                        </p>
                    )}
                </article>

                {/* Grid de información */}
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoCard icon={Hourglass} title="Estado">
                        <EstadoBadge estado={task.estado} />
                    </InfoCard>
                    <InfoCard icon={AlertCircle} title="Prioridad">
                        <PriorityBadge priority={task.prioridad || "medium"} />
                    </InfoCard>
                    {/* {task.assignee && (
                        <InfoCard icon={User} title="Asignado a">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{task.assignee}</p>
                        </InfoCard>
                    )}
                    {task.storyPoints !== undefined && (
                        <InfoCard icon={AlertCircle} title="Story Points">
                            <div className="flex items-center">
                                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-2">
                                    {task.storyPoints}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {task.storyPoints === 1 ? "Punto de historia" : "Puntos de historia"}
                                </span>
                            </div>
                        </InfoCard>
                    )} */}
                </ul>

                {/* Fechas */}
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoCard icon={CalendarDays} title="Creado en">
                        <p className="text-gray-800 dark:text-gray-200">{formatDate(task.createdAt)}</p>
                        {formatTime(task.createdAt) && <p className="text-sm text-gray-600 dark:text-gray-300">{formatTime(task.createdAt)}</p>}
                    </InfoCard>
                    <InfoCard icon={RefreshCw} title="Actualizado en">
                        <p className="text-gray-800 dark:text-gray-200">{formatDate(task.updatedAt)}</p>
                        {formatTime(task.updatedAt) && <p className="text-sm text-gray-600 dark:text-gray-300">{formatTime(task.updatedAt)}</p>}
                    </InfoCard>
                </ul>

                {/* Tags */}
                <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <label className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                        <Tag className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Tags</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {tags.length > 0 ? (
                            tags.map((tag, idx) => (
                                <span key={idx} className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 px-3 py-1 rounded-full text-sm">
                                    {tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 italic text-sm">No hay tags asignados</span>
                        )}
                    </div>
                </div>

                {/* Comentarios */}
                <CommentSection taskId={task.id} />
            </main>
        </Modal>
    );
};