import { getSessions, setSessionHiddenState } from "../architectureDecision/api.ts";

export const RESULTS_PAGE_SIZE = 5;

export function fetchLatestSession() {
    return getSessions({ page: 1, pageSize: 1 });
}

export function fetchSessionsPage(
    page: number,
    filters?: Record<string, string>,
    sortField?: string,
    sortOrder?: string,
) {
    return getSessions({
        page,
        pageSize: RESULTS_PAGE_SIZE,
        filters: filters ?? null,
        sortField: sortField ?? null,
        sortOrder: sortOrder ?? null,
    });
}

export function setSessionHidden(sessionId: number, isHidden: boolean) {
    return setSessionHiddenState(sessionId, isHidden);
}
