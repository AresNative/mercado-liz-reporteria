// hooks/usePedidosSignalR.ts
import { useSignalR } from "@/hooks/use-signalr";
import { useEffect, useCallback } from "react";

export const usePedidosSignalR = (
  onPedidoActualizado: (pedido: any) => void,
  onNuevoPedido: (pedido: any) => void,
  onPedidoEliminado: (pedidoId: number) => void // ✅ NUEVO: callback para eliminaciones
) => {
  const { connection, isConnected } = useSignalR("Hubs");

  const unirseAGrupos = useCallback(async () => {
    if (connection && isConnected) {
      try {
        console.log("Conectado al hub general de pedidos");
      } catch (error) {
        console.error("Error uniéndose a grupos:", error);
      }
    }
  }, [connection, isConnected]);

  useEffect(() => {
    if (connection && isConnected) {
      unirseAGrupos();

      // Escuchar eventos del servidor
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

      // ✅ CORREGIDO: Manejar eliminaciones correctamente
      connection.on("RegistroEliminado", (data: any) => {
        console.log("Registro eliminado:", data);
        if (data.Tabla === "listas" || data.Tabla === "pedidos") {
          // Extraer el ID del pedido eliminado
          const pedidoId = data.DatosOriginales?.id || data.Id;
          if (pedidoId) {
            onPedidoEliminado(pedidoId);
          }
        }
      });

      connection.on("RegistroArchivado", (data: any) => {
        console.log("Registro archivado:", data);
        if (data.Tabla === "listas" || data.Tabla === "pedidos") {
          // Tratar como actualización con estado "archivado"
          onPedidoActualizado({
            ...data.DatosOriginales,
            estado: "archivado",
          });
        }
      });

      connection.on("DatosActualizados", (data: any) => {
        console.log("Datos actualizados:", data);
      });

      // Manejar reconexión
      connection.onreconnected(() => {
        console.log("SignalR reconectado");
        unirseAGrupos();
      });

      return () => {
        // Limpiar listeners
        connection.off("NuevoRegistro");
        connection.off("RegistroActualizado");
        connection.off("PedidoActualizado");
        connection.off("RegistroArchivado");
        connection.off("RegistroEliminado");
        connection.off("DatosActualizados");
      };
    }
  }, [
    connection,
    isConnected,
    onPedidoActualizado,
    onNuevoPedido,
    onPedidoEliminado, // ✅ Añadido a las dependencias
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

  return {
    isConnected,
    unirseAPedido,
    salirDePedido,
  };
};
