import { ActionIcon, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useFeedbackStore } from "../store.ts";
import AdminFeedbackListRow from "./AdminFeedbackListRow.tsx";
import UserFeedbackCard from "./UserFeedbackCard.tsx";

export default function FeedbackListSection({ isAdmin }: { isAdmin: boolean }) {
    const items = useFeedbackStore((s) => s.items);
    const listLoading = useFeedbackStore((s) => s.listLoading);
    const listError = useFeedbackStore((s) => s.listError);
    const loadList = useFeedbackStore((s) => s.loadList);
    const openCreateModal = useFeedbackStore((s) => s.openCreateModal);
    const openAdminTicket = useFeedbackStore((s) => s.openAdminTicket);
    const adminOpeningTicketId = useFeedbackStore((s) => s.adminOpeningTicketId);
    const adminTicketOpenError = useFeedbackStore((s) => s.adminTicketOpenError);
    const clearAdminTicketOpenError = useFeedbackStore((s) => s.clearAdminTicketOpenError);

    return (
        <Paper p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md" wrap="wrap">
                <Title order={4}>{isAdmin ? "Все обращения" : "Мои обращения"}</Title>
                <Group gap="sm">
                    {!isAdmin && (
                        <Button color={mainColor} onClick={openCreateModal}>
                            Новое обращение
                        </Button>
                    )}
                    <ActionIcon
                        variant="light"
                        color={mainColor}
                        size="lg"
                        onClick={() => void loadList()}
                        loading={listLoading}
                        aria-label="Обновить список"
                    >
                        <IconRefresh size={20} stroke={1.5} />
                    </ActionIcon>
                </Group>
            </Group>
            {listError && (
                <Text size="sm" c="red" mb="sm">
                    {listError}
                </Text>
            )}
            {isAdmin && adminTicketOpenError && (
                <Group gap="xs" mb="sm" align="center" wrap="wrap">
                    <Text size="sm" c="red">
                        {adminTicketOpenError}
                    </Text>
                    <Button variant="subtle" size="compact-xs" onClick={clearAdminTicketOpenError}>
                        Скрыть
                    </Button>
                </Group>
            )}
            {!listLoading && items.length === 0 && (
                <Text size="sm" c="dimmed">
                    Пока нет обращений.
                </Text>
            )}
            <Stack gap="md">
                {items.map((t) =>
                    isAdmin ? (
                        <AdminFeedbackListRow
                            key={t.id}
                            ticket={t}
                            openLoading={adminOpeningTicketId === t.id}
                            onOpen={() => void openAdminTicket(t.id)}
                        />
                    ) : (
                        <UserFeedbackCard key={t.id} ticket={t} />
                    ),
                )}
            </Stack>
        </Paper>
    );
}
