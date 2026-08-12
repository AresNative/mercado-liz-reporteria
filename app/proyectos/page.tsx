"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { ScrumBoard } from "./components/scrum-board";
import { useTaskService, type Task } from "./services/taskService";
import {
    ArrowLeft,
    ClipboardListIcon,
    Edit,
    Hash,
    SquareChevronRight,
    Trash2,
    Search,
    RefreshCw,
    AlertTriangle,
    FolderKanban,
    Inbox,
} from "lucide-react";

import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer, closeModalReducer, openAlertReducer } from "@/hooks/reducers/drop-down";
import { ModalForm } from "./components/modal-form";
import { TasksField } from "./constants/tasks";
import { SprintField } from "./constants/sprint";
import { ProjectField } from "./constants/project";
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage";
import { formatAPIDate } from "@/utils/constants/format-values";
import Header from "@/template/header";
import Footer from "@/template/footer";
import { useGetWithFiltersMutation, useDeleteGeneralMutation } from "@/hooks/api/api";
import { Modal } from "@/components/modal";
import MainForm from "@/components/form/main-form";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { Button } from "@/components/button";

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

// Componentes modales para edición
const EditProjectModal = ({ project, refetch, onClose }: { project: Project; refetch: () => void; onClose: () => void }) => {
    return (
        <Modal title="Editar Proyecto" modalName="edit-project">
            <MainForm
                actionType="put-general"
                table="proyectos"
                modelName="Project"
                dataForm={ProjectField(project)}
                aditionalData={{ id: project.id }}
                onSuccess={() => {
                    onClose();
                    refetch();
                }}
                message_button="Guardar cambios"
            />
        </Modal>
    );
};

const EditSprintModal = ({ sprint, refetch, onClose }: { sprint: Sprint; refetch: () => void; onClose: () => void }) => {
    return (
        <Modal title="Editar Sprint" modalName="edit-sprint" >
            <MainForm
                actionType="put-general"
                table="sprints"
                modelName="Sprint"
                dataForm={SprintField(sprint)}
                aditionalData={{ id: sprint.id }}
                onSuccess={() => {
                    onClose();
                    refetch();
                }}
                message_button="Guardar cambios"
            />
        </Modal>
    );
};

// ─── Piezas de UI reutilizables (diseño consistente para ambas listas) ─────────

// Barra de herramientas de sección: título + contador, búsqueda y botón de recarga.
const SectionToolbar = ({
    icon: Icon,
    title,
    count,
    search,
    onSearchChange,
    searchPlaceholder,
    onRefresh,
    refreshing,
}: {
    icon: React.ElementType;
    title: string;
    count: number;
    search: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder: string;
    onRefresh: () => void;
    refreshing: boolean;
}) => (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
            <Icon className="size-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h2>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {count}
            </span>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>
            <button
                onClick={onRefresh}
                disabled={refreshing}
                title="Recargar"
                className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
        </div>
    </div>
);

// Banner de error con reintento, coherente en toda la app.
const ErrorBanner = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="flex-1">{message}</span>
        <button onClick={onRetry} className="underline hover:no-underline shrink-0 font-medium">
            Reintentar
        </button>
    </div>
);

// Estado vacío ilustrado, se usa tanto para "sin datos" como para "sin resultados de búsqueda".
const EmptyState = ({ message }: { message: string }) => (
    <li className="col-span-full flex flex-col items-center justify-center gap-2 p-10 text-gray-400 dark:text-gray-500">
        <Inbox size={28} className="opacity-60" />
        <span className="text-sm text-center">{message}</span>
    </li>
);

// Tarjeta esqueleto mientras carga la lista.
const CardSkeleton = () => (
    <li className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-4 h-[86px] animate-pulse">
        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-2 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
    </li>
);

export default function ProjectsPage() {
    const dispatch = useAppDispatch();

    const [projectId, setProjectId] = useState<number>(0);
    const [sprintId, setSprintId] = useState<number>(0);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);

    // Estados para datos
    const [projects, setProjects] = useState<Project[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    // Estados de error, propios de cada sección (independientes entre sí)
    const [projectsError, setProjectsError] = useState<string | null>(null);
    const [sprintsError, setSprintsError] = useState<string | null>(null);

    // Búsqueda local, propia de cada sección
    const [projectSearch, setProjectSearch] = useState("");
    const [sprintSearch, setSprintSearch] = useState("");

    // Mutations
    const [getProjects, { isLoading: loadingProjects }] = useGetWithFiltersMutation();
    const [getSprints, { isLoading: loadingSprints }] = useGetWithFiltersMutation();
    const [deleteProject] = useDeleteGeneralMutation();
    const [deleteSprint] = useDeleteGeneralMutation();

    // Servicio de tareas
    const { getTasks } = useTaskService(sprintId);

    // Referencias para cancelar peticiones obsoletas (evita condiciones de carrera
    // al cambiar rápido de proyecto o recargar varias veces seguidas)
    const projectsAbortRef = useRef<AbortController | null>(null);
    const sprintsAbortRef = useRef<AbortController | null>(null);

    // Cargar / recargar proyectos
    const refetchProjects = useCallback(async () => {
        projectsAbortRef.current?.abort();
        const controller = new AbortController();
        projectsAbortRef.current = controller;
        setProjectsError(null);
        try {
            const result = await getProjects({
                table: "proyectos",
                page: 1,
                pageSize: 100,
                filtros: {},
                signal: controller.signal,
            }).unwrap();
            if (controller.signal.aborted) return;
            setProjects(result.data || result || []);
        } catch (error: any) {
            if (error?.name === "AbortError" || controller.signal.aborted) return;
            console.error("Error al cargar proyectos:", error);
            setProjectsError("No se pudieron cargar los proyectos. Verifica tu conexión.");
        }
    }, [getProjects]);

    // Cargar / recargar sprints del proyecto activo
    const refetchSprints = useCallback(async () => {
        if (projectId <= 0) {
            setSprints([]);
            return;
        }
        sprintsAbortRef.current?.abort();
        const controller = new AbortController();
        sprintsAbortRef.current = controller;
        setSprintsError(null);
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
                signal: controller.signal,
            }).unwrap();
            if (controller.signal.aborted) return;
            setSprints(result.data || result || []);
        } catch (error: any) {
            if (error?.name === "AbortError" || controller.signal.aborted) return;
            console.error("Error al cargar sprints:", error);
            setSprintsError("No se pudieron cargar los sprints. Verifica tu conexión.");
        }
    }, [projectId, getSprints]);

    useEffect(() => {
        refetchProjects();
        return () => projectsAbortRef.current?.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        refetchSprints();
        return () => sprintsAbortRef.current?.abort();
    }, [refetchSprints]);

    // Limpiar la búsqueda de sprints al cambiar de proyecto
    useEffect(() => {
        setSprintSearch("");
    }, [projectId]);

    // Cargar tareas cuando cambia sprintId
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
    }, [sprintId, getTasks]);

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

    const handleGoBack = useCallback(() => {
        if (sprintId > 0) {
            setSprintId(0);
        } else if (projectId > 0) {
            setProjectId(0);
            setSprints([]);
        }
    }, [projectId, sprintId]);

    const showBackButton = projectId > 0 || sprintId > 0;

    // Eliminar proyecto
    const handleDeleteProject = (id: number, nombre: string) => {
        dispatch(
            openAlertReducer({
                title: "Borrar proyecto",
                message: `¿Estás seguro de que deseas eliminar el proyecto "${nombre}"? Se perderán todos los sprints y tareas asociadas.`,
                type: "error",
                icon: "alert",
                buttonText: "Eliminar",
                action: async () => {
                    try {
                        await deleteProject({
                            table: "proyectos", id, column: "id"
                        }).unwrap();
                        refetchProjects();
                        if (projectId === id) setProjectId(0);
                    } catch (error) {
                        console.error("Error al eliminar proyecto:", error);
                    }
                },
                duration: 10000000
            })
        );
    };

    // Eliminar sprint
    const handleDeleteSprint = (id: number, nombre: string) => {
        dispatch(
            openAlertReducer({
                title: "Borrar sprint",
                message: `¿Estás seguro de que deseas eliminar el sprint "${nombre}"? Se perderán todas las tareas asociadas.`,
                type: "error",
                icon: "alert",
                buttonText: "Eliminar",
                action: async () => {
                    try {
                        await deleteSprint({ table: "sprints", id, column: "id" }).unwrap();
                        refetchSprints();
                        if (sprintId === id) setSprintId(0);
                    } catch (error) {
                        console.error("Error al eliminar sprint:", error);
                    }
                },
                duration: 10000000
            })
        );
    };

    // Filtrado local por búsqueda (los catálogos son pequeños, no requiere ir al servidor)
    const filteredProjects = useMemo(() => {
        const query = projectSearch.trim().toLowerCase();
        if (!query) return projects;
        return projects.filter(
            (p) => p.nombre?.toLowerCase().includes(query) || p.descripcion?.toLowerCase().includes(query)
        );
    }, [projects, projectSearch]);

    const filteredSprints = useMemo(() => {
        const query = sprintSearch.trim().toLowerCase();
        if (!query) return sprints;
        return sprints.filter((s) => s.nombre?.toLowerCase().includes(query));
    }, [sprints, sprintSearch]);

    // Renderizado de proyectos con botones de acción
    const renderProjectsList = () => (
        <section>
            <SectionToolbar
                icon={FolderKanban}
                title="Proyectos"
                count={filteredProjects.length}
                search={projectSearch}
                onSearchChange={setProjectSearch}
                searchPlaceholder="Buscar proyectos..."
                onRefresh={refetchProjects}
                refreshing={loadingProjects}
            />

            {projectsError && <ErrorBanner message={projectsError} onRetry={refetchProjects} />}

            <BentoGrid cols={3}>
                {loadingProjects && projects.length === 0 ? (
                    <>
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </>
                ) : filteredProjects.length ? filteredProjects.map((project) => {
                    const formatted = formatAPIDate(project.fecha_inicio);
                    return (
                        <BentoItem
                            key={project.id}
                            className="bg-white dark:bg-gray-800 shadow border-1-2 border-l-blue-500 rounded-2xl px-3 py-3 hover:shadow-md transition-all relative group"
                        >
                            <div
                                className="cursor-pointer"
                                onClick={() => setProjectId(project.id)}
                            >
                                <label className="flex gap-2 items-center cursor-pointer uppercase text-green-800 dark:text-white">
                                    <SquareChevronRight className="size-4" />
                                    {project.nombre}
                                </label>
                                <div className="flex justify-between items-center gap-2 mt-2">
                                    <section className="flex text-ellipsis text-xs items-center gap-2 text-gray-800 dark:text-gray-200/60">
                                        <span>{project.descripcion}</span>
                                    </section>
                                    <section className="flex flex-col">
                                        <span className="text-sm dark:text-gray-200">{formatted}</span>
                                    </section>
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity dark:text-white">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedProject(project);
                                        dispatch(openModalReducer({ modalName: "edit-project" }));
                                    }}
                                    className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300"
                                    title="Editar"
                                >
                                    <Edit size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteProject(project.id, project.nombre);
                                    }}
                                    className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-red-200 dark:hover:bg-red-800"
                                    title="Eliminar"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </BentoItem>
                    );
                }) : (
                    <EmptyState
                        message={
                            projectSearch
                                ? `Ningún proyecto coincide con "${projectSearch}".`
                                : 'No hay proyectos disponibles, añade uno en "Agregar Proyecto".'
                        }
                    />
                )}
            </BentoGrid>
        </section>
    );

    // Renderizado de sprints con botones de acción
    const renderSprintsList = () => (
        <section>
            <SectionToolbar
                icon={ClipboardListIcon}
                title="Sprints"
                count={filteredSprints.length}
                search={sprintSearch}
                onSearchChange={setSprintSearch}
                searchPlaceholder="Buscar sprints..."
                onRefresh={refetchSprints}
                refreshing={loadingSprints}
            />

            {sprintsError && <ErrorBanner message={sprintsError} onRetry={refetchSprints} />}

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {loadingSprints && sprints.length === 0 ? (
                    <>
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </>
                ) : filteredSprints.length ? filteredSprints.map((sprint) => {
                    const formatted = formatAPIDate(sprint.fecha_inicio);
                    return (
                        <li
                            key={sprint.id}
                            className="bg-white dark:bg-gray-800 shadow border-l-2 border-l-blue-500 rounded-2xl px-3 py-3 hover:shadow-md transition-all relative group"
                        >
                            <div
                                className="cursor-pointer"
                                onClick={() => setSprintId(sprint.id)}
                            >
                                <label className="flex gap-2 items-center cursor-pointer uppercase text-sm text-blue-800 dark:text-white">
                                    <ClipboardListIcon className="size-4 text-blue-500 shrink-0" />
                                    <span className="truncate">{sprint.nombre}</span>
                                    <span className="flex items-center gap-1 text-xs text-cyan-700 dark:text-cyan-400 shrink-0">
                                        <Hash size={12} /> {sprint.id}
                                    </span>
                                </label>
                                <div className="flex items-center gap-2 justify-between mt-2 dark:text-white">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{formatted}</span>
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity dark:text-white">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSprint(sprint);
                                        dispatch(openModalReducer({ modalName: "edit-sprint" }));
                                    }}
                                    className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300"
                                    title="Editar"
                                >
                                    <Edit size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSprint(sprint.id, sprint.nombre);
                                    }}
                                    className="p-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-red-200 dark:hover:bg-red-800"
                                    title="Eliminar"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </li>
                    );
                }) : (
                    <EmptyState
                        message={
                            sprintSearch
                                ? `Ningún sprint coincide con "${sprintSearch}".`
                                : 'No hay sprints disponibles, añade uno en "Agregar Sprint".'
                        }
                    />
                )}
            </ul>
        </section>
    );

    return (
        <>
            <Header />
            <main className="min-h-screen mx-auto p-4 md:p-6 text-gray-900">
                <ul className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <header className="mb-8 flex flex-col">
                        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl dark:text-white">
                            <FolderKanban className="size-6 text-green-600 dark:text-green-400" />
                            Scrum
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-100">Gestiona proyectos y actividades de mejor manera</p>
                        {showBackButton && (
                            <Button
                                onClick={handleGoBack}
                                color="second"
                                size="small"
                            >
                                <ArrowLeft className="size-4" />
                                <span>Regresar</span>
                            </Button>
                        )}
                    </header>

                    <Button
                        color="success"
                        size="small"
                        onClick={() => {
                            dispatch(openModalReducer({ modalName: projectId === 0 ? "create-proyect" : sprintId > 0 ? "create-task" : "create-sprint" }));
                        }}
                    >
                        Agregar {projectId === 0 ? "Proyecto" : sprintId > 0 ? "Tarea" : "Sprint"}
                    </Button>
                </ul>

                {!projectId && !sprintId && renderProjectsList()}
                {projectId > 0 && !sprintId && renderSprintsList()}
                {sprintId > 0 && <ScrumBoard initialTasks={tasks} sprintId={sprintId} />}

                {/* Modales de creación */}
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
                    actionType="sprints"
                    formName="Sprint"
                    formFunction={SprintField}
                    refetch={refetchSprints}
                    messageButton="Crear Sprint"
                    nameModal="create-sprint"
                    aditionalData={{ proyecto_id: projectId }}
                />
                <ModalForm
                    modalName="Nueva Tarea"
                    actionType="tareas"
                    formName="Task"
                    formFunction={TasksField}
                    refetch={() => {
                        if (sprintId > 0) getTasks();
                    }}
                    messageButton="Crear tarea"
                    nameModal="create-task"
                    aditionalData={{ estado: "backlog", sprint_id: sprintId, fecha_creacion: new Date().toISOString(), fecha_actualizacion: new Date().toISOString() }}
                />

                {/* Modales de edición */}
                {selectedProject && (
                    <EditProjectModal
                        project={selectedProject}
                        refetch={refetchProjects}
                        onClose={() => {
                            setSelectedProject(null);
                            dispatch(closeModalReducer({ modalName: "edit-project" }));
                        }}
                    />
                )}
                {selectedSprint && (
                    <EditSprintModal
                        sprint={selectedSprint}
                        refetch={refetchSprints}
                        onClose={() => {
                            setSelectedSprint(null);
                            dispatch(closeModalReducer({ modalName: "edit-sprint" }));
                        }}
                    />
                )}
            </main>
            <Footer />
        </>
    );
}