// signalr-pedidos.ts
import { useSignalR } from "@/hooks/use-signalr";
import { useEffect, useCallback } from "react";

export const usePedidosSignalR = (
  onPedidoActualizado: (pedido: any) => void,
  onNuevoPedido: (pedido: any) => void,
  onPedidoEliminado: (pedidoId: number) => void,
  onRefrescarDatos: () => void
) => {
  const { connection, isConnected } = useSignalR("Hubs");

  const unirseAGrupos = useCallback(async () => {
    if (connection && isConnected) {
      try {
        // ✅ USAR LOS MÉTODOS DISPONIBLES EN EL HUB
        await connection.invoke("AddToGroup", "PedidosGeneral");
        console.log("Conectado al grupo general de pedidos");
      } catch (error) {
        console.error("Error uniéndose a grupos:", error);
      }
    }
  }, [connection, isConnected]);

  useEffect(() => {
    if (connection && isConnected) {
      unirseAGrupos();

      // ✅ ESCUCHAR LOS EVENTOS QUE EL HUB ENVÍA
      connection.on("ReceiveListasUpdate", (action: string, data: any) => {
        console.log(`📋 Actualización de lista: ${action}`, data);
        onRefrescarDatos();
      });

      // ✅ ESCUCHAR EVENTOS GENÉRICOS DE CLIENTES Y CITAS (por si afectan pedidos)
      connection.on("ReceiveClientesUpdate", (action: string, data: any) => {
        console.log(`👤 Actualización de cliente: ${action}`, data);
        // Si un cliente se actualiza, podría afectar pedidos relacionados
        // Forzar refresh después de un breve delay
        onRefrescarDatos();
      });

      connection.on("ReceiveCitasUpdate", (action: string, data: any) => {
        console.log(`📅 Actualización de cita: ${action}`, data);
        // Las citas pueden estar relacionadas con pedidos
        onRefrescarDatos();
      });

      // ✅ MANEJAR RECONEXIÓN
      connection.onreconnected(() => {
        console.log("🔌 SignalR reconectado, resincronizando...");
        unirseAGrupos();
        onRefrescarDatos();
      });

      connection.onclose(() => {
        console.log("🔴 SignalR desconectado");
      });

      return () => {
        // Limpiar listeners
        connection.off("ReceiveListasUpdate");
        connection.off("ReceiveClientesUpdate");
        connection.off("ReceiveCitasUpdate");
      };
    }
  }, [
    connection,
    isConnected,
    onPedidoActualizado,
    onNuevoPedido,
    onPedidoEliminado,
    onRefrescarDatos,
    unirseAGrupos,
  ]);

  const unirseAPedido = async (pedidoId: number) => {
    if (connection && isConnected) {
      try {
        // ✅ USAR EL MÉTODO DEL HUB PARA UNIRSE A PEDIDOS ESPECÍFICOS
        await connection.invoke("UnirseAPedido", pedidoId);
        console.log(`🔗 Unido al pedido ${pedidoId}`);
      } catch (error) {
        console.error("Error uniéndose al pedido:", error);
      }
    }
  };

  const salirDePedido = async (pedidoId: number) => {
    if (connection && isConnected) {
      try {
        // ✅ USAR EL MÉTODO DEL HUB PARA SALIR DE PEDIDOS
        await connection.invoke("SalirDePedido", pedidoId);
        console.log(`🔓 Salido del pedido ${pedidoId}`);
      } catch (error) {
        console.error("Error saliendo del pedido:", error);
      }
    }
  };

  // ✅ NUEVO: Notificar cambios usando los métodos del hub
  const notificarCambioLista = async (action: string, data: any) => {
    if (connection && isConnected) {
      try {
        await connection.invoke("NotifyListasChanged", action, data);
        console.log(`📢 Cambio en lista notificado: ${action}`, data);
      } catch (error) {
        console.error("Error notificando cambio de lista:", error);
      }
    }
  };

  return {
    connection,
    isConnected,
    unirseAPedido,
    salirDePedido,
    notificarCambioLista, // ✅ Exportar para notificar cambios
  };
};
