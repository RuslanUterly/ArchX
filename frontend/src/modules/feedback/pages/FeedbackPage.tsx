import {
    Anchor,
    Badge,
    Button,
    Container,
    Group,
    Modal,
    Paper,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import LayoutCenter from "../../../shared/components/layout/LayoutCenter.tsx";
import { useAuthStore } from "../../auth/store.ts";
import { getSessions, type SessionCompleteResponse } from "../../architectureDecision/api.ts";
import {
    createFeedback,
    FeedbackCategory,
    type FeedbackCategoryValue,
    FeedbackStatus,
    type FeedbackStatusValue,
    getFeedbackById,
    queryFeedback,
    updateFeedbackAdmin,
    type FeedbackTicketDto,
} from "../api.ts";

const categoryLabel: Record<FeedbackCategoryValue, string> = {
    [FeedbackCategory.Praise]: "Нравится",
    [FeedbackCategory.Complaint]: "Не нравится",
    [FeedbackCategory.Suggestion]: "Предложение",
};

const statusLabel: Record<FeedbackStatusValue, string> = {
    [FeedbackStatus.New]: "Новое",
    [FeedbackStatus.InReview]: "В работе",
    [FeedbackStatus.Resolved]: "Закрыто",
};

const adminResponsePresets = [
    "Спасибо за обратную связь — мы передали замечание команде.",
    "Уже разбираемся с этим и постараемся улучшить в ближайших обновлениях.",
    "Если появятся ещё детали или идеи — напишите в этом же разделе, это очень помогает.",
];

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleString("ru-RU");
    } catch {
        return iso;
    }
}

function truncate(text: string, max: number) {
    const t = text.replace(/\s+/g, " ").trim();
    return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export default function FeedbackPage() {
    const roles = useAuthStore((s) => s.roles);
    const isAdmin = useMemo(
        () => roles.some((r) => r.toLowerCase() === "admin"),
        [roles],
    );

    const [items, setItems] = useState<FeedbackTicketDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

    const [sessions, setSessions] = useState<SessionCompleteResponse[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);

    const [category, setCategory] = useState<string>(String(FeedbackCategory.Suggestion));
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitOk, setSubmitOk] = useState(false);

    const [adminModalOpen, { open: openAdminModal, close: closeAdminModal }] = useDisclosure(false);
    const [adminFocusId, setAdminFocusId] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setListError(null);
        try {
            const res = await queryFeedback({ page: 1, pageSize: 100 });
            setItems(res.items);
        } catch (e) {
            setListError(e instanceof Error ? e.message : "Ошибка загрузки");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (isAdmin) return;
        let cancelled = false;
        setSessionsLoading(true);
        void getSessions({ page: 1, pageSize: 200 })
            .then((res) => {
                if (!cancelled) setSessions(res.items);
            })
            .catch(() => {
                if (!cancelled) setSessions([]);
            })
            .finally(() => {
                if (!cancelled) setSessionsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isAdmin]);

    const sessionSelectData = useMemo(
        () =>
            sessions.map((s) => ({
                value: String(s.id),
                label: `${s.projectName} · #${s.id} · ${formatDate(s.completedAt)}`,
            })),
        [sessions],
    );

    const handleSubmit = async () => {
        setSubmitError(null);
        setSubmitOk(false);
        const cat = Number(category) as FeedbackCategoryValue;
        if (!Object.values(FeedbackCategory).includes(cat)) {
            setSubmitError("Выберите категорию");
            return;
        }
        if (!message.trim()) {
            setSubmitError("Введите текст обращения");
            return;
        }
        setSubmitting(true);
        try {
            const sid = sessionId != null && sessionId !== "" ? Number(sessionId) : null;
            await createFeedback({
                category: cat,
                sessionId: sid,
                subject: subject.trim() || null,
                message: message.trim(),
            });
            setMessage("");
            setSubject("");
            setSessionId(null);
            setSubmitOk(true);
            await load();
        } catch (e) {
            setSubmitError(e instanceof Error ? e.message : "Не удалось отправить");
        } finally {
            setSubmitting(false);
        }
    };

    const openAdminTicket = (id: number) => {
        setAdminFocusId(id);
        openAdminModal();
    };

    return (
        <LayoutCenter>
            <Container size="md">
                <Stack gap="lg">
                    <Title order={2} c={mainColor}>
                        Обратная связь
                    </Title>
                    <Text size="sm" c="dimmed">
                        {isAdmin
                            ? "Список обращений пользователей. Откройте карточку, чтобы изменить статус и ответить."
                            : "Опишите, что вам нравится или что стоит улучшить. При баге можно указать сессию опроса."}
                    </Text>

                    {!isAdmin && (
                        <Paper p="lg" radius="md" withBorder>
                            <Stack gap="md">
                                <Title order={4}>Новое обращение</Title>
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
                                    minRows={4}
                                    value={message}
                                    onChange={(e) => setMessage(e.currentTarget.value)}
                                    maxLength={4000}
                                />
                                {submitError && (
                                    <Text size="sm" c="red">
                                        {submitError}
                                    </Text>
                                )}
                                {submitOk && (
                                    <Text size="sm" c="green">
                                        Обращение отправлено.
                                    </Text>
                                )}
                                <Button color={mainColor} onClick={() => void handleSubmit()} loading={submitting}>
                                    Отправить
                                </Button>
                            </Stack>
                        </Paper>
                    )}

                    <Paper p="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Title order={4}>{isAdmin ? "Все обращения" : "Мои обращения"}</Title>
                            <Button variant="light" color={mainColor} onClick={() => void load()} loading={loading}>
                                Обновить
                            </Button>
                        </Group>
                        {listError && (
                            <Text size="sm" c="red" mb="sm">
                                {listError}
                            </Text>
                        )}
                        {!loading && items.length === 0 && (
                            <Text size="sm" c="dimmed">
                                Пока нет обращений.
                            </Text>
                        )}
                        <Stack gap="md">
                            {items.map((t) =>
                                isAdmin ? (
                                    <AdminFeedbackListRow key={t.id} ticket={t} onOpen={() => openAdminTicket(t.id)} />
                                ) : (
                                    <UserFeedbackCard key={t.id} ticket={t} />
                                ),
                            )}
                        </Stack>
                    </Paper>
                </Stack>
            </Container>

            {isAdmin && adminFocusId != null && (
                <AdminFeedbackModal
                    opened={adminModalOpen}
                    onClose={closeAdminModal}
                    ticketId={adminFocusId}
                    onSaved={async () => {
                        await load();
                    }}
                />
            )}
        </LayoutCenter>
    );
}

function UserFeedbackCard({ ticket }: { ticket: FeedbackTicketDto }) {
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

function AdminFeedbackListRow({ ticket, onOpen }: { ticket: FeedbackTicketDto; onOpen: () => void }) {
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
                <Button size="xs" variant="light" color={mainColor} onClick={onOpen}>
                    Открыть
                </Button>
            </Group>
        </Paper>
    );
}

function AdminFeedbackModal({
    opened,
    onClose,
    ticketId,
    onSaved,
}: {
    opened: boolean;
    onClose: () => void;
    ticketId: number;
    onSaved: () => Promise<void>;
}) {
    const [ticket, setTicket] = useState<FeedbackTicketDto | null>(null);
    const [loadErr, setLoadErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [status, setStatus] = useState(String(FeedbackStatus.New));
    const [responseText, setResponseText] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveErr, setSaveErr] = useState<string | null>(null);

    useEffect(() => {
        if (!opened) return;
        let cancelled = false;
        setLoading(true);
        setLoadErr(null);
        void getFeedbackById(ticketId)
            .then((t) => {
                if (!cancelled) {
                    setTicket(t);
                    setStatus(String(t.status));
                    setResponseText(t.adminReply?.message ?? "");
                }
            })
            .catch((e) => {
                if (!cancelled) setLoadErr(e instanceof Error ? e.message : "Ошибка загрузки");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [opened, ticketId]);

    const saveAdmin = async () => {
        if (!ticket) return;
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
            await onSaved();
        } catch (e) {
            setSaveErr(e instanceof Error ? e.message : "Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Обращение" size="lg" centered>
            {loading && (
                <Text size="sm" c="dimmed">
                    Загрузка…
                </Text>
            )}
            {loadErr && (
                <Text size="sm" c="red">
                    {loadErr}
                </Text>
            )}
            {!loading && ticket && (
                <Stack gap="md">
                    <Group gap="xs" wrap="wrap">
                        <Badge color={mainColor} variant="light">
                            {categoryLabel[ticket.category]}
                        </Badge>
                        <Badge variant="outline">{statusLabel[ticket.status]}</Badge>
                    </Group>
                    {ticket.userEmail && (
                        <Text size="sm" c="dimmed">
                            От: {ticket.userEmail}
                        </Text>
                    )}
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

                    <Select
                        label="Статус"
                        data={[
                            { value: String(FeedbackStatus.New), label: statusLabel[FeedbackStatus.New] },
                            { value: String(FeedbackStatus.InReview), label: statusLabel[FeedbackStatus.InReview] },
                            { value: String(FeedbackStatus.Resolved), label: statusLabel[FeedbackStatus.Resolved] },
                        ]}
                        value={status}
                        onChange={(v) => v && setStatus(v)}
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
                    <Group justify="flex-end">
                        <Button variant="default" onClick={onClose}>
                            Закрыть
                        </Button>
                        <Button color={mainColor} onClick={() => void saveAdmin()} loading={saving}>
                            Сохранить
                        </Button>
                    </Group>
                </Stack>
            )}
        </Modal>
    );
}
