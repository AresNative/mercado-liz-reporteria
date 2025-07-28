"use client"
import { useEffect, useState } from "react";
import { ScrumBoard } from "./components/scrum-board";
import { useTaskService, type Task } from "./services/taskService";
import { useGetProjectsQuery, useGetSprintsQuery } from "@/hooks/reducers/api";
import { ArrowLeft, ClipboardListIcon, SquareChevronRight } from "lucide-react";
import { formatDate } from "../pick-up/components/table";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";
import { ModalForm } from "./components/modal-form";
import { TasksField } from "./constants/tasks";
import { SprintField } from "./constants/sprint";
import { ProjectField } from "./constants/project";

export default function ProyectosPage() {
    const dispatch = useAppDispatch();

    const [proyectId, setProyectId] = useState<number>(0);
    const [sprintId, setSprintId] = useState<number>(0);

    const [proyects, setProyects] = useState([]);
    const [sprints, setSprints] = useState([]);

    const [tasks, setTasks] = useState<Task[]>([]);

    const { getTasks } = useTaskService(proyectId);
    const { data: Proyect } = useGetProjectsQuery({})
    const { data: Sprints } = useGetSprintsQuery(proyectId)

    useEffect(() => {
        try {
            setProyects(Proyect);
            setSprints(Sprints);
        } catch {
            // Manejo de error silencioso
        }

        const fetchData = async () => {
            try {
                const tasksData = await getTasks();
                setTasks(tasksData);
            } catch (error) {
                console.error("Error loading tasks:", error);
                // Manejar error apropiadamente
            }
        };

        if (sprintId > 0) {
            fetchData();
        }
    }, [getTasks, sprintId]);

    const handleGoBack = () => {
        if (sprintId > 0) {
            // Si estamos viendo un sprint, volvemos a la lista de sprints
            setSprintId(0);
        } else if (proyectId > 0) {
            // Si estamos viendo sprints de un proyecto, volvemos a la lista de proyectos
            setProyectId(0);
            setSprints([]); // Limpiar sprints al volver atrás
        }
    };

    const showBackButton = proyectId > 0 || sprintId > 0;

    return (
        <main className="mx-auto px-4 md:p-6 text-gray-900 relative">

            <ul className="flex justify-between items-center">
                <header className="mb-8 flex flex-col">
                    <h1 className="flex items-center text-2xl font-bold md:text-3xl">Scrum</h1>
                    <p className="mt-2 text-gray-600">Gestiona proyectos y actividades de mejor manera</p>
                    {showBackButton && (
                        <button
                            onClick={handleGoBack}
                            className="flex gap-1 z-30 cursor-pointer items-center text-green-700 hover:underline mb-4 focus:outline-none"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Regresar</span>
                        </button>
                    )}
                </header>

                <button className="flex gap-1 p-2 ml-auto min-w-[130px] cursor-pointer border bg-green-600 text-white text-xs rounded-4xl items-center mb-4 before:content-['+'] before:text-xs before:bg-white before:text-green-600 before:px-2 before:py-1 before:rounded-full hover:bg-green-700 transition-colors"
                    onClick={() => {
                        dispatch(openModalReducer({ modalName: 'create-in-scrum' }))
                    }}>
                    Agregar {proyectId === 0 ? "Proyecto" : sprintId > 0 ? "Tarea" : "Sprint"}
                </button>
            </ul>
            <ul className="flex gap-2 flex-wrap mt-10">
                {!proyectId && !sprintId && proyects && proyects.map((rows: any, key: any) => {
                    const formatted = formatDate(rows.fecha_inicio)
                    return (
                        <li
                            key={key}
                            className="bg-white shadow border-l-2 border-l-green-500 rounded-2xl px-3 py-2 cursor-pointer hover:underline hover:shadow-md transition-all flex-1 min-w-[200px]"
                            onClick={() => { setProyectId(rows.id) }}
                        >
                            <label className="flex gap-2 items-center cursor-pointer uppercase">
                                <SquareChevronRight className="size-4 text-green-800" /> {rows.nombre}
                            </label>

                            <div className="flex justify-between items-center gap-2 mt-2">
                                <section className="flex text-ellipsis text-xs items-center gap-2 text-gray-800/60">
                                    <span>{rows.descripcion}</span>
                                </section>
                                <section className="flex flex-col">
                                    <span className="text-sm">{formatted.date}</span>
                                    <span className="text-xs text-gray-500">{formatted.time}</span>
                                </section>
                            </div>
                        </li>
                    )
                })}

            </ul>
            <ul className="flex flex-col gap-1 flex-wrap">
                {proyectId > 0 && !sprintId && sprints.map((row: any, key: any) => {
                    const formatted = formatDate(row.fecha_inicio)
                    return (
                        <li
                            key={key}
                            className="flex md:flex-row flex-col gap-2 justify-between border-b border-gray-200 px-3 py-4 cursor-pointer hover:shadow-md hover:underline transition-all flex-1 min-w-[200px]"
                            onClick={() => { setSprintId(row.id) }}
                        >
                            <label className="flex gap-2 items-center cursor-pointer uppercase text-sm">
                                <ClipboardListIcon className="size-4 text-blue-500" /> {row.nombre}
                            </label>
                            <div className="flex items-center gap-2  justify-between">
                                <section className="flex flex-col">
                                    <span className="text-sm">{formatted.date}</span>
                                    <span className="text-xs text-gray-500">{formatted.time}</span>
                                </section>
                            </div>
                        </li>
                    )
                })}
            </ul>

            {sprintId > 0 && (
                <ScrumBoard
                    initialTasks={tasks}
                    sprintId={sprintId}
                />
            )}

            <ModalForm action={proyectId === 0 ? "post-projects" : sprintId > 0 ? "post-task" : "post-sprints"} nameModal="create-in-scrum" sprintId={sprintId} formFunction={proyectId === 0 ? ProjectField : sprintId > 0 ? TasksField : SprintField} />
        </main>
    );
}