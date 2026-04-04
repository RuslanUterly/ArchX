import { Button, Group, Modal, Select, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useMemo } from "react";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { FeedbackCategory } from "../api.ts";
import { categoryLabel } from "../feedbackLabels.ts";
import { useFeedbackStore } from "../store.ts";
import { formatDate } from "../utils.ts";

export default function CreateFeedbackModal() {
    const opened = useFeedbackStore((s) => s.createModalOpen);
    const closeCreateModal = useFeedbackStore((s) => s.closeCreateModal);
    const category = useFeedbackStore((s) => s.category);
    const setCategory = useFeedbackStore((s) => s.setCategory);
    const sessionId = useFeedbackStore((s) => s.sessionId);
    const setSessionId = useFeedbackStore((s) => s.setSessionId);
    const subject = useFeedbackStore((s) => s.subject);
    const setSubject = useFeedbackStore((s) => s.setSubject);
    const message = useFeedbackStore((s) => s.message);
    const setMessage = useFeedbackStore((s) => s.setMessage);
    const submitting = useFeedbackStore((s) => s.submitting);
    const submitError = useFeedbackStore((s) => s.submitError);
    const submitCreate = useFeedbackStore((s) => s.submitCreate);
    const sessions = useFeedbackStore((s) => s.sessions);
    const sessionsLoading = useFeedbackStore((s) => s.sessionsLoading);

    const sessionSelectData = useMemo(
        () =>
            sessions.map((s) => ({
                value: String(s.id),
                label: `${s.projectName} · #${s.id} · ${formatDate(s.completedAt)}`,
            })),
        [sessions],
    );

    return (
        <Modal opened={opened} onClose={closeCreateModal} title="Новое обращение" size="lg" centered>
            <Stack gap="md">
                <Select
                    label="Тип"
                    data={[
                        { value: String(FeedbackCategory.Praise), label: categoryLabel[FeedbackCategory.Praise] },
                        { value: String(FeedbackCategory.Complaint), label: categoryLabel[FeedbackCategory.Complaint] },
                        { value: String(FeedbackCategory.Suggestion), label: categoryLabel[FeedbackCategory.Suggestion] },
                    ]}
                    value={category}
                    onChange={(v) => v && setCategory(v)}
                />
                <Select
                    label="Сессия опроса (если баг в конкретном проходе)"
                    placeholder={sessionsLoading ? "Загрузка сессий…" : "Не привязывать"}
                    data={sessionSelectData}
                    value={sessionId}
                    onChange={setSessionId}
                    disabled={sessionsLoading}
                    clearable
                />
                <TextInput
                    label="Тема (необязательно)"
                    placeholder="Кратко, о чём речь"
                    value={subject}
                    onChange={(e) => setSubject(e.currentTarget.value)}
                    maxLength={200}
                />
                <Textarea
                    label="Сообщение"
                    placeholder="Подробности"
                    minRows={5}
                    value={message}
                    onChange={(e) => setMessage(e.currentTarget.value)}
                    maxLength={4000}
                />
                {submitError && (
                    <Text size="sm" c="red">
                        {submitError}
                    </Text>
                )}
                <Group justify="flex-end">
                    <Button variant="default" onClick={closeCreateModal}>
                        Отмена
                    </Button>
                    <Button color={mainColor} onClick={() => void submitCreate()} loading={submitting}>
                        Отправить
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
