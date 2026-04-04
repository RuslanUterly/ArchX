import {
    Button,
    Container,
    Group,
    Loader,
    Pagination,
    Paper,
    Space,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useAuthStore } from "../../auth/store.ts";
import {
    getSessions,
    type SessionCompleteResponse,
} from "../../architectureDecision/api.ts";
import { TreeType } from "../../architectureDecision/api.ts";
import StatisticsMiniBlock from "../../statistics/components/StatisticsMiniBlock.tsx";

const SESSIONS_PAGE_SIZE = 5;

function formatDate(s: string) {
    const d = new Date(s);
    return d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function sessionLabel(session: SessionCompleteResponse) {
    const isStyle =
        session.treeType === TreeType.ArchitectureStyle;
    if (isStyle && session.result?.architectureStyle) {
        return `Стиль: ${session.result.architectureStyle}`;
    }
    if (session.result?.patterns?.length) {
        return `Паттерны: ${session.result.patterns.slice(0, 3).join(", ")}${session.result.patterns.length > 3 ? "…" : ""}`;
    }
    return isStyle ? "Сессия по стилям" : "Сессия по паттернам";
}

export default function HomePage() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const roles = useAuthStore((s) => s.roles);
    const isAdmin = useMemo(
        () => roles.some((r) => r.toLowerCase() === "admin"),
        [roles],
    );
    const isUserRole = isAuthenticated && roles.includes("User") && !roles.includes("Admin");

    const [sessions, setSessions] = useState<SessionCompleteResponse[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [sessionsError, setSessionsError] = useState<string | null>(null);

    useEffect(() => {
        if (!isUserRole) return;
        setSessionsLoading(true);
        setSessionsError(null);
        getSessions({ page, pageSize: SESSIONS_PAGE_SIZE })
            .then((r) => {
                setSessions(r.items);
                setTotalCount(r.totalCount);
            })
            .catch((e) => setSessionsError(e instanceof Error ? e.message : "Ошибка загрузки"))
            .finally(() => setSessionsLoading(false));
    }, [isUserRole, page]);

    const totalPages = Math.max(1, Math.ceil(totalCount / SESSIONS_PAGE_SIZE));
    const from = totalCount === 0 ? 0 : (page - 1) * SESSIONS_PAGE_SIZE + 1;
    const to = Math.min(page * SESSIONS_PAGE_SIZE, totalCount);

    return (
        <Container size="md">
            <Space h="lg" />
            <Space h="lg" />
            <Stack gap="lg">
                <StatisticsMiniBlock />

                <Paper p="lg" radius="md" withBorder>
                    <Stack gap="md">
                        <Title order={2} c={mainColor}>
                            ArchX
                        </Title>
                        <Text c="dimmed">
                            Поможем выбрать архитектурный стиль и подходящие паттерны на основе
                            короткого опросника. Вопросы подбираются динамически по вашим ответам.
                        </Text>

                        <Group justify="space-between" mt="sm" align="flex-start" wrap="wrap">
                            {isAuthenticated && isAdmin ? (
                                <Stack gap="sm" style={{ flex: 1 }}>
                                    <Text size="sm" c="dimmed">
                                        Вы вошли как администратор. Управление контентом и аналитика — через
                                        разделы ниже.
                                    </Text>
                                    <Group gap="sm">
                                        <Button
                                            color={mainColor}
                                            variant="light"
                                            onClick={() => navigate("/statistics")}
                                        >
                                            Статистика
                                        </Button>
                                        <Button
                                            color={mainColor}
                                            variant="outline"
                                            onClick={() => navigate("/decision-tree/editor")}
                                        >
                                            Редактор деревьев
                                        </Button>
                                    </Group>
                                </Stack>
                            ) : isAuthenticated ? (
                                <>
                                    <Text size="sm" c="dimmed">
                                        Вы авторизованы — можно начинать.
                                    </Text>
                                    <Button color={mainColor} onClick={() => navigate("/decision-tree")}>
                                        Начать опрос
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Text size="sm" c="dimmed">
                                        Чтобы начать, нужно войти в аккаунт.
                                    </Text>
                                    <Group>
                                        <Button
                                            color={mainColor}
                                            variant="outline"
                                            onClick={() => navigate("/auth/register")}
                                        >
                                            Регистрация
                                        </Button>
                                        <Button
                                            color={mainColor}
                                            onClick={() => navigate("/auth/login")}
                                        >
                                            Войти
                                        </Button>
                                    </Group>
                                </>
                            )}
                        </Group>
                    </Stack>
                </Paper>

                {isUserRole && (
                    <Paper p="lg" radius="md" withBorder>
                        <Stack gap="md">
                            <Title order={3} c={mainColor}>
                                Мои сессии
                            </Title>
                            {sessionsLoading && (
                                <Group justify="center" py="md">
                                    <Loader size="sm" color={mainColor} />
                                </Group>
                            )}
                            {sessionsError && (
                                <Text c="red" size="sm">
                                    {sessionsError}
                                </Text>
                            )}
                            {!sessionsLoading && !sessionsError && sessions.length === 0 && (
                                <Text c="dimmed" size="sm">
                                    Пока нет завершённых сессий. Пройдите опрос, чтобы увидеть их здесь.
                                </Text>
                            )}
                            {!sessionsLoading && !sessionsError && sessions.length > 0 && (
                                <>
                                    <Text size="sm" c="dimmed">
                                        Показано {from}–{to} из {totalCount}
                                    </Text>
                                    <Stack gap="xs">
                                        {sessions.map((session) => (
                                            <Paper
                                                key={session.id}
                                                p="sm"
                                                radius="sm"
                                                withBorder
                                                style={{ cursor: "pointer" }}
                                                onClick={() => navigate(`/sessions/${session.id}`)}
                                            >
                                                <Group justify="space-between">
                                                    <div>
                                                        <Text fw={500}>{session.projectName}</Text>
                                                        <Text size="sm" c="dimmed">
                                                            {sessionLabel(session)} · {formatDate(session.completedAt)}
                                                        </Text>
                                                    </div>
                                                    <Text size="sm" c="dimmed">
                                                        #{session.id}
                                                    </Text>
                                                </Group>
                                            </Paper>
                                        ))}
                                    </Stack>
                                    {totalPages > 1 && (
                                        <Group justify="center" mt="md">
                                            <Pagination
                                                value={page}
                                                onChange={setPage}
                                                total={totalPages}
                                                color={mainColor}
                                                size="sm"
                                            />
                                        </Group>
                                    )}
                                </>
                            )}
                        </Stack>
                    </Paper>
                )}
            </Stack>
        </Container>
    );
}

