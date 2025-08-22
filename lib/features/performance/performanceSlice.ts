import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface PerformanceRecord {
  id: string
  memberId: string
  memberName: string
  date: string
  weight: number
  bodyFat?: number
  muscleMass?: number
  measurements: {
    chest?: number
    waist?: number
    hips?: number
    arms?: number
    thighs?: number
    neck?: number
  }
  workoutData: {
    duration: number
    caloriesBurned: number
    exercisesCompleted: number
    averageHeartRate?: number
  }
  notes?: string
  photos?: string[]
}

export interface ExerciseProgress {
  id: string
  memberId: string
  exerciseName: string
  date: string
  sets: number
  reps: number
  weight: number
  oneRepMax?: number
  volume: number // sets * reps * weight
}

interface PerformanceState {
  records: PerformanceRecord[]
  exerciseProgress: ExerciseProgress[]
  loading: boolean
  error: string | null
  selectedMemberId: string | null
  dateRange: {
    start: string
    end: string
  }
}

const initialState: PerformanceState = {
  records: [],
  exerciseProgress: [],
  loading: false,
  error: null,
  selectedMemberId: null,
  dateRange: {
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 90 days ago
    end: new Date().toISOString().split("T")[0], // today
  },
}

export const fetchPerformanceRecords = createAsyncThunk(
  "performance/fetchRecords",
  async (memberId?: string, { rejectWithValue }) => {
    try {
      const recordsRef = collection(db, "performanceRecords")
      let q = query(recordsRef, orderBy("date", "desc"))

      if (memberId) {
        q = query(recordsRef, where("memberId", "==", memberId), orderBy("date", "desc"))
      }

      const querySnapshot = await getDocs(q)
      const records: PerformanceRecord[] = []
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as PerformanceRecord)
      })

      return records
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const fetchExerciseProgress = createAsyncThunk(
  "performance/fetchExerciseProgress",
  async (memberId?: string, { rejectWithValue }) => {
    try {
      const progressRef = collection(db, "exerciseProgress")
      let q = query(progressRef, orderBy("date", "desc"))

      if (memberId) {
        q = query(progressRef, where("memberId", "==", memberId), orderBy("date", "desc"))
      }

      const querySnapshot = await getDocs(q)
      const progress: ExerciseProgress[] = []
      querySnapshot.forEach((doc) => {
        progress.push({ id: doc.id, ...doc.data() } as ExerciseProgress)
      })

      return progress
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const createPerformanceRecord = createAsyncThunk(
  "performance/createRecord",
  async (recordData: Omit<PerformanceRecord, "id">, { rejectWithValue }) => {
    try {
      const recordsRef = collection(db, "performanceRecords")
      const docRef = await addDoc(recordsRef, recordData)
      return { id: docRef.id, ...recordData }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

export const createExerciseProgress = createAsyncThunk(
  "performance/createExerciseProgress",
  async (progressData: Omit<ExerciseProgress, "id">, { rejectWithValue }) => {
    try {
      const progressRef = collection(db, "exerciseProgress")
      const docRef = await addDoc(progressRef, progressData)
      return { id: docRef.id, ...progressData }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  },
)

const performanceSlice = createSlice({
  name: "performance",
  initialState,
  reducers: {
    setSelectedMemberId: (state, action: PayloadAction<string | null>) => {
      state.selectedMemberId = action.payload
    },
    setDateRange: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.dateRange = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch performance records
      .addCase(fetchPerformanceRecords.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPerformanceRecords.fulfilled, (state, action) => {
        state.loading = false
        state.records = action.payload
      })
      .addCase(fetchPerformanceRecords.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch exercise progress
      .addCase(fetchExerciseProgress.fulfilled, (state, action) => {
        state.exerciseProgress = action.payload
      })
      // Create performance record
      .addCase(createPerformanceRecord.fulfilled, (state, action) => {
        state.records.unshift(action.payload)
      })
      // Create exercise progress
      .addCase(createExerciseProgress.fulfilled, (state, action) => {
        state.exerciseProgress.unshift(action.payload)
      })
  },
})

export const { setSelectedMemberId, setDateRange, clearError } = performanceSlice.actions
export default performanceSlice.reducer
