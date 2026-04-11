import {
    TreeType,
    type SessionCompleteResponse,
} from "../architectureDecision/api.ts";

export function formatSessionDate(s: string) {
    const d = new Date(s);
    return d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function isArchitectureStyleSession(session: SessionCompleteResponse) {
    return session.treeType === TreeType.ArchitectureStyle;
}

export function sessionSummaryLabel(session: SessionCompleteResponse) {
    const isStyle = isArchitectureStyleSession(session);
    if (isStyle && session.result?.architectureStyle) {
        return `Стиль: ${session.result.architectureStyle}`;
    }
    if (session.result?.patterns?.length) {
        return `Паттерны: ${session.result.patterns.slice(0, 3).join(", ")}${session.result.patterns.length > 3 ? "…" : ""}`;
    }
    return isStyle ? "Сессия по стилям" : "Сессия по паттернам";
}
