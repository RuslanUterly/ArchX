import { create } from 'zustand';
import { persist } from "zustand/middleware";
import {isTokenValid} from "./utils/ckeckToken.ts";

interface AuthState {
    accessToken: string | null;
    setToken: (token: string | null) => void;
    isAuthenticated: boolean;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            isAuthenticated: false,

            setToken: (token) => {
                if (!isTokenValid(token ?? "")) {
                    set({ accessToken: null, isAuthenticated: false });
                    return;
                }

                set({ accessToken: token, isAuthenticated: true });
            },

            logout: () =>
                set({
                    accessToken: null,
                    isAuthenticated: false,
                }),
        }),
        {
            name: "auth-storage", // ключ для localStorage
            partialize: (state) => ({
                accessToken: state.accessToken,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                if (state?.accessToken && !isTokenValid(state.accessToken)) {
                    state.logout?.();
                }
            },
        }
    )
);

