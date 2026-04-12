import { create } from "zustand";
import type { SessionCompleteResponse } from "../architectureDecision/api.ts";
import { fetchLatestSession, fetchSessionsPage, setSessionHidden } from "./api.ts";

interface ResultsState {
    latestSession: SessionCompleteResponse | null;
    sessions: SessionCompleteResponse[];
    totalCount: number;
    page: number;
    filters: Record<string, string>;
    latestLoading: boolean;
    listLoading: boolean;
    latestError: string | null;
    listError: string | null;

    loadLatest: () => Promise<void>;
    loadList: () => Promise<void>;
    setFilters: (filters: Record<string, string>) => Promise<void>;
    setFilter: (field: string, value: string) => Promise<void>;
    removeFilter: (field: string) => Promise<void>;
    setPage: (page: number) => void;
    toggleSessionHidden: (sessionId: number, isHidden: boolean) => Promise<void>;
}

export const useResultsStore = create<ResultsState>((set, get) => ({
    latestSession: null,
    sessions: [],
    totalCount: 0,
    page: 1,
    filters: {},
    latestLoading: false,
    listLoading: false,
    latestError: null,
    listError: null,

    loadLatest: async () => {
        set({ latestLoading: true, latestError: null });
        try {
            const r = await fetchLatestSession();
            set({ latestSession: r.items[0] ?? null });
        } catch (e) {
            set({
                latestError:
                    e instanceof Error ? e.message : "Ошибка загрузки последней сессии",
            });
        } finally {
            set({ latestLoading: false });
        }
    },

    loadList: async () => {
        const { page, filters } = get();
        set({ listLoading: true, listError: null });
        try {
            const r = await fetchSessionsPage(page, filters);
            set({ sessions: r.items, totalCount: r.totalCount });
        } catch (e) {
            set({
                listError:
                    e instanceof Error ? e.message : "Ошибка загрузки списка сессий",
            });
        } finally {
            set({ listLoading: false });
        }
    },

    setFilters: async (filters) => {
        set({ filters, page: 1 });
        await get().loadList();
    },

    setFilter: async (field, value) => {
        const trimmedField = field.trim();
        const trimmedValue = value.trim();
        const nextFilters = { ...get().filters };

        if (!trimmedField) return;

        if (!trimmedValue) {
            delete nextFilters[trimmedField];
        } else {
            nextFilters[trimmedField] = trimmedValue;
        }

        set({ filters: nextFilters, page: 1 });
        await get().loadList();
    },

    removeFilter: async (field) => {
        const trimmedField = field.trim();
        if (!trimmedField) return;

        const nextFilters = { ...get().filters };
        delete nextFilters[trimmedField];

        set({ filters: nextFilters, page: 1 });
        await get().loadList();
    },

    setPage: (page: number) => {
        set({ page });
        void get().loadList();
    },

    toggleSessionHidden: async (sessionId, isHidden) => {
        await setSessionHidden(sessionId, isHidden);
        await get().loadLatest();
        await get().loadList();
    },
}));
