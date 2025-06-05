import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AppState {
  sucursal: any | null;
  usuario: any | null;
  envio: any | null;
  cita: any | null;
}

const initialState: AppState = {
  sucursal: null,
  usuario: null,
  envio: null,
  cita: null,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setSucursal: (state, action: PayloadAction<any>) => {
      state.sucursal = action.payload;
    },
    setUsuario: (state, action: PayloadAction<any>) => {
      state.usuario = action.payload;
    },
    setEnvio: (state, action: PayloadAction<any>) => {
      state.envio = action.payload;
    },
    setCita: (state, action: PayloadAction<any>) => {
      state.cita = action.payload;
    },
    clearAll: (state) => {
      state.sucursal = null;
      state.usuario = null;
      state.envio = null;
      state.cita = null;
    },
  },
});

export const { setSucursal, setUsuario, setEnvio, setCita, clearAll } =
  appSlice.actions;

export default appSlice.reducer;
