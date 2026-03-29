import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../auth/store.ts";
import type {
    AnswerResponse,
    CompletedStyleResponse,
    ResultNodeResponse,
    SessionResponse,
    TreeTypeValue,
} from "./api.ts";
import { TreeType, continueWithPatterns, postAnswer, startSession } from "./api.ts";

interface JwtPayload {
    sub?: string;
}

export interface DecisionState {
    sessionId: number;
    treeType: TreeTypeValue;
    currentQuestion: string | null;
    currentQuestionDescription: string | null;
    options: string[];
    completed: boolean;
    result: ResultNodeResponse | null;
    canContinueWithPatterns: boolean;
    mode: "style" | "patterns";
}

interface DecisionTreeStore {
    projectName: string;
    session: DecisionState | null;
    loading: boolean;
    error: string | null;

    setProjectName: (value: string) => void;
    start: () => Promise<void>;
    answer: (answer: string) => Promise<void>;
    continueWithPatterns: () => Promise<void>;
    reset: () => void;
    clearError: () => void;
}

const getUserIdFromToken = (token: string | null): number | null => {
    if (!token) return null;
    try {
        const decoded = jwtDecode<JwtPayload>(token);
        return decoded.sub ? Number(decoded.sub) : null;
    } catch {
        return null;
    }
};

const isCompletedStyleResponse = (
    response: AnswerResponse,
): response is CompletedStyleResponse => {
    return (response as CompletedStyleResponse).canContinueWithPatterns !== undefined;
};

const mapSessionToState = (
    session: SessionResponse,
    prev?: DecisionState | null,
): DecisionState => ({
    sessionId: session.id,
    treeType: session.treeType,
    currentQuestion: session.currentQuestion,
    currentQuestionDescription: session.currentQuestionDescription?.trim() || null,
    options: session.options ?? [],
    completed: session.completed,
    result: session.result ?? null,
    canContinueWithPatterns: prev?.canContinueWithPatterns ?? false,
    mode:
        prev?.mode ??
        (session.treeType === TreeType.ArchitectureStyle ? "style" : "patterns"),
});

export const useDecisionTreeStore = create<DecisionTreeStore>((set, get) => ({
    projectName: "",
    session: null,
    loading: false,
    error: null,

    setProjectName: (value) => set({ projectName: value }),
    clearError: () => set({ error: null }),

    reset: () =>
        set({
            projectName: "",
            session: null,
            loading: false,
            error: null,
        }),

    start: async () => {
        const { projectName } = get();
        const token = useAuthStore.getState().accessToken;
        const userId = getUserIdFromToken(token);

        if (!userId) {
            set({ error: "Не удалось определить пользователя. Перезайдите в систему." });
            return;
        }

        if (!projectName.trim()) {
            set({ error: "Введите название проекта." });
            return;
        }

        set({ loading: true, error: null });
        try {
            const session = await startSession(userId, {
                projectName: projectName.trim(),
                treeType: TreeType.ArchitectureStyle,
            });

            set({
                session: mapSessionToState(session, {
                    sessionId: session.id,
                    treeType: session.treeType,
                    currentQuestion: session.currentQuestion,
                    currentQuestionDescription:
                        session.currentQuestionDescription?.trim() || null,
                    options: session.options ?? [],
                    completed: session.completed,
                    result: session.result ?? null,
                    canContinueWithPatterns: false,
                    mode: "style",
                }),
            });
        } catch (e) {
            set({ error: e instanceof Error ? e.message : "Ошибка при запуске сессии" });
        } finally {
            set({ loading: false });
        }
    },

    answer: async (answer: string) => {
        const session = get().session;
        if (!session) return;

        set({ loading: true, error: null });
        try {
            const response = await postAnswer(session.sessionId, answer);

            if (isCompletedStyleResponse(response)) {
                const result: ResultNodeResponse = {
                    architectureStyle: response.architectureStyle ?? undefined,
                    patterns: response.patterns,
                    description: response.description ?? undefined,
                    pros: response.pros,
                    cons: response.cons,
                };

                set({
                    session: {
                        ...session,
                        completed: true,
                        currentQuestion: null,
                        currentQuestionDescription: null,
                        options: [],
                        result,
                        canContinueWithPatterns: response.canContinueWithPatterns,
                    },
                });
            } else {
                set({ session: mapSessionToState(response, session) });
            }
        } catch (e) {
            set({ error: e instanceof Error ? e.message : "Ошибка при отправке ответа" });
        } finally {
            set({ loading: false });
        }
    },

    continueWithPatterns: async () => {
        const session = get().session;
        if (!session) return;

        set({ loading: true, error: null });
        try {
            const next = await continueWithPatterns(session.sessionId);

            set({
                session: mapSessionToState(next, {
                    ...session,
                    canContinueWithPatterns: false,
                    mode: "patterns",
                }),
            });
        } catch (e) {
            set({
                error:
                    e instanceof Error
                        ? e.message
                        : "Не удалось начать опрос по паттернам",
            });
        } finally {
            set({ loading: false });
        }
    },
}));

