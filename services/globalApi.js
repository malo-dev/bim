import { createSlice } from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist";

const initialState = {
  sectors: [],
  selectedBusinessId: undefined,
  isHydrated: false, 
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setSectors: (state, action) => {
      state.sectors = action.payload;
    },
    addSector: (state, action) => {
      state.sectors.push(action.payload);
    },
    updateSector: (state, action) => {
      const index = state.sectors.findIndex(
        (s) => s.businessId === action.payload.businessId
      );
      if (index !== -1) state.sectors[index] = action.payload;
    },
    removeSector: (state, action) => {
      state.sectors = state.sectors.filter(
        (s) => s.businessId !== action.payload
      );
    },
    setSelectedBusinessId: (state, action) => {
      state.selectedBusinessId = action.payload;
    },
    resetGlobal: (state) => {
      state.sectors = [];
      state.selectedBusinessId = undefined;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state) => {
      state.isHydrated = true;
    });
  },
});

export const {
  setSectors,
  addSector,
  updateSector,
  removeSector,
  setSelectedBusinessId,
  resetGlobal,
} = globalSlice.actions;

export default globalSlice.reducer;
