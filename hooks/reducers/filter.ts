import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FilterProps {
  value: string;
  key: string;
  type: "form" | "grafic" | "multi";
}
interface FilterState {
  [key: string]: {
    type: "form" | "grafic" | "multi";
    value: string;
  };
}
const initialState: FilterState = {};

export const filterData = createSlice({
  name: "filterData",
  initialState,
  reducers: {
    dataFilter: (state, action: PayloadAction<FilterProps>) => {
      const { key, value, type } = action.payload;
      state[key] = { type, value };
      return state;
    },
    searchData: (state, action: PayloadAction<string>) => {
      const searchKey = "search";
      state[searchKey] = { type: "form", value: action.payload };
      return state;
    },
    clearFilters: () => {
      return initialState;
    },
  },
});

export const { dataFilter, searchData, clearFilters } = filterData.actions;

export default filterData.reducer;
