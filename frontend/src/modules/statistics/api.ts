import { baseUrl } from "../../shared/api/options.ts";
import { useAuthStore } from "../auth/store.ts";

const BASE_URL = `${baseUrl}/api/v1/Statistics`;

const getAuthHeaders = (): HeadersInit => {
    const token = useAuthStore.getState().accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface PublicStatistics {
    totalSessions: number;
    registeredUsers: number;
}

export interface NamedCount {
    name: string;
    count: number;
}

export interface DailyCount {
    date: string;
    count: number;
}

export interface BreakdownByGrade {
    grade: number;
    topItems: NamedCount[];
}

export interface BreakdownByProfession {
    profession: number;
    topItems: NamedCount[];
}

export interface AdminStatistics {
    completedSessionsTotal: number;
    feedbackTicketsTotal: number;
    sessionsPerDay: DailyCount[];
    feedbackTicketsPerDay: DailyCount[];
    /** Топ стилей по всем завершённым сессиям выбора стиля */
    topArchitectureStylesOverall: NamedCount[];
    /** Топ паттернов по всем завершённым сессиям деревьев паттернов */
    topPatternsOverall: NamedCount[];
    topArchitectureStylesByGrade: BreakdownByGrade[];
    topPatternsByGrade: BreakdownByGrade[];
    topPatternsByProfession: BreakdownByProfession[];
    distinctUsersWithSessions: number;
    activeUsersLast7Days: number;
}

export interface PersonalStatistics {
    globalTotalSessions: number;
    myTotalSessions: number;
    myCompletedSessions: number;
    myFeedbackTickets: number;
}

export interface StatisticsResponse {
    personal: PersonalStatistics;
    admin: AdminStatistics | null;
}

export async function getPublicStatistics(): Promise<PublicStatistics> {
    const res = await fetch(`${BASE_URL}/public`);
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Не удалось загрузить статистику");
    }
    return res.json();
}

export async function getStatistics(): Promise<StatisticsResponse> {
    const res = await fetch(BASE_URL, { headers: getAuthHeaders() });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Не удалось загрузить статистику");
    }
    return res.json();
}
