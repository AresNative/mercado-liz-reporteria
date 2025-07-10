"use client";
import { useEffect, useState } from "react";
import { ScrumBoard } from "./components/scrum-board";
import { useGetScrumQuery } from "@/hooks/reducers/api";

export default function ProyectosPage() {
    const [tasks, setTasks] = useState([])
    const { data } = useGetScrumQuery({
        url: "sprints/27/tasks",
        signal: undefined, // You can pass an AbortSignal if needed
    });
    useEffect(() => {
        if (!data) return;

        // Ensure data is an array and map it to the expected format
        const formattedTasks = data.map((task: any) => ({
            ...task,
            prioridad: task.prioridad || "medium",
            tags: task.tags || ["planning"],
        }));

        setTasks(formattedTasks);
    }, [data]);

    return (
        <main className="min-h-screen mx-auto max-w-7xl p-4 md:p-6 text-gray-900">
            <ScrumBoard initialTasks={tasks} />
        </main>
    );
}