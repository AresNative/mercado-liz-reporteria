// hooks/classes/api-liz.ts
import { useRef, useEffect } from "react";
import { useGetWithFiltersMutation } from "../api/api";
import { RequestManager } from "./request-manager";

export function useManagmentWeb(): RequestManager {
  const [getData] = useGetWithFiltersMutation();
  const managerRef = useRef<RequestManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new RequestManager(getData);
  }

  useEffect(() => {
    const manager = managerRef.current;
    return () => {
      manager?.cancelAll();
    };
  }, []);

  return managerRef.current;
}
