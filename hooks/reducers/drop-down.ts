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
  modalStack: string[]; // nuevo
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
  modalStack: [],
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
      const { modalName } = action.payload;
      if (!state.modals[modalName]) {
        state.modals[modalName] = true;
        state.modalStack.push(modalName);
      }
    },
    closeModalReducer: (
      state,
      action: PayloadAction<{ modalName: string }>,
    ) => {
      const { modalName } = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName] = false;
        state.modalStack = state.modalStack.filter(
          (name) => name !== modalName,
        );
      }
    },
    toggleModalReducer: (
      state,
      action: PayloadAction<{ modalName: string }>,
    ) => {
      const { modalName } = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName] = false;
        state.modalStack = state.modalStack.filter(
          (name) => name !== modalName,
        );
      } else {
        state.modals[modalName] = true;
        state.modalStack.push(modalName);
      }
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
