// hooks/use-signalr.ts
import { useState, useEffect, useRef } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import { EnvConfig } from "@/utils/constants/env.config";

export const useSignalR = (url: string) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);

  const { hubs: apiUrl } = EnvConfig();
  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${apiUrl || ""}${url}`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connectionRef.current = newConnection;
    setConnection(newConnection);

    newConnection
      .start()
      .then(() => {
        console.log("SignalR Connected");
        setIsConnected(true);
      })
      .catch((error) => {
        console.error("SignalR Connection Error:", error);
        setIsConnected(false);
      });

    newConnection.onclose(() => {
      console.log("SignalR Disconnected");
      setIsConnected(false);
    });

    newConnection.onreconnected(() => {
      console.log("SignalR Reconnected");
      setIsConnected(true);
    });

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [url]);

  return { connection, isConnected };
};
