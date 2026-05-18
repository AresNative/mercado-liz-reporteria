"use client"

import { useState, useEffect, useRef } from "react"
import { type Task, type TaskEstado, useTaskService } from "@/app/proyectos/services/taskService"
import { Trash2, GripVertical, User, Filter, X } from "lucide-react"
import { ModalView } from "./modal-view"
import { openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { cn } from "@/utils/functions/cn"
import Badge from "@/components/badge"
import { AnimatePresence, motion } from "framer-motion"

interface ScrumBoardProps {
    initialTasks: any[]
    sprintId: number
}

const COLUMNS: { id: TaskEstado; name: string; bg: string }[] = [
    { id: "backlog", name: "Backlog", bg: "bg-gray-100" },
    { id: "todo", name: "Por hacer", bg: "bg-yellow-100" },
    { id: "in-progress", name: "En progreso", bg: "bg-yellow-200/70" },
    { id: "done", name: "Completado", bg: "bg-green-100" },
]

const PRIORIDAD_COLORS: any = {
    low: "green",
    medium: "yellow",
    high: "red",
}

export function ScrumBoard({ initialTasks, sprintId }: ScrumBoardProps) {
    const {
        tasks: serviceTasks,
        updateTaskEstado,
        deleteTask: deleteTaskService,
        updateTaskOrder,
    } = useTaskService(sprintId);

    const dispatch = useAppDispatch();

    const [TaskId, setTaskId] = useState<string | undefined>()
    const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
    const [draggedTask, setDraggedTask] = useState<string | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
    const [dragPosition, setDragPosition] = useState<"above" | "below" | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    const originalTasksRef = useRef<Task[]>([])

    // Sincronizar con las tareas del servicio (cuando se actualizan desde fuera)
    useEffect(() => {
        if (serviceTasks.length > 0) {
            setTasks(serviceTasks);
        } else if (initialTasks.length > 0 && serviceTasks.length === 0) {
            setTasks(initialTasks);
        }
    }, [serviceTasks, initialTasks]);

    const allPriorities = Array.from(new Set(tasks.map(task => task.prioridad || 'medium')))
    const allTags = Array.from(new Set(
        tasks.flatMap(task =>
            task.tags ? JSON.parse(task.tags) : []
        )
    ))

    const filteredTasks = tasks.filter(task => {
        const priorityMatch = selectedPriorities.length === 0 ||
            selectedPriorities.includes(task.prioridad || 'medium')
        const taskTags = task.tags ? JSON.parse(task.tags) : []
        const tagMatch = selectedTags.length === 0 ||
            selectedTags.some(tag => taskTags.includes(tag))
        return priorityMatch && tagMatch
    })

    const tasksByEstado = COLUMNS.reduce(
        (acc, column) => {
            acc[column.id] = filteredTasks.filter((task) => task.estado === column.id)
            return acc
        },
        {} as Record<TaskEstado, Task[]>,
    )

    const tasksById = (id: string) => tasks.filter((task) => task.id === id)

    // Recalcula y envía los nuevos órdenes para todas las tareas de una columna
    const recalculateOrdersForColumn = async (columnEstado: TaskEstado, tasksInColumn: Task[]) => {
        // Ordenar según la posición visual actual (índice en el array original)
        const sortedTasks = [...tasksInColumn].sort((a, b) => {
            const indexA = tasks.findIndex(t => t.id === a.id);
            const indexB = tasks.findIndex(t => t.id === b.id);
            return indexA - indexB;
        });
        for (let i = 0; i < sortedTasks.length; i++) {
            const task = sortedTasks[i];
            if (task.order !== i) {
                await updateTaskOrder(task.id, i);
            }
        }
    };

    // Handlers de filtros
    const handlePriorityFilter = (priority: string) => {
        setSelectedPriorities(prev =>
            prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
        )
    }

    const handleTagFilter = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        )
    }

    const clearFilters = () => {
        setSelectedPriorities([])
        setSelectedTags([])
    }

    // Drag & Drop
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        originalTasksRef.current = [...tasks]
        e.dataTransfer.setData("text/plain", taskId)
        setDraggedTask(taskId)
        const draggedTaskElement = document.getElementById(`task-${taskId}`)
        if (draggedTaskElement) {
            const rect = draggedTaskElement.getBoundingClientRect()
            e.dataTransfer.setDragImage(draggedTaskElement, rect.width / 2, rect.height / 2)
        }
        e.dataTransfer.effectAllowed = "move"
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setDragOverColumn(columnId)
    }

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault()
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        if (!e.relatedTarget || !(e.currentTarget as Node).contains(e.relatedTarget as Node)) {
            setDragOverColumn(null)
        }
    }

    const handleTaskDragOver = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.preventDefault()
        e.stopPropagation()
        if (draggedTask === taskId) return

        const targetRect = e.currentTarget.getBoundingClientRect()
        const mouseY = e.clientY
        const threshold = targetRect.top + targetRect.height / 2

        setDragOverTaskId(taskId)
        setDragPosition(mouseY < threshold ? "above" : "below")
    }

    const handleTaskDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        if (!e.relatedTarget || !(e.currentTarget as Node).contains(e.relatedTarget as Node)) {
            setDragOverTaskId(null)
            setDragPosition(null)
        }
    }

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, columnId: TaskEstado) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOverColumn(null)
        setDragOverTaskId(null)
        setDragPosition(null)

        const taskId = e.dataTransfer.getData("text/plain")
        const draggedTaskObj = tasks.find((t) => t.id === taskId)
        if (!draggedTaskObj) {
            setDraggedTask(null)
            return
        }

        // Solo cambiar estado si es diferente
        if (draggedTaskObj.estado !== columnId) {
            const updatedTasks = tasks.map((task) =>
                task.id === taskId ? { ...task, estado: columnId } : task
            )
            setTasks(updatedTasks)

            try {
                await updateTaskEstado(taskId, columnId)
                // Recalcular órdenes en la columna origen y destino
                const tasksInOrigin = updatedTasks.filter(t => t.estado === draggedTaskObj.estado)
                const tasksInDest = updatedTasks.filter(t => t.estado === columnId)
                await recalculateOrdersForColumn(draggedTaskObj.estado, tasksInOrigin)
                await recalculateOrdersForColumn(columnId, tasksInDest)
            } catch (error) {
                console.error("Error al cambiar estado:", error)
                setTasks(originalTasksRef.current)
            }
        }
        setDraggedTask(null)
    }

    const handleTaskDrop = async (e: React.DragEvent<HTMLDivElement>, targetTaskId: string) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOverTaskId(null)
        setDragPosition(null)

        const taskId = e.dataTransfer.getData("text/plain")
        if (taskId === targetTaskId) {
            setDraggedTask(null)
            return
        }

        const draggedTaskObj = tasks.find((t) => t.id === taskId)
        const targetTaskObj = tasks.find((t) => t.id === targetTaskId)
        if (!draggedTaskObj || !targetTaskObj) {
            setDraggedTask(null)
            return
        }

        originalTasksRef.current = [...tasks]

        // Reordenar localmente
        let newTasks = [...tasks]
        const draggedIndex = newTasks.findIndex(t => t.id === taskId)
        const targetIndex = newTasks.findIndex(t => t.id === targetTaskId)

        // Remover la tarea arrastrada
        const [dragged] = newTasks.splice(draggedIndex, 1)
        let insertIndex = targetIndex
        if (dragPosition === "below" && targetIndex > draggedIndex) insertIndex = targetIndex - 1
        else if (dragPosition === "below") insertIndex = targetIndex + 1
        else if (dragPosition === "above" && targetIndex > draggedIndex) insertIndex = targetIndex - 1

        newTasks.splice(insertIndex, 0, dragged)

        // Si cambió de columna, actualizar estado
        let updatedDragged = dragged
        if (draggedTaskObj.estado !== targetTaskObj.estado) {
            updatedDragged = { ...dragged, estado: targetTaskObj.estado }
            newTasks = newTasks.map(t => t.id === taskId ? updatedDragged : t)
        }

        setTasks(newTasks)

        try {
            // Actualizar estado si cambió
            if (draggedTaskObj.estado !== targetTaskObj.estado) {
                await updateTaskEstado(taskId, targetTaskObj.estado)
            }

            // Recalcular órdenes en ambas columnas (origen y destino)
            const tasksInOrigin = newTasks.filter(t => t.estado === draggedTaskObj.estado)
            const tasksInDest = newTasks.filter(t => t.estado === targetTaskObj.estado)

            if (draggedTaskObj.estado !== targetTaskObj.estado) {
                await recalculateOrdersForColumn(draggedTaskObj.estado, tasksInOrigin)
                await recalculateOrdersForColumn(targetTaskObj.estado, tasksInDest)
            } else {
                // Mismo estado, solo reordenar esa columna
                await recalculateOrdersForColumn(draggedTaskObj.estado, newTasks.filter(t => t.estado === draggedTaskObj.estado))
            }
        } catch (error) {
            console.error("Error al reordenar:", error)
            setTasks(originalTasksRef.current)
        }

        setDraggedTask(null)
    }

    const handleDeleteTask = async (id: string) => {
        try {
            await deleteTaskService(id)
        } catch (error) {
            console.error("Error al eliminar tarea:", error)
        }
    }

    const confirmDeleteTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch(
            openAlertReducer({
                title: "Borrar tarea!",
                message: "Se borrará la tarea seleccionada, ¿estás seguro?",
                type: "error",
                icon: "alert",
                buttonText: "Aceptar",
                action: () => handleDeleteTask(id),
                duration: 10000000
            })
        );
    }

    return (
        <>
            <div className="mb-4 flex justify-between items-center">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer rounded-md text-sm"
                >
                    <Filter size={16} />
                    {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                </button>
                {(selectedPriorities.length > 0 || selectedTags.length > 0) && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-sm"
                    >
                        <X size={16} />
                        Limpiar filtros
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.section
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Filtrar por prioridad</h4>
                                <div className="flex flex-wrap gap-2">
                                    {allPriorities.map(priority => (
                                        <button
                                            key={priority}
                                            onClick={() => handlePriorityFilter(priority)}
                                            className={cn(
                                                "px-3 py-1 text-xs rounded-full border",
                                                selectedPriorities.includes(priority)
                                                    ? "bg-gray-800/40 text-white border-gray-800"
                                                    : "bg-white/40 border-gray-300 hover:bg-gray-100/60"
                                            )}
                                        >
                                            {priority}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium mb-2">Filtrar por etiquetas</h4>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleTagFilter(tag)}
                                            className={cn(
                                                "px-3 py-1 text-xs rounded-full border",
                                                selectedTags.includes(tag)
                                                    ? "bg-indigo-100/40 text-indigo-800 border-indigo-300"
                                                    : "bg-white/40 border-gray-300 hover:bg-gray-100/60"
                                            )}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            <ul className="grid grid-cols-1 space-y-6 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {COLUMNS.map((column) => (
                    <li key={column.id} className="space-y-2">
                        <section className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{column.name}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-950 text-gray-900 dark:text-gray-100">
                                {tasksByEstado[column.id]?.length || 0}
                            </span>
                        </section>
                        <section
                            id={`column-${column.id}`}
                            className={cn(`min-h-[200px] h-full rounded-lg border p-2 space-y-2 transition-colors ${dragOverColumn === column.id
                                    ? "border-green-300 dark:bg-green-700 bg-green-50 dark:border-green-500"
                                    : "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`)}
                            onDragOver={(e:any) => handleDragOver(e, column.id)}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={(e:any) => handleDrop(e, column.id)}
                        >
                            {tasksByEstado[column.id]
                                ?.sort((a, b) => (a.order || 0) - (b.order || 0))
                                .map((task) => (
                                    <article
                                        key={task.id}
                                        id={`task-${task.id}`}
                                        className={cn(
                                            `cursor-pointer visibility rounded-md bg-white p-3 shadow-sm hover:shadow transition-all duration-250
                                            ${draggedTask === task.id ? "opacity-50" : "opacity-100"} 
                                            ${dragOverTaskId === task.id
                                                ? dragPosition === "above"
                                                    ? "border-t-2 border-emerald-700"
                                                    : "border-b-2 border-emerald-700"
                                                : column.bg
                                            }`
                                        )}
                                        draggable="true"
                                        onDragStart={(e:any) => handleDragStart(e, task.id)}
                                        onDragOver={(e:any) => handleTaskDragOver(e, task.id)}
                                        onDragLeave={handleTaskDragLeave}
                                        onDrop={(e:any) => handleTaskDrop(e, task.id)}
                                        onClick={() => {
                                            dispatch(openModalReducer({ modalName: 'view-task' }))
                                            setTaskId(task.id)
                                        }}
                                    >
                                        <section className="flex items-start justify-between">
                                            <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={(e) => confirmDeleteTask(task.id, e)}
                                                    className="text-gray-400 hover:text-red-500 cursor-pointer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <span className="cursor-grab">
                                                    <GripVertical size={16} className="text-gray-400" />
                                                </span>
                                            </div>
                                        </section>
                                        <h3
                                            className="mt-1 text-xs text-gray-500 overflow-hidden text-ellipsis"
                                            style={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical"
                                            }}
                                        >
                                            {task.title}
                                        </h3>
                                        <p
                                            className="mt-1 text-xs text-gray-500 overflow-hidden text-ellipsis"
                                            style={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical"
                                            }}
                                        >
                                            {task.description}
                                        </p>
                                        {task.tags && task.tags.length > 0 && (
                                            <section className="mt-2 flex flex-wrap gap-1">
                                                {JSON.parse(task.tags).map((tag: any, index: any) => (
                                                    <Badge key={index} color="indigo" text={tag} />
                                                ))}
                                            </section>
                                        )}
                                        <section className="mt-3 flex items-center justify-between">
                                            <Badge color={PRIORIDAD_COLORS[task.prioridad || "medium"]} text={task.prioridad || "medium"} />
                                            <span className="flex items-center text-xs text-gray-500">
                                                <User size={12} className="mr-1" />
                                                {task.assignee}
                                            </span>
                                        </section>
                                    </article>
                                ))}
                        </section>
                    </li>
                ))}
            </ul>
            <ModalView nameModal="view-task" task={TaskId ? tasksById(TaskId)[0] : null} />
        </>
    )
}