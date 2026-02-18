"use client";

import { useState, useEffect, useCallback } from "react";
import { useGetWithFiltersGeneralMutation } from "@/hooks/api/api";
import Header from "@/template/header";
import Footer from "@/template/footer";
import MainForm from "@/components/form/main-form";
import { Modal } from "@/components/modal";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { Button } from "@/components/button";
import Badge from "@/components/badge";
import Card from "@/components/card";
import AvatarGroup from "@/components/avatar-group";
import { CountdownTimer } from "@/components/counter-down";
import {
    Plus,
    Calendar,
    Users,
    Flag,
    CheckCircle,
    Clock,
    AlertCircle,
    Trash2,
    Edit,
    ChevronRight,
    X,
    ListTodo,
    TrendingUp,
    BarChart3,
    Target,
    Zap,
    GitPullRequest,
    AlertTriangle,
    FileText,
    MoreHorizontal,
    UserPlus,
    Settings,
    Download,
    Share2,
    Filter
} from "lucide-react";
import { Field } from "@/utils/types/interfaces";
import { AnimatePresence, motion } from "motion/react";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";

// Tipos alineados con BD
interface Proyecto {
    id: number;
    nombre: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_fin?: string;
    usuario_lider_id?: number;
}

interface Sprint {
    id: number;
    proyecto_id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
}

interface Tarea {
    id: number;
    sprint_id: number;
    titulo: string;
    descripcion: string;
    estado: 'pendiente' | 'en_progreso' | 'en_revision' | 'completado';
    prioridad: 'baja' | 'media' | 'alta' | 'critica';
    fecha_creacion: string;
    fecha_actualizacion: string;
    usuario_asignado_id?: number;
    fecha_inicio?: string;
    fecha_limite?: string;
}

export default function ScrumScreen() {
    const dispatch = useAppDispatch();

    // Estados principales con tipado fuerte
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);

    // Estados de datos con tipado
    const [projects, setProjects] = useState<Proyecto[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [tasks, setTasks] = useState<Tarea[]>([]);

    // Estados UI
    const [loading, setLoading] = useState({
        projects: true,
        sprints: false,
        tasks: false
    });
    const [editingItem, setEditingItem] = useState<any>(null);
    const [activeView, setActiveView] = useState<'board' | 'list'>('board');
    const [filterPriority, setFilterPriority] = useState<string>('all');

    // Consultas RTK Query
    const [getWithFilter] = useGetWithFiltersGeneralMutation();

    // Helper para fetch genérico
    const fetchById = useCallback(async <T,>(
        table: string,
        key: string,
        value: number
    ): Promise<T[]> => {
        try {
            const response = await getWithFilter({
                table,
                filtros: {
                    Filtros: [{
                        Key: key,
                        Operator: '=',
                        Value: value
                    }]
                }
            }).unwrap();
            return response.data || response;
        } catch (error) {
            console.error(`Error fetching ${table}:`, error);
            return [];
        }
    }, [getWithFilter]);

    // 1. Fetch inicial de proyectos (solo al montar)   
    useEffect(() => {
        const loadProjects = async () => {
            try {
                setLoading(prev => ({ ...prev, projects: true }));
                const response = await getWithFilter({
                    table: 'proyectos',
                    filtros: { Filtros: [{}] }
                }).unwrap();

                const data: Proyecto[] = response.data || response;
                setProjects(data);

                if (data.length > 0) {
                    const firstProjectId = data[0].id;
                    setSelectedProjectId(firstProjectId);
                }
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(prev => ({ ...prev, projects: false }));
            }
        };

        loadProjects();
    }, [getWithFilter]); // Solo getWithFilter como dependencia

    // 2. Fetch de sprints cuando cambia selectedProjectId
    const loadSprints = useCallback(async (projectId: number) => {
        if (!projectId) return;

        try {
            setLoading(prev => ({ ...prev, sprints: true }));
            const data: Sprint[] = await fetchById<Sprint>('sprints', 'proyecto_id', projectId);
            setSprints(data);

            // Resetear sprint seleccionado y tareas cuando cambia el proyecto
            setSelectedSprintId(null);
            setTasks([]);

            // Solo seleccionar primer sprint si existe
            if (data.length > 0) {
                setSelectedSprintId(data[0].id);
            }
        } catch (error) {
            console.error("Error loading sprints:", error);
        } finally {
            setLoading(prev => ({ ...prev, sprints: false }));
        }
    }, [fetchById]);

    // Efecto para cargar sprints
    useEffect(() => {
        if (selectedProjectId) {
            loadSprints(selectedProjectId);
        }
    }, [selectedProjectId, loadSprints]);

    // 3. Fetch de tareas cuando cambia selectedSprintId
    const loadTasks = useCallback(async (sprintId: number) => {
        if (!sprintId) {
            setTasks([]);
            return;
        }

        try {
            setLoading(prev => ({ ...prev, tasks: true }));
            const data: Tarea[] = await fetchById<Tarea>('tareas', 'sprint_id', sprintId);
            setTasks(data);
        } catch (error) {
            console.error("Error loading tasks:", error);
        } finally {
            setLoading(prev => ({ ...prev, tasks: false }));
        }
    }, [fetchById]);

    // Efecto para cargar tareas
    useEffect(() => {
        if (selectedSprintId) {
            loadTasks(selectedSprintId);
        }
    }, [selectedSprintId, loadTasks]);

    // Funciones para manejar cambios de selección
    const handleProjectClick = (projectId: number) => {
        if (projectId !== selectedProjectId) {
            setSelectedProjectId(projectId);
        }
    };

    const handleSprintClick = (sprintId: number) => {
        if (sprintId !== selectedSprintId) {
            setSelectedSprintId(sprintId);
        }
    };

    // Formularios de datos ALINEADOS CON BD
    const projectFormFields: Field[] = [
        {
            type: "H1",
            label: editingItem ? "Editar Proyecto" : "Nuevo Proyecto",
            require: false
        },
        {
            type: "INPUT",
            name: "nombre",
            label: "Nombre del Proyecto",
            placeholder: "Ej: Sistema de Gestión de Inventarios",
            require: true,
            maxLength: 100
        },
        {
            type: "TEXT_AREA",
            name: "descripcion",
            label: "Descripción",
            placeholder: "Describe los objetivos y alcance del proyecto...",
            require: true,
            maxLength: 500
        },
        {
            type: "Flex",
            elements: [
                {
                    type: "DATE",
                    name: "fecha_inicio",
                    label: "Fecha de Inicio",
                    require: true
                },
                {
                    type: "DATE",
                    name: "fecha_fin",
                    label: "Fecha de Fin Estimada",
                    require: false
                }
            ],
            require: false
        }
    ];

    const sprintFormFields: Field[] = [
        {
            type: "H1",
            label: editingItem ? "Editar Sprint" : "Nuevo Sprint",
            require: false
        },
        {
            type: "INPUT",
            name: "nombre",
            label: "Nombre del Sprint",
            placeholder: "Ej: Sprint 1 - Implementación inicial",
            require: true
        },
        {
            type: "Flex",
            elements: [
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
            ],
            require: false
        }
    ];

    const taskFormFields: Field[] = [
        {
            type: "H1",
            label: editingItem ? "Editar Tarea" : "Nueva Tarea",
            require: false
        },
        {
            type: "INPUT",
            name: "titulo",
            label: "Título",
            placeholder: "Ej: Implementar API de usuarios",
            require: true
        },
        {
            type: "TEXT_AREA",
            name: "descripcion",
            label: "Descripción",
            placeholder: "Detalles de la tarea...",
            require: true
        },
        {
            type: "Flex",
            elements: [
                {
                    type: "SELECT",
                    name: "prioridad",
                    label: "Prioridad",
                    options: [
                        { value: "baja", label: "Baja" },
                        { value: "media", label: "Media" },
                        { value: "alta", label: "Alta" },
                        { value: "critica", label: "Crítica" }
                    ],
                    require: true
                },
                {
                    type: "SELECT",
                    name: "estado",
                    label: "Estado",
                    options: [
                        { value: "pendiente", label: "Pendiente" },
                        { value: "en_progreso", label: "En Progreso" },
                        { value: "en_revision", label: "En Revisión" },
                        { value: "completado", label: "Completado" }
                    ],
                    require: true
                }
            ],
            require: false
        },
        {
            type: "Flex",
            elements: [
                {
                    type: "DATE",
                    name: "fecha_inicio",
                    label: "Fecha de Inicio",
                    require: false
                },
                {
                    type: "DATE",
                    name: "fecha_limite",
                    label: "Fecha Límite",
                    require: false
                }
            ],
            require: false
        }
    ];

    // Funciones CRUD simplificadas
    const handleProjectSuccess = async () => {
        try {
            setLoading(prev => ({ ...prev, projects: true }));
            const response = await getWithFilter({
                table: 'proyectos',
                filtros: { Filtros: [{}] }
            }).unwrap();
            setProjects(response.data || response);
        } catch (error) {
            console.error("Error reloading projects:", error);
        } finally {
            setLoading(prev => ({ ...prev, projects: false }));
            dispatch(openModalReducer({ modalName: "projectModal" }));
            setEditingItem(null);
        }
    };

    const handleSprintSuccess = async () => {
        if (!selectedProjectId) return;

        try {
            setLoading(prev => ({ ...prev, sprints: true }));
            await loadSprints(selectedProjectId);
        } catch (error) {
            console.error("Error reloading sprints:", error);
        } finally {
            dispatch(openModalReducer({ modalName: "sprintModal" }));
            setEditingItem(null);
        }
    };

    const handleTaskSuccess = async () => {
        if (!selectedSprintId) return;

        try {
            setLoading(prev => ({ ...prev, tasks: true }));
            await loadTasks(selectedSprintId);
        } catch (error) {
            console.error("Error reloading tasks:", error);
        } finally {
            dispatch(openModalReducer({ modalName: "taskModal" }));
            setEditingItem(null);
        }
    };

    // Función para refrescar datos manualmente
    const refreshData = async () => {
        try {
            setLoading({ projects: true, sprints: true, tasks: true });

            // Recargar proyectos
            const projectsResponse = await getWithFilter({
                table: 'proyectos',
                filtros: { Filtros: [{}] }
            }).unwrap();
            setProjects(projectsResponse.data || projectsResponse);

            if (selectedProjectId) {
                await loadSprints(selectedProjectId);
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
        } finally {
            setLoading({ projects: false, sprints: false, tasks: false });
        }
    };

    // Función para abrir modales
    const openModal = (modalName: string) => {
        dispatch(openModalReducer({ modalName }));
    };

    // Datos actuales
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const selectedSprint = sprints.find(s => s.id === selectedSprintId);

    // Estadísticas REALES (sin campos fantasma)
    const taskStats = {
        total: tasks.length,
        pendiente: tasks.filter(t => t.estado === 'pendiente').length,
        progreso: tasks.filter(t => t.estado === 'en_progreso').length,
        revision: tasks.filter(t => t.estado === 'en_revision').length,
        completado: tasks.filter(t => t.estado === 'completado').length
    };

    // Calcular progreso basado en estados
    const calculateProgress = () => {
        if (tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.estado === 'completado').length;
        return Math.round((completed / tasks.length) * 100);
    };

    // Avatar data para el equipo
    const teamAvatars = [
        { alt: "Usuario 1", src: "https://api.dicebear.com/7.x/avataaars/svg?seed=1" },
        { alt: "Usuario 2", src: "https://api.dicebear.com/7.x/avataaars/svg?seed=2" },
        { alt: "Usuario 3", src: "https://api.dicebear.com/7.x/avataaars/svg?seed=3" },
        { alt: "Usuario 4", src: "https://api.dicebear.com/7.x/avataaars/svg?seed=4" },
    ];

    // Tareas filtradas por prioridad
    const filteredTasks = filterPriority === 'all'
        ? tasks
        : tasks.filter(task => task.prioridad === filterPriority);

    // Función dummy para CountdownTimer
    const dummyRefresh = () => {
        console.log("Timer expired");
        // Opcional: podrías mostrar una notificación aquí
    };

    return (
        <>
            <Header />
            <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
                <div className="container mx-auto max-w-7xl">
                    {/* Header con estadísticas */}
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Gestión Scrum</h1>
                                <p className="text-gray-600 mt-2">
                                    Administra proyectos, sprints y tareas utilizando metodología Scrum
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    color="success"
                                    onClick={refreshData}
                                    disabled={loading.projects || loading.sprints || loading.tasks}
                                >
                                    <Zap className="size-5" />
                                    <span>Actualizar</span>
                                </Button>
                                <Button
                                    color="info"
                                    onClick={() => openModal("statsModal")}
                                >
                                    <BarChart3 className="size-5" />
                                    <span>Estadísticas</span>
                                </Button>
                            </div>
                        </div>

                        {/* Tarjetas de resumen CORREGIDAS (sin campos fantasma) */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Card
                                title="Proyectos"
                                value={projects.length}
                                icon={<Target className="text-white size-6" />}
                                subText="total"
                            />
                            <Card
                                title="Sprints Activos"
                                value={sprints.filter(s => {
                                    const now = new Date();
                                    const start = new Date(s.fecha_inicio);
                                    const end = new Date(s.fecha_fin);
                                    return now >= start && now <= end;
                                }).length}
                                icon={<Zap className="text-white size-6" />}
                                subText={`de ${sprints.length}`}
                            />
                            <Card
                                title="Tareas Pendientes"
                                value={taskStats.pendiente}
                                icon={<AlertTriangle className="text-white size-6" />}
                                subText={`de ${taskStats.total}`}
                            />
                            <Card
                                title="Progreso"
                                value={`${calculateProgress()}%`}
                                icon={<TrendingUp className="text-white size-6" />}
                                subText="completado"
                            />
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Panel de Proyectos - Bento Grid */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/80 sticky top-20 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-gray-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        <Flag className="text-blue-600 size-6" />
                                        <span>Proyectos</span>
                                    </h2>
                                    <div className="flex gap-2">
                                        <Button
                                            color="success"
                                            size="small"
                                            onClick={() => {
                                                setEditingItem(null);
                                                openModal("projectModal");
                                            }}
                                            disabled={loading.projects}
                                        >
                                            <Plus className="size-4" />
                                        </Button>
                                        <Button
                                            color="info"
                                            size="small"
                                            onClick={refreshData}
                                            disabled={loading.projects}
                                        >
                                            <Settings className="size-4" />
                                        </Button>
                                    </div>
                                </div>

                                <BentoGrid cols={1} loading={loading.projects && projects.length === 0}>
                                    {projects.map((project) => (
                                        <div
                                            key={project.id}
                                            onClick={() => handleProjectClick(project.id)}
                                        >
                                            <BentoItem
                                                className={`cursor-pointer transition-all ${selectedProjectId === project.id
                                                    ? 'ring-2 ring-blue-500 bg-blue-50/50'
                                                    : 'hover:bg-gray-50'
                                                    }`}
                                                title={project.nombre}
                                                description={project.descripcion?.substring(0, 80) + '...'}
                                                icon={<Flag className="text-blue-600 size-5" />}
                                            >
                                                <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="size-4" />
                                                        <span>{new Date(project.fecha_inicio).toLocaleDateString()}</span>
                                                    </div>
                                                    <Button
                                                        color="info"
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingItem(project);
                                                            openModal("projectModal");
                                                        }}
                                                        disabled={loading.projects}
                                                    >
                                                        <Edit className="size-4" />
                                                    </Button>
                                                </div>
                                            </BentoItem>
                                        </div>
                                    ))}

                                    {projects.length === 0 && !loading.projects && (
                                        <BentoItem
                                            title="Sin proyectos"
                                            description="Comienza creando tu primer proyecto"
                                            icon={<Flag className="text-gray-400 size-5" />}
                                        >
                                            <Button
                                                color="success"
                                                onClick={() => openModal("projectModal")}
                                                disabled={loading.projects}
                                            >
                                                <Plus className="size-4" />
                                                <span>Crear Proyecto</span>
                                            </Button>
                                        </BentoItem>
                                    )}
                                </BentoGrid>
                            </div>
                        </div>

                        {/* Panel de Sprints y Tareas */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Panel de Sprints */}
                            {selectedProject && (
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-gray-200"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-800">
                                                    Sprints - {selectedProject.nombre}
                                                </h2>
                                                <p className="text-gray-600 text-sm mt-1">
                                                    {selectedProject.descripcion?.substring(0, 120)}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    color="success"
                                                    onClick={() => {
                                                        setEditingItem(null);
                                                        openModal("sprintModal");
                                                    }}
                                                    disabled={loading.sprints}
                                                >
                                                    <Plus className="size-5" />
                                                    <span>Nuevo Sprint</span>
                                                </Button>
                                                <AvatarGroup data={teamAvatars} size="" />
                                            </div>
                                        </div>

                                        <BentoGrid cols={3} loading={loading.sprints && sprints.length === 0}>
                                            {sprints.map((sprint) => {
                                                const isActive = () => {
                                                    const now = new Date();
                                                    const start = new Date(sprint.fecha_inicio);
                                                    const end = new Date(sprint.fecha_fin);
                                                    return now >= start && now <= end;
                                                };

                                                return (
                                                    <div
                                                        key={sprint.id}
                                                        onClick={() => handleSprintClick(sprint.id)}
                                                    >
                                                        <BentoItem
                                                            className={`cursor-pointer transition-all ${selectedSprintId === sprint.id
                                                                ? 'ring-2 ring-green-500 bg-green-50/50'
                                                                : 'hover:bg-gray-50'
                                                                }`}
                                                            title={sprint.nombre}
                                                            description={`${sprint.nombre} - ${isActive() ? 'En curso' : 'Planificado'}`}
                                                            icon={<Zap className={`size-5 ${isActive() ? 'text-green-600' : 'text-gray-400'}`} />}
                                                        >
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-500">Inicio:</span>
                                                                    <span className="font-medium">
                                                                        {new Date(sprint.fecha_inicio).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-500">Fin:</span>
                                                                    <span className="font-medium">
                                                                        {new Date(sprint.fecha_fin).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <div className="pt-2 border-t border-gray-100">
                                                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                                                        <span>Tiempo restante:</span>
                                                                        <span className="font-medium text-blue-600">
                                                                            <CountdownTimer
                                                                                endDate={new Date(sprint.fecha_fin)}
                                                                                refrech={dummyRefresh}
                                                                            />
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </BentoItem>
                                                    </div>
                                                );
                                            })}

                                            {sprints.length === 0 && !loading.sprints && (
                                                <BentoItem
                                                    colSpan={3}
                                                    title="No hay sprints"
                                                    description="Crea un sprint para comenzar a trabajar en este proyecto"
                                                    icon={<Calendar className="text-gray-400 size-5" />}
                                                >
                                                    <Button
                                                        color="success"
                                                        onClick={() => openModal("sprintModal")}
                                                        disabled={loading.sprints}
                                                    >
                                                        <Plus className="size-4" />
                                                        <span>Crear Primer Sprint</span>
                                                    </Button>
                                                </BentoItem>
                                            )}
                                        </BentoGrid>
                                    </motion.div>
                                </AnimatePresence>
                            )}

                            {/* Panel de Tareas */}
                            {selectedSprint && (
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-gray-200"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-800">
                                                    Tareas - {selectedSprint.nombre}
                                                </h2>
                                                <p className="text-gray-600 text-sm mt-1">
                                                    Sprint activo
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <div className="flex gap-2">
                                                    <Button
                                                        color={activeView === 'board' ? 'success' : 'info'}
                                                        size="small"
                                                        onClick={() => setActiveView('board')}
                                                        disabled={loading.tasks}
                                                    >
                                                        <FileText className="size-4" />
                                                        <span>Tablero</span>
                                                    </Button>
                                                    <Button
                                                        color={activeView === 'list' ? 'success' : 'info'}
                                                        size="small"
                                                        onClick={() => setActiveView('list')}
                                                        disabled={loading.tasks}
                                                    >
                                                        <ListTodo className="size-4" />
                                                        <span>Lista</span>
                                                    </Button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        color={filterPriority === 'all' ? 'success' : 'info'}
                                                        size="small"
                                                        onClick={() => setFilterPriority('all')}
                                                        disabled={loading.tasks}
                                                    >
                                                        <span>Todas</span>
                                                    </Button>
                                                    <Button
                                                        color={filterPriority === 'alta' ? 'success' : 'info'}
                                                        size="small"
                                                        onClick={() => setFilterPriority('alta')}
                                                        disabled={loading.tasks}
                                                    >
                                                        <AlertTriangle className="size-4" />
                                                        <span>Alta</span>
                                                    </Button>
                                                </div>
                                                <Button
                                                    color="success"
                                                    onClick={() => {
                                                        setEditingItem(null);
                                                        openModal("taskModal");
                                                    }}
                                                    disabled={loading.tasks}
                                                >
                                                    <Plus className="size-5" />
                                                    <span>Nueva Tarea</span>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Estadísticas rápidas */}
                                        <div className="mb-6">
                                            <BentoGrid cols={4} loading={loading.tasks && tasks.length === 0}>
                                                <BentoItem
                                                    title="Total"
                                                    description={taskStats.total.toString()}
                                                    icon={<ListTodo className="text-blue-600 size-5" />}
                                                />
                                                <BentoItem
                                                    title="Pendientes"
                                                    description={taskStats.pendiente.toString()}
                                                    icon={<Clock className="text-yellow-600 size-5" />}
                                                />
                                                <BentoItem
                                                    title="En Progreso"
                                                    description={taskStats.progreso.toString()}
                                                    icon={<GitPullRequest className="text-orange-600 size-5" />}
                                                />
                                                <BentoItem
                                                    title="Completadas"
                                                    description={taskStats.completado.toString()}
                                                    icon={<CheckCircle className="text-green-600 size-5" />}
                                                />
                                            </BentoGrid>
                                        </div>

                                        {/* Lista de Tareas */}
                                        <div className="space-y-3">
                                            {filteredTasks.map((task) => (
                                                <BentoItem
                                                    key={task.id}
                                                    className="hover:shadow-md transition-all"
                                                    icon={
                                                        <div className={`p-2 rounded-full ${task.prioridad === 'alta' ? 'bg-red-100 text-red-600' :
                                                            task.prioridad === 'media' ? 'bg-yellow-100 text-yellow-600' :
                                                                'bg-blue-100 text-blue-600'
                                                            }`}
                                                        >
                                                            <ListTodo className="size-5" />
                                                        </div>
                                                    }
                                                    title={task.titulo}
                                                    description={task.descripcion?.substring(0, 120) + '...'}
                                                    header={
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="flex gap-2">
                                                                <Badge
                                                                    color={task.estado === 'completado' ? 'green' :
                                                                        task.estado === 'en_progreso' ? 'blue' :
                                                                            task.estado === 'en_revision' ? 'purple' : 'gray'}
                                                                    text={task.estado}
                                                                />
                                                                {task.prioridad === 'alta' && (
                                                                    <Badge color="red" text="Alta Prioridad" />
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    color="info"
                                                                    size="small"
                                                                    onClick={() => {
                                                                        setEditingItem(task);
                                                                        openModal("taskModal");
                                                                    }}
                                                                    disabled={loading.tasks}
                                                                >
                                                                    <Edit className="size-4" />
                                                                </Button>
                                                                <Button
                                                                    color="info"
                                                                    size="small"
                                                                    disabled={loading.tasks}
                                                                >
                                                                    <MoreHorizontal className="size-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    }
                                                >
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                                                        {task.fecha_limite && (
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="size-4" />
                                                                <span>Vence: {new Date(task.fecha_limite).toLocaleDateString()}</span>
                                                            </div>
                                                        )}
                                                        {task.fecha_creacion && (
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="size-4" />
                                                                <span>Creada: {new Date(task.fecha_creacion).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
                                                            </div>
                                                        )}
                                                        {task.usuario_asignado_id && (
                                                            <div className="flex items-center gap-1">
                                                                <Users className="size-4" />
                                                                <span>Asignado</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </BentoItem>
                                            ))}

                                            {filteredTasks.length === 0 && !loading.tasks && (
                                                <BentoItem
                                                    title="No hay tareas"
                                                    description={filterPriority !== 'all'
                                                        ? `No hay tareas con prioridad ${filterPriority}`
                                                        : "Comienza creando tu primera tarea para este sprint"
                                                    }
                                                    icon={<ListTodo className="text-gray-400 size-5" />}
                                                >
                                                    <Button
                                                        color="success"
                                                        onClick={() => openModal("taskModal")}
                                                        disabled={loading.tasks}
                                                    >
                                                        <Plus className="size-4" />
                                                        <span>Crear Primera Tarea</span>
                                                    </Button>
                                                </BentoItem>
                                            )}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            )}

                            {/* Mensajes cuando no hay selección */}
                            {!selectedProject && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-200 text-center">
                                    <Flag className="text-gray-400 size-12 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        Selecciona un proyecto
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Elige un proyecto de la lista para ver sus sprints y tareas
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        <Button
                                            color="success"
                                            onClick={() => openModal("projectModal")}
                                            disabled={loading.projects}
                                        >
                                            <Plus className="size-5" />
                                            <span>Crear Nuevo Proyecto</span>
                                        </Button>
                                        <Button
                                            color="info"
                                            onClick={refreshData}
                                            disabled={loading.projects}
                                        >
                                            <Settings className="size-5" />
                                            <span>Actualizar Lista</span>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {selectedProject && !selectedSprint && sprints.length > 0 && !loading.sprints && (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-200 text-center">
                                    <Zap className="text-gray-400 size-12 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        Selecciona un sprint
                                    </h3>
                                    <p className="text-gray-600">
                                        Elige un sprint de la lista para ver y gestionar sus tareas
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {/* Modal de Proyecto */}
            <Modal
                modalName="projectModal"
                title={editingItem ? "Editar Proyecto" : "Nuevo Proyecto"}
                maxWidth="lg"
            >
                <MainForm
                    message_button={editingItem ? "Actualizar Proyecto" : "Crear Proyecto"}
                    actionType="post-general"
                    dataForm={projectFormFields}
                    table="proyectos"
                    aditionalData={editingItem ? { id: editingItem.id } : undefined}
                    onSuccess={handleProjectSuccess}
                />
            </Modal>

            {/* Modal de Sprint */}
            <Modal
                modalName="sprintModal"
                title={editingItem ? "Editar Sprint" : "Nuevo Sprint"}
                maxWidth="lg"
            >
                <MainForm
                    message_button={editingItem ? "Actualizar Sprint" : "Crear Sprint"}
                    actionType="post-general"
                    dataForm={sprintFormFields}
                    table="sprints"
                    aditionalData={
                        editingItem
                            ? { id: editingItem.id, proyecto_id: selectedProject?.id }
                            : { proyecto_id: selectedProject?.id }
                    }
                    onSuccess={handleSprintSuccess}
                    showButton={true}
                />
            </Modal>

            {/* Modal de Tarea */}
            <Modal
                modalName="taskModal"
                title={editingItem ? "Editar Tarea" : "Nueva Tarea"}
                maxWidth="lg"
            >
                <MainForm
                    message_button={editingItem ? "Actualizar Tarea" : "Crear Tarea"}
                    actionType="post-general"
                    dataForm={taskFormFields}
                    table="tareas"
                    aditionalData={
                        editingItem
                            ? { id: editingItem.id, sprint_id: selectedSprint?.id }
                            : { sprint_id: selectedSprint?.id }
                    }
                    onSuccess={handleTaskSuccess}
                    showButton={true}
                />
            </Modal>

            {/* Modal de Estadísticas */}
            <Modal
                modalName="statsModal"
                title="Estadísticas de Proyecto"
                maxWidth="2xl"
            >
                {selectedProject && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card
                                title="Progreso General"
                                value={`${calculateProgress()}%`}
                                icon={<Target className="text-white size-6" />}
                            />
                            <Card
                                title="Sprints Activos"
                                value={sprints.filter(s => {
                                    const now = new Date();
                                    const start = new Date(s.fecha_inicio);
                                    const end = new Date(s.fecha_fin);
                                    return now >= start && now <= end;
                                }).length}
                                icon={<Zap className="text-white size-6" />}
                            />
                            <Card
                                title="Tareas de Alta Prioridad"
                                value={tasks.filter(t => t.prioridad === 'alta' || t.prioridad === 'critica').length}
                                icon={<AlertTriangle className="text-white size-6" />}
                            />
                            <Card
                                title="Tiempo Promedio"
                                value="-- días"
                                icon={<Clock className="text-white size-6" />}
                            />
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-800 mb-3">Distribución por Estado</h3>
                            <div className="space-y-2">
                                {['pendiente', 'en_progreso', 'en_revision', 'completado'].map((estado) => {
                                    const count = tasks.filter(t => t.estado === estado).length;
                                    const percentage = taskStats.total > 0 ? (count / taskStats.total) * 100 : 0;
                                    return (
                                        <div key={estado} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${estado === 'completado' ? 'bg-green-500' :
                                                    estado === 'en_progreso' ? 'bg-blue-500' :
                                                        estado === 'en_revision' ? 'bg-purple-500' : 'bg-gray-500'
                                                    }`} />
                                                <span className="text-sm capitalize">{estado.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium">{count}</span>
                                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${estado === 'completado' ? 'bg-green-500' :
                                                            estado === 'en_progreso' ? 'bg-blue-500' :
                                                                estado === 'en_revision' ? 'bg-purple-500' : 'bg-gray-500'
                                                            }`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600 w-10">{percentage.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-800 mb-3">Distribución por Prioridad</h3>
                            <div className="space-y-2">
                                {['baja', 'media', 'alta', 'critica'].map((prioridad) => {
                                    const count = tasks.filter(t => t.prioridad === prioridad).length;
                                    const percentage = taskStats.total > 0 ? (count / taskStats.total) * 100 : 0;
                                    return (
                                        <div key={prioridad} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${prioridad === 'critica' ? 'bg-red-500' :
                                                    prioridad === 'alta' ? 'bg-orange-500' :
                                                        prioridad === 'media' ? 'bg-yellow-500' : 'bg-gray-500'
                                                    }`} />
                                                <span className="text-sm capitalize">{prioridad}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium">{count}</span>
                                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${prioridad === 'critica' ? 'bg-red-500' :
                                                            prioridad === 'alta' ? 'bg-orange-500' :
                                                                prioridad === 'media' ? 'bg-yellow-500' : 'bg-gray-500'
                                                            }`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600 w-10">{percentage.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button color="info">
                                <Download className="size-5" />
                                <span>Exportar</span>
                            </Button>
                            <Button color="success">
                                <Share2 className="size-5" />
                                <span>Compartir</span>
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}