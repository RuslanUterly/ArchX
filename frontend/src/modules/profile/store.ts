import { notifications } from "@mantine/notifications";
import { create } from "zustand";
import { fetchProfile, updateProfile, type ProfileDto } from "./api.ts";
import type { Grade, UserType } from "../auth/types.ts";

interface ProfileStore {
    profile: ProfileDto | null;
    loading: boolean;
    loadError: string | null;

    editModalOpen: boolean;
    draftUserType: string | null;
    draftGrade: string | null;
    saving: boolean;
    saveError: string | null;

    loadProfile: () => Promise<void>;
    openEditModal: () => void;
    closeEditModal: () => void;
    setDraftUserType: (value: string | null) => void;
    setDraftGrade: (value: string | null) => void;
    saveProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
    profile: null,
    loading: false,
    loadError: null,

    editModalOpen: false,
    draftUserType: null,
    draftGrade: null,
    saving: false,
    saveError: null,

    loadProfile: async () => {
        set({ loading: true, loadError: null });
        try {
            const profile = await fetchProfile();
            set({ profile, loading: false });
        } catch (e) {
            set({
                profile: null,
                loadError: e instanceof Error ? e.message : "Не удалось загрузить профиль",
                loading: false,
            });
        }
    },

    openEditModal: () => {
        const { profile } = get();
        if (!profile) return;
        set({
            editModalOpen: true,
            draftUserType: String(profile.userType),
            draftGrade: String(profile.grade),
            saveError: null,
        });
    },

    closeEditModal: () =>
        set({
            editModalOpen: false,
            saving: false,
            saveError: null,
        }),

    setDraftUserType: (value) => set({ draftUserType: value }),
    setDraftGrade: (value) => set({ draftGrade: value }),

    saveProfile: async () => {
        const { draftUserType, draftGrade } = get();
        if (draftUserType === null || draftGrade === null) return;

        set({ saveError: null, saving: true });
        try {
            const updated = await updateProfile({
                userType: Number(draftUserType) as UserType,
                grade: Number(draftGrade) as Grade,
            });
            set({
                profile: updated,
                editModalOpen: false,
                saving: false,
                saveError: null,
            });
            notifications.show({
                title: "Сохранено",
                message: "Профиль обновлён",
                color: "green",
            });
        } catch (e) {
            set({
                saveError: e instanceof Error ? e.message : "Не удалось сохранить",
                saving: false,
            });
        }
    },
}));
