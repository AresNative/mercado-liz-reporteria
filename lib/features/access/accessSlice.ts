import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AccessRecord {
  id: string;
  memberId: string;
  memberName: string;
  membershipStatus: "active" | "expired" | "suspended";
  checkInTime: string;
  checkOutTime?: string;
  duration?: number; // in minutes
  date: string;
  accessMethod: "qr" | "manual" | "card";
}

interface AccessState {
  records: AccessRecord[];
  currentlyInGym: AccessRecord[];
  loading: boolean;
  error: string | null;
  dailyStats: {
    totalVisits: number;
    currentOccupancy: number;
    peakHour: string;
  };
}

const initialState: AccessState = {
  records: [],
  currentlyInGym: [],
  loading: false,
  error: null,
  dailyStats: {
    totalVisits: 0,
    currentOccupancy: 0,
    peakHour: "00:00",
  },
};

const accessSlice = createSlice({
  name: "access",
  initialState,
  reducers: {
    checkIn: (
      state,
      action: PayloadAction<{
        memberId: string;
        memberName: string;
        membershipStatus: "active" | "expired" | "suspended";
        accessMethod: "qr" | "manual" | "card";
      }>
    ) => {
      if (action.payload.membershipStatus !== "active") {
        state.error = "Membresía no activa. Contacte recepción.";
        return;
      }

      const existingRecord = state.currentlyInGym.find(
        (r) => r.memberId === action.payload.memberId
      );
      if (existingRecord) {
        state.error = "El miembro ya está registrado en el gimnasio.";
        return;
      }

      const newRecord: AccessRecord = {
        id: Date.now().toString(),
        memberId: action.payload.memberId,
        memberName: action.payload.memberName,
        membershipStatus: action.payload.membershipStatus,
        checkInTime: new Date().toISOString(),
        date: new Date().toDateString(),
        accessMethod: action.payload.accessMethod,
      };
      state.records.push(newRecord);
      state.currentlyInGym.push(newRecord);
      state.dailyStats.totalVisits += 1;
      state.dailyStats.currentOccupancy = state.currentlyInGym.length;
      state.error = null;
    },
    checkOut: (state, action: PayloadAction<string>) => {
      const recordIndex = state.records.findIndex(
        (r) => r.memberId === action.payload && !r.checkOutTime
      );
      const currentIndex = state.currentlyInGym.findIndex(
        (r) => r.memberId === action.payload
      );

      if (recordIndex !== -1) {
        const checkOutTime = new Date().toISOString();
        const checkInTime = new Date(state.records[recordIndex].checkInTime);
        const duration = Math.floor(
          (new Date(checkOutTime).getTime() - checkInTime.getTime()) /
            (1000 * 60)
        );

        state.records[recordIndex].checkOutTime = checkOutTime;
        state.records[recordIndex].duration = duration;
      }

      if (currentIndex !== -1) {
        state.currentlyInGym.splice(currentIndex, 1);
      }

      state.dailyStats.currentOccupancy = state.currentlyInGym.length;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateDailyStats: (state) => {
      const today = new Date().toDateString();
      const todayRecords = state.records.filter((r) => r.date === today);

      state.dailyStats.totalVisits = todayRecords.length;
      state.dailyStats.currentOccupancy = state.currentlyInGym.length;

      // Calculate peak hour
      const hourCounts: { [key: string]: number } = {};
      todayRecords.forEach((record) => {
        const hour = new Date(record.checkInTime).getHours();
        const hourKey = `${hour.toString().padStart(2, "0")}:00`;
        hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
      });

      const peakHour =
        hourCounts.length === 0
          ? "00:00"
          : Object.entries(hourCounts).reduce((a, b) =>
              hourCounts[a[0]] > hourCounts[b[0]] ? a : b
            )?.[0] || "00:00";

      state.dailyStats.peakHour = peakHour;
    },
  },
});

export const { checkIn, checkOut, setLoading, clearError, updateDailyStats } =
  accessSlice.actions;
export default accessSlice.reducer;
