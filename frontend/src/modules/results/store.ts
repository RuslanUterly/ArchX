import { create } from "zustand";
import type { SessionCompleteResponse } from "../architectureDecision/api.ts";
import { fetchLatestSession, fetchSessionsPage } from "./api.ts";

interface ResultsState {
    latestSession: SessionCompleteResponse | null;
    sessions: SessionCompleteResponse[];
    totalCount: number;
    page: number;
    latestLoading: boolean;
    listLoading: boolean;
    latestError: string | null;
    listError: string | null;

    loadLatest: () => Promise<void>;
    loadList: () => Promise<void>;
    setPage: (page: number) => void;
}

export const useResultsStore = create<ResultsState>((set, get) => ({
    latestSession: null,
    sessions: [],
    totalCount: 0,
    page: 1,
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
        const { page } = get();
        set({ listLoading: true, listError: null });
        try {
            const r = await fetchSessionsPage(page);
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

    setPage: (page: number) => {
        set({ page });
        void get().loadList();
    },
}));
