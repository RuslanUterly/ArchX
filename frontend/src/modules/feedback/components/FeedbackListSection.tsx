import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Group,
    Stack,
    Text,
    TextInput,
    Title,
    UnstyledButton,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import QueryFiltersModal, {
    formatFilterDisplayValue,
    type QueryFilterFieldOption,
} from "../../../shared/components/QueryFiltersModal.tsx";
import SortPopover, { type SortFieldOption } from "../../../shared/components/SortPopover.tsx";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useFeedbackStore } from "../store.ts";
import AdminFeedbackListRow from "./AdminFeedbackListRow.tsx";
import UserFeedbackCard from "./UserFeedbackCard.tsx";
import classes from "./FeedbackListSection.module.css";

const FEEDBACK_FILTER_FIELD_LABELS: Record<string, string> = {
    subject: "Тема",
    message: "Сообщение",
    status: "Статус",
    category: "Категория",
    createdAt: "Создано",
    updatedAt: "Обновлено",
    sessionId: "ID сессии",
    sessionProjectName: "Проект сессии",
    userEmail: "Email пользователя",
    id: "ID обращения",
};

const FEEDBACK_FILTER_FIELD_OPTIONS: QueryFilterFieldOption[] = Object.entries(FEEDBACK_FILTER_FIELD_LABELS)
    .map(([value, label]) => {
        if (value === "status") {
            return {
                value,
                label,
                type: "enum",
                enumOptions: [
                    { value: "New", label: "Новый" },
                    { value: "InReview", label: "В работе" },
                    { value: "Resolved", label: "Решен" },
                ],
            };
        }

        if (value === "category") {
            return {
                value,
                label,
                type: "enum",
                enumOptions: [
                    { value: "Praise", label: "Похвала" },
                    { value: "Complaint", label: "Жалоба" },
                    { value: "Suggestion", label: "Предложение" },
                ],
            };
        }

        if (value === "createdAt" || value === "updatedAt") {
            return { value, label, type: "date" };
        }

        if (value === "id" || value === "sessionId") {
            return { value, label, type: "number" };
        }

        return { value, label, type: "string" };
    });

const FEEDBACK_SORT_OPTIONS: SortFieldOption[] = [
    {
        value: "createdAt",
        label: "Дата создания",
        ascLabel: "Старые -> новые",
        descLabel: "Новые -> старые",
    },
    {
        value: "updatedAt",
        label: "Дата обновления",
        ascLabel: "Старые -> новые",
        descLabel: "Новые -> старые",
    },
    {
        value: "status",
        label: "Статус",
        ascLabel: "А -> Я",
        descLabel: "Я -> А",
    },
];

export default function FeedbackListSection({ isAdmin }: { isAdmin: boolean }) {
    const items = useFeedbackStore((s) => s.items);
    const listLoading = useFeedbackStore((s) => s.listLoading);
    const listError = useFeedbackStore((s) => s.listError);
    const loadList = useFeedbackStore((s) => s.loadList);
    const openCreateModal = useFeedbackStore((s) => s.openCreateModal);
    const openAdminTicket = useFeedbackStore((s) => s.openAdminTicket);
    const adminTicketOpenError = useFeedbackStore((s) => s.adminTicketOpenError);
    const clearAdminTicketOpenError = useFeedbackStore((s) => s.clearAdminTicketOpenError);
    const filters = useFeedbackStore((s) => s.filters);
    const setFilter = useFeedbackStore((s) => s.setFilter);
    const setFilters = useFeedbackStore((s) => s.setFilters);
    const removeFilter = useFeedbackStore((s) => s.removeFilter);
    const sortField = useFeedbackStore((s) => s.sortField);
    const sortOrder = useFeedbackStore((s) => s.sortOrder);
    const setSorting = useFeedbackStore((s) => s.setSorting);

    const [filtersModalOpened, setFiltersModalOpened] = useState(false);
    const [subjectFilterInput, setSubjectFilterInput] = useState(filters.subject ?? "");
    const [messageFilterInput, setMessageFilterInput] = useState(filters.message ?? "");

    useEffect(() => {
        setSubjectFilterInput(filters.subject ?? "");
        setMessageFilterInput(filters.message ?? "");
    }, [filters.message, filters.subject]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if ((filters.subject ?? "") === subjectFilterInput.trim()) return;
            void setFilter("subject", subjectFilterInput);
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [filters.subject, setFilter, subjectFilterInput]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if ((filters.message ?? "") === messageFilterInput.trim()) return;
            void setFilter("message", messageFilterInput);
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [filters.message, messageFilterInput, setFilter]);

    return (
        <Stack gap="md">
            <Group justify="space-between" wrap="wrap">
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

            <Group align="flex-end" justify="space-between" wrap="nowrap" gap="sm">
                <Group grow style={{ flex: 1 }}>
                    <TextInput
                        label="Быстрый фильтр: тема"
                        placeholder="Например: ошибка статуса"
                        value={subjectFilterInput}
                        onChange={(e) => setSubjectFilterInput(e.currentTarget.value)}
                    />
                    <TextInput
                        label="Быстрый фильтр: сообщение"
                        placeholder="Например: не сохранилось"
                        value={messageFilterInput}
                        onChange={(e) => setMessageFilterInput(e.currentTarget.value)}
                    />
                </Group>

                <Group gap="sm" wrap="nowrap">
                    <SortPopover
                        field={sortField}
                        order={sortOrder}
                        options={FEEDBACK_SORT_OPTIONS}
                        onApply={setSorting}
                    />
                    <Button color={mainColor} variant="light" onClick={() => setFiltersModalOpened(true)}>
                        Фильтры
                    </Button>
                </Group>
            </Group>

            {Object.keys(filters).length > 0 && (
                <Group gap="xs">
                    {Object.entries(filters).map(([field, value]) => (
                        <Badge
                            key={field}
                            variant="light"
                            color={mainColor}
                            style={{ cursor: "pointer" }}
                            onClick={() => void removeFilter(field)}
                            title="Нажмите, чтобы удалить фильтр"
                        >
                            {(FEEDBACK_FILTER_FIELD_LABELS[field] ?? field)}:{" "}
                            {formatFilterDisplayValue(FEEDBACK_FILTER_FIELD_OPTIONS, field, value)}
                        </Badge>
                    ))}
                </Group>
            )}

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
            <QueryFiltersModal
                opened={filtersModalOpened}
                onClose={() => setFiltersModalOpened(false)}
                title="Фильтры по обращениям"
                fieldOptions={FEEDBACK_FILTER_FIELD_OPTIONS}
                filters={filters}
                onSave={setFilters}
            />
        </Stack>
    );
}
