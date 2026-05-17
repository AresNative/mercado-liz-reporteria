import {
  useGetWithFiltersMutation,
  usePostGeneralMutation,
} from "@/hooks/api/api";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { useEffect, useState } from "react";

export interface Comment {
  id: number;
  tarea_id: number;
  usuario_id?: number;
  contenido: string;
  fecha: string;
}
const USER_DATA_KEY = "userData";
const userData = getLocalStorageItem(USER_DATA_KEY);

export function useCommentService(taskId: string) {
  const [getComments] = useGetWithFiltersMutation();
  const [postComment] = usePostGeneralMutation();
  const [comments, setComments] = useState<Comment[]>([]);

  const fetchComments = async () => {
    if (!taskId) return;
    try {
      const result = await getComments({
        table: "comentarios",
        page: 1,
        pageSize: 100,
        filtros: {
          Filtros: [
            { key: "tarea_id", operator: "=", value: parseInt(taskId) },
          ]
        },
      }).unwrap();
      setComments(result.data || []);
    } catch (error) {
      console.error("Error al cargar comentarios:", error);
    }
  };

  const addComment = async (contenido: string) => {
    try {
      await postComment({
        table: "comentarios",
        data: {
          tarea_id: parseInt(taskId),
          usuario_id: userData?.userId, // Cambiar por el ID del usuario autenticado
          contenido,
          fecha: new Date().toISOString(),
        },
      }).unwrap();
      await fetchComments(); // Recargar lista
    } catch (error) {
      console.error("Error al crear comentario:", error);
      throw error;
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  return { comments, addComment, fetchComments };
}
