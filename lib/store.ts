import { configureStore } from "@reduxjs/toolkit"
import authSlice from "./features/auth/authSlice"
import membersSlice from "./features/members/membersSlice"
import plansSlice from "./features/plans/plansSlice"
import routinesSlice from "./features/routines/routinesSlice"
import performanceSlice from "./features/performance/performanceSlice"
import accessSlice from "./features/access/accessSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    members: membersSlice,
    plans: plansSlice,
    routines: routinesSlice,
    performance: performanceSlice,
    access: accessSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
