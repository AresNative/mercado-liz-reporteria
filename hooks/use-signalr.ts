// hooks/use-signalr.ts
import { useEffect, useRef, useState } from "react";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";

export const useSignalR = (hubUrl: string) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    const connect = async () => {
      try {
        const newConnection = new HubConnectionBuilder()
          .withUrl(`${process.env.NEXT_PUBLIC_API_URL}${hubUrl}`)
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) => {
              // Reintentar después de 2, 5, 10 segundos...
              return Math.min(
                10000,
                retryContext.previousRetryCount * 2000 + 2000
              );
            },
          })
          .build();

        await newConnection.start();

        setConnection(newConnection);
        connectionRef.current = newConnection;
        setIsConnected(true);

        console.log("SignalR Connected to:", hubUrl);

        // Manejar reconexión
        newConnection.onreconnected(() => {
          console.log("SignalR reconnected");
          setIsConnected(true);
        });

        newConnection.onreconnecting((error) => {
          console.log("SignalR reconnecting:", error);
          setIsConnected(false);
        });

        newConnection.onclose((error) => {
          console.log("SignalR connection closed:", error);
          setIsConnected(false);
        });
      } catch (error) {
        console.error("SignalR Connection Error:", error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        setConnection(null);
        setIsConnected(false);
      }
    };
  }, [hubUrl]);

  return { connection, isConnected };
};
