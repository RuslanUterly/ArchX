import { Container, Space, Stack, Text, Title } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useAuthStore } from "../../auth/store.ts";
import AdminFeedbackModal from "../components/AdminFeedbackModal.tsx";
import CreateFeedbackModal from "../components/CreateFeedbackModal.tsx";
import FeedbackListSection from "../components/FeedbackListSection.tsx";
import { useFeedbackStore } from "../store.ts";

export default function FeedbackPage() {
    const roles = useAuthStore((s) => s.roles);
    const isAdmin = useMemo(
        () => roles.some((r) => r.toLowerCase() === "admin"),
        [roles],
    );

    const loadList = useFeedbackStore((s) => s.loadList);
    const loadSessions = useFeedbackStore((s) => s.loadSessions);
    const adminModalOpen = useFeedbackStore((s) => s.adminModalOpen);
    const adminPrefetchedTicket = useFeedbackStore((s) => s.adminPrefetchedTicket);
    const closeAdminModal = useFeedbackStore((s) => s.closeAdminModal);
    const isMobile = useMediaQuery("(max-width: 767px)");

    useEffect(() => {
        void loadList();
    }, [loadList]);

    useEffect(() => {
        if (isAdmin) return;
        void loadSessions();
    }, [isAdmin, loadSessions]);

    return (
        <>
            <Container size="md" style={{ width: "100%" }}>
                <Space h="xl" />
                <Stack gap="lg">
                    <Title order={isMobile ? 3 : 2} c={mainColor}>
                        Обратная связь
                    </Title>
                    <Text size="sm" c="dimmed">
                        {isAdmin
                            ? "Список обращений пользователей. Откройте карточку, чтобы изменить статус и ответить."
                            : "Опишите, что вам нравится или что стоит улучшить. При баге можно указать сессию опроса."}
                    </Text>

                    <FeedbackListSection isAdmin={isAdmin} />
                </Stack>
                <Space h="xl" />
            </Container>

            {!isAdmin && <CreateFeedbackModal />}

            {isAdmin && adminModalOpen && adminPrefetchedTicket != null && (
                <AdminFeedbackModal
                    key={adminPrefetchedTicket.id}
                    opened={adminModalOpen}
                    onClose={closeAdminModal}
                    ticket={adminPrefetchedTicket}
                    onSaved={async () => {
                        await loadList();
                    }}
                />
            )}
        </>
    );
}
