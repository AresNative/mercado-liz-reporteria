import { useCallback, useState } from "react";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";

/**
 * Encapsula el patrón repetido "useState(false) + dispatch(openModalReducer)"
 * y controla si el contenido pesado del modal debe montarse o no.
 * Una vez montado se queda montado (evita perder estado interno al cerrar),
 * pero nunca se monta antes de la primera apertura.
 */
export function useModalTrigger(modalName: string) {
  const [mounted, setMounted] = useState(false);
  const dispatch = useAppDispatch();

  const open = useCallback(() => {
    setMounted(true);
    dispatch(openModalReducer({ modalName }));
  }, [dispatch, modalName]);

  return { mounted, open } as const;
}
