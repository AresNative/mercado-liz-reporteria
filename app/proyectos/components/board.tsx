"use client"

import { useState, useEffect, useRef } from "react"
import { type Task, type TaskEstado, useTaskService } from "@/app/proyectos/services/tasks"
import { /* Edit,  */Trash2, GripVertical, User, Filter, X } from "lucide-react"
import { ModalView } from "./modal-view"
import { openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { cn } from "@/utils/functions/cn"
import Badge from "@/components/badge"
import { AnimatePresence, motion } from "framer-motion"

interface ScrumBoardProps {
    initialTasks: any[]
    sprintId: number
    onTasksUpdate?: () => void; // Añadido para permitir actualización desde el padre
}

const COLUMNS: { id: TaskEstado; name: string, bg: string }[] = [
    { id: "backlog", name: "Backlog", bg: "bg-gray-100 dark:bg-gray-700" },
    { id: "todo", name: "Por hacer", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
    { id: "in-progress", name: "En progreso", bg: "bg-yellow-200/70 dark:bg-yellow-800/30" },
    { id: "done", name: "Completado", bg: "bg-green-100 dark:bg-green-900/30" },
]

const PRIORIDAD_COLORS: any = {
    low: "green",
    medium: "yellow",
    high: "red",
}

export function ScrumBoard({ initialTasks, sprintId, onTasksUpdate }: ScrumBoardProps) {
    const {
        tasks: serviceTasks,
        updateTaskEstado,
        deleteTask: deleteTaskService,
        updateTaskOrder
    } = useTaskService(sprintId);

    const dispatch = useAppDispatch();

    const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>()
    const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
    const [draggedTask, setDraggedTask] = useState<string | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
    const [dragPosition, setDragPosition] = useState<"above" | "below" | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    // Ref para almacenar el orden original de las tareas
    const originalTasksRef = useRef<Task[]>([])

    // Sincronizar con tareas del servicio
    useEffect(() => {
        if (serviceTasks && serviceTasks.length > 0) {
            setTasks(serviceTasks);
        }
    }, [serviceTasks]);

    // Obtener todas las prioridades únicas de las tareas
    const allPriorities = Array.from(new Set(
        tasks
            .map(task => task.prioridad || 'medium')
            .filter(Boolean)
    ))

    // Obtener todas las etiquetas únicas de las tareas
    const allTags = Array.from(new Set(
        tasks.flatMap(task => {
            try {
                return task.tags ? JSON.parse(task.tags) : []
            } catch {
                return []
            }
        }).filter(Boolean)
    ))

    // Filtrar tareas basadas en prioridades y etiquetas seleccionadas
    const filteredTasks = tasks.filter(task => {
        const priorityMatch = selectedPriorities.length === 0 ||
            selectedPriorities.includes(task.prioridad || 'medium')

        let taskTags: string[] = []
        try {
            taskTags = task.tags ? JSON.parse(task.tags) : []
        } catch {
            taskTags = []
        }

        const tagMatch = selectedTags.length === 0 ||
            selectedTags.some(tag => taskTags.includes(tag))

        return priorityMatch && tagMatch
    })

    // Agrupar tareas por estado
    const tasksByEstado = COLUMNS.reduce(
        (acc, column) => {
            acc[column.id] = filteredTasks
                .filter((task) => task.estado === column.id)
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            return acc
        },
        {} as Record<TaskEstado, Task[]>,
    )

    // Función para obtener tarea por ID
    const getTaskById = (id?: string) => {
        if (!id) return undefined
        return tasks.find(task => task.id === id)
    }

    const handlePriorityFilter = (priority: string) => {
        setSelectedPriorities(prev =>
            prev.includes(priority)
                ? prev.filter(p => p !== priority)
                : [...prev, priority]
        )
    }

    const handleTagFilter = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        )
    }

    const clearFilters = () => {
        setSelectedPriorities([])
        setSelectedTags([])
    }

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

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

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
        const draggedTaskObj = getTaskById(taskId)

        if (!draggedTaskObj) {
            setDraggedTask(null)
            return
        }

        // Si se suelta directamente en una columna (no en una tarea)
        if (draggedTaskObj.estado !== columnId) {
            // Actualizar UI optimistamente
            setTasks((prevTasks) => prevTasks.map((task) =>
                task.id === taskId ? { ...task, estado: columnId } : task
            ))

            try {
                // Actualizar en el servidor
                await updateTaskEstado(taskId, columnId)
                // Notificar al padre si existe
                if (onTasksUpdate) onTasksUpdate()
            } catch (error) {
                console.error("Failed to update task estado:", error)
                // Revertir en caso de error
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

        const draggedTaskObj = getTaskById(taskId)
        const targetTaskObj = getTaskById(targetTaskId)

        if (!draggedTaskObj || !targetTaskObj) {
            setDraggedTask(null)
            return
        }

        // Guardar copia de las tareas originales para posible rollback
        originalTasksRef.current = [...tasks]

        // Crear nueva array con el orden actualizado
        const newTasks = [...tasks]

        if (draggedTaskObj.estado !== targetTaskObj.estado) {
            // Mover entre columnas
            const updatedDraggedTask = { ...draggedTaskObj, estado: targetTaskObj.estado }
            const filteredTasks = newTasks.filter((t) => t.id !== taskId)
            const targetIndex = filteredTasks.findIndex((t) => t.id === targetTaskId)
            const insertIndex = dragPosition === "above" ? targetIndex : targetIndex + 1
            filteredTasks.splice(insertIndex, 0, updatedDraggedTask)

            // Actualizar estado local primero para feedback inmediato
            setTasks(filteredTasks)

            try {
                // 1. Actualizar estado en el servidor
                await updateTaskEstado(taskId, targetTaskObj.estado)

                // 2. Obtener todas las tareas en el nuevo estado (incluyendo la movida)
                const tasksInNewStatus = filteredTasks
                    .filter(t => t.estado === targetTaskObj.estado)
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

                // 3. Recalcular órdenes para todas las tareas en el nuevo estado
                const updatedTasks = await recalculateOrders(tasksInNewStatus, filteredTasks)

                // Actualizar con los nuevos órdenes
                setTasks(updatedTasks)
                // Notificar al padre si existe
                if (onTasksUpdate) onTasksUpdate()
            } catch (error) {
                console.error("Failed to update task:", error)
                setTasks(originalTasksRef.current)
            }
        } else {
            // Reordenar dentro de la misma columna
            const filteredTasks = newTasks.filter((t) => t.id !== taskId)
            const targetIndex = filteredTasks.findIndex((t) => t.id === targetTaskId)
            const insertIndex = dragPosition === "above" ? targetIndex : targetIndex + 1
            filteredTasks.splice(insertIndex, 0, draggedTaskObj)

            // Actualizar estado local primero para feedback inmediato
            setTasks(filteredTasks)

            try {
                // Obtener todas las tareas en el mismo estado
                const tasksInSameStatus = filteredTasks
                    .filter(t => t.estado === draggedTaskObj.estado)
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

                // Recalcular órdenes para todas las tareas en este estado
                const updatedTasks = await recalculateOrders(tasksInSameStatus, filteredTasks)

                // Actualizar con los nuevos órdenes
                setTasks(updatedTasks)
                // Notificar al padre si existe
                if (onTasksUpdate) onTasksUpdate()
            } catch (error) {
                console.error("Failed to update task order:", error)
                setTasks(originalTasksRef.current)
            }
        }

        setDraggedTask(null)
    }

    // Función auxiliar para recalcular órdenes
    const recalculateOrders = async (tasksInStatus: any[], allTasks: any[]) => {
        // Asignar nuevos órdenes secuenciales empezando desde 0
        const updatedTasksInStatus = tasksInStatus.map((task, index) => ({
            ...task,
            order: index
        }))

        // Actualizar todas las tareas en el servidor
        const updatePromises = updatedTasksInStatus.map(task =>
            updateTaskOrder(task.id, task.order)
        )

        try {
            await Promise.all(updatePromises)

            // Actualizar el array completo de tareas
            return allTasks.map(task => {
                const updatedTask = updatedTasksInStatus.find(t => t.id === task.id)
                return updatedTask ? updatedTask : task
            })
        } catch (error) {
            console.error("Failed to update orders:", error)
            throw error
        }
    }

    const handleDeleteTask = async (id: string) => {
        try {
            await deleteTaskService(id)
            setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id))
            // Notificar al padre si existe
            if (onTasksUpdate) onTasksUpdate()
        } catch (error) {
            console.error("Failed to delete task:", error)
        }
    }

    const confirmDeleteTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()

        dispatch(
            openAlertReducer({
                title: "Borrar tarea!",
                message: "Se borrara la tarea seleccionada, ¿estás seguro?",
                type: "error",
                icon: "alert",
                buttonText: "Aceptar",
                action: () => handleDeleteTask(id),
                duration: 10000000
            })
        );
    }

    const handleOpenTaskView = (taskId: string) => {
        dispatch(openModalReducer({ modalName: 'view-task' }))
        setSelectedTaskId(taskId)
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
                        className="mb-6 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-medium mb-2 dark:text-gray-200">Filtrar por prioridad</h4>
                                <div className="flex flex-wrap gap-2">
                                    {allPriorities.map(priority => (
                                        <button
                                            key={priority}
                                            onClick={() => handlePriorityFilter(priority)}
                                            className={cn(
                                                "px-3 py-1 text-xs rounded-full border transition-colors",
                                                selectedPriorities.includes(priority)
                                                    ? "bg-gray-800 dark:bg-gray-700 text-white border-gray-800 dark:border-gray-600"
                                                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            )}
                                        >
                                            {priority}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-2 dark:text-gray-200">Filtrar por etiquetas</h4>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => handleTagFilter(tag)}
                                            className={cn(
                                                "px-3 py-1 text-xs rounded-full border transition-colors",
                                                selectedTags.includes(tag)
                                                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                                                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
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

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {COLUMNS.map((column) => (
                    <li key={column.id} className="space-y-2">
                        <section className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{column.name}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-gray-100">
                                {tasksByEstado[column.id]?.length || 0}
                            </span>
                        </section>
                        <section
                            id={`column-${column.id}`}
                            className={cn(
                                `min-h-[200px] h-full rounded-lg border p-2 space-y-2 transition-colors ${dragOverColumn === column.id
                                    ? "border-green-300 dark:border-green-500 bg-green-50 dark:bg-green-900/20"
                                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`
                            )}
                            onDragOver={(e: any) => handleDragOver(e, column.id)}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={(e: any) => handleDrop(e, column.id)}
                        >
                            {tasksByEstado[column.id]?.map((task) => (
                                <article
                                    key={task.id}
                                    id={`task-${task.id}`}
                                    className={cn(
                                        `cursor-pointer rounded-md bg-white dark:bg-gray-900 p-3 shadow-sm hover:shadow transition-all duration-250 border border-transparent
                                        ${draggedTask === task.id ? "opacity-30" : "opacity-100"} 
                                        ${dragOverTaskId === task.id
                                            ? dragPosition === "above"
                                                ? "border-t-2 border-emerald-500"
                                                : "border-b-2 border-emerald-500"
                                            : ""
                                        }`
                                    )}
                                    draggable="true"
                                    onDragStart={(e: any) => handleDragStart(e, task.id)}
                                    onDragOver={(e: any) => handleTaskDragOver(e, task.id)}
                                    onDragLeave={handleTaskDragLeave}
                                    onDrop={(e: any) => handleTaskDrop(e, task.id)}
                                    onClick={() => handleOpenTaskView(task.id)}
                                >
                                    <section className="flex items-start justify-between">
                                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{task.title}</h4>
                                        <div className="flex items-center space-x-1">
                                            <button
                                                onClick={(e) => confirmDeleteTask(task.id, e)}
                                                className="text-gray-400 hover:text-red-500 cursor-pointer"
                                                title="Eliminar tarea"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <span className="cursor-grab" title="Arrastrar">
                                                <GripVertical size={16} className="text-gray-400" />
                                            </span>
                                        </div>
                                    </section>
                                    <p
                                        className="mt-1 text-xs text-gray-500 dark:text-gray-400 overflow-hidden text-ellipsis"
                                        style={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical"
                                        }}
                                    >
                                        {task.description}
                                    </p>

                                    {/* Tags */}
                                    {task.tags && task.tags.length > 0 && (
                                        <section className="mt-2 flex flex-wrap gap-1">
                                            {(() => {
                                                try {
                                                    const tags = JSON.parse(task.tags)
                                                    return tags.map((tag: string, index: number) => (
                                                        <Badge key={index} color="indigo" text={tag} />
                                                    ))
                                                } catch {
                                                    return null
                                                }
                                            })()}
                                        </section>
                                    )}

                                    <section className="mt-3 flex items-center justify-between">
                                        <Badge
                                            color={PRIORIDAD_COLORS[task.prioridad || "medium"]}
                                            text={task.prioridad || "medium"}
                                        />
                                        <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                            <User size={12} className="mr-1" />
                                            {task.assignee || "Sin asignar"}
                                        </span>
                                    </section>
                                </article>
                            ))}
                        </section>
                    </li>
                ))}
            </ul>
            <ModalView
                nameModal="view-task"
                task={getTaskById(selectedTaskId)}
            />
        </>
    )
}