"use client"
import { useGetScrumQuery, usePutTaskStatusMutation } from "@/hooks/reducers/api";
import { useState, useEffect, useCallback } from "react";

export type TaskEstado = "backlog" | "pruebas" | "todo" | "in-progress" | "done";
export type TaskPrioridad = "low" | "medium" | "high";

export interface Task {
    id: string;
    title: string;
    description: string;
    estado: TaskEstado;
    assignee: string;
    storyPoints: number;
    createdAt: Date;
    updatedAt: Date;
    prioridad?: TaskPrioridad;
    tags?: string[];
}

export interface TimeEntry {
    id: string;
    taskId: string;
    date: Date;
    hours: number;
    description: string;
}

// Custom hook para manejar el estado de las tareas
export function useTaskService() {
    const { data: scrumTasks } = useGetScrumQuery({
        url: "sprints/27/tasks",
        signal: undefined,
    });
    const [putStatusTask] = usePutTaskStatusMutation()
    const [tasks, setTasks] = useState<Task[]>([]);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

    useEffect(() => {
        if (scrumTasks) {
            // Mapear los datos de la API al formato Task
            const mappedTasks = scrumTasks.map((apiTask: any) => ({
                id: String(apiTask.id),
                title: apiTask.nombre,
                description: apiTask.descripcion || "",
                estado: apiTask.estado,
                assignee: apiTask.asignado_a || "Sin asignar",
                storyPoints: 1, // Valor por defecto
                createdAt: new Date(apiTask.fecha_creacion),
                updatedAt: new Date(apiTask.fecha_creacion),
                prioridad: mapPriority(apiTask.prioridad),
                tags: []
            }));
            setTasks(mappedTasks);
        }
    }, [scrumTasks]);

    // Función para mapear prioridades
    const mapPriority = (priority: string): TaskPrioridad => {
        switch (priority?.toLowerCase()) {
            case 'alta': return 'high';
            case 'media': return 'medium';
            case 'baja': return 'low';
            default: return 'medium';
        }
    };

    // Cached data fetching functions
    const getTasks = useCallback(() => tasks, [tasks]);

    const getTasksByEstado = useCallback((estado: TaskEstado) => {
        return tasks.filter(task => task.estado === estado);
    }, [tasks]);

    const getTask = useCallback((id: string) => {
        return tasks.find(task => task.id === id);
    }, [tasks]);

    // Data mutation functions
    const updateTask = useCallback((
        id: string,
        updates: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>
    ) => {
        setTasks(prev => prev.map(task => {
            if (task.id === id) {
                return {
                    ...task,
                    ...updates,
                    updatedAt: new Date(),
                };
            }
            return task;
        }));
        return tasks.find(task => task.id === id);
    }, [tasks]);

    const deleteTask = useCallback((id: string) => {
        setTasks(prev => prev.filter(task => task.id !== id));
        putStatusTask({
            taskId: id,
            estado: "archivado"
        });
        return true;
    }, []);

    const updateTaskEstado = useCallback((id: string, estado: TaskEstado) => {
        putStatusTask({
            taskId: id,
            estado: estado
        });
        return updateTask(id, { estado });
    }, [updateTask]);

    return {
        tasks,
        getTasks,
        getTasksByEstado,
        getTask,
        updateTask,
        deleteTask,
        updateTaskEstado
    };
}