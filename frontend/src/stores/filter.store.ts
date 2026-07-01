import { create } from "zustand";

interface FilterState {
  month: number;
  year: number;
  selectedUserId: string | undefined;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
  setSelectedUserId: (userId: string | undefined) => void;
  resetToCurrentMonth: () => void;
}

const now = new Date();

export const useFilterStore = create<FilterState>((set) => ({
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  selectedUserId: undefined,
  setMonth: (month) => set({ month }),
  setYear: (year) => set({ year }),
  setSelectedUserId: (userId) => set({ selectedUserId: userId }),
  resetToCurrentMonth: () =>
    set({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    }),
}));
