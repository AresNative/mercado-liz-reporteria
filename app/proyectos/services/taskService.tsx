"use server";
import { revalidatePath } from "next/cache";

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

// In-memory data store (in a real app, this would be a database)
let tasks: Task[] = [
    {
        id: "task-1",
        title: "Implementar autenticación de usuarios",
        description: "Añadir funcionalidad de inicio de sesión y registro",
        estado: "todo",
        assignee: "Juan Pérez",
        storyPoints: 5,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
        prioridad: "medium",
        tags: ["backend", "security"],
    },
    {
        id: "task-2",
        title: "Diseñar interfaz del dashboard",
        description: "Crear wireframes y mockups para el dashboard",
        estado: "in-progress",
        assignee: "Ana García",
        storyPoints: 3,
        createdAt: new Date("2023-01-02"),
        updatedAt: new Date("2023-01-02"),
        prioridad: "high",
        tags: ["design", "frontend"],
    },
    {
        id: "task-3",
        title: "Corregir bug de navegación",
        description:
            "Solucionar problema con el menú de navegación en dispositivos móviles",
        estado: "done",
        assignee: "Juan Pérez",
        storyPoints: 2,
        createdAt: new Date("2023-01-03"),
        updatedAt: new Date("2023-01-05"),
        prioridad: "high",
        tags: ["bug", "frontend"],
    },
    {
        id: "task-4",
        title: "Optimizar consultas de base de datos",
        description:
            "Mejorar el rendimiento de las consultas lentas a la base de datos",
        estado: "backlog",
        assignee: "Ana García",
        storyPoints: 8,
        createdAt: new Date("2023-01-04"),
        updatedAt: new Date("2023-01-04"),
        prioridad: "medium",
        tags: ["database", "performance"],
    },
    {
        id: "task-5",
        title: "Documentar API",
        description: "Documentar todos los endpoints y parámetros de la API",
        estado: "todo",
        assignee: "Juan Pérez",
        storyPoints: 3,
        createdAt: new Date("2023-01-05"),
        updatedAt: new Date("2023-01-05"),
        prioridad: "low",
        tags: ["documentation", "api"],
    },
];

let timeEntries: TimeEntry[] = [
    {
        id: "entry-1",
        taskId: "task-2",
        date: new Date("2023-01-02"),
        hours: 4,
        description: "Comenzando a trabajar en wireframes",
    },
    {
        id: "entry-2",
        taskId: "task-2",
        date: new Date("2023-01-03"),
        hours: 3,
        description: "Continuando trabajo en mockups",
    },
    {
        id: "entry-3",
        taskId: "task-3",
        date: new Date("2023-01-03"),
        hours: 2,
        description: "Depurando problemas de navegación",
    },
    {
        id: "entry-4",
        taskId: "task-3",
        date: new Date("2023-01-04"),
        hours: 3,
        description:
            "Corregido bug de navegación y probado en múltiples dispositivos",
    },
];

// Cached data fetching functions
export async function getTasks() {
    return tasks;
}

export async function getTasksByEstado(estado: TaskEstado) {
    return tasks.filter((task) => task.estado === estado);
}

export async function getTask(id: string) {
    return tasks.find((task) => task.id === id);
}

export async function getTimeEntries() {
    return timeEntries;
}

export async function getTimeEntriesByTask(taskId: string) {
    return timeEntries.filter((entry) => entry.taskId === taskId);
}

// Data mutation functions
export async function createTask(
    task: Omit<Task, "id" | "createdAt" | "updatedAt">
) {
    const newTask: Task = {
        ...task,
        id: `task-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    tasks = [...tasks, newTask];
    revalidatePath("/scrum-board");
    revalidatePath("/task-management");
    return newTask;
}

export async function updateTask(
    id: string,
    updates: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>
) {
    tasks = tasks.map((task) => {
        if (task.id === id) {
            return {
                ...task,
                ...updates,
                updatedAt: new Date(),
            };
        }
        return task;
    });

    revalidatePath("/scrum-board");
    revalidatePath("/task-management");
    return tasks.find((task) => task.id === id);
}

export async function deleteTask(id: string) {
    tasks = tasks.filter((task) => task.id !== id);
    timeEntries = timeEntries.filter((entry) => entry.taskId !== id);

    revalidatePath("/scrum-board");
    revalidatePath("/task-management");
    revalidatePath("/time-reporting");
    return true;
}

export async function createTimeEntry(entry: Omit<TimeEntry, "id">) {
    const newEntry: TimeEntry = {
        ...entry,
        id: `entry-${Date.now()}`,
    };

    timeEntries = [...timeEntries, newEntry];
    revalidatePath("/time-reporting");
    return newEntry;
}

export async function updateTimeEntry(
    id: string,
    updates: Partial<Omit<TimeEntry, "id">>
) {
    timeEntries = timeEntries.map((entry) => {
        if (entry.id === id) {
            return {
                ...entry,
                ...updates,
            };
        }
        return entry;
    });

    revalidatePath("/time-reporting");
    return timeEntries.find((entry) => entry.id === id);
}

export async function deleteTimeEntry(id: string) {
    timeEntries = timeEntries.filter((entry) => entry.id !== id);

    revalidatePath("/time-reporting");
    return true;
}

export async function updateTaskEstado(id: string, estado: TaskEstado) {
    return updateTask(id, { estado });
}