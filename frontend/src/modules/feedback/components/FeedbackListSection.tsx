import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Group,
    Stack,
    Text,
    Title,
    UnstyledButton,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useFeedbackStore } from "../store.ts";
import AdminFeedbackListRow from "./AdminFeedbackListRow.tsx";
import UserFeedbackCard from "./UserFeedbackCard.tsx";
import classes from "./FeedbackListSection.module.css";

export default function FeedbackListSection({ isAdmin }: { isAdmin: boolean }) {
    const items = useFeedbackStore((s) => s.items);
    const listLoading = useFeedbackStore((s) => s.listLoading);
    const listError = useFeedbackStore((s) => s.listError);
    const loadList = useFeedbackStore((s) => s.loadList);
    const openCreateModal = useFeedbackStore((s) => s.openCreateModal);
    const openAdminTicket = useFeedbackStore((s) => s.openAdminTicket);
    const adminTicketOpenError = useFeedbackStore((s) => s.adminTicketOpenError);
    const clearAdminTicketOpenError = useFeedbackStore((s) => s.clearAdminTicketOpenError);

    return (
        <div>
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
            {items.length > 0 && (
                <Stack gap="sm">
                    <Group justify="space-between" align="center">
                        <Text size="sm" c="dimmed">
                            Показано {items.length} из {items.length}
                        </Text>
                        <Badge variant="dot" color={mainColor}>
                            История обращений
                        </Badge>
                    </Group>

                    <Box className={classes.ticketsList}>
                        {items.map((t) => (
                            isAdmin ? (
                                <UnstyledButton
                                    key={t.id}
                                    className={`${classes.ticketRow} ${classes.ticketRowClickable}`}
                                    onClick={() => void openAdminTicket(t.id)}
                                >
                                    <Stack gap={6} className={classes.rowContent}>
                                        <AdminFeedbackListRow
                                            ticket={t}
                                        />
                                    </Stack>
                                </UnstyledButton>
                            ) : (
                                <Box key={t.id} className={classes.ticketRow}>
                                    <Stack gap={6} className={classes.rowContent}>
                                        <UserFeedbackCard ticket={t} />
                                    </Stack>
                                </Box>
                            )
                        ))}
                    </Box>
                </Stack>
            )}
        </div>
    );
}
