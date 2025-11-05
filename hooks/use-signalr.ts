// hooks/use-signalr.ts
import { useState, useEffect, useRef } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
} from "@microsoft/signalr";

import { EnvConfig } from "@/utils/constants/env.config";

export const useSignalR = (url: string) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);

  const { hubs: apiUrl } = EnvConfig();

  useEffect(() => {
    let isMounted = true;

    // If there's an existing connection that is Connecting/Connected/Reconnecting, don't create another
    if (
      connectionRef.current &&
      (connectionRef.current.state === HubConnectionState.Connected ||
        connectionRef.current.state === HubConnectionState.Connecting ||
        connectionRef.current.state === HubConnectionState.Reconnecting)
    ) {
      return;
    }

    const newConnection = new HubConnectionBuilder()
      .withUrl(`${apiUrl || ""}${url}`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connectionRef.current = newConnection;
    setConnection(newConnection);

    (async () => {
      try {
        await newConnection.start();

        // If unmounted while starting, stop the connection and exit to avoid race errors
        if (!isMounted) {
          await newConnection.stop().catch(() => {});
          return;
        }

        setIsConnected(true);
      } catch (err) {
        if (!isMounted) return;
        setIsConnected(false);

        // Ensure failed connection is cleaned up
        try {
          await newConnection.stop();
        } catch {}
      }
    })();

    newConnection.onclose(() => {
      setIsConnected(false);
    });

    newConnection.onreconnecting(() => {
      setIsConnected(false);
    });

    newConnection.onreconnected(() => {
      setIsConnected(true);
    });

    return () => {
      isMounted = false;
      if (connectionRef.current === newConnection) {
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
      }
    };
  }, [url, apiUrl]);

  return { connection, isConnected };
};
