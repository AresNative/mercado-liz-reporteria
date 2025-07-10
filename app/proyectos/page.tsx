"use client"
import { useEffect, useState } from "react";
import { ScrumBoard } from "./components/scrum-board";
import { useTaskService, type Task } from "./services/taskService";

export default function ProyectosPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const { getTasks } = useTaskService();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const tasksData = await getTasks();
                setTasks(tasksData);
            } catch (error) {
                console.error("Error loading tasks:", error);
                // Manejar error apropiadamente
            }
        };

        fetchData();
    }, [getTasks]);

    return (
        <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
            <ScrumBoard initialTasks={tasks} />
        </main>
    );
}