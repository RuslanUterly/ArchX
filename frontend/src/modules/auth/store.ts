import { create } from 'zustand';
import { persist } from "zustand/middleware";
import { getRolesFromToken, isTokenValid } from "./utils/ckeckToken.ts";

interface AuthState {
    accessToken: string | null;
    setToken: (token: string | null) => void;
    roles: string[];
    isAuthenticated: boolean;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            roles: [],
            isAuthenticated: false,

            setToken: (token) => {
                if (!token || !isTokenValid(token)) {
                    set({
                        accessToken: null,
                        roles: [],
                        isAuthenticated: false,
                    });
                    return;
                }
                const roles = getRolesFromToken(token);
                set({
                    accessToken: token,
                    roles,
                    isAuthenticated: true,
                });
            },

            logout: () =>
                set({
                    accessToken: null,
                    roles: [],
                    isAuthenticated: false,
                }),
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({ accessToken: state.accessToken }),
            merge: (persisted, current) => {
                const p = persisted as { accessToken?: string | null } | undefined;
                const token = p?.accessToken;
                if (!token || !isTokenValid(token)) {
                    return { ...current, accessToken: null, roles: [], isAuthenticated: false };
                }
                return {
                    ...current,
                    accessToken: token,
                    roles: getRolesFromToken(token),
                    isAuthenticated: true,
                };
            },
        }
    )
);

