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
    description?: string | null;
    pros: string[];
    cons: string[];
}

export interface SessionResponse {
    id: number;
    treeType: TreeTypeValue;
    currentQuestion: string | null;
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

