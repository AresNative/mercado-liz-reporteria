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
import { useGetProjectsQuery } from "@/hooks/reducers/api";
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
                    <span className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-500" />
                    </span>
                    <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">Tarea no disponible</h3>
                    <p className="text-gray-500">No se encontraron datos para esta tarea.</p>
                </main>
            </Modal>
        );
    }
    // Formatear fechas
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
    }

    return (
        <Modal title="Informe de tarea" modalName={nameModal} maxWidth="md">
            <main className="space-y-6">
                {/* Encabezado */}
                <article className="border-b border-gray-200 pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
                        {task.title}
                    </h2>
                    {task.description && (<p className="text-gray-600 dark:text-gray-100 mt-2 bg-gray-50 dark:bg-zinc-800 p-3 rounded-lg">{task.description}</p>)}
                </article>

                {/* Grid de información */}
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Estado */}
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 mb-2">
                            <Hourglass className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Estado</span>
                        </div>
                        {renderEstado(task.estado)}
                    </li>

                    {/* Prioridad */}
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

                    {/* Asignado */}
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 mb-2">
                            <User className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Asignado a</span>
                        </div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{task.assignee}</p>
                    </li>

                    {/* Story Points */}
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
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
                    </li>
                </ul>

                {/* Fechas */}
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fecha de creación */}
                    <li className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center text-gray-500 mb-2">
                            <CalendarDays className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Creado en</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200">{formatDate(task.createdAt)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-100">{formatTime(task.createdAt)}</p>
                    </li>

                    {/* Fecha de actualización */}
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
                    <label className="flex flex-wrap">
                        {task.tags && task.tags.length > 0 ? (
                            JSON.parse(task.tags).map((tag: string, index: number) => (
                                <span key={index} className="inline-flex items-center">
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">
                                        {tag}
                                    </span>
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 italic">No hay tags asignados</span>
                        )}
                    </label>
                </footer>
                <section className="mt-4 border-t border-gray-200 pt-4">
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