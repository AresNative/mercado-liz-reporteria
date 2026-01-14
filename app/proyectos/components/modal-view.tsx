import { Modal } from "@/components/modal";
import {
    Hourglass,
    AlertCircle,
    User,
    BarChart2,
    CalendarDays,
    RefreshCw,
    Tag,
} from "lucide-react";
/* import { useGetProjectsQuery } from "@/hooks/reducers/api"; */
import { CommentsField } from "../constants/comments";
import MainForm from "@/components/form/main-form";

type ModalViewProps = {
    nameModal: string;
    task?: any;
};

export const ModalView: React.FC<ModalViewProps> = ({ nameModal, task }) => {
    if (!task) {
        return (
            <Modal title="Informe de tarea" modalName={nameModal} maxWidth="md">
                <main className="p-6 text-center">
                    <span className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                    </span>
                    <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">Tarea no disponible</h3>
                    <p className="text-gray-500 dark:text-gray-400">No se encontraron datos para esta tarea.</p>
                </main>
            </Modal>
        );
    }

    // Formatear fechas
    const formatDate = (dateString?: string) => {
        if (!dateString) return "No disponible";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return "Fecha inválida";
        }
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return "";
        }
    };

    const renderEstado = (estado?: string) => {
        switch (estado) {
            case 'done':
                return <span className="px-3 py-1 flex items-center w-fit rounded-full text-sm font-medium text-white bg-green-600">Completado</span>;
            case 'todo':
                return <span className="px-3 py-1 flex items-center w-fit rounded-full text-sm font-medium text-white bg-yellow-500">Por hacer</span>;
            case 'in-progress':
                return <span className="px-3 py-1 flex items-center w-fit rounded-full text-sm font-medium text-white bg-yellow-500">En Progreso</span>;
            case 'backlog':
                return <span className="px-3 py-1 flex items-center w-fit rounded-full text-sm font-medium text-white bg-gray-600">Backlog</span>;
            default:
                return <span className="px-3 py-1 flex items-center w-fit rounded-full text-sm font-medium text-white bg-gray-600">{estado || "Sin estado"}</span>;
        }
    }

    // Obtener tags parseados
    const getTags = () => {
        try {
            if (!task.tags || task.tags.length === 0) return [];
            return JSON.parse(task.tags);
        } catch {
            return [];
        }
    };

    const tags = getTags();

    return (
        <Modal title="Informe de tarea" modalName={nameModal} maxWidth="md">
            <main className="space-y-6">
                {/* Encabezado */}
                <article className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
                        {task.title || "Tarea sin título"}
                    </h2>
                    {task.description && (
                        <p className="text-gray-600 dark:text-gray-300 mt-2 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">
                            {task.description}
                        </p>
                    )}
                </article>

                {/* Grid de información */}
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Estado */}
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                            <Hourglass className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Estado</span>
                        </div>
                        {renderEstado(task.estado)}
                    </li>

                    {/* Prioridad */}
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Prioridad</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${task.prioridad === 'high'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            : task.prioridad === 'medium'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            }`}>
                            {task.prioridad === 'high' ? 'Alta' : task.prioridad === 'medium' ? 'Media' : 'Baja'}
                        </span>
                    </li>

                    {/* Asignado */}
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                            <User className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Asignado a</span>
                        </div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                            {task.assignee || "Sin asignar"}
                        </p>
                    </li>

                    {/* Story Points */}
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                            <BarChart2 className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Story Points</span>
                        </div>
                        <label className="flex items-center">
                            <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-2">
                                {task.storyPoints || 0}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {task.storyPoints === 1 ? 'Punto de historia' : 'Puntos de historia'}
                            </span>
                        </label>
                    </li>
                </ul>

                {/* Fechas */}
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fecha de creación */}
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                            <CalendarDays className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Creado en</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200">{formatDate(task.createdAt)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{formatTime(task.createdAt)}</p>
                    </li>

                    {/* Fecha de actualización */}
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Actualizado en</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200">{formatDate(task.updatedAt)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{formatTime(task.updatedAt)}</p>
                    </li>
                </ul>

                {/* Tags */}
                <footer className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                    <label className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                        <Tag className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Tags</span>
                    </label>
                    <div className="flex flex-wrap">
                        {tags.length > 0 ? (
                            tags.map((tag: string, index: number) => (
                                <span key={index} className="inline-flex items-center">
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm mr-2 mb-2">
                                        {tag}
                                    </span>
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 dark:text-gray-400 italic">No hay tags asignados</span>
                        )}
                    </div>
                </footer>

                {/* Comentarios */}
                <section className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <MainForm
                        actionType="v1/projects"
                        formName="Project"
                        dataForm={CommentsField()}
                        message_button="Enviar"
                    />
                </section>
            </main>
        </Modal>
    );
};