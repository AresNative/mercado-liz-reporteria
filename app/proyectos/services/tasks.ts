"use client";
import { useState, useEffect, useCallback, useMemo } from "react";

export type TaskEstado =
  | "backlog"
  | "pruebas"
  | "todo"
  | "in-progress"
  | "done"
  | "archivado";
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
  tags?: string;
  order?: number;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  date: Date;
  hours: number;
  description: string;
}

// Función auxiliar para mapear prioridades
const mapPriority = (priority: string): TaskPrioridad => {
  switch (priority?.toLowerCase()) {
    case "alta":
      return "high";
    case "media":
      return "medium";
    case "baja":
      return "low";
    default:
      return "medium";
  }
};

// Función para mapear tareas desde la API
const mapTaskFromAPI = (apiTask: any): Task => ({
  id: String(apiTask.id),
  title: apiTask.nombre,
  description: apiTask.descripcion || "",
  estado: apiTask.estado,
  assignee: apiTask.asignado_a || "Sin asignar",
  storyPoints: apiTask.storyPoints || 1,
  createdAt: new Date(apiTask.fecha_inicio),
  updatedAt: new Date(apiTask.fecha_actualizacion || apiTask.fecha_inicio),
  prioridad: mapPriority(apiTask.prioridad),
  tags: apiTask.tags,
  order: apiTask.order || 0,
});

// Custom hook para manejar el estado de las tareas
export function useTaskService(sprintId: number) {
  // Simular datos de API - en producción esto vendría de un hook real
  const [apiTasks, setApiTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estados internos
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentSprintId, setCurrentSprintId] = useState(sprintId);

  // Cargar tareas cuando cambie el sprintId
  useEffect(() => {
    if (sprintId !== currentSprintId) {
      setCurrentSprintId(sprintId);
    }
  }, [sprintId, currentSprintId]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (currentSprintId <= 0) {
        setTasks([]);
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Reemplazar con llamada real a API
        // Por ahora usamos datos de ejemplo
        const mockTasks = [
          {
            id: "1",
            nombre: "Tarea de ejemplo",
            descripcion: "Descripción de la tarea",
            estado: "todo",
            asignado_a: "Usuario 1",
            fecha_inicio: new Date().toISOString(),
            prioridad: "media",
            tags: '["desarrollo", "frontend"]',
            order: 0,
          },
        ];

        setApiTasks(mockTasks);
        const mappedTasks = mockTasks.map(mapTaskFromAPI);
        setTasks(mappedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [currentSprintId]);

  // Funciones para actualizar el estado (simuladas)
  const putStatusTask = async (data: {
    taskId: string;
    estado: TaskEstado;
  }) => {
    // TODO: Implementar llamada real a API
    console.log("Updating task status:", data);
    return Promise.resolve();
  };

  const putTaskOrder = async (data: { taskId: string; order: number }) => {
    // TODO: Implementar llamada real a API
    console.log("Updating task order:", data);
    return Promise.resolve();
  };

  // Función para refetch (simulada)
  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simular refetch
      const currentTasks = [...apiTasks];
      setApiTasks(currentTasks);
      const mappedTasks = currentTasks.map(mapTaskFromAPI);
      setTasks(mappedTasks);
    } catch (error) {
      console.error("Error refetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [apiTasks]);

  // Funciones para obtener tareas (estabilizadas con useMemo)
  const getTasks = useCallback((): Task[] => {
    return tasks;
  }, [tasks]);

  const getTasksByEstado = useCallback(
    (estado: TaskEstado) => {
      return tasks.filter((task) => task.estado === estado);
    },
    [tasks]
  );

  const getTask = useCallback(
    (id: string) => {
      return tasks.find((task) => task.id === id);
    },
    [tasks]
  );

  // Funciones para mutar datos
  const updateTask = useCallback(
    (
      id: string,
      updates: Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>
    ) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === id) {
            const updatedTask = {
              ...task,
              ...updates,
              updatedAt: new Date(),
            };

            // Actualizar en el estado de API también
            setApiTasks((prevApi) =>
              prevApi.map((apiTask) =>
                apiTask.id === id
                  ? {
                      ...apiTask,
                      nombre: updates.title || apiTask.nombre,
                      descripcion: updates.description || apiTask.descripcion,
                      estado: updates.estado || apiTask.estado,
                      prioridad: updates.prioridad
                        ? updates.prioridad === "high"
                          ? "alta"
                          : updates.prioridad === "medium"
                          ? "media"
                          : "baja"
                        : apiTask.prioridad,
                    }
                  : apiTask
              )
            );

            return updatedTask;
          }
          return task;
        })
      );
      return tasks.find((task) => task.id === id);
    },
    [tasks]
  );

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setApiTasks((prev) => prev.filter((task) => task.id !== id));

    // Simular llamada a API
    putStatusTask({
      taskId: id,
      estado: "archivado",
    });

    return true;
  }, []);

  const updateTaskEstado = useCallback(
    (id: string, estado: TaskEstado) => {
      // Actualizar en el estado local primero
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, estado, updatedAt: new Date() } : task
        )
      );

      setApiTasks((prev) =>
        prev.map((task) => (task.id === id ? { ...task, estado } : task))
      );

      // Llamar a la API
      putStatusTask({
        taskId: id,
        estado: estado,
      });

      return getTask(id);
    },
    [getTask]
  );

  const updateTaskOrder = useCallback(
    async (taskId: string, newOrder: number) => {
      try {
        // Optimistic update
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, order: newOrder } : task
          )
        );

        setApiTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, order: newOrder } : task
          )
        );

        // Enviar actualización al servidor
        await putTaskOrder({
          taskId,
          order: newOrder,
        });
      } catch (error) {
        console.error("Error updating task order:", error);
        // En caso de error, refetch para restaurar el estado
        refetch();
      }
    },
    [refetch]
  );

  return {
    tasks,
    isLoading,
    getTasks,
    getTasksByEstado,
    getTask,
    updateTask,
    deleteTask,
    updateTaskEstado,
    updateTaskOrder,
    refetch,
  };
}
