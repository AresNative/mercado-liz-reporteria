// hooks/usePedidosSignalR.ts
import { useSignalR } from "@/hooks/use-signalr";
import { useEffect, useCallback } from "react";

export const usePedidosSignalR = (
  onPedidoActualizado: (pedido: any) => void,
  onNuevoPedido: (pedido: any) => void
) => {
  const { connection, isConnected } = useSignalR("/pedidosHub");

  // Función para unirse a grupos específicos
  const unirseAGrupos = useCallback(async () => {
    if (connection && isConnected) {
      try {
        // Unirse al grupo general de pedidos
        await connection.invoke("JoinGroup", "PedidosGeneral");
        console.log("Unido al grupo general de pedidos");
      } catch (error) {
        console.error("Error uniéndose a grupos:", error);
      }
    }
  }, [connection, isConnected]);

  useEffect(() => {
    if (connection && isConnected) {
      unirseAGrupos();

      // Escuchar eventos del servidor
      connection.on("DatosActualizados", (data: any) => {
        console.log("Datos actualizados:", data);
        // Actualizar estadísticas o mostrar notificaciones generales
      });

      connection.on("NuevoRegistro", (data: any) => {
        console.log("Nuevo registro:", data);
        if (data.Tabla === "listas" || data.Tabla === "pedidos") {
          onNuevoPedido(data.Registro);
        }
      });

      connection.on("RegistroActualizado", (data: any) => {
        console.log("Registro actualizado:", data);
        if (data.Tabla === "listas" || data.Tabla === "pedidos") {
          onPedidoActualizado(data.DatosActualizados);
        }
      });

      connection.on("PedidoActualizado", (pedidoActualizado: any) => {
        console.log("Pedido específico actualizado:", pedidoActualizado);
        onPedidoActualizado(pedidoActualizado);
      });

      connection.on("RegistroArchivado", (data: any) => {
        console.log("Registro archivado:", data);
        if (data.Tabla === "listas" || data.Tabla === "pedidos") {
          // Actualizar la lista removiendo el pedido archivado
          onPedidoActualizado({ ...data.DatosOriginales, estado: "archivado" });
        }
      });

      connection.on("RegistroEliminado", (data: any) => {
        console.log("Registro eliminado:", data);
        if (data.Tabla === "listas" || data.Tabla === "pedidos") {
          // Notificar que el pedido fue eliminado
          onPedidoActualizado({ ...data.DatosOriginales, estado: "eliminado" });
        }
      });

      // Manejar reconexión
      connection.onreconnected(() => {
        console.log("SignalR reconectado, uniéndose a grupos...");
        unirseAGrupos();
      });

      return () => {
        connection.off("DatosActualizados");
        connection.off("NuevoRegistro");
        connection.off("RegistroActualizado");
        connection.off("PedidoActualizado");
        connection.off("RegistroArchivado");
        connection.off("RegistroEliminado");
        connection.off("onreconnected");
      };
    }
  }, [
    connection,
    isConnected,
    onPedidoActualizado,
    onNuevoPedido,
    unirseAGrupos,
  ]);

  const unirseAPedido = async (pedidoId: number) => {
    if (connection && isConnected) {
      try {
        await connection.invoke("UnirseAPedido", pedidoId);
        console.log(`Unido al pedido ${pedidoId}`);
      } catch (error) {
        console.error("Error uniéndose al pedido:", error);
      }
    }
  };

  const salirDePedido = async (pedidoId: number) => {
    if (connection && isConnected) {
      try {
        await connection.invoke("SalirDePedido", pedidoId);
        console.log(`Salido del pedido ${pedidoId}`);
      } catch (error) {
        console.error("Error saliendo del pedido:", error);
      }
    }
  };

  // Función para enviar actualizaciones al servidor
  const enviarActualizacion = async (pedidoId: number, datos: any) => {
    if (connection && isConnected) {
      try {
        await connection.invoke("ActualizarPedido", pedidoId, datos);
        console.log(`Actualización enviada para pedido ${pedidoId}`);
      } catch (error) {
        console.error("Error enviando actualización:", error);
      }
    }
  };

  // Función para notificar recolección de productos
  const notificarRecoleccion = async (
    pedidoId: number,
    itemId: string,
    recolectado: boolean
  ) => {
    if (connection && isConnected) {
      try {
        await connection.invoke(
          "NotificarRecoleccion",
          pedidoId,
          itemId,
          recolectado
        );
        console.log(
          `Recolección notificada para item ${itemId} del pedido ${pedidoId}`
        );
      } catch (error) {
        console.error("Error notificando recolección:", error);
      }
    }
  };

  return {
    isConnected,
    unirseAPedido,
    salirDePedido,
    enviarActualizacion,
    notificarRecoleccion,
  };
};
