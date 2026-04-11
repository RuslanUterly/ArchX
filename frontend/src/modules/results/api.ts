import { getSessions } from "../architectureDecision/api.ts";

export const RESULTS_PAGE_SIZE = 5;

export function fetchLatestSession() {
    return getSessions({ page: 1, pageSize: 1 });
}

export function fetchSessionsPage(page: number) {
    return getSessions({ page, pageSize: RESULTS_PAGE_SIZE });
}
