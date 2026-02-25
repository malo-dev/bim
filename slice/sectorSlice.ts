import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Company {
  companyId: number;
  name: string;
  description?: string;
  logo?: string;
  location?: string;
  email?: string;
  branchTrackId?: number | null;
  businessId: number;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessCategory {
  businessId: number;
  name: string;
  description?: string;
  logo?: string;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  companies: Company[];
}

interface GlobalState {
  sectors: BusinessCategory[]; // tous les objets dynamiques
  selectedBusinessId?: number; // business sélectionné dans l'UI
}

const initialState: GlobalState = {
  sectors: [],
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setSectors: (state, action: PayloadAction<BusinessCategory[]>) => {
      state.sectors = action.payload;
    },
    addSector: (state, action: PayloadAction<BusinessCategory>) => {
      state.sectors.push(action.payload);
    },
    updateSector: (state, action: PayloadAction<BusinessCategory>) => {
      const index = state.sectors.findIndex(
        (s) => s.businessId === action.payload.businessId
      );
      if (index !== -1) state.sectors[index] = action.payload;
    },
    removeSector: (state, action: PayloadAction<number>) => {
      state.sectors = state.sectors.filter(
        (s) => s.businessId !== action.payload
      );
    },
    setSelectedBusinessId: (state, action: PayloadAction<number>) => {
      state.selectedBusinessId = action.payload;
    },
    resetGlobal: (state) => {
      state.sectors = [];
      state.selectedBusinessId = undefined;
    },
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
