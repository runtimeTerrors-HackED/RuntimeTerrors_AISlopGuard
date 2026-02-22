import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AppState = {
  userFingerprint: string;
  conservativeMode: boolean;
  setConservativeMode: (enabled: boolean) => void;
  themeMode: "system" | "light" | "dark";
  setThemeMode: (mode: "system" | "light" | "dark") => void;
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
      themeMode: "system",
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: "ai-content-guardian",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
