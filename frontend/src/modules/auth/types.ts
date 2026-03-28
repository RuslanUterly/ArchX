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

export interface RegisterData extends Credentials {
    userType: UserType;
}

export interface LoginResponse {
    accessToken: string;
}

export interface RegisterResponse {
    message: string;
}