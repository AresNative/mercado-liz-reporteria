/**
 * Utilidades para trabajar con la biblioteca Swapy para drag and drop
 */

// Tipo genérico para cualquier objeto con un ID
export type WithId = {
  id: string;
  [key: string]: any;
};

// Tipo para el mapeo entre slots e items
export type SlotItemMap = {
  slotId: string;
  itemId: string;
};

/**
 * Inicializa un mapa de slots a items
 * @param items - Array de items
 * @param idKey - Nombre de la propiedad que contiene el ID del item
 * @param columnIdKey - Nombre de la propiedad que contiene el ID de la columna
 * @returns Array de mapeos entre slots e items
 */
export function initSlotItemMap<T extends WithId>(
  items: T[],
  columnIdKey = "columnId"
): SlotItemMap[] {
  return items.map((item) => ({
    slotId: `slot-${item[columnIdKey]}`,
    itemId: item.id,
  }));
}

/**
 * Convierte un array de items y un mapa de slots a un objeto con los items organizados por slot
 * @param items - Array de items
 * @param idKey - Nombre de la propiedad que contiene el ID del item
 * @param slotItemMap - Mapa de slots a items
 * @returns Objeto con los items organizados por slot
 */
export function toSlottedItems<T extends WithId>(
  items: T[],
  slotItemMap: SlotItemMap[]
): Record<string, T> {
  const result: Record<string, T> = {};

  slotItemMap.forEach(({ slotId, itemId }) => {
    const item = items.find((item) => item.id === itemId);
    if (item) {
      result[slotId] = item;
    }
  });

  return result;
}

/**
 * Actualiza la instancia de Swapy cuando cambian los items o el mapa de slots
 * Versión más segura que evita errores de propiedades indefinidas
 */
export function updateSwapy<T extends WithId>(
  swapy: any,
  items: T[],
  slotItemMap: SlotItemMap[],
  setSlotItemMap: (map: SlotItemMap[]) => void
): void {
  // Actualizar Swapy cuando cambian los items o el mapa de slots
  try {
    // Verificar que swapy existe y tiene el método update
    if (swapy && typeof swapy.update === "function") {
      swapy.update();
    }
  } catch (error) {
    console.error("Error updating Swapy:", error);
  }
}

/**
 * Encuentra el ID de la columna a la que pertenece una tarea
 * @param columns - Array de columnas
 * @param taskId - ID de la tarea
 * @returns ID de la columna o null si no se encuentra
 */
export function findColumnIdForTask(
  columns: Array<{ id: string; tasks: Array<{ id: string }> }>,
  taskId: string
): string | null {
  for (const column of columns) {
    if (column.tasks.some((task) => task.id === taskId)) {
      return column.id;
    }
  }
  return null;
}

/**
 * Mueve una tarea de una columna a otra
 * @param columns - Array de columnas
 * @param taskId - ID de la tarea a mover
 * @param sourceColumnId - ID de la columna de origen
 * @param targetColumnId - ID de la columna de destino
 * @param currentUser - Usuario actual para registrar el cambio
 * @returns Nuevo array de columnas con la tarea movida
 */
export function moveTask(
  columns: Array<{
    id: string;
    title: string;
    tasks: Array<{
      id: string;
      changeLog: Array<any>;
      updatedAt: string;
    }>;
  }>,
  taskId: string,
  sourceColumnId: string,
  targetColumnId: string,
  currentUser: { id: string; name: string }
) {
  return columns.map((column) => {
    if (column.id === sourceColumnId) {
      // Encontrar la tarea en la columna de origen
      const taskIndex = column.tasks.findIndex((task) => task.id === taskId);

      if (taskIndex === -1) {
        return column;
      }

      // Eliminar la tarea de la columna de origen
      return {
        ...column,
        tasks: column.tasks.filter((task) => task.id !== taskId),
      };
    } else if (column.id === targetColumnId) {
      // Encontrar la tarea en la columna de origen para moverla
      const sourceColumn = columns.find((col) => col.id === sourceColumnId);
      if (!sourceColumn) {
        return column;
      }

      const task = sourceColumn.tasks.find((task) => task.id === taskId);
      if (!task) {
        return column;
      }

      // Añadir la tarea a la columna de destino con el registro de cambio
      const updatedTask = {
        ...task,
        updatedAt: new Date().toISOString(),
        changeLog: [
          ...task.changeLog,
          {
            id: `change-${Date.now()}`,
            author: currentUser,
            field: "status",
            oldValue: sourceColumn.title,
            newValue: column.title,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      return {
        ...column,
        tasks: [...column.tasks, updatedTask],
      };
    }

    return column;
  });
}
