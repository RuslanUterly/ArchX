export function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleString("ru-RU");
    } catch {
        return iso;
    }
}

export function truncate(text: string, max: number) {
    const t = text.replace(/\s+/g, " ").trim();
    return t.length <= max ? t : `${t.slice(0, max)}…`;
}
