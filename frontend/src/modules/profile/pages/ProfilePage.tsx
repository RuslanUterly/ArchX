import { Alert, Container, Text } from "@mantine/core";
import { useEffect } from "react";
import { EditProfileModal } from "../components/EditProfileModal.tsx";
import { ProfileViewCard } from "../components/ProfileViewCard.tsx";
import { useProfileStore } from "../store.ts";

export default function ProfilePage() {
    const loadProfile = useProfileStore((s) => s.loadProfile);
    const loading = useProfileStore((s) => s.loading);
    const loadError = useProfileStore((s) => s.loadError);

    useEffect(() => {
        void loadProfile();
        return () => {
            useProfileStore.getState().closeEditModal();
        };
    }, [loadProfile]);

    if (loading) {
        return (
            <Container size="sm" py="xl">
                <Text>Загрузка…</Text>
            </Container>
        );
    }

    if (loadError) {
        return (
            <Container size="sm" py="xl">
                <Alert color="red" title="Ошибка">
                    {loadError}
                </Alert>
            </Container>
        );
    }

    return (
        <Container size="md" py="xl" style={{ width: "100%" }}>
            <ProfileViewCard />
            <EditProfileModal />
        </Container>
    );
}
