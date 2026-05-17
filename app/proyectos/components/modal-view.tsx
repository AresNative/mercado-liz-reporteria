import { Modal } from "@/components/modal";
import {
    Hourglass,
    AlertCircle,
    User,
    BarChart2,
    CalendarDays,
    RefreshCw,
    Tag,
    Send,
} from "lucide-react";
import { useCommentService } from "../services/commentService";
import { useEffect, useRef, useState } from "react";

type ModalViewProps = {
    nameModal: string;
    task?: any;
};

export const ModalView: React.FC<ModalViewProps> = ({ nameModal, task }) => {
    const [newComment, setNewComment] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { comments, addComment } = useCommentService(task?.id);

    // Scroll automático
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    if (!task) {
        return (
            <Modal title="Informe de tarea" modalName={nameModal} maxWidth="md">
                <main className="p-6 text-center">
                    <span className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-500" />
                    </span>
                    <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">Tarea no disponible</h3>
                    <p className="text-gray-500">No se encontraron datos para esta tarea.</p>
                </main>
            </Modal>
        );
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderEstado = (estado: string) => {
        switch (estado) {
            case 'done':
                return <span className="px-3 py-1 flex items-center w-fit rounded-full text-sm font-medium text-white bg-green-600">Completado</span>;
            case 'todo':
                return <span className="px-3 py-1 flex items-center w-fit rounded-full text-sm font-medium text-white bg-yellow-500">Por hacer</span>;
            case 'in-progress':
                return <span className="px-3 py-1 flex items-center w-fit rounded-full text-sm font-medium text-white bg-yellow-500">En Progreso</span>;
            default:
                return <span className="px-3 py-1 flex items-center w-fit rounded-full text-sm font-medium text-white bg-gray-600">{estado}</span>;
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
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
        <Modal title="Informe de tarea" modalName={nameModal} maxWidth="lg">
            <main className="space-y-6 max-h-[80vh] p-1">
                {/* Encabezado */}
                <article className="border-b border-gray-200 pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
                        {task.title}
                    </h2>
                    {task.description && (
                        <p className="text-gray-600 dark:text-gray-100 mt-2 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
                            {task.description}
                        </p>
                    )}
                </article>

                {/* Grid de información */}
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 mb-2">
                            <Hourglass className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Estado</span>
                        </div>
                        {renderEstado(task.estado)}
                    </li>
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 mb-2">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Prioridad</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${task.prioridad === 'high'
                                ? 'bg-red-100 text-red-800'
                                : task.prioridad === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800 dark:text-green-200'
                            }`}>
                            {task.prioridad === 'high' ? 'Alta' : task.prioridad === 'medium' ? 'Media' : 'Baja'}
                        </span>
                    </li>
                    {/* <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 mb-2">
                            <User className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Asignado a</span>
                        </div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{task.assignee}</p>
                    </li> */}
                    {/* <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 mb-2">
                            <BarChart2 className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Story Points</span>
                        </div>
                        <label className="flex items-center">
                            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-2">
                                {task.storyPoints}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-100">
                                {task.storyPoints === 1 ? 'Punto de historia' : 'Puntos de historia'}
                            </span>
                        </label>
                    </li> */}
                </ul>

                {/* Fechas */}
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 mb-2">
                            <CalendarDays className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Creado en</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200">{formatDate(task.createdAt)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-100">{formatTime(task.createdAt)}</p>
                    </li>
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 mb-2">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Actualizado en</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200">{formatDate(task.updatedAt)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-100">{formatTime(task.updatedAt)}</p>
                    </li>
                </ul>

                {/* Tags */}
                <footer className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                    <label className="flex items-center text-gray-500 mb-2">
                        <Tag className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Tags</span>
                    </label>
                    <div className="flex flex-wrap">
                        {task.tags && task.tags.length > 0 ? (
                            JSON.parse(task.tags).map((tag: string, index: number) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">
                                    {tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 italic">No hay tags asignados</span>
                        )}
                    </div>
                </footer>

                {/* Sección de comentarios */}
                <section className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Comentarios</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                        {comments.length === 0 ? (
                            <p className="text-gray-500 italic text-sm">No hay comentarios aún. ¡Sé el primero en comentar!</p>
                        ) : (
                            comments.map((comment: any) => (
                                <div key={comment.id} className="bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                            Usuario {comment.usuario_id || "Anónimo"}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(comment.fecha)} {formatTime(comment.fecha)}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-100 text-sm mt-1">{comment.contenido}</p>
                                </div>
                            ))
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSubmitComment} className="flex gap-2 py-2">
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
            </main>
        </Modal>
    );
};