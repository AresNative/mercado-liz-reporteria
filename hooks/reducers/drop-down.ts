// drop-down.ts (slice actualizado)
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ModalState {
  [modalName: string]: boolean;
}

interface BaseAlertProps {
  title?: string;
  message: string;
  buttonText?: string;
  icon: "archivo" | "alert";
  type: "success" | "error" | "warning" | "completed" | "info";
  duration?: number;
  action?: (...args: any[]) => void;
}

export interface DropDowState {
  alert: BaseAlertProps;
  modals: ModalState;
  cuestionActivate: unknown;
}

const initialAlertState: BaseAlertProps = {
  title: "",
  message: "",
  buttonText: "",
  type: "completed",
  duration: 0,
  icon: "archivo",
  action: () => {},
};

const initialState: DropDowState = {
  alert: initialAlertState,
  modals: {},
  cuestionActivate: null,
};

export const dropDow = createSlice({
  name: "dropDown",
  initialState,
  reducers: {
    openAlertReducer: (state, action: PayloadAction<BaseAlertProps>) => {
      state.alert = {
        ...action.payload,
        duration: action.payload.duration ?? 3000,
      };
    },
    clearAlert: (state) => {
      state.alert = initialAlertState;
    },
    openModalReducer: (state, action: PayloadAction<{ modalName: string }>) => {
      // Solo maneja modales, no afecta alertas
      const { modalName } = action.payload;
      // Cierra otros modales antes de abrir uno nuevo
      Object.keys(state.modals).forEach((key) => {
        state.modals[key] = false;
      });
      state.modals[modalName] = true;
    },
    closeModalReducer: (
      state,
      action: PayloadAction<{ modalName: string }>
    ) => {
      const { modalName } = action.payload;
      state.modals[modalName] = false;
    },
    toggleModalReducer: (
      state,
      action: PayloadAction<{ modalName: string }>
    ) => {
      const { modalName } = action.payload;
      state.modals[modalName] = !state.modals[modalName];
    },
  },
});

export const {
  openAlertReducer,
  clearAlert,
  openModalReducer,
  closeModalReducer,
  toggleModalReducer,
} = dropDow.actions;

export default dropDow.reducer;
