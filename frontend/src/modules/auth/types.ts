export interface Credentials {
    email: string;
    password: string;
}

/** Соответствует ArchX.Server.Entities.UserType */
export enum UserType {
    Architect = 1,
    TeamLead,
    BackendDeveloper,
    FullstackDeveloper,
    DevOps,
    SystemsAnalyst,
    Student,
    Other,
}

/** Соответствует ArchX.Server.Entities.Grade */
export enum Grade {
    Junior = 1,
    Middle = 2,
    Senior = 3,
    TeamLead = 4,
}

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