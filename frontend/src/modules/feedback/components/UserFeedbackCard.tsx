import { Anchor, Badge, Group, Paper, Stack, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import type { FeedbackTicketDto } from "../api.ts";
import { categoryLabel, statusLabel } from "../feedbackLabels.ts";
import { formatDate } from "../utils.ts";

export default function UserFeedbackCard({ ticket }: { ticket: FeedbackTicketDto }) {
    return (
        <Paper p="md" radius="sm" withBorder>
            <Stack gap="xs">
                <Group gap="xs" wrap="wrap">
                    <Badge color={mainColor} variant="light">
                        {categoryLabel[ticket.category]}
                    </Badge>
                    <Badge variant="outline">{statusLabel[ticket.status]}</Badge>
                    <Text size="xs" c="dimmed">
                        {formatDate(ticket.createdAt)}
                    </Text>
                </Group>
                {ticket.sessionId != null && ticket.sessionId > 0 && (
                    <Text size="sm">
                        Сессия:{" "}
                        <Anchor component={Link} to={`/sessions/${ticket.sessionId}`}>
                            #{ticket.sessionId}
                            {ticket.sessionProjectName ? ` · ${ticket.sessionProjectName}` : ""}
                        </Anchor>
                    </Text>
                )}
                {ticket.subject && (
                    <Text size="sm" fw={600}>
                        {ticket.subject}
                    </Text>
                )}
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                    {ticket.message}
                </Text>
                {ticket.adminReply && (
                    <Paper p="sm" withBorder>
                        <Text size="xs" c="dimmed" mb={4}>
                            Ответ · обновлено {formatDate(ticket.adminReply.updatedAt)}
                        </Text>
                        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                            {ticket.adminReply.message}
                        </Text>
                    </Paper>
                )}
            </Stack>
        </Paper>
    );
}
