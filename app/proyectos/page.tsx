"use client";
import { useEffect, useState, useCallback } from "react";
import { ScrumBoard } from "./components/scrum-board";
import { useTaskService, type Task } from "./services/taskService";
import { ArrowLeft, ClipboardListIcon, Copy, FileText, Hash, Share2, SquareChevronRight, Trash2 } from "lucide-react";

import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import { ModalForm } from "./components/modal-form";
import { TasksField } from "./constants/tasks";
import { SprintField } from "./constants/sprint";
import { ProjectField } from "./constants/project";
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage";
import { formatAPIDate } from "@/utils/constants/format-values";
import Header from "@/template/header";
import Footer from "@/template/footer";
import { useGetWithFiltersMutation } from "@/hooks/api/api";
import { ContextMenu, ContextMenuItem } from "@/components/context-menu";

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

    const menuItems: ContextMenuItem[] = [
        {
            label: 'Copiar',
            icon: <Copy size={16} />,
            onClick: () => console.log('Copiado'),
        },
        {
            label: 'Ver detalles',
            icon: <FileText size={16} />,
            onClick: () => console.log('Mostrar detalles'),
        },
        {
            label: 'Compartir',
            icon: <Share2 size={16} />,
            onClick: () => console.log('Abrir diálogo de compartir'),
        },
        {
            label: 'Eliminar',
            icon: <Trash2 size={16} />,
            onClick: () => console.log('Elemento eliminado'),
            danger: true,
        },
    ];

    const [projectId, setProjectId] = useState<number>(0);
    const [sprintId, setSprintId] = useState<number>(0);

    // Estados para datos
    const [projects, setProjects] = useState<Project[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    // Mutations para consultas con filtros
    const [getProjects, { isLoading: loadingProjects }] = useGetWithFiltersMutation();
    const [getSprints, { isLoading: loadingSprints }] = useGetWithFiltersMutation();

    // Servicio de tareas (se ajustará aparte para usar getWithFilters también)
    const { getTasks } = useTaskService(sprintId);

    // Cargar proyectos al inicio
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const result = await getProjects({
                    table: "proyectos",        // nombre de la tabla en BD
                    page: 1,
                    pageSize: 100,
                    filtros: {},               // sin filtros adicionales
                }).unwrap();
                // Asumiendo que result.data contiene el array de proyectos
                setProjects(result.data || result || []);
            } catch (error) {
                console.error("Error al cargar proyectos:", error);
            }
        };
        fetchProjects();
    }, [getProjects]);

    // Cargar sprints cuando cambia projectId
    useEffect(() => {
        if (projectId <= 0) {
            setSprints([]);
            return;
        }
        const fetchSprints = async () => {
            try {
                const result = await getSprints({
                    table: "sprints",
                    page: 1,
                    pageSize: 100,
                    filtros: {
                        Filtros: [
                            {
                                Key: "proyecto_id",
                                Value: projectId,
                                Operator: "="
                            }
                        ],
                    }, // filtro por proyecto
                }).unwrap();
                setSprints(result.data || result || []);
            } catch (error) {
                console.error("Error al cargar sprints:", error);
            }
        };
        fetchSprints();
    }, [projectId, getSprints]);

    // Cargar tareas cuando cambia sprintId (usando el servicio)
    useEffect(() => {
        if (sprintId <= 0) return;
        const fetchTasks = async () => {
            try {
                const tasksData = await getTasks();
                setTasks(tasksData);
            } catch (error) {
                console.error("Error loading tasks:", error);
            }
        };
        fetchTasks();
    }, [sprintId]);

    // Persistir IDs seleccionados en localStorage
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

    // Refetch manual para recargar listas después de crear/editar
    const refetchProjects = useCallback(async () => {
        try {
            const result = await getProjects({
                table: "proyectos",
                page: 1,
                pageSize: 100,
                filtros: {},
            }).unwrap();
            setProjects(result.data || result || []);
        } catch (error) {
            console.error("Error al recargar proyectos:", error);
        }
    }, [getProjects]);

    const refetchSprints = useCallback(async () => {
        if (projectId <= 0) return;
        try {
            const result = await getSprints({
                table: "sprints",
                page: 1,
                pageSize: 100,
                filtros: { 
                    Filtros: [
                        {
                            Key: "proyecto_id",
                            Value: projectId,
                            Operator: "="
                        }
                    ],
                 },
            }).unwrap();
            setSprints(result.data || result || []);
        } catch (error) {
            console.error("Error al recargar sprints:", error);
        }
    }, [getSprints, projectId]);

    const handleGoBack = useCallback(() => {
        if (sprintId > 0) {
            setSprintId(0);
        } else if (projectId > 0) {
            setProjectId(0);
            setSprints([]);
        }
    }, [projectId, sprintId]);

    const showBackButton = projectId > 0 || sprintId > 0;

    // Renderizado de proyectos
    const renderProjectsList = () => (
        <ul className="flex gap-2 flex-wrap mt-10">
            <ContextMenu items={menuItems}>
            {loadingProjects ? (
                <li className="text-gray-500">Cargando proyectos...</li>
            ) : projects.length ? projects.map((project) => {
                const formatted = formatAPIDate(project.fecha_inicio);
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
                                <span className="text-sm">{formatted}</span>
                            </section>
                        </div>
                    </li>
                );
            }) : (
                <li className="flex items-center justify-center p-4">
                    <span className="text-gray-500">No hay proyectos disponibles, añada uno en la sección "Agregar Proyecto"</span>
                </li>
                )}
            </ContextMenu>
        </ul>
    );

    // Renderizado de sprints
    const renderSprintsList = () => (
        <ul className="flex flex-col gap-1 flex-wrap">
            {loadingSprints ? (
                <li className="text-gray-500">Cargando sprints...</li>
            ) : sprints.length ? sprints.map((sprint) => {
                const formatted = formatAPIDate(sprint.fecha_inicio);
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
                                <span className="text-sm">{formatted}</span>
                            </section>
                        </div>
                    </li>
                );
            }) : (
                <li className="flex items-center justify-center p-4">
                    <span className="text-gray-500">No hay sprints disponibles, añada uno en la sección "Agregar Sprint"</span>
                </li>
            )}
        </ul>
    );

    return (
        <>
            <Header />
            <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
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
                            dispatch(openModalReducer({ modalName: projectId === 0 ? "create-proyect" : sprintId > 0 ? "create-task" : "create-sprint" }));
                        }}
                    >
                        Agregar {projectId === 0 ? "Proyecto" : sprintId > 0 ? "Tarea" : "Sprint"}
                    </button>
                </ul>

                {!projectId && !sprintId && renderProjectsList()}
                {projectId > 0 && !sprintId && renderSprintsList()}
                {sprintId > 0 && <ScrumBoard initialTasks={tasks} sprintId={sprintId} />}

                <ModalForm
                    modalName="Nuevo Proyecto"
                    actionType="proyectos"
                    formName="Project"
                    formFunction={ProjectField}
                    refetch={refetchProjects}
                    messageButton="Crear Proyecto"
                    nameModal="create-proyect"
                />
                <ModalForm
                    modalName="Nuevo Sprint"
                    actionType={`sprints`}
                    formName="Sprint"
                    formFunction={SprintField}
                    refetch={refetchSprints}
                    messageButton="Crear Sprint"
                    nameModal="create-sprint"
                    aditionalData={{ proyecto_id: projectId }}
                />
                
                <ModalForm
                    modalName="Nueva Tarea"
                    actionType={`tareas`}
                    formName="Task"
                    formFunction={TasksField}
                    refetch={() => {
                        // Refetch tareas después de crear una nueva
                        if (sprintId > 0) {
                            getTasks()
                        }
                    }}
                    messageButton="Crear tarea"
                    nameModal="create-task"
                    aditionalData={{ estado:"backlog", sprint_id: sprintId, fecha_creacion: new Date().toISOString(), fecha_actualizacion: new Date().toISOString() }}
                />
            </main>
            <Footer />
        </>
    );
}