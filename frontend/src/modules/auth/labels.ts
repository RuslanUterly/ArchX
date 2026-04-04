import { Grade, UserType } from "./types";

export const USER_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: String(UserType.Architect), label: "Архитектор ПО" },
    { value: String(UserType.TeamLead), label: "Тимлид / ведущий разработчик" },
    { value: String(UserType.BackendDeveloper), label: "Backend-разработчик" },
    { value: String(UserType.FullstackDeveloper), label: "Fullstack-разработчик" },
    { value: String(UserType.DevOps), label: "DevOps / SRE" },
    { value: String(UserType.SystemsAnalyst), label: "Системный аналитик" },
    { value: String(UserType.Student), label: "Студент" },
    { value: String(UserType.Other), label: "Другое" },
];

export const GRADE_OPTIONS: { value: string; label: string }[] = [
    { value: String(Grade.Junior), label: "Джуниор" },
    { value: String(Grade.Middle), label: "Мидл" },
    { value: String(Grade.Senior), label: "Сеньор" },
    { value: String(Grade.TeamLead), label: "Тимлид" },
];

export function labelForUserType(value: number): string {
    return USER_TYPE_OPTIONS.find((o) => o.value === String(value))?.label ?? String("Другое");
}

export function labelForGrade(value: number): string {
    return GRADE_OPTIONS.find((o) => o.value === String(value))?.label ?? String("Другое");
}
