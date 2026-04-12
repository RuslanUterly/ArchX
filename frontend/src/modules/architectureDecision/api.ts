import { baseUrl } from "../../shared/api/options.ts";
import { useAuthStore } from "../auth/store.ts";

export const TreeType = {
    ArchitectureStyle: 1,
    MonolithPatterns: 2,
    ModularMonolithPatterns: 3,
    MicroservicesPatterns: 4,
} as const;

export type TreeTypeValue = (typeof TreeType)[keyof typeof TreeType];

export interface ResultNodeResponse {
    architectureStyle?: string | null;
    patterns: string[];
    patternDetails?: PatternDetailResponse[] | null;
    description?: string | null;
    pros: string[];
    cons: string[];
}

export interface PatternDetailResponse {
    name: string;
    description?: string | null;
    pros?: string[] | null;
    cons?: string[] | null;
}

export interface SessionResponse {
    id: number;
    treeType: TreeTypeValue;
    currentQuestion: string | null;
    currentQuestionDescription?: string | null;
    options: string[] | null;
    completed: boolean;
    result?: ResultNodeResponse | null;
    isStyleSelected: boolean;
}

export interface CompletedStyleResponse {
    id: number;
    completed: true;
    treeType: TreeTypeValue;
    architectureStyle: string | null;
    patterns: string[];
    description: string | null;
    pros: string[];
    cons: string[];
    canContinueWithPatterns: boolean;
}

export type AnswerResponse = SessionResponse | CompletedStyleResponse;

interface StartSessionRequest {
    projectName: string;
    treeType: TreeTypeValue;
}

const BASE_URL = `${baseUrl}/api/v1/DecisionTree`;

const getAuthHeaders = (): HeadersInit => {
    const token = useAuthStore.getState().accessToken;

    if (!token) {
        return {};
    }

    return {
        Authorization: `Bearer ${token}`,
    };
};

export const startSession = async (
    userId: number,
    payload: StartSessionRequest,
): Promise<SessionResponse> => {
    const res = await fetch(`${BASE_URL}/start/${userId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Не удалось начать сессию");
    }

    return res.json();
};

export const postAnswer = async (
    sessionId: number,
    answer: string,
): Promise<AnswerResponse> => {
    const res = await fetch(`${BASE_URL}/${sessionId}/answer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ answer }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Не удалось отправить ответ");
    }

    return res.json();
};

export const continueWithPatterns = async (
    styleSessionId: number,
): Promise<SessionResponse> => {
    const res = await fetch(`${BASE_URL}/${styleSessionId}/continue-with-patterns`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Не удалось продолжить с паттернами");
    }

    return res.json();
};

// --- Сессии (список и детали) ---

export interface SessionCompleteResult {
    architectureStyle?: string | null;
    patterns?: string[] | null;
    patternDetails?: PatternDetailResponse[] | null;
    description?: string | null;
    pros?: string[] | null;
    cons?: string[] | null;
}

export interface SessionCompleteResponse {
    id: number;
    treeType: TreeTypeValue;
    projectName: string;
    startedAt: string;
    completedAt: string;
    selectedStyleNodeId?: number | null;
    isHidden: boolean;
    result: SessionCompleteResult;
}

export interface PagedResult<T> {
    totalCount: number;
    items: T[];
}

export interface QueryParameter {
    page: number;
    pageSize: number;
    filters?: Record<string, string> | null;
    sortField?: string | null;
    sortOrder?: string | null;
}

export const getSessions = async (
    query: QueryParameter,
): Promise<PagedResult<SessionCompleteResponse>> => {
    const res = await fetch(`${BASE_URL}/Get`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(query),
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Не удалось загрузить сессии");
    }
    return res.json();
};

export const getSession = async (
    sessionId: number,
): Promise<SessionResponse> => {
    const res = await fetch(`${BASE_URL}/${sessionId}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Сессия не найдена");
    }
    return res.json();
};

export const setSessionHiddenState = async (
    sessionId: number,
    isHidden: boolean,
): Promise<void> => {
    const res = await fetch(`${BASE_URL}/${sessionId}/hidden`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ isHidden }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Не удалось изменить видимость сессии");
    }
};

// --- Дерево сессии (объединённое: стили + паттерны) ---

export interface QuestionNodeResponse {
    nodeId: number;
    question: string;
    answer: string | null;
    nextNode: QuestionNodeResponse | null;
}

export interface SessionTreeResponse {
    sessionId: number;
    projectName: string;
    startedAt: string;
    completedAt: string;
    tree: QuestionNodeResponse;
    result: SessionCompleteResult | null;
}

export interface CombinedSessionTreeResponse {
    styleTree: SessionTreeResponse | null;
    patternsTree: SessionTreeResponse | null;
}

export const getCombinedSessionTree = async (
    sessionId: number,
): Promise<CombinedSessionTreeResponse> => {
    const res = await fetch(`${BASE_URL}/${sessionId}/tree/combined`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Не удалось загрузить дерево сессии");
    }
    return res.json();
};

