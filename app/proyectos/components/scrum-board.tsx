"use client"

import { useState, useEffect, useRef, useCallback, useMemo, useOptimistic } from "react"
import { type Task, type TaskEstado, useTaskService } from "@/app/proyectos/services/taskService"
import { Trash2, GripVertical, User, Filter, X } from "lucide-react"
import { ModalView } from "./modal-view"
import { openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { cn } from "@/utils/functions/cn"
import Badge from "@/components/badge"
import { AnimatePresence, motion } from "framer-motion"

// ---------- Tipos ----------
type Priority = "low" | "medium" | "high"
type Tag = string

interface ColumnConfig {
    id: TaskEstado
    name: string
    bgColor: string
    borderColor: string
}

// Mapa de colores por prioridad
const PRIORITY_COLORS: Record<Priority, "green" | "yellow" | "red"> = {
    low: "green",
    medium: "yellow",
    high: "red",
}

// Columnas del tablero
const COLUMNS: ColumnConfig[] = [
    { id: "backlog", name: "Backlog", bgColor: "bg-gray-50 dark:bg-gray-800/50", borderColor: "border-gray-200 dark:border-gray-700" },
    { id: "todo", name: "Por hacer", bgColor: "bg-yellow-50/50 dark:bg-yellow-900/20", borderColor: "border-yellow-200 dark:border-yellow-800" },
    { id: "in-progress", name: "En progreso", bgColor: "bg-blue-50/50 dark:bg-blue-900/20", borderColor: "border-blue-200 dark:border-blue-800" },
    { id: "done", name: "Completado", bgColor: "bg-green-50/50 dark:bg-green-900/20", borderColor: "border-green-200 dark:border-green-800" },
]

// ---------- Componente de tarjeta de tarea ----------
interface TaskCardProps {
    task: Task
    isDragging: boolean
    dragOverTaskId: string | null
    dragPosition: "above" | "below" | null
    onDragStart: (e: React.DragEvent, taskId: string) => void
    onDragOver: (e: React.DragEvent, taskId: string) => void
    onDragLeave: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent, taskId: string) => void
    onClick: () => void
    onDelete: (id: string, e: React.MouseEvent) => void
}

function TaskCard({
    task,
    isDragging,
    dragOverTaskId,
    dragPosition,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onClick,
    onDelete,
}: TaskCardProps) {
    const tags = useMemo(() => (task.tags ? (JSON.parse(task.tags) as Tag[]) : []), [task.tags])

    const dragIndicatorClass = dragOverTaskId === task.id
        ? dragPosition === "above"
            ? "border-t-2 border-emerald-500 dark:border-emerald-400"
            : "border-b-2 border-emerald-500 dark:border-emerald-400"
        : ""

    return (
        <article
            id={`task-${task.id}`}
            className={cn(
                "group relative rounded-lg bg-white dark:bg-gray-800 p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
                isDragging && "opacity-50",
                dragIndicatorClass
            )}
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragOver={(e) => onDragOver(e, task.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, task.id)}
            onClick={onClick}
            aria-label={`Tarea: ${task.title}, prioridad ${task.prioridad}`}
            role="article"
        >
            <header className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{task.title}</h4>
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={(e) => onDelete(task.id, e)}
                        className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        aria-label="Eliminar tarea"
                    >
                        <Trash2 size={16} />
                    </button>
                    <span className="cursor-grab active:cursor-grabbing text-gray-400">
                        <GripVertical size={16} />
                    </span>
                </div>
            </header>

            {task.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{task.description}</p>
            )}

            {tags.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1">
                    {tags.map((tag, idx) => (
                        <li key={idx}>
                            <Badge color="indigo" text={tag} />
                        </li>
                    ))}
                </ul>
            )}

            <footer className="mt-3 flex items-center justify-between">
                <Badge color={PRIORITY_COLORS[task.prioridad as Priority] || "yellow"} text={task.prioridad || "medium"} />
                <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <User size={12} className="mr-1" />
                    {task.assignee || "Sin asignar"}
                </span>
            </footer>
        </article>
    )
}

// ---------- Componente de columna ----------
interface ColumnProps {
    column: ColumnConfig
    tasks: Task[]
    isDragOver: boolean
    draggedTaskId: string | null
    dragOverTaskId: string | null
    dragPosition: "above" | "below" | null
    onDragOverColumn: (e: React.DragEvent, columnId: string) => void
    onDragLeaveColumn: (e: React.DragEvent) => void
    onDropColumn: (e: React.DragEvent, columnId: TaskEstado) => void
    onDragStart: (e: React.DragEvent, taskId: string) => void
    onTaskDragOver: (e: React.DragEvent, taskId: string) => void
    onTaskDragLeave: (e: React.DragEvent) => void
    onTaskDrop: (e: React.DragEvent, taskId: string) => void
    onTaskClick: (taskId: string) => void
    onDeleteTask: (id: string, e: React.MouseEvent) => void
}

function Column({
    column,
    tasks,
    isDragOver,
    draggedTaskId,
    dragOverTaskId,
    dragPosition,
    onDragOverColumn,
    onDragLeaveColumn,
    onDropColumn,
    onDragStart,
    onTaskDragOver,
    onTaskDragLeave,
    onTaskDrop,
    onTaskClick,
    onDeleteTask,
}: ColumnProps) {
    const sortedTasks = useMemo(
        () => [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [tasks]
    )

    return (
        <li className="flex flex-col gap-2 min-w-[280px]">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{column.name}</h3>
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {tasks.length}
                </span>
            </div>

            <div
                id={`column-${column.id}`}
                className={cn(
                    "min-h-[300px] h-full rounded-xl border-2 p-2 space-y-2 transition-all duration-200",
                    column.bgColor,
                    column.borderColor,
                    isDragOver && "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/20"
                )}
                onDragOver={(e) => onDragOverColumn(e, column.id)}
                onDragLeave={onDragLeaveColumn}
                onDrop={(e) => onDropColumn(e, column.id)}
                role="group"
                aria-label={`Columna ${column.name}`}
            >
                {sortedTasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        isDragging={draggedTaskId === task.id}
                        dragOverTaskId={dragOverTaskId}
                        dragPosition={dragPosition}
                        onDragStart={onDragStart}
                        onDragOver={onTaskDragOver}
                        onDragLeave={onTaskDragLeave}
                        onDrop={onTaskDrop}
                        onClick={() => onTaskClick(task.id)}
                        onDelete={onDeleteTask}
                    />
                ))}
            </div>
        </li>
    )
}

// ---------- Panel de filtros ----------
interface FiltersPanelProps {
    visible: boolean
    priorities: Priority[]
    tags: Tag[]
    selectedPriorities: Priority[]
    selectedTags: Tag[]
    onPriorityFilter: (priority: Priority) => void
    onTagFilter: (tag: Tag) => void
    onClearFilters: () => void
    onClose: () => void
}

function FiltersPanel({
    visible,
    priorities,
    tags,
    selectedPriorities,
    selectedTags,
    onPriorityFilter,
    onTagFilter,
    onClearFilters,
    onClose,
}: FiltersPanelProps) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.section
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                >
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Filtros</h4>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Cerrar filtros"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h5 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Prioridad</h5>
                                <div className="flex flex-wrap gap-2">
                                    {priorities.map((priority) => (
                                        <button
                                            key={priority}
                                            onClick={() => onPriorityFilter(priority)}
                                            className={cn(
                                                "px-3 py-1 text-xs rounded-full border transition-all",
                                                selectedPriorities.includes(priority)
                                                    ? "bg-gray-800 text-white border-gray-800 dark:bg-gray-600 dark:border-gray-600"
                                                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            )}
                                        >
                                            {priority}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h5 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Etiquetas</h5>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => onTagFilter(tag)}
                                            className={cn(
                                                "px-3 py-1 text-xs rounded-full border transition-all",
                                                selectedTags.includes(tag)
                                                    ? "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-200 dark:border-indigo-700"
                                                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            )}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {(selectedPriorities.length > 0 || selectedTags.length > 0) && (
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={onClearFilters}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                                >
                                    <X size={14} />
                                    Limpiar filtros
                                </button>
                            </div>
                        )}
                    </div>
                </motion.section>
            )}
        </AnimatePresence>
    )
}

// ---------- Componente principal ScrumBoard ----------
interface ScrumBoardProps {
    initialTasks: Task[]
    sprintId: number
}

export function ScrumBoard({ initialTasks, sprintId }: ScrumBoardProps) {
    const dispatch = useAppDispatch()
    const { tasks: serviceTasks, updateTaskEstado, deleteTask, updateTaskOrder } = useTaskService(sprintId)

    // Estado local con actualizaciones optimistas
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [optimisticTasks, setOptimisticTasks] = useOptimistic(tasks)
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
    const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
    const [dragPosition, setDragPosition] = useState<any>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([])
    const [selectedTags, setSelectedTags] = useState<Tag[]>([])

    // Ref para revertir estado en caso de error
    const previousTasksRef = useRef<Task[]>(tasks)

    // Sincronizar con el servicio (cuando se actualizan desde fuera)
    useEffect(() => {
        if (serviceTasks.length > 0) {
            setTasks(serviceTasks)
        } else if (initialTasks.length > 0 && serviceTasks.length === 0) {
            setTasks(initialTasks)
        }
    }, [serviceTasks, initialTasks])

    // Datos derivados para filtros
    const allPriorities = useMemo<Priority[]>(() => {
        const priorities = tasks.map(t => t.prioridad as Priority).filter(Boolean)
        return Array.from(new Set(priorities)) as Priority[]
    }, [tasks])

    const allTags = useMemo<Tag[]>(() => {
        const tags = tasks.flatMap(task => task.tags ? JSON.parse(task.tags) as Tag[] : [])
        return Array.from(new Set(tags))
    }, [tasks])

    // Filtrar tareas según selección
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const priorityMatch = selectedPriorities.length === 0 || selectedPriorities.includes(task.prioridad as Priority)
            const taskTags = task.tags ? (JSON.parse(task.tags) as Tag[]) : []
            const tagMatch = selectedTags.length === 0 || selectedTags.some(tag => taskTags.includes(tag))
            return priorityMatch && tagMatch
        })
    }, [tasks, selectedPriorities, selectedTags])

    // Agrupar tareas por estado
    const tasksByEstado = useMemo(() => {
        return COLUMNS.reduce(
            (acc, column) => {
                acc[column.id] = filteredTasks.filter(task => task.estado === column.id)
                return acc
            },
            {} as Record<TaskEstado, Task[]>
        )
    }, [filteredTasks])

    // ---------- Funciones auxiliares para reordenamiento ----------
    const recalculateOrdersForColumn = useCallback(async (columnEstado: TaskEstado, tasksInColumn: Task[]) => {
        // Ordenar por orden visual (índice actual en el array)
        const sortedTasks = [...tasksInColumn].sort((a, b) => {
            const indexA = tasks.findIndex(t => t.id === a.id)
            const indexB = tasks.findIndex(t => t.id === b.id)
            return indexA - indexB
        })

        // Actualizar en lote (puedes optimizar enviando solo las que cambiaron)
        const updatePromises = sortedTasks.map((task, idx) => {
            if (task.order !== idx) {
                return updateTaskOrder(task.id, idx)
            }
            return Promise.resolve()
        })
        await Promise.all(updatePromises)
    }, [tasks, updateTaskOrder])

    // ---------- Handlers de filtros ----------
    const handlePriorityFilter = useCallback((priority: Priority) => {
        setSelectedPriorities(prev =>
            prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
        )
    }, [])

    const handleTagFilter = useCallback((tag: Tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        )
    }, [])

    const clearFilters = useCallback(() => {
        setSelectedPriorities([])
        setSelectedTags([])
    }, [])

    // ---------- Handlers de Drag & Drop ----------
    const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
        previousTasksRef.current = tasks
        e.dataTransfer.setData("text/plain", taskId)
        e.dataTransfer.effectAllowed = "move"
        setDraggedTaskId(taskId)

        // Personalizar la imagen de arrastre
        const taskElement = document.getElementById(`task-${taskId}`)
        if (taskElement) {
            const rect = taskElement.getBoundingClientRect()
            e.dataTransfer.setDragImage(taskElement, rect.width / 2, rect.height / 2)
        }
    }, [tasks])

    const handleDragOverColumn = useCallback((e: React.DragEvent, columnId: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setDragOverColumnId(columnId)
    }, [])

    const handleDragLeaveColumn = useCallback((e: React.DragEvent) => {
        if (!e.relatedTarget || !(e.currentTarget as Node).contains(e.relatedTarget as Node)) {
            setDragOverColumnId(null)
        }
    }, [])

    const handleTaskDragOver = useCallback((e: React.DragEvent, taskId: string) => {
        e.preventDefault()
        e.stopPropagation()
        if (draggedTaskId === taskId) return

        const targetRect = e.currentTarget.getBoundingClientRect()
        const mouseY = e.clientY
        const threshold = targetRect.top + targetRect.height / 2
        const position = mouseY < threshold ? "above" : "below"

        setDragOverTaskId(taskId)
        setDragPosition(position)
    }, [draggedTaskId])

    const handleTaskDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!e.relatedTarget || !(e.currentTarget as Node).contains(e.relatedTarget as Node)) {
            setDragOverTaskId(null)
            setDragPosition(null)
        }
    }, [])

    const dropTask = useCallback(async (taskId: string, targetColumnId: TaskEstado, targetTaskId?: string, position?: "above" | "below") => {
        const draggedTask = tasks.find(t => t.id === taskId)
        if (!draggedTask) return

        let newTasks = [...tasks]
        let updatedDraggedTask = { ...draggedTask }

        // 1. Si cambia de estado
        if (draggedTask.estado !== targetColumnId) {
            updatedDraggedTask.estado = targetColumnId
            newTasks = newTasks.map(t => t.id === taskId ? updatedDraggedTask : t)
        }

        // 2. Reordenar dentro de la misma columna o entre columnas
        if (targetTaskId && draggedTask.id !== targetTaskId) {
            const draggedIndex = newTasks.findIndex(t => t.id === taskId)
            const targetIndex = newTasks.findIndex(t => t.id === targetTaskId)

            // Remover la tarea arrastrada
            const [dragged] = newTasks.splice(draggedIndex, 1)
            let insertIndex = targetIndex

            if (position === "below") {
                insertIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex + 1
            } else if (position === "above") {
                insertIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex
            }
            newTasks.splice(insertIndex, 0, dragged)
        }

        // Aplicar cambio optimista
        setOptimisticTasks(newTasks)
        setTasks(newTasks)

        try {
            // Actualizar estado si cambió
            if (draggedTask.estado !== targetColumnId) {
                await updateTaskEstado(taskId, targetColumnId)
            }

            // Recalcular órdenes en las columnas afectadas
            const originEstado = draggedTask.estado
            const finalTasks = newTasks

            if (originEstado !== targetColumnId) {
                const tasksInOrigin = finalTasks.filter(t => t.estado === originEstado)
                const tasksInDest = finalTasks.filter(t => t.estado === targetColumnId)
                await recalculateOrdersForColumn(originEstado, tasksInOrigin)
                await recalculateOrdersForColumn(targetColumnId, tasksInDest)
            } else {
                // Mismo estado: solo reordenar esa columna
                const tasksInColumn = finalTasks.filter(t => t.estado === originEstado)
                await recalculateOrdersForColumn(originEstado, tasksInColumn)
            }
        } catch (error) {
            console.error("Error al mover tarea:", error)
            // Rollback al estado anterior
            setTasks(previousTasksRef.current)
            // Podrías mostrar una notificación de error aquí
        }
    }, [tasks, updateTaskEstado, recalculateOrdersForColumn, setOptimisticTasks])

    const handleDropColumn = useCallback(async (e: React.DragEvent, columnId: TaskEstado) => {
        e.preventDefault()
        e.stopPropagation()
        const taskId = e.dataTransfer.getData("text/plain")
        if (!taskId) return

        setDragOverColumnId(null)
        setDragOverTaskId(null)
        setDragPosition(null)
        setDraggedTaskId(null)

        await dropTask(taskId, columnId, undefined, undefined)
    }, [dropTask])

    const handleTaskDrop = useCallback(async (e: React.DragEvent, targetTaskId: string) => {
        e.preventDefault()
        e.stopPropagation()
        const taskId = e.dataTransfer.getData("text/plain")
        if (!taskId || taskId === targetTaskId) {
            setDraggedTaskId(null)
            setDragOverTaskId(null)
            setDragPosition(null)
            return
        }

        const draggedTask = tasks.find(t => t.id === taskId)
        const targetTask = tasks.find(t => t.id === targetTaskId)
        if (!draggedTask || !targetTask) return

        const targetColumnId = targetTask.estado
        setDragOverTaskId(null)
        setDragPosition(null)
        setDraggedTaskId(null)

        await dropTask(taskId, targetColumnId, targetTaskId, dragPosition)
    }, [tasks, dragPosition, dropTask])

    // ---------- Handlers de tareas ----------
    const handleDeleteTask = useCallback(async (id: string) => {
        try {
            await deleteTask(id)
            // La tarea se eliminará automáticamente vía useEffect al actualizar serviceTasks
        } catch (error) {
            console.error("Error al eliminar tarea:", error)
        }
    }, [deleteTask])

    const confirmDeleteTask = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch(
            openAlertReducer({
                title: "Borrar tarea",
                message: "Se borrará la tarea seleccionada, ¿estás seguro?",
                type: "error",
                icon: "alert",
                buttonText: "Aceptar",
                action: () => handleDeleteTask(id),
                duration: 10000000,
            })
        )
    }, [dispatch, handleDeleteTask])

    const openTaskModal = useCallback((taskId: string) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) return
        setSelectedTask(task)
        dispatch(openModalReducer({ modalName: 'view-task' }))
    }, [dispatch, tasks])

    // Obtener tarea seleccionada para el modal
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    return (
        <div className="w-full">
            {/* Barra de filtros */}
            <div className="mb-4 flex justify-between items-center">
                <button
                    onClick={() => setShowFilters(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm transition-colors cursor-pointer"
                >
                    <Filter size={16} />
                    {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                </button>
            </div>

            <FiltersPanel
                visible={showFilters}
                priorities={allPriorities}
                tags={allTags}
                selectedPriorities={selectedPriorities}
                selectedTags={selectedTags}
                onPriorityFilter={handlePriorityFilter}
                onTagFilter={handleTagFilter}
                onClearFilters={clearFilters}
                onClose={() => setShowFilters(false)}
            />

            {/* Tablero (grid responsive) */}
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
                {COLUMNS.map((column) => (
                    <Column
                        key={column.id}
                        column={column}
                        tasks={tasksByEstado[column.id] || []}
                        isDragOver={dragOverColumnId === column.id}
                        draggedTaskId={draggedTaskId}
                        dragOverTaskId={dragOverTaskId}
                        dragPosition={dragPosition}
                        onDragOverColumn={handleDragOverColumn}
                        onDragLeaveColumn={handleDragLeaveColumn}
                        onDropColumn={handleDropColumn}
                        onDragStart={handleDragStart}
                        onTaskDragOver={handleTaskDragOver}
                        onTaskDragLeave={handleTaskDragLeave}
                        onTaskDrop={handleTaskDrop}
                        onTaskClick={openTaskModal}
                        onDeleteTask={confirmDeleteTask}
                    />
                ))}
            </ul>

            <ModalView nameModal="view-task" task={selectedTask} />
        </div>
    )
}

// Extensión para window (solución temporal, reemplazar por estado global si es necesario)
declare global {
    interface Window {
        __SELECTED_TASK_ID__?: string
    }
}