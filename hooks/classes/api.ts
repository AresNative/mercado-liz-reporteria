import { useEffect, useRef } from "react";
import { useGetWithFiltersIntelisisMutation } from "@/hooks/api/api_int";
import {
  RequestManager,
  RequestPayload,
  GetDataFunction,
} from "./request-manager";

export type { RequestPayload, GetDataFunction };
export { RequestManager as ManagmentRead };

export function useManagmentRead(): [RequestManager, boolean] {
  const [getData, { isLoading }] = useGetWithFiltersIntelisisMutation();
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

  return [managerRef.current!, isLoading];
}

export function useManagmentSearch(): [RequestManager, boolean] {
  const [getData, { isLoading }] = useGetWithFiltersIntelisisMutation();
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

  return [managerRef.current!, isLoading];
}
