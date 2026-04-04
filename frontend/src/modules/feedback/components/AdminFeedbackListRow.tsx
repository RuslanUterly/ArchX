import { Badge, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import type { FeedbackTicketDto } from "../api.ts";
import { categoryLabel, statusLabel } from "../feedbackLabels.ts";
import { formatDate, truncate } from "../utils.ts";

export default function AdminFeedbackListRow({
    ticket,
    openLoading,
    onOpen,
}: {
    ticket: FeedbackTicketDto;
    openLoading?: boolean;
    onOpen: () => void;
}) {
    return (
        <Paper p="md" radius="sm" withBorder>
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
                <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" wrap="wrap">
                        <Badge color={mainColor} variant="light">
                            {categoryLabel[ticket.category]}
                        </Badge>
                        <Badge variant="outline">{statusLabel[ticket.status]}</Badge>
                        <Text size="xs" c="dimmed">
                            {formatDate(ticket.createdAt)}
                        </Text>
                    </Group>
                    {ticket.userEmail && (
                        <Text size="sm" c="dimmed">
                            {ticket.userEmail}
                        </Text>
                    )}
                    {ticket.sessionId != null && ticket.sessionId > 0 && (
                        <Text size="sm" c="dimmed">
                            Сессия #{ticket.sessionId}
                            {ticket.sessionProjectName ? ` · ${ticket.sessionProjectName}` : ""}
                        </Text>
                    )}
                    {ticket.subject && (
                        <Text size="sm" fw={600}>
                            {ticket.subject}
                        </Text>
                    )}
                    <Text size="sm" c="dimmed" lineClamp={2}>
                        {truncate(ticket.message, 220)}
                    </Text>
                    {ticket.adminReply && (
                        <Badge size="sm" variant="dot" color="green">
                            Есть ответ
                        </Badge>
                    )}
                </Stack>
                <Button size="xs" variant="light" color={mainColor} onClick={onOpen} loading={openLoading}>
                    Открыть
                </Button>
            </Group>
        </Paper>
    );
}
