"use client"
import { useEffect, useState, useCallback } from "react";
import { ScrumBoard } from "./components/scrum-board";
import { useTaskService, type Task } from "./services/taskService";
import { useGetProjectsQuery, useGetScrumQuery, useGetSprintsQuery } from "@/hooks/reducers/api";
import { ArrowLeft, ClipboardListIcon, Hash, SquareChevronRight } from "lucide-react";
import { formatDate } from "../pick-up/components/table";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import { ModalForm } from "./components/modal-form";
import { TasksField } from "./constants/tasks";
import { SprintField } from "./constants/sprint";
import { ProjectField } from "./constants/project";
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage";

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
}

export default function ProjectsPage() {
    const dispatch = useAppDispatch();

    const [projectId, setProjectId] = useState<number>(0);
    const [sprintId, setSprintId] = useState<number>(0);

    useEffect(() => {
        const savedProjectId = getLocalStorageItem('scrumProjectId');
        const savedSprintId = getLocalStorageItem('scrumSprintId');

        if (savedProjectId) setProjectId(parseInt(savedProjectId, 10));
        if (savedSprintId) setSprintId(parseInt(savedSprintId, 10));
    }, []);

    useEffect(() => {
        setLocalStorageItem('scrumProjectId', projectId.toString());
    }, [projectId]);

    useEffect(() => {
        setLocalStorageItem('scrumSprintId', sprintId.toString());
    }, [sprintId]);

    const [projects, setProjects] = useState<Project[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    const { getTasks } = useTaskService(projectId);
    const { data: projectsData, refetch: refetchProjects } = useGetProjectsQuery({});
    const { data: sprintsData, refetch: refetchSprints } = useGetSprintsQuery(projectId);
    const { refetch: refetchDef } = useGetScrumQuery({
        url: `sprints/${sprintId}/tasks`,
        signal: undefined,
    });

    // Fetch tasks when sprintId changes
    useEffect(() => {
        const fetchTasks = async () => {
            if (sprintId <= 0) return;

            try {
                const tasksData = await getTasks();
                setTasks(tasksData);
            } catch (error) {
                console.error("Error loading tasks:", error);
                // TODO: Add proper error handling (e.g., show toast notification)
            }
        };

        fetchTasks();
    }, [getTasks, sprintId]);

    // Update projects and sprints when data changes
    useEffect(() => {
        if (projectsData) setProjects(projectsData);
        if (sprintsData) setSprints(sprintsData);
    }, [projectsData, sprintsData]);

    const handleGoBack = useCallback(() => {
        if (sprintId > 0) {
            setSprintId(0);
        } else if (projectId > 0) {
            setProjectId(0);
            setSprints([]);
        }
    }, [projectId, sprintId]);

    const showBackButton = projectId > 0 || sprintId > 0;

    const renderProjectsList = () => (
        <ul className="flex gap-2 flex-wrap mt-10">
            {projects.length ? projects.map((project) => {
                const formatted = formatDate(project.fecha_inicio);
                return (
                    <li
                        key={project.id}
                        className="bg-white dark:bg-zinc-800 shadow border-l-2 border-l-green-500 rounded-2xl px-3 py-2 cursor-pointer hover:underline hover:shadow-md transition-all flex-1 min-w-[200px]"
                        onClick={() => setProjectId(project.id)}
                    >
                        <label className="flex gap-2 items-center cursor-pointer uppercase">
                            <SquareChevronRight className="size-4 text-green-800 dark:text-green-200" />
                            {project.nombre}
                        </label>

                        <div className="flex justify-between items-center gap-2 mt-2">
                            <section className="flex text-ellipsis text-xs items-center gap-2 text-gray-800 dark:text-gray-200/60">
                                <span>{project.descripcion}</span>
                            </section>
                            <section className="flex flex-col">
                                <span className="text-sm">{formatted.date}</span>
                                <span className="text-xs text-gray-500">{formatted.time}</span>
                            </section>
                        </div>
                    </li>
                );
            }) : (
                <li className="flex items-center justify-center p-4">
                    <span className="text-gray-500">No hay proyectos disponibles, añada uno en la seccion "Agregar Proyecto"</span>
                </li>
            )}
        </ul>
    );

    const renderSprintsList = () => (
        <ul className="flex flex-col gap-1 flex-wrap">
            {sprints.length ? sprints.map((sprint) => {
                const formatted = formatDate(sprint.fecha_inicio);
                return (
                    <li
                        key={sprint.id}
                        className="flex md:flex-row flex-col gap-2 justify-between border-b border-gray-200 px-3 py-4 cursor-pointer hover:shadow-md hover:underline transition-all flex-1 min-w-[200px]"
                        onClick={() => setSprintId(sprint.id)}
                    >
                        <label className="flex gap-2 items-center cursor-pointer uppercase text-sm">
                            <ClipboardListIcon className="size-4 text-blue-500 justify-between" />
                            {sprint.nombre}
                            <span className="flex gap-2">
                                <Hash className="text-cyan-600" /> {sprint.id}
                            </span>
                        </label>
                        <div className="flex items-center gap-2 justify-between">
                            <section className="flex flex-col">
                                <span className="text-sm">{formatted.date}</span>
                                <span className="text-xs text-gray-500">{formatted.time}</span>
                            </section>
                        </div>
                    </li>
                );
            }) : (
                <li className="flex items-center justify-center p-4">
                    <span className="text-gray-500">No hay sprints disponibles, añada uno en la seccion "Agregar Sprint"</span>
                </li>
            )}
        </ul>
    );

    return (
        <main className="mx-auto px-4 md:p-6 text-gray-900 dark:text-gray-100 relative">
            <ul className="flex justify-between items-center">
                <header className="mb-8 flex flex-col">
                    <h1 className="flex items-center text-2xl font-bold md:text-3xl">Scrum</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-100">Gestiona proyectos y actividades de mejor manera</p>
                    {showBackButton && (
                        <button
                            onClick={handleGoBack}
                            className="flex gap-1 z-30 cursor-pointer items-center text-green-700 hover:underline mb-4 focus:outline-none"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Regresar</span>
                        </button>
                    )}
                </header>

                <button
                    className="flex gap-1 p-2 ml-auto min-w-[130px] cursor-pointer border bg-green-600 text-gray-100 text-xs rounded-4xl items-center mb-4 before:content-['+'] before:text-xs before:bg-white before:text-green-600 before:px-2 before:py-1 before:rounded-full hover:bg-green-700 transition-colors"
                    onClick={() => {
                        dispatch(openModalReducer({ modalName: projectId === 0 ? "create-proyect" : sprintId > 0 ? "create-task" : "create-sprint" }))
                    }}
                >
                    Agregar {projectId === 0 ? "Proyecto" : sprintId > 0 ? "Tarea" : "Sprint"}
                </button>
            </ul>

            {!projectId && !sprintId && renderProjectsList()}
            {projectId > 0 && !sprintId && renderSprintsList()}
            {sprintId > 0 && <ScrumBoard initialTasks={tasks} sprintId={sprintId} />}

            <ModalForm
                actionType="v1/projects"
                formName="Project"
                formFunction={ProjectField}
                refetch={refetchProjects}
                messageButton="Crear Proyecto"
                nameModal="create-proyect"
            />
            <ModalForm
                actionType={`v1/projects/${projectId}/sprints`}
                formName="Sprint"
                formFunction={SprintField}
                refetch={refetchSprints}
                messageButton="Crear Sprint"
                nameModal="create-sprint"
                sprintId={projectId}
            />
            <ModalForm
                actionType={`v1/sprints/tasks`}
                formName="Task"
                formFunction={TasksField}
                refetch={refetchDef}
                messageButton="Crear tarea"
                nameModal="create-task"
                sprintId={sprintId}
            />
        </main>
    );
}