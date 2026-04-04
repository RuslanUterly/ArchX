import { Button, Container, List, Loader, Paper, Space, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import LayoutCenter from "../../../shared/components/layout/LayoutCenter.tsx";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import {
    getCombinedSessionTree,
    type CombinedSessionTreeResponse,
    type SessionCompleteResult,
} from "../api.ts";
import SessionTreeView from "../components/SessionTreeView.tsx";

function formatDate(s: string) {
    return new Date(s).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function ResultBlock({ result }: { result: SessionCompleteResult | null }) {
    if (!result) return null;
    return (
        <Stack gap="sm">
            {result.architectureStyle && (
                <Text fw={600}>
                    Стиль архитектуры: {result.architectureStyle}
                </Text>
            )}
            {result.patterns && result.patterns.length > 0 && (
                <Text size="sm">
                    Паттерны: {result.patterns.join(", ")}
                </Text>
            )}
            {result.description && (
                <Text size="sm" c="dimmed">
                    {result.description}
                </Text>
            )}
            {result.pros && result.pros.length > 0 && (
                <Stack gap={4}>
                    <Text size="sm" fw={500}>
                        Плюсы:
                    </Text>
                    <List spacing={4} size="sm">
                        {result.pros.map((item) => (
                            <List.Item
                                key={item}
                                icon={
                                    <ThemeIcon color="green" size={20} radius="xl">
                                        <IconCheck size={14} />
                                    </ThemeIcon>
                                }
                            >
                                {item}
                            </List.Item>
                        ))}
                    </List>
                </Stack>
            )}
            {result.cons && result.cons.length > 0 && (
                <Stack gap={4}>
                    <Text size="sm" fw={500}>
                        Минусы:
                    </Text>
                    <List spacing={4} size="sm">
                        {result.cons.map((item) => (
                            <List.Item key={item}>{item}</List.Item>
                        ))}
                    </List>
                </Stack>
            )}
        </Stack>
    );
}

export default function SessionDetailPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<CombinedSessionTreeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const id = sessionId ? parseInt(sessionId, 10) : NaN;
        if (!Number.isFinite(id)) {
            setError("Неверный идентификатор сессии");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        getCombinedSessionTree(id)
            .then(setData)
            .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
            .finally(() => setLoading(false));
    }, [sessionId]);

    if (loading) {
        return (
            <LayoutCenter>
                <Container size="md">
                    <Stack align="center" py="xl">
                        <Loader color={mainColor} />
                        <Text c="dimmed">Загрузка сессии…</Text>
                    </Stack>
                </Container>
            </LayoutCenter>
        );
    }

    if (error || !data) {
        return (
            <LayoutCenter>
                <Container size="md">
                    <Paper p="lg" withBorder>
                        <Text c="red">{error ?? "Сессия не найдена"}</Text>
                        <Button mt="md" variant="subtle" size="sm" onClick={() => navigate("/")}>
                            На главную
                        </Button>
                    </Paper>
                </Container>
            </LayoutCenter>
        );
    }

    const styleTree = data.styleTree;
    const patternsTree = data.patternsTree;
    const projectName =
        styleTree?.projectName ?? patternsTree?.projectName ?? "Сессия";
    const completedAt =
        styleTree?.completedAt ?? patternsTree?.completedAt ?? "";

    return (
        <>
            <Container size="md" style={{ width: "100%" }}>
                <Space h="xl" />
                <Stack gap="lg">
                    <div>
                        <Button
                            variant="subtle"
                            size="sm"
                            color={mainColor}
                            onClick={() => navigate("/")}
                        >
                            ← На главную
                        </Button>
                        <Title order={2} c={mainColor} mt="xs">
                            Сессия: {projectName}
                        </Title>
                        <Text size="sm" c="dimmed">
                            Завершена: {formatDate(completedAt)}
                        </Text>
                    </div>

                    {styleTree && (
                        <Paper p="lg" radius="md" withBorder>
                            <Stack gap="md">
                                <Text fw={600} size="lg">
                                    Результат по стилям
                                </Text>
                                <ResultBlock result={styleTree.result} />
                                <SessionTreeView
                                    tree={styleTree.tree}
                                    title="Путь по дереву стилей"
                                    accentColor={mainColor}
                                />
                            </Stack>
                        </Paper>
                    )}

                    {patternsTree && (
                        <Paper p="lg" radius="md" withBorder>
                            <Stack gap="md">
                                <Text fw={600} size="lg">
                                    Результат по паттернам
                                </Text>
                                <ResultBlock result={patternsTree.result} />
                                <SessionTreeView
                                    tree={patternsTree.tree}
                                    title="Путь по дереву паттернов"
                                    accentColor="#40a157"
                                />
                            </Stack>
                        </Paper>
                    )}

                    {!styleTree && !patternsTree && (
                        <Paper p="lg" withBorder>
                            <Text c="dimmed">Нет данных дерева для отображения.</Text>
                        </Paper>
                    )}
                </Stack>
                <Space h="xl" />
            </Container>
        </>
    );
}
