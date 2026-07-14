"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { type Task, type TaskEstado, useTaskService } from "@/app/proyectos/services/taskService"
import { Trash2, GripVertical, User, Filter, X, Pin, Search, Inbox } from "lucide-react"
import { ModalView } from "./modal-view"
import { openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { cn } from "@/utils/functions/cn"

// ---------- Tipos ----------
type Priority = "low" | "medium" | "high"
type Tag = string

interface ColumnConfig {
    id: TaskEstado
    name: string
    bgColor: string
    borderColor: string
    accent: string
}

// Estilos de post-it por prioridad (paleta de papel + acento)
const PRIORITY_STYLES: Record<Priority, { paper: string; border: string; tape: string; pin: string; label: string }> = {
    high: {
        paper: "bg-rose-100 dark:bg-rose-950/60",
        border: "border-rose-200/80 dark:border-rose-800/60",
        tape: "bg-rose-200/80 dark:bg-rose-800/60",
        pin: "text-rose-500 dark:text-rose-400",
        label: "Alta",
    },
    medium: {
        paper: "bg-amber-100 dark:bg-amber-950/60",
        border: "border-amber-200/80 dark:border-amber-800/60",
        tape: "bg-amber-200/80 dark:bg-amber-800/60",
        pin: "text-amber-500 dark:text-amber-400",
        label: "Media",
    },
    low: {
        paper: "bg-emerald-100 dark:bg-emerald-950/60",
        border: "border-emerald-200/80 dark:border-emerald-800/60",
        tape: "bg-emerald-200/80 dark:bg-emerald-800/60",
        pin: "text-emerald-500 dark:text-emerald-400",
        label: "Baja",
    },
}

// Columnas del tablero
const COLUMNS: ColumnConfig[] = [
    { id: "backlog", name: "Backlog", bgColor: "bg-gray-50 dark:bg-gray-800/50", borderColor: "border-gray-200 dark:border-gray-700", accent: "bg-gray-400" },
    { id: "todo", name: "Por hacer", bgColor: "bg-yellow-50/50 dark:bg-yellow-900/20", borderColor: "border-yellow-200 dark:border-yellow-800", accent: "bg-yellow-400" },
    { id: "in-progress", name: "En progreso", bgColor: "bg-blue-50/50 dark:bg-blue-900/20", borderColor: "border-blue-200 dark:border-blue-800", accent: "bg-blue-400" },
    { id: "done", name: "Completado", bgColor: "bg-green-50/50 dark:bg-green-900/20", borderColor: "border-green-200 dark:border-green-800", accent: "bg-green-500" },
]

// Rotación determinística por id (misma tarea = misma inclinación siempre, evita "saltos" al re-renderizar)
function getRotation(id: string) {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000
    return (hash % 7) - 3 // entre -3 y 3 grados
}

// ---------- Componente de tarjeta de tarea (post-it) ----------
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
    onQuickMove: (taskId: string, target: TaskEstado) => void
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
    onQuickMove,
}: TaskCardProps) {
    const tags = useMemo(() => (task.tags ? (JSON.parse(task.tags) as Tag[]) : []), [task.tags])
    const priority = (task.prioridad as Priority) || "medium"
    const styles = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium
    const rotation = useMemo(() => getRotation(task.id), [task.id])

    const dragIndicatorClass = dragOverTaskId === task.id
        ? dragPosition === "above"
            ? "border-t-2 border-emerald-500 dark:border-emerald-400"
            : "border-b-2 border-emerald-500 dark:border-emerald-400"
        : ""

    return (
        <article
            id={`task-${task.id}`}
            style={{ "--r": `${rotation}deg` } as React.CSSProperties}
            className={cn(
                "group/card relative rounded-sm border p-3 pt-4 cursor-pointer",
                "shadow-[2px_3px_6px_rgba(0,0,0,0.12)] dark:shadow-[2px_3px_10px_rgba(0,0,0,0.4)]",
                "transition-all duration-200 ease-out",
                "rotate-[var(--r)] hover:rotate-0 hover:-translate-y-1 hover:shadow-[3px_6px_14px_rgba(0,0,0,0.18)] hover:z-20",
                styles.paper,
                styles.border,
                isDragging && "opacity-40 scale-95",
                dragIndicatorClass
            )}
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragOver={(e) => onDragOver(e, task.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, task.id)}
            onClick={onClick}
            aria-label={`Tarea: ${task.title}, prioridad ${styles.label}`}
            role="article"
        >
            {/* Cinta adhesiva */}
            <span
                aria-hidden
                className={cn("absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 -rotate-2 rounded-[2px] opacity-90", styles.tape)}
            />
            {/* Chincheta */}
            <Pin aria-hidden size={14} className={cn("absolute top-1 left-1 -rotate-45 drop-shadow-sm", styles.pin)} />
            {/* Esquina doblada */}
            <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 right-0 w-4 h-4 bg-black/10 dark:bg-white/10"
                style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
            />

            <header className="flex items-start justify-between gap-2 pl-3">
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">{task.title}</h4>
                <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover/card:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => onDelete(task.id, e)}
                        className="text-gray-500 hover:text-red-600 dark:text-gray-400 transition-colors cursor-pointer p-0.5"
                        aria-label="Eliminar tarea"
                    >
                        <Trash2 size={15} />
                    </button>
                    <span className="hidden sm:inline-flex cursor-grab active:cursor-grabbing text-gray-500 dark:text-gray-400">
                        <GripVertical size={15} />
                    </span>
                </div>
            </header>

            {task.description && (
                <p className="mt-1 pl-3 text-xs text-gray-700/80 dark:text-gray-300/80 line-clamp-2">{task.description}</p>
            )}

            {tags.length > 0 && (
                <ul className="mt-2 pl-3 flex flex-wrap gap-1">
                    {tags.map((tag, idx) => (
                        <li
                            key={idx}
                            className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-white/60 dark:bg-black/20 text-gray-700 dark:text-gray-200 border border-black/5 dark:border-white/10"
                        >
                            {tag}
                        </li>
                    ))}
                </ul>
            )}

            <footer className="mt-3 pl-3 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <User size={11} />
                    <span className="truncate max-w-[80px]">{task.assignee || "Sin asignar"}</span>
                </span>

                {/* Selector rápido de estado: alternativa a drag & drop, imprescindible en táctil */}
                <select
                    value={task.estado}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        e.stopPropagation()
                        onQuickMove(task.id, e.target.value as TaskEstado)
                    }}
                    aria-label="Mover tarea a otra columna"
                    className="text-[11px] bg-white/70 dark:bg-black/30 border border-black/10 dark:border-white/10 rounded-md px-1 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-800 dark:text-gray-100"
                >
                    {COLUMNS.map((col) => (
                        <option key={col.id} value={col.id}>
                            {col.name}
                        </option>
                    ))}
                </select>
            </footer>
        </article>
    )
}

// ---------- Skeleton mientras cargan las tareas ----------
function TaskCardSkeleton({ delay = 0 }: { delay?: number }) {
    return (
        <div
            className="rounded-sm border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 p-3 h-24 animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="h-3 w-2/3 bg-black/10 dark:bg-white/10 rounded mb-2" />
            <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded mb-1" />
            <div className="h-2 w-1/2 bg-black/10 dark:bg-white/10 rounded" />
        </div>
    )
}

// ---------- Componente de columna ----------
interface ColumnProps {
    column: ColumnConfig
    tasks: Task[]
    isLoading: boolean
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
    onQuickMove: (taskId: string, target: TaskEstado) => void
}

function Column({
    column,
    tasks,
    isLoading,
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
    onQuickMove,
}: ColumnProps) {
    const sortedTasks = useMemo(
        () => [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [tasks]
    )

    return (
        <li className="flex flex-col gap-2 shrink-0 w-[85vw] xs:w-[75vw] sm:w-[320px] lg:w-auto snap-start">
            <div className="flex items-center justify-between px-1 sticky top-0 z-10">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", column.accent)} />
                    {column.name}
                </h3>
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {tasks.length}
                </span>
            </div>

            <div
                id={`column-${column.id}`}
                className={cn(
                    "min-h-[200px] max-h-[65vh] overflow-y-auto h-full rounded-xl border-2 p-2 space-y-3 transition-all duration-200 custom-scrollbar",
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
                {isLoading && tasks.length === 0 ? (
                    <>
                        <TaskCardSkeleton />
                        <TaskCardSkeleton delay={100} />
                    </>
                ) : sortedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center gap-1 py-8 text-gray-400 dark:text-gray-500">
                        <Inbox size={22} className="opacity-60" />
                        <span className="text-xs">Sin tareas aquí</span>
                    </div>
                ) : (
                    sortedTasks.map((task) => (
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
                            onQuickMove={onQuickMove}
                        />
                    ))
                )}
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

// ---------- Componente principal ScrumBoard ----------
interface ScrumBoardProps {
    initialTasks: Task[]
    sprintId: number
}

export function ScrumBoard({ initialTasks, sprintId }: ScrumBoardProps) {
    const dispatch = useAppDispatch()
    const { tasks: serviceTasks, updateTaskEstado, deleteTask, updateTaskOrder, isLoading } = useTaskService(sprintId)

    // Estado local con actualizaciones optimistas manuales (rollback vía previousTasksRef)
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
    const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
    const [dragPosition, setDragPosition] = useState<"above" | "below" | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([])
    const [selectedTags, setSelectedTags] = useState<Tag[]>([])
    const [searchQuery, setSearchQuery] = useState("")

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

    // Filtrar tareas según selección y búsqueda
    const filteredTasks = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        return tasks.filter(task => {
            const priorityMatch = selectedPriorities.length === 0 || selectedPriorities.includes(task.prioridad as Priority)
            const taskTags = task.tags ? (JSON.parse(task.tags) as Tag[]) : []
            const tagMatch = selectedTags.length === 0 || selectedTags.some(tag => taskTags.includes(tag))
            const searchMatch = !query || task.title?.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query)
            return priorityMatch && tagMatch && searchMatch
        })
    }, [tasks, selectedPriorities, selectedTags, searchQuery])

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
        const sortedTasks = [...tasksInColumn].sort((a, b) => {
            const indexA = tasks.findIndex(t => t.id === a.id)
            const indexB = tasks.findIndex(t => t.id === b.id)
            return indexA - indexB
        })

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
        setSearchQuery("")
    }, [])

    // ---------- Handlers de Drag & Drop ----------
    const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
        previousTasksRef.current = tasks
        e.dataTransfer.setData("text/plain", taskId)
        e.dataTransfer.effectAllowed = "move"
        setDraggedTaskId(taskId)

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

    const dropTask = useCallback(async (taskId: string, targetColumnId: TaskEstado, targetTaskId?: string, position?: "above" | "below" | null) => {
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
        previousTasksRef.current = tasks
        setTasks(newTasks)

        try {
            if (draggedTask.estado !== targetColumnId) {
                await updateTaskEstado(taskId, targetColumnId)
            }

            const originEstado = draggedTask.estado
            const finalTasks = newTasks

            if (originEstado !== targetColumnId) {
                const tasksInOrigin = finalTasks.filter(t => t.estado === originEstado)
                const tasksInDest = finalTasks.filter(t => t.estado === targetColumnId)
                await recalculateOrdersForColumn(originEstado, tasksInOrigin)
                await recalculateOrdersForColumn(targetColumnId, tasksInDest)
            } else {
                const tasksInColumn = finalTasks.filter(t => t.estado === originEstado)
                await recalculateOrdersForColumn(originEstado, tasksInColumn)
            }
        } catch (error) {
            console.error("Error al mover tarea:", error)
            dispatch(
                openAlertReducer({
                    title: "No se pudo mover la tarea",
                    message: "Ocurrió un error al actualizar la tarea. Se revirtió el cambio.",
                    type: "error",
                    icon: "alert",
                    buttonText: "Entendido",
                    action: () => { },
                    duration: 6000,
                })
            )
            setTasks(previousTasksRef.current)
        }
    }, [tasks, updateTaskEstado, recalculateOrdersForColumn, dispatch])

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

    // Movimiento rápido (selector de la tarjeta) — misma lógica que soltar en la columna,
    // pensado para dispositivos táctiles donde el drag & drop nativo no funciona bien.
    const handleQuickMove = useCallback(async (taskId: string, target: TaskEstado) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task || task.estado === target) return
        await dropTask(taskId, target, undefined, undefined)
    }, [tasks, dropTask])

    // ---------- Handlers de tareas ----------
    const handleDeleteTask = useCallback(async (id: string) => {
        try {
            await deleteTask(id)
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

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    return (
        <div className="w-full">
            {/* Barra de herramientas: búsqueda + filtros */}
            <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-full sm:max-w-xs">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar tareas..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            {!isLoading && tasks.length > 0 && filteredTasks.length === 0 && (
                <div className="mb-4 p-3 rounded-md bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 text-center">
                    Ninguna tarea coincide con la búsqueda o los filtros activos.
                </div>
            )}

            {/* Tablero: scroll horizontal con snap en móvil, grid en escritorio */}
            <ul className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
                {COLUMNS.map((column) => (
                    <Column
                        key={column.id}
                        column={column}
                        tasks={tasksByEstado[column.id] || []}
                        isLoading={isLoading}
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
                        onQuickMove={handleQuickMove}
                    />
                ))}
            </ul>

            <ModalView nameModal="view-task" task={selectedTask} />
        </div>
    )
}