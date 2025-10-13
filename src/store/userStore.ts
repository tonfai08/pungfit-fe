"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api"; // ✅ ใช้ api ที่มี interceptor แล้ว

interface UserProfile {
  email?: string;
  weight?: number;
  height?: number;
  bodyFat?: number;
}

interface UserState {
  token: string | null;
  profile: UserProfile | null;
  loading: boolean;
  hydrated: boolean; 
  setToken: (token: string | null) => void;
  fetchProfile: () => Promise<void>;
  setHydrated: (value: boolean) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      token: null,
      profile: null,
      loading: false,
      hydrated: false, 

      setToken: (token) => set({ token }),

      fetchProfile: async () => {
        const token = get().token;
        if (!token) return;

        set({ loading: true });
        try {
          const res = await api.get("api/users/me"); // ✅ ใช้ api
          set({ profile: res.data });
        } catch (err) {
          console.error("❌ Failed to fetch profile:", err);
          set({ token: null, profile: null }); // token หมดอายุ → ล้าง
        } finally {
          set({ loading: false });
        }
      },

      clear: () => set({ token: null, profile: null }),
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "user-storage",
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
