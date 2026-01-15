"use client";

import { useEffect, useState, useCallback } from "react";
import {
    useGetGeneralQuery,
    usePostGeneralMutation,
    usePutGeneralMutation,
    useDeleteGeneralMutation
} from "@/hooks/api/api";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer, openAlertReducer } from "@/hooks/reducers/drop-down";
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage";
import { formatAPIDate } from "@/utils/constants/format-values";
import Footer from "@/template/footer";
import Header from "@/template/header";
import { Modal } from "@/components/modal";
import MainForm from "@/components/form/main-form";
import {
    ClipboardListIcon,
    ShoppingCart,
    ArrowLeft,
    Plus,
    SquareChevronRight,
    Calendar,
    Clock,
    User,
    CheckCircle,
    AlertCircle,
    PlayCircle,
    Hash,
    Eye,
    Edit,
    Trash2,
    Filter,
    X
} from "lucide-react";

interface Project {
    id: number;
    nombre: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_fin: string;
}

interface Sprint {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    proyecto_id: number;
}

interface Task {
    id: number;
    titulo: string;
    descripcion: string;
    prioridad: string;
    fecha_inicio: string;
    fecha_limite: string;
    fecha_actualizacion: string;
    sprint_id: number;
    usuario_asignado_id: number;
    estado?: string; // Agregado para el board
}

// Campos del formulario para proyectos
const ProjectFields = () => [
    {
        type: "INPUT",
        name: "nombre",
        label: "Nombre del Proyecto",
        placeholder: "Ej: Optimización de Procesos",
        require: true
    },
    {
        type: "TEXT_AREA",
        name: "descripcion",
        label: "Descripción",
        placeholder: "Describa los objetivos del proyecto...",
        require: true
    },
    {
        type: "DATE",
        name: "fecha_inicio",
        label: "Fecha de Inicio",
        require: true
    },
    {
        type: "DATE",
        name: "fecha_fin",
        label: "Fecha de Fin",
        require: true
    }
];

// Campos del formulario para sprints
const SprintFields = (proyectoId?: number) => [
    {
        type: "INPUT",
        name: "nombre",
        label: "Nombre del Sprint",
        placeholder: "Ej: Sprint 1 - Implementación inicial",
        require: true
    },
    {
        type: "DATE",
        name: "fecha_inicio",
        label: "Fecha de Inicio",
        require: true
    },
    {
        type: "DATE",
        name: "fecha_fin",
        label: "Fecha de Fin",
        require: true
    }
];

// Campos del formulario para tareas
const TaskFields = (sprintId?: number) => [
    {
        type: "INPUT",
        name: "titulo",
        label: "Título de la Tarea",
        placeholder: "Ej: Configurar sistema de inventario",
        require: true
    },
    {
        type: "TEXT_AREA",
        name: "descripcion",
        label: "Descripción",
        placeholder: "Describa los detalles de la tarea...",
        require: true
    },
    {
        type: "SELECT",
        name: "prioridad",
        label: "Prioridad",
        options: [
            { value: "baja", label: "Baja" },
            { value: "media", label: "Media" },
            { value: "alta", label: "Alta" },
            { value: "urgente", label: "Urgente" }
        ],
        require: true
    },
    {
        type: "NUMBER",
        name: "usuario_asignado_id",
        label: "ID Usuario Asignado",
        placeholder: "ID del usuario responsable",
        require: true
    },
    {
        type: "DATE",
        name: "fecha_inicio",
        label: "Fecha de Inicio",
        require: true
    },
    {
        type: "DATE",
        name: "fecha_limite",
        label: "Fecha Límite",
        require: true
    }
];

// Componente Modal para crear elementos
const ModalForm = ({
    actionType,
    formName,
    nameModal,
    sprintId,
    formFunction,
    refetch,
    messageButton
}: {
    actionType: string;
    formName: string;
    nameModal: string;
    sprintId?: number;
    formFunction: any;
    refetch: () => void;
    messageButton: string;
}) => {
    const dispatch = useAppDispatch();

    const handleSuccess = () => {
        dispatch(openAlertReducer({
            title: "¡Éxito!",
            message: `${formName} creado exitosamente`,
            type: "success",
            icon: "archivo",
            duration: 3000
        }));
        dispatch(openModalReducer({ modalName: nameModal }));
        refetch();
    };

    return (
        <Modal title={messageButton} modalName={nameModal} maxWidth="md">
            <MainForm
                actionType="post-general"
                table={actionType}
                formName={formName}
                dataForm={formFunction(sprintId)}
                aditionalData={sprintId ? { sprint_id: sprintId } : {}}
                onSuccess={handleSuccess}
                message_button="Crear"
            />
        </Modal>
    );
};

// Componente ScrumBoard
const ScrumBoard = ({ tasks, onTaskUpdate }: {
    tasks: Task[],
    onTaskUpdate: () => void
}) => {
    const dispatch = useAppDispatch();
    const [updateTask] = usePutGeneralMutation();
    const [deleteTask] = useDeleteGeneralMutation();
    const [showFilters, setShowFilters] = useState(false);
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

    // Asignar estados basados en fechas (simplificado)
    const getTaskEstado = (task: Task): string => {
        const now = new Date();
        const fechaLimite = new Date(task.fecha_limite);

        if (now > fechaLimite) return "atrasado";
        if (task.fecha_actualizacion) return "en-progreso";
        return "pendiente";
    };

    const COLUMNS = [
        { id: "pendiente", name: "Pendiente", color: "bg-gray-100 dark:bg-gray-700" },
        { id: "en-progreso", name: "En Progreso", color: "bg-blue-100 dark:bg-blue-900/30" },
        { id: "atrasado", name: "Atrasado", color: "bg-red-100 dark:bg-red-900/30" },
        { id: "completado", name: "Completado", color: "bg-green-100 dark:bg-green-900/30" }
    ];

    const PRIORIDAD_COLORS: Record<string, string> = {
        baja: "text-green-600 bg-green-100 dark:bg-green-900/30",
        media: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
        alta: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
        urgente: "text-red-600 bg-red-100 dark:bg-red-900/30"
    };

    const PRIORIDAD_ICONS: Record<string, React.ReactNode> = {
        baja: <CheckCircle className="size-3" />,
        media: <AlertCircle className="size-3" />,
        alta: <AlertCircle className="size-3" />,
        urgente: <AlertCircle className="size-3" />
    };

    // Filtrar tareas por prioridad
    const filteredTasks = selectedPriorities.length > 0
        ? tasks.filter(task => selectedPriorities.includes(task.prioridad))
        : tasks;

    // Agrupar tareas por estado
    const tasksByEstado = COLUMNS.reduce((acc, column) => {
        acc[column.id] = filteredTasks.filter(task => getTaskEstado(task) === column.id);
        return acc;
    }, {} as Record<string, Task[]>);

    // Obtener todas las prioridades únicas
    const allPriorities = Array.from(new Set(tasks.map(task => task.prioridad)));

    const handlePriorityFilter = (priority: string) => {
        setSelectedPriorities(prev =>
            prev.includes(priority)
                ? prev.filter(p => p !== priority)
                : [...prev, priority]
        );
    };

    const clearFilters = () => {
        setSelectedPriorities([]);
    };

    const handleDeleteTask = async (taskId: number) => {
        dispatch(openAlertReducer({
            title: "Eliminar Tarea",
            message: "¿Está seguro de eliminar esta tarea?",
            type: "warning",
            icon: "alert",
            buttonText: "Eliminar",
            action: async () => {
                try {
                    await deleteTask({
                        table: "tareas",
                        id: taskId
                    }).unwrap();
                    onTaskUpdate();
                } catch (error) {
                    console.error("Error deleting task:", error);
                }
            }
        }));
    };

    const handleViewTask = (task: Task) => {
        dispatch(openModalReducer({ modalName: `view-task-${task.id}` }));
    };

    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                    <Filter className="size-4" />
                    {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                </button>

                {selectedPriorities.length > 0 && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                    >
                        <X className="size-4" />
                        Limpiar filtros
                    </button>
                )}
            </div>

            {showFilters && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium mb-2">Filtrar por prioridad</h4>
                    <div className="flex flex-wrap gap-2">
                        {allPriorities.map(priority => (
                            <button
                                key={priority}
                                onClick={() => handlePriorityFilter(priority)}
                                className={`px-3 py-1 text-xs rounded-full border ${selectedPriorities.includes(priority)
                                    ? "bg-gray-800 dark:bg-gray-700 text-white border-gray-800 dark:border-gray-600"
                                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                            >
                                {priority}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {COLUMNS.map((column) => (
                    <div key={column.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium">{column.name}</h3>
                            <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full text-xs">
                                {tasksByEstado[column.id]?.length || 0}
                            </span>
                        </div>
                        <div className={`min-h-[200px] rounded-lg border p-3 space-y-3 ${column.color}`}>
                            {tasksByEstado[column.id]?.map((task) => (
                                <div
                                    key={task.id}
                                    className="bg-white dark:bg-gray-900 rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-sm">{task.titulo}</h4>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleViewTask(task)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <Eye className="size-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="size-3" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                        {task.descripcion}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-1 text-xs rounded-full ${PRIORIDAD_COLORS[task.prioridad] || 'bg-gray-100'}`}>
                                            <div className="flex items-center gap-1">
                                                {PRIORIDAD_ICONS[task.prioridad]}
                                                {task.prioridad}
                                            </div>
                                        </span>

                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <User className="size-3" />
                                            {task.usuario_asignado_id}
                                        </div>
                                    </div>

                                    <div className="mt-2 text-xs text-gray-500 flex justify-between">
                                        <div>
                                            <Calendar className="size-3 inline mr-1" />
                                            {formatAPIDate(task.fecha_limite)}
                                        </div>
                                        {task.fecha_actualizacion && (
                                            <div>
                                                <Clock className="size-3 inline mr-1" />
                                                Actualizado: {formatAPIDate(task.fecha_actualizacion)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function SupermarketScrumPage() {
    const dispatch = useAppDispatch();
    const [projectId, setProjectId] = useState<number>(0);
    const [sprintId, setSprintId] = useState<number>(0);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);

    // Hooks de API
    const { data: projectsData = [], refetch: refetchProjects } = useGetGeneralQuery({
        param: 'proyectos'
    });

    const { data: sprintsData = [], refetch: refetchSprints } = useGetGeneralQuery({
        param: 'sprints'
    });

    const { data: tasksData = [], refetch: refetchTasks } = useGetGeneralQuery({
        param: sprintId > 0 ? `tareas?sprint_id=${sprintId}` : 'tareas'
    });

    // Cargar IDs desde localStorage
    useEffect(() => {
        const savedProjectId = getLocalStorageItem('scrumProjectId');
        const savedSprintId = getLocalStorageItem('scrumSprintId');

        if (savedProjectId) {
            const parsedId = parseInt(savedProjectId, 10);
            if (!isNaN(parsedId)) {
                setProjectId(parsedId);
                const project = (projectsData as Project[]).find(p => p.id === parsedId);
                setSelectedProject(project || null);
            }
        }
        if (savedSprintId) {
            const parsedId = parseInt(savedSprintId, 10);
            if (!isNaN(parsedId)) {
                setSprintId(parsedId);
                const sprint = (sprintsData as Sprint[]).find(s => s.id === parsedId);
                setSelectedSprint(sprint || null);
            }
        }
    }, [projectsData, sprintsData]);

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

    // Funciones de navegación
    const handleGoBack = () => {
        if (sprintId > 0) {
            setSprintId(0);
            setSelectedSprint(null);
            setLocalStorageItem('scrumSprintId', '0');
        } else if (projectId > 0) {
            setProjectId(0);
            setSprintId(0);
            setSelectedProject(null);
            setSelectedSprint(null);
            setLocalStorageItem('scrumProjectId', '0');
            setLocalStorageItem('scrumSprintId', '0');
        }
    };

    const handleSelectProject = (project: Project) => {
        setProjectId(project.id);
        setSelectedProject(project);
        setSprintId(0);
        setSelectedSprint(null);
    };

    const handleSelectSprint = (sprint: Sprint) => {
        setSprintId(sprint.id);
        setSelectedSprint(sprint);
    };

    // Filtrar sprints por proyecto
    const projectSprints = (sprintsData as Sprint[]).filter(sprint => sprint.proyecto_id === projectId);

    // Renderizar proyectos
    const renderProjects = () => (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Proyectos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(projectsData as Project[]).map((project) => (
                    <div
                        key={project.id}
                        onClick={() => handleSelectProject(project)}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <ClipboardListIcon className="size-5 text-blue-500" />
                            <h3 className="font-semibold text-lg">{project.nombre}</h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                            {project.descripcion}
                        </p>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Inicio:</span>
                                <span className="font-medium">{formatAPIDate(project.fecha_inicio)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Fin:</span>
                                <span className="font-medium">{formatAPIDate(project.fecha_fin)}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">
                                    Sprints: {(sprintsData as Sprint[]).filter(s => s.proyecto_id === project.id).length}
                                </span>
                                <SquareChevronRight className="size-4 text-gray-400" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Renderizar sprints
    const renderSprints = () => (
        <div className="space-y-6">
            {/* Información del proyecto */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-xl font-bold">{selectedProject?.nombre}</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedProject?.descripcion}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Período del proyecto</div>
                        <div className="font-medium">
                            {formatAPIDate(selectedProject?.fecha_inicio || '')} - {formatAPIDate(selectedProject?.fecha_fin || '')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de sprints */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Sprints del Proyecto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projectSprints.map((sprint) => {
                        const sprintTasks = (tasksData as Task[]).filter(task => task.sprint_id === sprint.id);
                        const completedTasks = sprintTasks.filter(task => {
                            const fechaLimite = new Date(task.fecha_limite);
                            const now = new Date();
                            return now <= fechaLimite && task.fecha_actualizacion;
                        }).length;

                        const completionRate = sprintTasks.length > 0
                            ? Math.round((completedTasks / sprintTasks.length) * 100)
                            : 0;

                        return (
                            <div
                                key={sprint.id}
                                onClick={() => handleSelectSprint(sprint)}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <Calendar className="size-5 text-green-500" />
                                    <h4 className="font-semibold">{sprint.nombre}</h4>
                                </div>

                                <div className="space-y-2 text-sm mb-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Inicio:</span>
                                        <span className="font-medium">{formatAPIDate(sprint.fecha_inicio)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Fin:</span>
                                        <span className="font-medium">{formatAPIDate(sprint.fecha_fin)}</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm">
                                            <div className="font-medium">{sprintTasks.length} tareas</div>
                                            <div className="text-gray-500">{completedTasks} completadas</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold">{completionRate}%</div>
                                            <div className="text-xs text-gray-500">Avance</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    // Renderizar board de tareas
    const renderTaskBoard = () => {
        const sprintTasks = (tasksData as Task[]).filter(task => task.sprint_id === sprintId);

        return (
            <div className="space-y-6">
                {/* Información del sprint */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ClipboardListIcon className="size-5 text-green-500" />
                                {selectedSprint?.nombre}
                            </h2>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <Calendar className="size-4" />
                                    {formatAPIDate(selectedSprint?.fecha_inicio || '')} - {formatAPIDate(selectedSprint?.fecha_fin || '')}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Hash className="size-4" />
                                    ID: {selectedSprint?.id}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Proyecto</div>
                            <div className="font-medium">{selectedProject?.nombre}</div>
                        </div>
                    </div>
                </div>

                {/* Board de tareas */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Tablero de Tareas</h3>
                    <ScrumBoard
                        tasks={sprintTasks}
                        onTaskUpdate={refetchTasks}
                    />
                </div>
            </div>
        );
    };

    return (
        <>
            <Header />
            <main className="p-4 md:p-6 min-h-[70vh] max-w-7xl mx-auto">
                {/* Header principal */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                                <ShoppingCart className="size-6 md:size-7" />
                                Gestión Scrum
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Gestiona proyectos, sprints y tareas de manera eficiente
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {(projectId > 0 || sprintId > 0) && (
                                <button
                                    onClick={handleGoBack}
                                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <ArrowLeft className="size-4" />
                                    Regresar
                                </button>
                            )}

                            <button
                                onClick={() => dispatch(openModalReducer({
                                    modalName: projectId === 0 ? 'create-project' :
                                        sprintId === 0 ? 'create-sprint' : 'create-task'
                                }))}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                            >
                                <Plus className="size-4" />
                                Agregar {projectId === 0 ? 'Proyecto' : sprintId === 0 ? 'Sprint' : 'Tarea'}
                            </button>
                        </div>
                    </div>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="hover:text-gray-700 cursor-pointer" onClick={() => {
                            setProjectId(0);
                            setSprintId(0);
                        }}>Proyectos</span>
                        {projectId > 0 && (
                            <>
                                <SquareChevronRight className="size-3" />
                                <span className="hover:text-gray-700 cursor-pointer" onClick={() => setSprintId(0)}>
                                    {selectedProject?.nombre}
                                </span>
                            </>
                        )}
                        {sprintId > 0 && (
                            <>
                                <SquareChevronRight className="size-3" />
                                <span>{selectedSprint?.nombre}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Contenido principal */}
                {!projectId && !sprintId && renderProjects()}
                {projectId > 0 && !sprintId && renderSprints()}
                {sprintId > 0 && renderTaskBoard()}

                {/* Modales */}
                <ModalForm
                    actionType="proyectos"
                    formName="Project"
                    nameModal="create-project"
                    formFunction={() => ProjectFields()}
                    refetch={refetchProjects}
                    messageButton="Crear Nuevo Proyecto"
                />

                {projectId > 0 && (
                    <ModalForm
                        actionType="sprints"
                        formName="Sprint"
                        nameModal="create-sprint"
                        sprintId={projectId}
                        formFunction={() => SprintFields(projectId)}
                        refetch={refetchSprints}
                        messageButton="Crear Nuevo Sprint"
                    />
                )}

                {sprintId > 0 && (
                    <ModalForm
                        actionType="tareas"
                        formName="Task"
                        nameModal="create-task"
                        sprintId={sprintId}
                        formFunction={() => TaskFields(sprintId)}
                        refetch={refetchTasks}
                        messageButton="Crear Nueva Tarea"
                    />
                )}
            </main>
            <Footer />
        </>
    );
}