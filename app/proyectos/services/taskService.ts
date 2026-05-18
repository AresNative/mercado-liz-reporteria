"use client";
import {
  useGetWithFiltersMutation,
  usePutGeneralMutation,
  useDeleteGeneralMutation,
} from "@/hooks/api/api";
import { useCallback, useEffect, useState } from "react";

export type TaskEstado = "backlog" | "todo" | "in-progress" | "done";
export type TaskPrioridad = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  estado: TaskEstado;
  assignee: string;
  storyPoints: number;
  createdAt: string;
  updatedAt: string;
  prioridad: TaskPrioridad;
  tags?: string;
  order: number;
}

export function useTaskService(sprintId: number) {
  // Obtener tareas del sprint
  const [getData, { data: tasksData = [] }] = useGetWithFiltersMutation();

  useEffect(() => {
    if (!sprintId) return;

    getData({
      table: "tareas",
      tag: `sprint_${sprintId}`,
      page: 1,
      pageSize: 100,
      filtros: {
        Filtros: [
          { key: "sprint_id", operator: "=", value: sprintId },
        ],
        order: [{ key: "orden", direction: "desc" }],
      },
      signal: undefined,
    })
      .unwrap()
      .catch((error) => {
        console.error("Error al obtener tareas:", error);
      });
  }, [getData, sprintId]);

  // Mutaciones
  const [putTaskEstado] = usePutGeneralMutation();
  const [putTaskOrder] = usePutGeneralMutation();
  const [deleteTaskMutation] = useDeleteGeneralMutation();

  const [tasks, setTasks] = useState<Task[]>([]);

  // Mapear datos de la API al formato Task
  useEffect(() => {
    if (tasksData.data && Array.isArray(tasksData.data)) {
      const mapped = tasksData.data.map((apiTask: any) => ({
        id: String(apiTask.id),
        title: apiTask.titulo,
        description: apiTask.descripcion || "",
        estado: apiTask.estado,
        assignee: apiTask.asignado_a || "Sin asignar",
        storyPoints: apiTask.puntos_historia || 1,
        createdAt: apiTask.fecha_creacion,
        updatedAt: apiTask.fecha_actualizacion,
        prioridad: mapPriority(apiTask.prioridad),
        tags: apiTask.tags,
        order: apiTask.orden ?? 0,
      }));
      setTasks(mapped);
    }
  }, [tasksData]);

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

  // Obtener tareas (cache local)
  const getTasks = useCallback(() => tasks, [tasks]);

  // Actualizar estado de una tarea
  const updateTaskEstado = useCallback(
    async (taskId: string, estado: TaskEstado) => {
      try {
        await putTaskEstado({
          table: "tareas", // o "tareas" según tu BD
          data: {
            Data: { estado: estado, fecha_actualizacion: new Date().toISOString() },
            Filtros: [{ Key: "id", Value: taskId, Operator: "=" }]
          },
        }).unwrap();
        // Actualización optimista (opcional, ya se hará con el refetch)
      } catch (error) {
        console.error("Error al actualizar estado:", error);
        throw error;
      }
    },
    [putTaskEstado],
  );

  // Actualizar orden de una tarea
  const updateTaskOrder = useCallback(
    async (taskId: string, order: number) => {
      try {
        await putTaskOrder({
          table: "tareas",
          data: {
            Data: {
              orden: order,
              fecha_actualizacion: new Date().toISOString(),
            },
            Filtros: [{ Key: "id", Value: taskId, Operator: "=" }],
          },
        }).unwrap();
      } catch (error) {
        console.error("Error al actualizar orden:", error);
        throw error;
      }
    },
    [putTaskOrder],
  );

  // Eliminar tarea
  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        await deleteTaskMutation({
          table: "tareas",
          id: taskId,
        }).unwrap();
      } catch (error) {
        
        await deleteTaskMutation({
          table: "comentarios",
          column: "tarea_id",
          id: taskId,
        }).unwrap();
        deleteTask;

        console.error("Error al eliminar tarea:", error);
        throw error;
      }
    },
    [deleteTaskMutation],
  );

  return {
    tasks,
    getTasks,
    updateTaskEstado,
    updateTaskOrder,
    deleteTask,
  };
}
