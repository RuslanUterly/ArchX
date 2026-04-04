import { baseUrl } from "../../shared/api/options.ts";
import { useAuthStore } from "../auth/store.ts";
import type { Grade, UserType } from "../auth/types.ts";

const BASE_URL = `${baseUrl}/api/v1/Profile`;

const getAuthHeaders = (): HeadersInit => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
};

export interface ProfileDto {
    email: string;
    userType: UserType;
    grade: Grade;
}

export const fetchProfile = async (): Promise<ProfileDto> => {
    const res = await fetch(BASE_URL, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Не удалось загрузить профиль");
    }
    return res.json();
};

export const updateProfile = async (payload: {
    userType: UserType;
    grade: Grade;
}): Promise<ProfileDto> => {
    const res = await fetch(BASE_URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Не удалось сохранить профиль");
    }
    return res.json();
};
