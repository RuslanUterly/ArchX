import {
    Anchor,
    Badge,
    Button,
    Group,
    Modal,
    Select,
    Stack,
    Text,
    Textarea,
} from "@mantine/core";
import { useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { Link, useLocation } from "react-router-dom";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { buildSessionRouteState } from "../../../shared/navigation/sessionNav.ts";
import {
    FeedbackStatus,
    type FeedbackStatusValue,
    type FeedbackTicketDto,
    updateFeedbackAdmin,
} from "../api.ts";
import { adminResponsePresets, categoryLabel, statusLabel } from "../feedbackLabels.ts";

export default function AdminFeedbackModal({
    opened,
    onClose,
    ticket: initialTicket,
    onSaved,
}: {
    opened: boolean;
    onClose: () => void;
    ticket: FeedbackTicketDto;
    onSaved: () => Promise<void>;
}) {
    const location = useLocation();
    const isMobile = useMediaQuery("(max-width: 767px)");
    const selectComboboxProps = isMobile ? { withinPortal: false } : undefined;
    const [ticket, setTicket] = useState(initialTicket);
    const [status, setStatus] = useState(String(initialTicket.status));
    const [responseText, setResponseText] = useState(initialTicket.adminReply?.message ?? "");
    const [saving, setSaving] = useState(false);
    const [saveErr, setSaveErr] = useState<string | null>(null);

    const saveAdmin = async () => {
        setSaveErr(null);
        const st = Number(status) as FeedbackStatusValue;
        if (!Object.values(FeedbackStatus).includes(st)) {
            setSaveErr("Некорректный статус");
            return;
        }
        setSaving(true);
        try {
            const updated = await updateFeedbackAdmin(ticket.id, {
                status: st,
                adminResponse: responseText.trim() || null,
            });
            setTicket(updated);
            setStatus(String(updated.status));
            setResponseText(updated.adminReply?.message ?? "");
            onClose();
            void onSaved();
        } catch (e) {
            setSaveErr(e instanceof Error ? e.message : "Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Обращение"
            size="lg"
            centered
        >
            <Stack gap="md">
                <Group gap="xs" wrap="wrap">
                    <Badge color={mainColor} variant="light">
                        {categoryLabel[ticket.category]}
                    </Badge>
                    <Badge color={mainColor} variant="outline">{statusLabel[ticket.status]}</Badge>
                </Group>
                {ticket.userEmail && (
                    <Text size="sm" c="dimmed">
                        От: {ticket.userEmail}
                    </Text>
                )}
                {ticket.sessionId != null && ticket.sessionId > 0 && (
                    <Text size="sm" c="dimmed">
                        Сессия:{" "}
                        <Anchor
                            component={Link}
                            to={`/sessions/${ticket.sessionId}`}
                            state={buildSessionRouteState(location.pathname)}
                            c="dimmed"
                        >
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

                <Select
                    label="Статус"
                    data={[
                        { value: String(FeedbackStatus.New), label: statusLabel[FeedbackStatus.New] },
                        { value: String(FeedbackStatus.InReview), label: statusLabel[FeedbackStatus.InReview] },
                        { value: String(FeedbackStatus.Resolved), label: statusLabel[FeedbackStatus.Resolved] },
                    ]}
                    value={status}
                    onChange={(v) => v && setStatus(v)}
                    comboboxProps={selectComboboxProps}
                />
                <Text size="xs" c="dimmed">
                    Быстрые шаблоны:
                </Text>
                <Group gap="xs" wrap="wrap">
                    {adminResponsePresets.map((p, i) => (
                        <Button
                            key={i}
                            size="compact-xs"
                            variant="light"
                            color={mainColor}
                            onClick={() => setResponseText(p)}
                        >
                            Шаблон {i + 1}
                        </Button>
                    ))}
                </Group>
                <Textarea
                    label="Ответ пользователю"
                    placeholder="Текст ответа (виден автору обращения). Пустое значение удалит ответ."
                    minRows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.currentTarget.value)}
                    maxLength={4000}
                />
                {saveErr && (
                    <Text size="sm" c="red">
                        {saveErr}
                    </Text>
                )}
                <Group justify="flex-end" wrap="wrap">
                    <Button variant="default" onClick={onClose} fullWidth={Boolean(isMobile)}>
                        Закрыть
                    </Button>
                    <Button
                        color={mainColor}
                        onClick={() => void saveAdmin()}
                        loading={saving}
                        fullWidth={Boolean(isMobile)}
                    >
                        Сохранить
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
