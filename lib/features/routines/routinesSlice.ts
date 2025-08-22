import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  weight?: number
  duration?: number // for cardio in minutes
  restTime: number // in seconds
  notes?: string
  category: "strength" | "cardio" | "flexibility" | "functional"
  muscleGroups: string[]
}

export interface Routine {
  id: string
  name: string
  description: string
  memberId: string
  memberName: string
  trainerId: string
  trainerName: string
  exercises: Exercise[]
  createdAt: string
  updatedAt: string
  isActive: boolean
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedDuration: number // in minutes
  tags: string[]
}

interface RoutinesState {
  routines: Routine[]
  exercises: Exercise[]
  loading: boolean
  error: string | null
  selectedRoutine: Routine | null
  searchTerm: string
  difficultyFilter: "all" | "beginner" | "intermediate" | "advanced"
}

const initialState: RoutinesState = {
  routines: [],
  exercises: [],
  loading: false,
  error: null,
  selectedRoutine: null,
  searchTerm: "",
  difficultyFilter: "all",
}

export const fetchRoutines = createAsyncThunk("routines/fetchRoutines", async (_, { rejectWithValue }) => {
  try {
    const routinesRef = collection(db, "routines")
    const q = query(routinesRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    const routines: Routine[] = []
    querySnapshot.forEach((doc) => {
      routines.push({ id: doc.id, ...doc.data() } as Routine)
    })

    return routines
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

export const createRoutine = createAsyncThunk(
  "routines/createRoutine",
  async (routineData: Omit<Routine, "id">, { rejectWithValue }) => {
    try {
      const routinesRef = collection(db, "routines")
      const docRef = await addDoc(routinesRef, routineData)
      return { id: docRef.id, ...routineData }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const updateRoutineData = createAsyncThunk(
  "routines/updateRoutine",
  async (routine: Routine, { rejectWithValue }) => {
    try {
      const routineRef = doc(db, "routines", routine.id)
      await updateDoc(routineRef, { ...routine, updatedAt: new Date().toISOString() })
      return { ...routine, updatedAt: new Date().toISOString() }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const deleteRoutineData = createAsyncThunk(
  "routines/deleteRoutine",
  async (routineId: string, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, "routines", routineId))
      return routineId
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

const routinesSlice = createSlice({
  name: "routines",
  initialState,
  reducers: {
    setSelectedRoutine: (state, action: PayloadAction<Routine | null>) => {
      state.selectedRoutine = action.payload
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload
    },
    setDifficultyFilter: (state, action: PayloadAction<"all" | "beginner" | "intermediate" | "advanced">) => {
      state.difficultyFilter = action.payload
    },
    addExerciseToRoutine: (state, action: PayloadAction<{ routineId: string; exercise: Exercise }>) => {
      const routine = state.routines.find((r) => r.id === action.payload.routineId)
      if (routine) {
        routine.exercises.push(action.payload.exercise)
      }
    },
    removeExerciseFromRoutine: (state, action: PayloadAction<{ routineId: string; exerciseId: string }>) => {
      const routine = state.routines.find((r) => r.id === action.payload.routineId)
      if (routine) {
        routine.exercises = routine.exercises.filter((e) => e.id !== action.payload.exerciseId)
      }
    },
    updateExerciseInRoutine: (state, action: PayloadAction<{ routineId: string; exercise: Exercise }>) => {
      const routine = state.routines.find((r) => r.id === action.payload.routineId)
      if (routine) {
        const exerciseIndex = routine.exercises.findIndex((e) => e.id === action.payload.exercise.id)
        if (exerciseIndex !== -1) {
          routine.exercises[exerciseIndex] = action.payload.exercise
        }
      }
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch routines
      .addCase(fetchRoutines.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRoutines.fulfilled, (state, action) => {
        state.loading = false
        state.routines = action.payload
      })
      .addCase(fetchRoutines.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Create routine
      .addCase(createRoutine.fulfilled, (state, action) => {
        state.routines.unshift(action.payload)
      })
      // Update routine
      .addCase(updateRoutineData.fulfilled, (state, action) => {
        const index = state.routines.findIndex((r) => r.id === action.payload.id)
        if (index !== -1) {
          state.routines[index] = action.payload
        }
      })
      // Delete routine
      .addCase(deleteRoutineData.fulfilled, (state, action) => {
        state.routines = state.routines.filter((r) => r.id !== action.payload)
      })
  },
})

export const {
  setSelectedRoutine,
  setSearchTerm,
  setDifficultyFilter,
  addExerciseToRoutine,
  removeExerciseFromRoutine,
  updateExerciseInRoutine,
  clearError,
} = routinesSlice.actions
export default routinesSlice.reducer
