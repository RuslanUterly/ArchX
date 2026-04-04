export interface Credentials {
    email: string;
    password: string;
}

/** Соответствует ArchX.Server.Entities.UserType (const вместо enum — совместимость с erasableSyntaxOnly). */
export const UserType = {
    Architect: 1,
    TeamLead: 2,
    BackendDeveloper: 3,
    FullstackDeveloper: 4,
    DevOps: 5,
    SystemsAnalyst: 6,
    Student: 7,
    Other: 8,
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];

/** Соответствует ArchX.Server.Entities.Grade */
export const Grade = {
    Junior: 1,
    Middle: 2,
    Senior: 3,
    TeamLead: 4,
} as const;

export type Grade = (typeof Grade)[keyof typeof Grade];

export interface RegisterData extends Credentials {
    userType: UserType;
    grade: Grade;
}

export interface LoginResponse {
    accessToken: string;
}

export interface RegisterResponse {
    message: string;
}
