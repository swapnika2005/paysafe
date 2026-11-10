import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:        null,
      accessToken: null,   
      isLoggedIn:  false,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isLoggedIn: true }),

      setAccessToken: (accessToken) =>
        set({ accessToken }),

      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),

      logout: () =>
        set({ user: null, accessToken: null, isLoggedIn: false }),

      getToken: () => get().accessToken,
    }),

    {
      name: "safepay-auth",   

      
      partialize: (state) => ({
        user:      state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);

export default useAuthStore;