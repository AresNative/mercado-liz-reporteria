"use client"

import { useState, useEffect, useRef } from "react"
import { type Task, type TaskEstado, useTaskService } from "@/app/proyectos/services/taskService"
import { Edit, Trash2, GripVertical, User, Plus } from "lucide-react"
import { ModalView } from "./modal-view"
import { openAlertReducer, openModalReducer } from "@/hooks/reducers/drop-down"
import { useAppDispatch } from "@/hooks/selector"
import { ModalForm } from "./modal-form"

interface ScrumBoardProps {
    initialTasks: any[]
}

const COLUMNS: { id: TaskEstado; name: string }[] = [
    { id: "backlog", name: "Backlog" },
    { id: "todo", name: "Por hacer" },
    { id: "in-progress", name: "En progreso" },
    { id: "done", name: "Completado" },
]

const PRIORIDAD_COLORS = {
    low: "#dcfce7",
    medium: "#fef9c3",
    high: "#fee2e2",
}

const PRIORIDAD_TEXT_COLORS = {
    low: "#166534",
    medium: "#854d0e",
    high: "#991b1b",
}

export function ScrumBoard({ initialTasks }: ScrumBoardProps) {
    const {
        tasks: serviceTasks,
        updateTaskEstado,
        deleteTask: deleteTaskService
    } = useTaskService();

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
    const [TaskId, setTaskId] = useState<string | undefined>()
    const dispatch = useAppDispatch();

    return (
        <main>
            <button className="flex gap-1 p-2 ml-auto border bg-green-600 text-white text-xs rounded-4xl items-center mb-4 before:content-['+'] before:text-xs before:bg-white before:text-green-600 before:px-2 before:py-1 before:rounded-full hover:bg-green-700 transition-colors"
                onClick={() => {
                    dispatch(openModalReducer({ modalName: 'create-task' }))
                }}>
                Agregar tarea
            </button>
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
                            className={`min-h-[200px] rounded-lg border p-2 space-y-2 transition-colors ${dragOverColumn === column.id
                                ? "border-purple-300 bg-purple-50"
                                : "border-gray-200 bg-gray-50"
                                }`}
                            onDragOver={(e: any) => handleDragOver(e, column.id)}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={(e: any) => handleDrop(e, column.id)}
                        >
                            {tasksByEstado[column.id]?.map((task) => (
                                <div
                                    key={task.id}
                                    id={`task-${task.id}`}
                                    className={`cursor-pointer visibility rounded-md border bg-white shadow-sm hover:shadow p-3 ${draggedTask === task.id ? "opacity-50" : "opacity-100"
                                        } ${dragOverTaskId === task.id
                                            ? dragPosition === "above"
                                                ? "border-t-2 border-t-purple-500"
                                                : "border-b-2 border-b-purple-500"
                                            : ""
                                        }`}
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    onDragOver={(e) => handleTaskDragOver(e, task.id)}
                                    onDragLeave={handleTaskDragLeave}
                                    onDrop={(e) => handleTaskDrop(e, task.id)}
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
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </section>
                                    )}

                                    <section className="mt-3 flex items-center justify-between">
                                        <span
                                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                                            style={{
                                                backgroundColor: PRIORIDAD_COLORS[task.prioridad || "medium"],
                                                color: PRIORIDAD_TEXT_COLORS[task.prioridad || "medium"],
                                            }}
                                        >
                                            {task.prioridad || "medium"}
                                        </span>
                                        <span className="flex items-center text-xs text-gray-500">
                                            <User size={12} className="mr-1" />
                                            {task.assignee}
                                        </span>
                                    </section>
                                </div>
                            ))}
                        </section>
                    </li>
                ))}
            </ul>
            <ModalView nameModal="view-task" task={TaskId ? tasksById(TaskId)[0] : []} />
            <ModalForm nameModal="create-task" sprintId={27} />
            {/* <ModalForm nameModal="edit-task" sprintId={27} dataModal={TaskId ? tasksById(TaskId)[0] : []} /> */}
        </main>
    )
}