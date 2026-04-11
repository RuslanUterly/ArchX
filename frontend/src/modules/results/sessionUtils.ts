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

export function getSessionTypeLabel(session: SessionCompleteResponse) {
    return isArchitectureStyleSession(session) ? "Архитектурный стиль" : "Паттерны";
}

function getStyleByTreeType(treeType: number): string | null {
    switch (treeType) {
        case TreeType.MonolithPatterns:
            return "Монолит";
        case TreeType.ModularMonolithPatterns:
            return "Модульный монолит";
        case TreeType.MicroservicesPatterns:
            return "Микросервисная архитектура";
        default:
            return null;
    }
}

export function resolveSessionStyleName(session: SessionCompleteResponse) {
    const styleFromResult = session.result?.architectureStyle?.trim();
    if (styleFromResult) {
        return styleFromResult;
    }
    return getStyleByTreeType(session.treeType);
}

export function sessionSummaryLabel(session: SessionCompleteResponse) {
    const isStyle = isArchitectureStyleSession(session);
    const styleName = resolveSessionStyleName(session);

    if (isStyle && styleName) {
        return `Стиль: ${styleName}`;
    }

    if (session.result?.patterns?.length) {
        const patternsLabel = `Паттерны: ${session.result.patterns.slice(0, 3).join(", ")}${session.result.patterns.length > 3 ? "…" : ""}`;
        return styleName ? `Стиль: ${styleName} · ${patternsLabel}` : patternsLabel;
    }

    return isStyle ? "Сессия по стилям" : "Сессия по паттернам";
}
