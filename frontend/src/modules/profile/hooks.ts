import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile } from "./api";
import type { Grade, UserType } from "../auth/types.ts";

export const profileQueryKey = ["profile"] as const;

export const useProfileQuery = () =>
    useQuery({
        queryKey: profileQueryKey,
        queryFn: fetchProfile,
    });

export const useUpdateProfile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: { userType: UserType; grade: Grade }) => updateProfile(payload),
        onSuccess: (data) => {
            qc.setQueryData(profileQueryKey, data);
            notifications.show({
                title: "Сохранено",
                message: "Профиль обновлён",
                color: "green",
            });
        },
    });
};
