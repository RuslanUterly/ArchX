/** Подписи совпадают с `ArchX.Server.Entities.Grade` (значения 1–4). */
const gradeLabels: Record<number, string> = {
    1: "Джуниор",
    2: "Мидл",
    3: "Сеньор",
    4: "Тимлид",
};

/** Подписи совпадают с `ArchX.Server.Entities.UserType` (значения 1–8). */
const professionLabels: Record<number, string> = {
    1: "Архитектор ПО",
    2: "Тимлид / ведущий разработчик",
    3: "Backend-разработчик",
    4: "Fullstack-разработчик",
    5: "DevOps / SRE",
    6: "Системный аналитик",
    7: "Студент",
    8: "Другое",
};

export function gradeLabel(grade: number): string {
    return gradeLabels[grade] ?? `Грейд ${grade}`;
}

export function professionLabel(profession: number): string {
    return professionLabels[profession] ?? `Профессия ${profession}`;
}
