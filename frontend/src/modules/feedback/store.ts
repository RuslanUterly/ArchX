import { create } from "zustand";
import { getSessions, type SessionCompleteResponse } from "../architectureDecision/api.ts";
import {
    createFeedback,
    FeedbackCategory,
    type FeedbackCategoryValue,
    getFeedbackById,
    queryFeedback,
    type FeedbackTicketDto,
} from "./api.ts";

interface FeedbackStore {
    items: FeedbackTicketDto[];
    listLoading: boolean;
    listError: string | null;

    sessions: SessionCompleteResponse[];
    sessionsLoading: boolean;

    createModalOpen: boolean;
    category: string;
    sessionId: string | null;
    subject: string;
    message: string;
    submitting: boolean;
    submitError: string | null;

    adminModalOpen: boolean;
    adminPrefetchedTicket: FeedbackTicketDto | null;
    adminOpeningTicketId: number | null;
    adminTicketOpenError: string | null;

    loadList: () => Promise<void>;
    loadSessions: () => Promise<void>;

    openCreateModal: () => void;
    closeCreateModal: () => void;
    setCategory: (value: string) => void;
    setSessionId: (value: string | null) => void;
    setSubject: (value: string) => void;
    setMessage: (value: string) => void;
    submitCreate: () => Promise<void>;

    openAdminTicket: (id: number) => Promise<void>;
    clearAdminTicketOpenError: () => void;
    closeAdminModal: () => void;
}

const resetCreateFormFields = () => ({
    category: String(FeedbackCategory.Suggestion),
    sessionId: null as string | null,
    subject: "",
    message: "",
    submitError: null as string | null,
});

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
    items: [],
    listLoading: false,
    listError: null,

    sessions: [],
    sessionsLoading: false,

    createModalOpen: false,
    ...resetCreateFormFields(),
    submitting: false,

    adminModalOpen: false,
    adminPrefetchedTicket: null,
    adminOpeningTicketId: null,
    adminTicketOpenError: null,

    loadList: async () => {
        set({ listLoading: true, listError: null });
        try {
            const res = await queryFeedback({ page: 1, pageSize: 100 });
            set({ items: res.items });
        } catch (e) {
            set({ listError: e instanceof Error ? e.message : "Ошибка загрузки" });
        } finally {
            set({ listLoading: false });
        }
    },

    loadSessions: async () => {
        set({ sessionsLoading: true });
        try {
            const res = await getSessions({ page: 1, pageSize: 200 });
            set({ sessions: res.items });
        } catch {
            set({ sessions: [] });
        } finally {
            set({ sessionsLoading: false });
        }
    },

    openCreateModal: () => set({ createModalOpen: true }),

    closeCreateModal: () =>
        set({
            createModalOpen: false,
            submitting: false,
            ...resetCreateFormFields(),
        }),

    setCategory: (value) => set({ category: value }),
    setSessionId: (value) => set({ sessionId: value }),
    setSubject: (value) => set({ subject: value }),
    setMessage: (value) => set({ message: value }),

    submitCreate: async () => {
        set({ submitError: null });
        const { category, sessionId, subject, message } = get();
        const cat = Number(category) as FeedbackCategoryValue;
        if (!Object.values(FeedbackCategory).includes(cat)) {
            set({ submitError: "Выберите категорию" });
            return;
        }
        if (!message.trim()) {
            set({ submitError: "Введите текст обращения" });
            return;
        }
        set({ submitting: true });
        try {
            const sid = sessionId != null && sessionId !== "" ? Number(sessionId) : null;
            await createFeedback({
                category: cat,
                sessionId: sid,
                subject: subject.trim() || null,
                message: message.trim(),
            });
            await get().loadList();
            set({
                createModalOpen: false,
                submitting: false,
                ...resetCreateFormFields(),
            });
        } catch (e) {
            set({
                submitError: e instanceof Error ? e.message : "Не удалось отправить",
                submitting: false,
            });
        }
    },

    openAdminTicket: async (id) => {
        set({ adminOpeningTicketId: id, adminTicketOpenError: null });
        try {
            const t = await getFeedbackById(id);
            set({
                adminPrefetchedTicket: t,
                adminModalOpen: true,
                adminOpeningTicketId: null,
            });
        } catch (e) {
            set({
                adminOpeningTicketId: null,
                adminTicketOpenError: e instanceof Error ? e.message : "Ошибка загрузки",
            });
        }
    },

    clearAdminTicketOpenError: () => set({ adminTicketOpenError: null }),

    closeAdminModal: () =>
        set({
            adminModalOpen: false,
            adminPrefetchedTicket: null,
            adminTicketOpenError: null,
        }),
}));
