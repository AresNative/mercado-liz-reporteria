"use client";
import { useEffect, useState, useCallback } from "react";
import { ScrumBoard } from "./components/board";
import { useTaskService, type Task } from "./services/tasks";
import { ArrowLeft, ClipboardListIcon, Hash, SquareChevronRight } from "lucide-react";

import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import { ModalForm } from "./components/modal-form";
import { TasksField } from "./constants/tasks";
import { SprintField } from "./constants/sprint";
import { ProjectField } from "./constants/project";
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage";
import { formatAPIDate } from "@/utils/constants/format-values";
import Footer from "@/template/footer";
import Header from "@/template/header";

interface Project {
    id: number;
    nombre: string;
    descripcion: string;
    fecha_inicio: string;
}

interface Sprint {
    id: number;
    nombre: string;
    fecha_inicio: string;
    proyecto_id?: number;
}

export default function ProjectsPage() {
    const dispatch = useAppDispatch();

    // Estados principales
    const [projectId, setProjectId] = useState<number>(0);
    const [sprintId, setSprintId] = useState<number>(0);
    const [projects, setProjects] = useState<Project[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Usar el servicio de tareas
    const taskService = useTaskService(sprintId);

    // TODO: Reemplazar con hooks reales de API
    const [projectsData] = useState<Project[]>([]);
    const [sprintsData] = useState<Sprint[]>([]);

    // Cargar IDs desde localStorage
    useEffect(() => {
        const savedProjectId = getLocalStorageItem('scrumProjectId');
        const savedSprintId = getLocalStorageItem('scrumSprintId');

        if (savedProjectId) {
            const parsedId = parseInt(savedProjectId, 10);
            if (!isNaN(parsedId)) setProjectId(parsedId);
        }
        if (savedSprintId) {
            const parsedId = parseInt(savedSprintId, 10);
            if (!isNaN(parsedId)) setSprintId(parsedId);
        }
    }, []);

    // Persistir IDs en localStorage
    useEffect(() => {
        if (projectId > 0) {
            setLocalStorageItem('scrumProjectId', projectId.toString());
        }
    }, [projectId]);

    useEffect(() => {
        if (sprintId > 0) {
            setLocalStorageItem('scrumSprintId', sprintId.toString());
        }
    }, [sprintId]);

    // Función para recargar tareas
    const fetchTasks = useCallback(async () => {
        await taskService.refetch();
    }, [taskService.refetch]); // Dependencia estabilizada

    // Actualizar proyectos y sprints cuando cambian los datos
    useEffect(() => {
        if (projectsData) setProjects(projectsData);
        if (sprintsData) setSprints(sprintsData);
    }, [projectsData, sprintsData]);

    // Filtrar sprints por proyecto seleccionado
    const filteredSprints = sprints.filter(sprint =>
        projectId === 0 || sprint.proyecto_id === projectId
    );

    const handleGoBack = useCallback(() => {
        if (sprintId > 0) {
            setSprintId(0);
            setLocalStorageItem('scrumSprintId', '0');
        } else if (projectId > 0) {
            setProjectId(0);
            setSprintId(0);
            setLocalStorageItem('scrumProjectId', '0');
            setLocalStorageItem('scrumSprintId', '0');
        }
    }, [projectId, sprintId]);

    const showBackButton = projectId > 0 || sprintId > 0;

    const getModalType = () => {
        if (projectId === 0) return "create-proyect";
        if (sprintId > 0) return "create-task";
        return "create-sprint";
    };

    const getAddButtonText = () => {
        if (projectId === 0) return "Proyecto";
        if (sprintId > 0) return "Tarea";
        return "Sprint";
    };

    const renderProjectsList = () => (
        <div className="mt-6 md:mt-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                Proyectos Disponibles
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.length > 0 ? projects.map((project) => {
                    const formattedDate = formatAPIDate(project.fecha_inicio);
                    return (
                        <li
                            key={project.id}
                            className="bg-white dark:bg-zinc-800 shadow-md border-l-4 border-l-green-500 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                            onClick={() => setProjectId(project.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setProjectId(project.id)}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <SquareChevronRight className="size-5 text-green-600 dark:text-green-400" />
                                <h3 className="font-semibold text-lg truncate">{project.nombre}</h3>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                                {project.descripcion || "Sin descripción"}
                            </p>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">
                                    Inicio: {formattedDate}
                                </span>
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-medium">
                                    ID: {project.id}
                                </span>
                            </div>
                        </li>
                    );
                }) : (
                    <li className="col-span-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <ClipboardListIcon className="size-12 text-gray-400 dark:text-gray-500 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-center">
                            No hay proyectos disponibles
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Añada uno en la sección "Agregar Proyecto"
                        </p>
                    </li>
                )}
            </ul>
        </div>
    );

    const renderSprintsList = () => (
        <div className="mt-6 md:mt-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                Sprints del Proyecto
            </h2>
            <ul className="space-y-3">
                {filteredSprints.length > 0 ? filteredSprints.map((sprint) => {
                    const formattedDate = formatAPIDate(sprint.fecha_inicio);
                    return (
                        <li
                            key={sprint.id}
                            className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md hover:border-green-300 dark:hover:border-green-700 transition-all"
                            onClick={() => setSprintId(sprint.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setSprintId(sprint.id)}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                        <ClipboardListIcon className="size-5 text-blue-500 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                            {sprint.nombre}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="flex items-center gap-1 text-sm text-cyan-600 dark:text-cyan-400">
                                                <Hash className="size-3" />
                                                {sprint.id}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Inicio: {formattedDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <SquareChevronRight className="size-5 text-gray-400 dark:text-gray-500" />
                                </div>
                            </div>
                        </li>
                    );
                }) : (
                    <li className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <ClipboardListIcon className="size-12 text-gray-400 dark:text-gray-500 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 text-center">
                            No hay sprints disponibles para este proyecto
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Añada uno en la sección "Agregar Sprint"
                        </p>
                    </li>
                )}
            </ul>
        </div>
    );

    return (
        <>
            <Header />
            <main className="mx-auto px-4 md:px-6 py-6 md:py-8 text-gray-900 dark:text-gray-100 max-w-7xl min-h-[70vh]">
                {/* Header y navegación */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <header className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                            <ClipboardListIcon className="size-6 md:size-7" />
                            Gestión Scrum
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">
                            Gestiona proyectos, sprints y tareas de manera eficiente
                        </p>

                        {showBackButton && (
                            <button
                                onClick={handleGoBack}
                                className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1"
                            >
                                <ArrowLeft className="size-4" />
                                <span className="font-medium">Regresar</span>
                            </button>
                        )}
                    </header>

                    {/* Botón para agregar */}
                    <button
                        onClick={() => dispatch(openModalReducer({ modalName: getModalType() }))}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    >
                        <span className="flex items-center justify-center size-6 bg-white text-green-600 rounded-full font-bold">
                            +
                        </span>
                        Agregar {getAddButtonText()}
                    </button>
                </div>

                {/* Contenido principal según estado */}
                {isLoading || taskService.isLoading ? (
                    <div className="flex justify-center items-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <>
                        {!projectId && !sprintId && renderProjectsList()}
                        {projectId > 0 && !sprintId && renderSprintsList()}
                        {sprintId > 0 && (
                            <ScrumBoard
                                initialTasks={taskService.tasks}
                                sprintId={sprintId}
                                onTasksUpdate={fetchTasks}
                            />
                        )}
                    </>
                )}

                {/* Modales */}
                <ModalForm
                    actionType="projects"
                    formName="Project"
                    formFunction={ProjectField}
                    refetch={() => { /* TODO: Implementar refetch real */ }}
                    messageButton="Crear Proyecto"
                    nameModal="create-proyect"
                />

                {projectId > 0 && (
                    <ModalForm
                        actionType={`sprints`}
                        formName="Sprint"
                        formFunction={SprintField}
                        refetch={() => { /* TODO: Implementar refetch real */ }}
                        messageButton="Crear Sprint"
                        nameModal="create-sprint"
                        sprintId={projectId}
                    />
                )}

                {sprintId > 0 && (
                    <ModalForm
                        actionType={`tareas`}
                        formName="Task"
                        formFunction={TasksField}
                        refetch={fetchTasks}
                        messageButton="Crear tarea"
                        nameModal="create-task"
                        sprintId={sprintId}
                    />
                )}
            </main>
            <Footer />
        </>
    );
}