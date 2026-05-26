import { Grade, UserType } from "./types";

const USER_TYPE_LABELS: Record<number, string> = {
    [UserType.Architect]: "Архитектор ПО",
    [UserType.TeamLead]: "Ведущий разработчик",
    [UserType.BackendDeveloper]: "Backend-разработчик",
    [UserType.FullstackDeveloper]: "Fullstack-разработчик",
    [UserType.DevOps]: "DevOps / SRE",
    [UserType.SystemsAnalyst]: "Системный аналитик",
    [UserType.Other]: "Другое",
};

export const USER_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: String(UserType.Architect), label: USER_TYPE_LABELS[UserType.Architect] },
    { value: String(UserType.TeamLead), label: USER_TYPE_LABELS[UserType.TeamLead] },
    { value: String(UserType.BackendDeveloper), label: USER_TYPE_LABELS[UserType.BackendDeveloper] },
    { value: String(UserType.FullstackDeveloper), label: USER_TYPE_LABELS[UserType.FullstackDeveloper] },
    { value: String(UserType.DevOps), label: USER_TYPE_LABELS[UserType.DevOps] },
    { value: String(UserType.SystemsAnalyst), label: USER_TYPE_LABELS[UserType.SystemsAnalyst] },
    { value: String(UserType.Other), label: USER_TYPE_LABELS[UserType.Other] },
];

export const GRADE_OPTIONS: { value: string; label: string }[] = [
    { value: String(Grade.Junior), label: "Джуниор" },
    { value: String(Grade.Middle), label: "Мидл" },
    { value: String(Grade.Senior), label: "Сеньор" },
    { value: String(Grade.TeamLead), label: "Тимлид" },
];

export function labelForUserType(value: number): string {
    return USER_TYPE_LABELS[value] ?? String("Другое");
}

export function labelForGrade(value: number): string {
    return GRADE_OPTIONS.find((o) => o.value === String(value))?.label ?? String("Другое");
}
