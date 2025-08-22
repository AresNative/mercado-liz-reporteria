import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface Plan {
  id: string
  name: string
  description: string
  price: number
  duration: number // in months
  features: string[]
  isActive: boolean
  color: string
}

interface PlansState {
  plans: Plan[]
  loading: boolean
  error: string | null
}

const initialState: PlansState = {
  plans: [
    {
      id: "1",
      name: "Plan Básico",
      description: "Acceso al gimnasio y equipos básicos",
      price: 29.99,
      duration: 1,
      features: ["Acceso al gimnasio", "Equipos básicos", "Vestuarios"],
      isActive: true,
      color: "#0891b2",
    },
    {
      id: "2",
      name: "Plan Premium",
      description: "Acceso completo + clases grupales",
      price: 49.99,
      duration: 1,
      features: ["Todo del plan básico", "Clases grupales", "Sauna", "Nutricionista"],
      isActive: true,
      color: "#f59e0b",
    },
    {
      id: "3",
      name: "Plan VIP",
      description: "Acceso total + entrenador personal",
      price: 89.99,
      duration: 1,
      features: ["Todo del plan premium", "Entrenador personal", "Masajes", "Parking"],
      isActive: true,
      color: "#dc2626",
    },
  ],
  loading: false,
  error: null,
}

const plansSlice = createSlice({
  name: "plans",
  initialState,
  reducers: {
    addPlan: (state, action: PayloadAction<Plan>) => {
      state.plans.push(action.payload)
    },
    updatePlan: (state, action: PayloadAction<Plan>) => {
      const index = state.plans.findIndex((p) => p.id === action.payload.id)
      if (index !== -1) {
        state.plans[index] = action.payload
      }
    },
    removePlan: (state, action: PayloadAction<string>) => {
      state.plans = state.plans.filter((p) => p.id !== action.payload)
    },
  },
})

export const { addPlan, updatePlan, removePlan } = plansSlice.actions
export default plansSlice.reducer
