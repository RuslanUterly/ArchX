import { baseUrl } from "../../shared/api/options.ts";
import { useAuthStore } from "../auth/store.ts";
import type { QueryParameter } from "../architectureDecision/api.ts";

const BASE_URL = `${baseUrl}/api/v1/Feedback`;

const getAuthHeaders = (): HeadersInit => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
};

export const FeedbackCategory = {
    Praise: 1,
    Complaint: 2,
    Suggestion: 3,
} as const;

export type FeedbackCategoryValue = (typeof FeedbackCategory)[keyof typeof FeedbackCategory];

export const FeedbackStatus = {
    New: 1,
    InReview: 2,
    Resolved: 3,
} as const;

export type FeedbackStatusValue = (typeof FeedbackStatus)[keyof typeof FeedbackStatus];

export interface FeedbackAdminReplyDto {
    message: string;
    createdAt: string;
    updatedAt: string;
}

export interface FeedbackTicketDto {
    id: number;
    userId: number;
    userEmail?: string | null;
    sessionId?: number | null;
    sessionProjectName?: string | null;
    category: FeedbackCategoryValue;
    subject?: string | null;
    message: string;
    status: FeedbackStatusValue;
    adminReply?: FeedbackAdminReplyDto | null;
    createdAt: string;
    updatedAt: string;
}

export interface PagedFeedbackResult {
    totalCount: number;
    items: FeedbackTicketDto[];
}

export const createFeedback = async (payload: {
    category: FeedbackCategoryValue;
    sessionId?: number | null;
    subject?: string | null;
    message: string;
}): Promise<FeedbackTicketDto> => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Не удалось отправить обращение");
    }
    return res.json();
};

export const getFeedbackById = async (id: number): Promise<FeedbackTicketDto> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Не удалось загрузить обращение");
    }
    return res.json();
};

export const queryFeedback = async (query: QueryParameter): Promise<PagedFeedbackResult> => {
    const res = await fetch(`${BASE_URL}/query`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(query),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Не удалось загрузить обращения");
    }
    return res.json();
};

export const updateFeedbackAdmin = async (
    id: number,
    payload: { status?: FeedbackStatusValue | null; adminResponse?: string | null },
): Promise<FeedbackTicketDto> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Не удалось сохранить ответ");
    }
    return res.json();
};
