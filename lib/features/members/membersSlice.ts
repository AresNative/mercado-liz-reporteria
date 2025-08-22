import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  membershipType: string;
  status: "active" | "inactive" | "suspended";
  profileImage?: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
  medicalInfo?: string;
  birthDate?: string;
  address?: string;
  paymentStatus: "paid" | "pending" | "overdue";
  nextPaymentDate: string;
}

interface MembersState {
  members: Member[];
  loading: boolean;
  error: string | null;
  selectedMember: Member | null;
  searchTerm: string;
  statusFilter: "all" | "active" | "inactive" | "suspended";
}

const initialState: MembersState = {
  members: [],
  loading: false,
  error: null,
  selectedMember: null,
  searchTerm: "",
  statusFilter: "all",
};

export const fetchMembers = createAsyncThunk(
  "members/fetchMembers",
  async (_, { rejectWithValue }) => {
    try {
      const membersRef = collection(db, "members");
      const q = query(membersRef, orderBy("joinDate", "desc"));
      const querySnapshot = await getDocs(q);

      const members: Member[] = [];
      querySnapshot.forEach((doc) => {
        members.push({ id: doc.id, ...doc.data() } as Member);
      });

      return members;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createMember = createAsyncThunk(
  "members/createMember",
  async (memberData: Omit<Member, "id">, { rejectWithValue }) => {
    try {
      const membersRef = collection(db, "members");
      const docRef = await addDoc(membersRef, memberData);
      return { id: docRef.id, ...memberData };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMemberData = createAsyncThunk(
  "members/updateMember",
  async (member: Member, { rejectWithValue }) => {
    try {
      const memberRef = doc(db, "members", member.id);
      await updateDoc(memberRef, { ...member });
      return member;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteMemberData = createAsyncThunk(
  "members/deleteMember",
  async (memberId: string, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, "members", memberId));
      return memberId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const membersSlice = createSlice({
  name: "members",
  initialState,
  reducers: {
    setSelectedMember: (state, action: PayloadAction<Member | null>) => {
      state.selectedMember = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setStatusFilter: (
      state,
      action: PayloadAction<"all" | "active" | "inactive" | "suspended">
    ) => {
      state.statusFilter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch members
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create member
      .addCase(createMember.fulfilled, (state, action) => {
        state.members.unshift(action.payload);
      })
      // Update member
      .addCase(updateMemberData.fulfilled, (state, action) => {
        const index = state.members.findIndex(
          (m) => m.id === action.payload.id
        );
        if (index !== -1) {
          state.members[index] = action.payload;
        }
      })
      // Delete member
      .addCase(deleteMemberData.fulfilled, (state, action) => {
        state.members = state.members.filter((m) => m.id !== action.payload);
      });
  },
});

export const { setSelectedMember, setSearchTerm, setStatusFilter, clearError } =
  membersSlice.actions;
export default membersSlice.reducer;
