import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AppState = {
  userFingerprint: string;
  conservativeMode: boolean;
  setConservativeMode: (enabled: boolean) => void;
};

function createUserFingerprint() {
  return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userFingerprint: createUserFingerprint(),
      conservativeMode: true,
      setConservativeMode: (enabled) => set({ conservativeMode: enabled }),
    }),
    {
      name: "ai-content-guardian",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
