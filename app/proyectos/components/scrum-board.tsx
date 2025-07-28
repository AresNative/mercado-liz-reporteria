"use client"

import { useState, useEffect, useRef } from "react"
import { type Task, type TaskEstado, useTaskService } from "@/app/proyectos/services/taskService"
import { /* Edit,  */Trash2, GripVertical, User/* , Plus */ } from "lucide-react"
import { ModalView } from "./modal-view"
import { openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { cn } from "@/utils/functions/cn"
import Badge from "@/components/badge"

interface ScrumBoardProps {
    initialTasks: any[]
    sprintId: number
}

const COLUMNS: { id: TaskEstado; name: string }[] = [
    { id: "backlog", name: "Backlog" },
    { id: "todo", name: "Por hacer" },
    { id: "in-progress", name: "En progreso" },
    { id: "done", name: "Completado" },
]

const PRIORIDAD_COLORS: any = {
    low: "green",
    medium: "yellow",
    high: "red",
}

const PRIORIDAD_TEXT_COLORS = {
    low: "#166534",
    medium: "#854d0e",
    high: "#991b1b",
}

export function ScrumBoard({ initialTasks, sprintId }: ScrumBoardProps) {
    const {
        tasks: serviceTasks,
        updateTaskEstado,
        deleteTask: deleteTaskService,
        updateTaskOrder // Añadida la función de actualización de orden
    } = useTaskService(sprintId);

    const dispatch = useAppDispatch();

    const [TaskId, setTaskId] = useState<string | undefined>()
    const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
    const [draggedTask, setDraggedTask] = useState<string | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
    const [dragPosition, setDragPosition] = useState<"above" | "below" | null>(null)

    // Ref to store the original order of tasks before dragging
    const originalTasksRef = useRef<Task[]>([])

    // Sync with service tasks
    useEffect(() => {
        if (serviceTasks.length > 0) {
            setTasks(serviceTasks);
        }
    }, [serviceTasks]);

    // Group tasks by estado
    const tasksByEstado = COLUMNS.reduce(
        (acc, column) => {
            acc[column.id] = tasks.filter((task) => task.estado === column.id)
            return acc
        },
        {} as Record<TaskEstado, Task[]>,
    )

    // Group tasks by id
    const tasksById = (id: string) => tasks.filter((task) => task.id === id)

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
        const draggedTaskObj = tasks.find((t) => t.id === taskId)

        if (!draggedTaskObj) {
            setDraggedTask(null)
            return
        }

        // If dropping directly on a column (not on a task)
        if (draggedTaskObj.estado !== columnId) {
            // Optimistically update UI
            setTasks((prevTasks) => prevTasks.map((task) =>
                task.id === taskId ? { ...task, estado: columnId } : task
            ))

            try {
                // Update on server
                await updateTaskEstado(taskId, columnId)
            } catch (error) {
                console.error("Failed to update task estado:", error)
                // Revert on error
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

        // Create a new array with the updated order
        const newTasks = [...tasks]

        // If moving between columns
        if (draggedTaskObj.estado !== targetTaskObj.estado) {
            // Update the estado of the dragged task
            const updatedDraggedTask = { ...draggedTaskObj, estado: targetTaskObj.estado }

            // Remove the dragged task from its original position
            const filteredTasks = newTasks.filter((t) => t.id !== taskId)

            // Find the index of the target task
            const targetIndex = filteredTasks.findIndex((t) => t.id === targetTaskId)

            // Insert the dragged task at the appropriate position
            const insertIndex = dragPosition === "above" ? targetIndex : targetIndex + 1
            filteredTasks.splice(insertIndex, 0, updatedDraggedTask)

            // Update the tasks state
            setTasks(filteredTasks)

            try {
                // Update on server
                await updateTaskEstado(taskId, targetTaskObj.estado)
            } catch (error) {
                console.error("Failed to update task estado:", error)
                // Revert on error
                setTasks(originalTasksRef.current)
            }
        } else {
            // Reordering within the same column
            // Remove the dragged task from its original position
            const filteredTasks = newTasks.filter((t) => t.id !== taskId)

            // Find the index of the target task
            const targetIndex = filteredTasks.findIndex((t) => t.id === targetTaskId)

            // Insert the dragged task at the appropriate position
            const insertIndex = dragPosition === "above" ? targetIndex : targetIndex + 1
            filteredTasks.splice(insertIndex, 0, draggedTaskObj)

            // CALCULAR EL NUEVO ORDEN
            // 1. Obtener todas las tareas en el mismo estado
            const tasksInSameStatus: any = filteredTasks
                .filter(t => t.estado === draggedTaskObj.estado)
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            console.log(tasksInSameStatus);

            // 2. Encontrar la tarea arrastrada en la nueva posición
            const draggedTaskNewIndex = tasksInSameStatus.findIndex((t: any) => t.id === taskId);

            // 3. Calcular el nuevo orden basado en las tareas adyacentes
            let newOrder;
            if (draggedTaskNewIndex === 0) {
                // Primera tarea: orden = tarea siguiente - 1
                newOrder = tasksInSameStatus[1]?.order !== undefined
                    ? tasksInSameStatus[1].order - 1
                    : 1;
            } else if (draggedTaskNewIndex === tasksInSameStatus.length - 1) {
                // Última tarea: orden = tarea anterior + 1
                newOrder = tasksInSameStatus[draggedTaskNewIndex - 1].order + 1;
            } else {
                // Tarea intermedia: promedio entre anterior y siguiente
                const prevTask = tasksInSameStatus[draggedTaskNewIndex - 1];
                const nextTask = tasksInSameStatus[draggedTaskNewIndex + 1];
                newOrder = (prevTask.order + nextTask.order) / 2;
            }

            try {
                // ACTUALIZAR ORDEN EN EL SERVIDOR
                await updateTaskOrder(taskId, newOrder);

                // Actualizar estado local con el nuevo orden
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === taskId
                            ? { ...task, order: newOrder }
                            : task
                    )
                );
            } catch (error) {
                console.error("Failed to update task order:", error);
                // Revertir a estado original en caso de error
                setTasks(originalTasksRef.current);
            }


            // Update the tasks state
            setTasks(filteredTasks)
        }

        setDraggedTask(null)
    }

    const handleDeleteTask = async (id: string) => {
        try {
            await deleteTaskService(id)
            setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id))
        } catch (error) {
            console.error("Failed to delete task:", error)
        }
    }
    /* const editTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        dispatch(openModalReducer({ modalName: 'edit-task' }))
        setTaskId(id)
    } */

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

    return (
        <>
            {/* <button className="flex gap-1 p-2 ml-auto border bg-green-600 text-white text-xs rounded-4xl items-center mb-4 before:content-['+'] before:text-xs before:bg-white before:text-green-600 before:px-2 before:py-1 before:rounded-full hover:bg-green-700 transition-colors"
                onClick={() => {
                    dispatch(openModalReducer({ modalName: 'create-task' }))
                }}>
                Agregar tarea
            </button> */}
            <ul className="grid grid-cols-1 space-y-6 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {COLUMNS.map((column) => (
                    <li key={column.id} className="space-y-2">
                        <section className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">{column.name}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {tasksByEstado[column.id]?.length || 0}
                            </span>
                        </section>
                        <section
                            id={`column-${column.id}`}
                            className={cn(`min-h-[200px] h-full rounded-lg border p-2 space-y-2 transition-colors ${dragOverColumn === column.id
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200 bg-gray-50"
                                }`)}
                            onDragOver={(e: any) => handleDragOver(e, column.id)}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={(e: any) => handleDrop(e, column.id)}
                        >
                            {tasksByEstado[column.id]?.map((task) => (
                                <article
                                    key={task.id}
                                    id={`task-${task.id}`}
                                    className={cn(`cursor-pointer visibility rounded-md bg-white p-3 shadow-sm hover:shadow
                                         ${draggedTask === task.id ? "opacity-50" : "opacity-100"} 
                                            ${dragOverTaskId === task.id
                                            ? dragPosition === "above"
                                                ? "border-t-2 border-emerald-700"
                                                : "border-b-2 border-emerald-700"
                                            : ""
                                        }`)}
                                    draggable="true"
                                    onDragStart={(e: any) => handleDragStart(e, task.id)}
                                    onDragOver={(e: any) => handleTaskDragOver(e, task.id)}
                                    onDragLeave={handleTaskDragLeave}
                                    onDrop={(e: any) => handleTaskDrop(e, task.id)}
                                    onClick={() => {
                                        dispatch(openModalReducer({ modalName: 'view-task' }))
                                        setTaskId(task.id)
                                    }}
                                >
                                    <section className="flex items-start justify-between">
                                        <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
                                        <div className="flex items-center space-x-1">
                                            {/* <button
                                                onClick={(e) => editTask(task.id, e)}
                                                className="text-gray-400 hover:text-gray-500 cursor-pointer"
                                            >
                                                <Edit size={16} />
                                            </button> */}
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

                                    {/* Tags */}
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
            <ModalView nameModal="view-task" task={TaskId ? tasksById(TaskId)[0] : []} />
            {/* <ModalForm nameModal="edit-task" sprintId={sprintId} dataModal={TaskId ? tasksById(TaskId)[0] : []} /> */}
        </>
    )
}