import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

import { api } from "@/hooks/reducers/api";
import { api_int } from "@/hooks/reducers/api_int";
import { api_test } from "@/app/reporteria/hooks/useMasivoQuery";
import { authApi } from "@/hooks/reducers/auth";
import { EnvConfig } from "@/utils/constants/env.config";

import dropDownReducer from "@/hooks/reducers/drop-down";
import filterData from "@/hooks/reducers/filter";

import cartReducer from "@/hooks/slices/cart";
import appReducer from "@/hooks/slices/app";

const config = EnvConfig();
export const store = configureStore({
  reducer: {
    dropDownReducer,
    filterData,
    cart: cartReducer,
    app: appReducer,
    [api.reducerPath]: api.reducer,
    [api_int.reducerPath]: api_int.reducer,
    [api_test.reducerPath]: api_test.reducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  devTools: config.mode !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignora estas rutas específicas
        ignoredPaths: ["dropDownReducer.alert.action"],
        // Ignora estas acciones específicas
        ignoredActions: ["dropDown/openAlertReducer"],
      },
    }).concat([
      api.middleware,
      api_int.middleware,
      api_test.middleware,
      authApi.middleware,
    ]),
});

setupListeners(store.dispatch);

export interface Auth {
  mutations: Array<{
    data?: {
      token?: string;
    };
  }>;
}

export type RootState = ReturnType<typeof store.getState> & {
  auth: Auth;
};
export type AppDispatch = typeof store.dispatch;
