import { useCallback, useState } from "react";
import { useAppDispatch } from "@/hooks/selector";
import { openModalReducer } from "@/hooks/reducers/drop-down";

export function useModalTrigger(modalName: string) {
  const [mounted, setMounted] = useState(false);
  const dispatch = useAppDispatch();

  const open = useCallback(() => {
    setMounted(true);
    dispatch(openModalReducer({ modalName }));
  }, [dispatch, modalName]);

  return { mounted, open } as const;
}
