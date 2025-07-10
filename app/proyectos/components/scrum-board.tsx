"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { type Task, type TaskEstado, updateTaskEstado, createTask, updateTask, deleteTask } from "@/app/proyectos/services/taskService"
import { Package, Edit, Trash2, GripVertical, User, PenSquare } from "lucide-react"
/* import CardResumen from "@/app/mermas/components/card-resumen" */
import { Modal } from "@/components/modal"
import MainForm from "@/components/form/main-form"
import { useAppDispatch } from "@/hooks/selector"
import { closeModalReducer, openModalReducer } from "@/hooks/reducers/drop-down"

interface ScrumBoardProps {
    initialTasks: any[]
}

const COLUMNS: { id: TaskEstado; name: string }[] = [
    { id: "backlog", name: "Backlog" },
    { id: "pruebas", name: "Pruebas" },
    { id: "todo", name: "Por hacer" },
    { id: "in-progress", name: "En progreso" },
    { id: "done", name: "Completado" },
]

const PRIORIDAD_COLORS = {
    low: "#dcfce7", // Light green
    medium: "#fef9c3", // Light yellow
    high: "#fee2e2", // Light red
}

const PRIORIDAD_TEXT_COLORS = {
    low: "#166534", // Dark green
    medium: "#854d0e", // Dark yellow
    high: "#991b1b", // Dark red
}

export function ScrumBoard({ initialTasks }: ScrumBoardProps) {
    const dispatch = useAppDispatch();
    const [tasks, setTasks] = useState<Task[]>(
        initialTasks || [],
    )
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: "",
        description: "",
        estado: "backlog",
        assignee: "",
        storyPoints: 1,
        prioridad: "medium",
        tags: ["planning"],
    })
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [draggedTask, setDraggedTask] = useState<string | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
    const [dragPosition, setDragPosition] = useState<"above" | "below" | null>(null)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [commentText, setCommentText] = useState("")
    const [attachments, setAttachments] = useState<Array<{ type: "image" | "document"; name: string; preview?: string }>>(
        [],
    )
    const [showAttachments, setShowAttachments] = useState(false)

    // Ref to store the original order of tasks before dragging
    const originalTasksRef = useRef<Task[]>([])

    // Calculate total story points
    const totalStoryPoints = tasks.reduce((sum, task) => sum + task.storyPoints, 0)

    // Group tasks by estado
    const tasksByEstado = COLUMNS.reduce(
        (acc, column) => {
            acc[column.id] = tasks.filter((task) => task.estado === column.id)
            return acc
        },
        {} as Record<TaskEstado, Task[]>,
    )

    // Set up drag and drop event handlers
    useEffect(() => {
        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setDetailsModalOpen(false)
            }
        }

        document.addEventListener("keydown", handleEscapeKey)
        return () => {
            document.removeEventListener("keydown", handleEscapeKey)
        }
    }, [])

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        // Store the original tasks order before dragging
        originalTasksRef.current = [...tasks]

        e.dataTransfer.setData("text/plain", taskId)
        setDraggedTask(taskId)

        // Set a custom drag image (optional)
        const draggedTaskElement = document.getElementById(`task-${taskId}`)
        if (draggedTaskElement) {
            const rect = draggedTaskElement.getBoundingClientRect()
            e.dataTransfer.setDragImage(draggedTaskElement, rect.width / 2, rect.height / 2)
        }

        // For better UX, set effectAllowed
        e.dataTransfer.effectAllowed = "move"
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
        e.preventDefault() // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move"
        setDragOverColumn(columnId)
    }

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault() // Prevent default to allow drop
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        // Only clear if we're leaving the column, not entering a child element
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

        // Only clear if we're leaving the task, not entering a child element
        if (!e.relatedTarget || !(e.currentTarget as Node).contains(e.relatedTarget as Node)) {
            setDragOverTaskId(null)
            setDragPosition(null)
        }
    }
    // Función para añadir un comentario
    const addComment = () => {
        if (!commentText.trim() && attachments.length === 0) return

        // En una implementación real, aquí se guardaría el comentario en la base de datos
        // Por ahora, solo limpiamos el formulario
        setCommentText("")
        setAttachments([])
        setShowAttachments(false)

        // Podríamos mostrar un mensaje de éxito o actualizar la lista de comentarios
        alert("Comentario añadido correctamente")
    }
    const handleAttachment = (type: "image" | "document") => {
        // En una implementación real, aquí se abriría un selector de archivos
        // Por ahora, simulamos la adición de un archivo
        const newAttachment = {
            type,
            name: type === "image" ? "imagen.jpg" : "documento.pdf",
            preview: type === "image" ? "/placeholder.svg?height=64&width=64" : undefined,
        }

        setAttachments([...attachments, newAttachment])
        setShowAttachments(true)
    }

    const removeAttachment = (index: number) => {
        const newAttachments = [...attachments]
        newAttachments.splice(index, 1)
        setAttachments(newAttachments)
        setShowAttachments(newAttachments.length > 0)
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
            setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? { ...task, estado: columnId } : task)))

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

    const handleCreateTaskSuccess = (formData: any) => {
        const newTaskData = {
            ...formData,
            tags: formData.tags || ["planning"],
            prioridad: formData.prioridad || "medium",
            storyPoints: parseInt(formData.storyPoints) || 1
        }

        setTasks((prevTasks) => [...prevTasks, newTaskData])
        setNewTask({
            title: "",
            description: "",
            estado: "backlog",
            assignee: "",
            storyPoints: 1,
            prioridad: "medium",
            tags: ["planning"],
        })
    }

    const handleDeleteTask = async (id: string) => {
        try {
            await deleteTask(id)
            setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id))
            setDetailsModalOpen(false)
        } catch (error) {
            console.error("Failed to delete task:", error)
        }
    }

    const openTaskDetails = (task: Task) => {
        setSelectedTask(task)
        setDetailsModalOpen(true)
    }

    const openEditTask = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingTask(task)
        dispatch(openModalReducer({ modalName: "editTask" }))
    }

    const confirmDeleteTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (window.confirm("¿Estás seguro de que deseas eliminar esta tarea?")) {
            handleDeleteTask(id)
        }
    }

    return (
        <div className="space-y-6">
            <section className="flex justify-end mb-4">
                <button
                    className={`px-2 py-1 md:px-3 md:py-2 border dark:border-zinc-700 rounded-lg flex gap-1 md:gap-2 items-center transition-colors bg-purple-500 text-white border-purple-700'
                            hover:bg-purple-600 focus:outline-none focus:ring focus:ring-purple-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus:ring-zinc-700`}
                    onClick={() => dispatch(openModalReducer({ modalName: "createTask" }))}
                >
                    <span className="text-xs md:text-sm">Añadir tarea</span>
                </button>
            </section>

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {COLUMNS.map((column) => (
                    <li key={column.id} className="space-y-2">
                        <section className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">{column.name}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {tasksByEstado[column.id].length}
                            </span>
                        </section>
                        <section
                            id={`column-${column.id}`}
                            className={`min-h-[200px] rounded-lg border p-2 space-y-2 transition-colors ${dragOverColumn === column.id ? "border-purple-300 bg-purple-50" : "border-gray-200 bg-gray-50"
                                }`}
                            onDragOver={(e: any) => handleDragOver(e, column.id)}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={(e: any) => handleDrop(e, column.id)}
                        >
                            {tasksByEstado[column.id].map((task) => (
                                <div
                                    key={task.id}
                                    id={`task-${task.id}`}
                                    className={`cursor-pointer rounded-md border bg-white shadow-sm hover:shadow p-3 ${draggedTask === task.id ? "opacity-50" : "opacity-100"
                                        } ${dragOverTaskId === task.id
                                            ? dragPosition === "above"
                                                ? "border-t-2 border-t-purple-500"
                                                : "border-b-2 border-b-purple-500"
                                            : ""
                                        }`}
                                    onClick={() => openTaskDetails(task)}
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    onDragOver={(e) => handleTaskDragOver(e, task.id)}
                                    onDragLeave={handleTaskDragLeave}
                                    onDrop={(e) => handleTaskDrop(e, task.id)}
                                >
                                    <section className="flex items-start justify-between">
                                        <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
                                        <div className="flex items-center space-x-1">
                                            <button onClick={(e) => openEditTask(task, e)} className="text-gray-400 hover:text-gray-500">
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => confirmDeleteTask(task.id, e)}
                                                className="text-gray-400 hover:text-red-500"
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
                                        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                                    >
                                        {task.description}
                                    </p>

                                    {/* Tags */}
                                    <section className="mt-2 flex flex-wrap gap-1">
                                        {task.tags &&
                                            task.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                    </section>

                                    <section className="mt-3 flex items-center justify-between">
                                        <span
                                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
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

            {/* Create Task Modal */}
            <Modal modalName="createTask" title="Crear Nueva Tarea">
                <section className="md:w-[400px]">
                    <MainForm
                        message_button="Crear"
                        actionType="add-task"
                        dataForm={[
                            {
                                type: "INPUT",
                                name: "title",
                                label: "Título",
                                placeholder: "Ingrese el título de la tarea",
                                require: true
                            },
                            {
                                type: "TEXT_AREA",
                                name: "description",
                                label: "Descripción",
                                placeholder: "Ingrese la descripción de la tarea",
                                require: true
                            },
                            {
                                type: "INPUT",
                                name: "assignee",
                                label: "Asignado a",
                                placeholder: "Ingrese el nombre del asignado",
                                require: true
                            },
                            {
                                type: "SELECT",
                                name: "prioridad",
                                label: "Prioridad",
                                valueDefined: editingTask?.prioridad || "medium",
                                options: [
                                    { value: "low", label: "Baja" },
                                    { value: "medium", label: "Media" },
                                    { value: "high", label: "Alta" }
                                ],
                                require: true
                            },
                            {
                                type: "TAG_INPUT",
                                name: "tags",
                                label: "Etiquetas",
                                valueDefined: editingTask?.tags || [],
                                placeholder: "Añadir etiqueta",
                                require: false
                            },
                            {
                                type: "INPUT",
                                name: "storyPoints",
                                label: "Puntos de Historia",
                                minLength: 1,
                                valueDefined: editingTask?.storyPoints || 1,
                                require: true
                            },
                            {
                                type: "SELECT",
                                name: "estado",
                                label: "Estado",
                                valueDefined: editingTask?.estado || "backlog",
                                options: [
                                    { value: "backlog", label: "Backlog" },
                                    { value: "todo", label: "Por hacer" },
                                    { value: "in-progress", label: "En progreso" },
                                    { value: "done", label: "Completado" }
                                ],
                                require: true
                            }
                        ]}
                        onSuccess={(formData) => {
                            handleCreateTaskSuccess(formData);
                            dispatch(closeModalReducer({ modalName: "createTask" }));
                        }}
                    />
                </section>
            </Modal>

            {/* Task Details Modal */}
            {detailsModalOpen && selectedTask && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={() => setDetailsModalOpen(false)}
                        ></div>
                        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
                        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg font-medium leading-6 text-gray-900">Detalles de la Tarea</h3>
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Título</h4>
                                                <p className="mt-1 text-sm text-gray-900">{selectedTask.title}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Descripción</h4>
                                                <p className="mt-1 text-sm text-gray-900">{selectedTask.description}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Asignado a</h4>
                                                <p className="mt-1 text-sm text-gray-900">{selectedTask.assignee}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Prioridad</h4>
                                                <p className="mt-1 text-sm text-gray-900">{selectedTask.prioridad || "media"}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Etiquetas</h4>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {selectedTask.tags &&
                                                        selectedTask.tags.map((tag, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Puntos de Historia</h4>
                                                <p className="mt-1 text-sm text-gray-900">{selectedTask.storyPoints}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Estado</h4>
                                                <p className="mt-1 text-sm text-gray-900">
                                                    {COLUMNS.find((c) => c.id === selectedTask.estado)?.name}
                                                </p>
                                            </div>

                                            {/* New sections for documentation, comments and progress */}
                                            <div className="border-t border-gray-200 pt-4 mt-4">
                                                <h4 className="text-sm font-medium text-gray-700">Documentación y Avances</h4>

                                                <div className="mt-3">
                                                    <h5 className="text-sm font-medium text-gray-500">Documentación</h5>
                                                    <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                                                        <p className="text-sm text-gray-700">
                                                            {selectedTask.description
                                                                ? selectedTask.description
                                                                : "No hay documentación adicional para esta tarea."}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <h5 className="text-sm font-medium text-gray-500">Comentarios</h5>
                                                    <div className="mt-1 space-y-3">
                                                        <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-xs font-medium text-gray-700">{selectedTask.assignee}</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(selectedTask.updatedAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-sm text-gray-700">Última actualización de la tarea.</p>
                                                        </div>

                                                        {/* Historial de comentarios */}
                                                        <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-xs font-medium text-gray-700">Ana García</span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(Date.now() - 86400000).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-sm text-gray-700">
                                                                He actualizado el diseño según los comentarios del cliente.
                                                            </p>
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                <div className="w-20 h-20 border border-gray-200 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                                                                    <img
                                                                        src="/placeholder.svg?height=80&width=80"
                                                                        alt="Imagen adjunta"
                                                                        className="object-cover"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>



                                                        {/* Formulario para agregar comentarios */}
                                                        <div className="border border-gray-200 rounded-md overflow-hidden">
                                                            <textarea
                                                                placeholder="Añadir un comentario..."
                                                                className="w-full p-2 text-sm border-b border-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                                rows={2}
                                                                value={commentText}
                                                                onChange={(e) => setCommentText(e.target.value)}
                                                            ></textarea>

                                                            <div className="bg-gray-50 p-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex space-x-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleAttachment("image")}
                                                                            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                                        >
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="14"
                                                                                height="14"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                className="mr-1"
                                                                            >
                                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                                                <polyline points="21 15 16 10 5 21"></polyline>
                                                                            </svg>
                                                                            Imagen
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleAttachment("document")}
                                                                            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                                        >
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="14"
                                                                                height="14"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                className="mr-1"
                                                                            >
                                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                                                <polyline points="10 9 9 9 8 9"></polyline>
                                                                            </svg>
                                                                            Documento
                                                                        </button>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={addComment}
                                                                        disabled={!commentText.trim() && attachments.length === 0}
                                                                        className={`inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white ${!commentText.trim() && attachments.length === 0
                                                                            ? "bg-purple-400 cursor-not-allowed"
                                                                            : "bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                                            }`}
                                                                    >
                                                                        Comentar
                                                                    </button>
                                                                </div>

                                                                {/* Vista previa de archivos adjuntos */}
                                                                <div className={`mt-2 flex flex-wrap gap-2 ${showAttachments ? "" : "hidden"}`}>
                                                                    {attachments.map((attachment, index) => (
                                                                        <div key={index} className="relative group">
                                                                            {attachment.type === "image" ? (
                                                                                <div className="w-16 h-16 border border-gray-200 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                                                                                    <img
                                                                                        src={attachment.preview || "/placeholder.svg"}
                                                                                        alt="Vista previa"
                                                                                        className="object-cover"
                                                                                    />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-16 h-16 border border-gray-200 rounded-md bg-gray-100 flex flex-col items-center justify-center text-xs text-gray-500">
                                                                                    <svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="20"
                                                                                        height="20"
                                                                                        viewBox="0 0 24 24"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        strokeWidth="2"
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        className="mb-1"
                                                                                    >
                                                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                                                        <polyline points="14 2 14 8 20 8"></polyline>
                                                                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                                                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                                                                        <polyline points="10 9 9 9 8 9"></polyline>
                                                                                    </svg>
                                                                                    <div>{attachment.name}</div>
                                                                                </div>
                                                                            )}
                                                                            <button
                                                                                onClick={() => removeAttachment(index)}
                                                                                className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100"
                                                                            >
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    width="12"
                                                                                    height="12"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="2"
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                >
                                                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3">
                                                    <h5 className="text-sm font-medium text-gray-500">Progreso</h5>
                                                    <div className="mt-1">
                                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                            <div
                                                                className="bg-purple-600 h-2.5 rounded-full"
                                                                style={{
                                                                    width:
                                                                        selectedTask.estado === "done"
                                                                            ? "100%"
                                                                            : selectedTask.estado === "in-progress"
                                                                                ? "50%"
                                                                                : selectedTask.estado === "todo"
                                                                                    ? "10%"
                                                                                    : "0%",
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <div className="flex justify-between mt-1">
                                                            <span className="text-xs text-gray-500">Inicio</span>
                                                            <span className="text-xs text-gray-500">
                                                                {selectedTask.estado === "done" ? "Completado" : "En progreso"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingTask(selectedTask)
                                        setDetailsModalOpen(false)
                                    }}
                                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="mr-2"
                                    >
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    Editar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteTask(selectedTask.id)}
                                    className="mt-3 inline-flex w-full justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-base font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="mr-2"
                                    >
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                    Eliminar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDetailsModalOpen(false)}
                                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            <Modal modalName="editTask" title="Editar Tarea">
                {editingTask && (
                    <MainForm
                        message_button="Guardar"
                        dataForm={[
                            {
                                type: "INPUT",
                                name: "title",
                                label: "Título",
                                placeholder: "Ingrese el título de la tarea",
                                valueDefined: editingTask.title,
                                require: true
                            },
                            {
                                type: "TEXT_AREA",
                                name: "description",
                                label: "Descripción",
                                placeholder: "Ingrese la descripción de la tarea",
                                valueDefined: editingTask.description,
                                require: true
                            },
                            {
                                type: "INPUT",
                                name: "assignee",
                                label: "Asignado a",
                                placeholder: "Ingrese el nombre del asignado",
                                valueDefined: editingTask.assignee,
                                require: true
                            },
                            {
                                type: "SELECT",
                                name: "prioridad",
                                label: "Prioridad",
                                valueDefined: editingTask?.prioridad || "medium",
                                options: [
                                    { value: "low", label: "Baja" },
                                    { value: "medium", label: "Media" },
                                    { value: "high", label: "Alta" }
                                ],
                                require: true
                            },
                            {
                                type: "TAG_INPUT",
                                name: "tags",
                                label: "Etiquetas",
                                valueDefined: editingTask?.tags || [],
                                placeholder: "Añadir etiqueta",
                                require: false
                            },
                            {
                                type: "INPUT",
                                name: "storyPoints",
                                label: "Puntos de Historia",
                                minLength: 1,
                                valueDefined: editingTask?.storyPoints || 1,
                                require: true
                            },
                            {
                                type: "SELECT",
                                name: "estado",
                                label: "Estado",
                                valueDefined: editingTask?.estado || "backlog",
                                options: [
                                    { value: "backlog", label: "Backlog" },
                                    { value: "todo", label: "Por hacer" },
                                    { value: "in-progress", label: "En progreso" },
                                    { value: "done", label: "Completado" }
                                ],
                                require: true
                            }
                        ]}
                        actionType="edit-task"
                        action={() => {
                            dispatch(closeModalReducer({ modalName: "editTask" }));
                            setEditingTask(null);
                        }}
                    />
                )}
            </Modal>
        </div >
    )
}
