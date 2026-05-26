import {
    Anchor,
    Badge,
    Breadcrumbs,
    Button,
    Container,
    Divider,
    Group,
    List,
    Loader,
    Paper,
    Space,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import LayoutCenter from "../../../shared/components/layout/LayoutCenter.tsx";
import type { SessionRouteState } from "../../../shared/navigation/sessionNav.ts";
import { mainColor, successColor } from "../../../shared/components/theme/colors.ts";
import {
    getCombinedSessionTree,
    type CombinedSessionTreeResponse,
    type PatternDetailResponse,
    type SessionCompleteResult,
} from "../api.ts";
import SessionFlowGraph from "../components/SessionFlowGraph.tsx";

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
        <Stack gap="md">
            {result.description && <Text size="sm">{result.description}</Text>}
            {result.description && (
                <Divider variant="dashed" />
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
                                    <ThemeIcon color={successColor} size={20} radius="xl">
                                        <IconCheck size={10} />
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
                            <List.Item
                                key={item}
                                icon={
                                    <ThemeIcon color="red" size={20} radius="xl">
                                        <IconX size={10} />
                                    </ThemeIcon>
                                }
                            >
                                {item}
                            </List.Item>
                        ))}
                    </List>
                </Stack>
            )}
        </Stack>
    );
}

function PatternDetailsBlock({ detail }: { detail: PatternDetailResponse }) {
    const pros = detail.pros?.filter(Boolean) ?? [];
    const cons = detail.cons?.filter(Boolean) ?? [];

    return (
        <Stack gap="sm">
            {detail.description && <Text size="sm">{detail.description}</Text>}
            {pros.length > 0 && (
                <Stack gap={4}>
                    <Text size="sm" fw={500}>
                        Плюсы:
                    </Text>
                    <List spacing={4} size="sm">
                        {pros.map((item) => (
                            <List.Item
                                key={item}
                                icon={
                                    <ThemeIcon color="green" size={15} radius="xl">
                                        <IconCheck size={13} />
                                    </ThemeIcon>
                                }
                            >
                                {item}
                            </List.Item>
                        ))}
                    </List>
                </Stack>
            )}
            {cons.length > 0 && (
                <Stack gap={4}>
                    <Text size="sm" fw={500}>
                        Минусы:
                    </Text>
                    <List spacing={4} size="sm">
                        {cons.map((item) => (
                            <List.Item 
                                key={item}
                                icon={
                                    <ThemeIcon color="red" size={15} radius="xl">
                                        <IconX size={10} />
                                    </ThemeIcon>
                                }
                            >
                                {item}
                            </List.Item>
                        ))}
                    </List>
                </Stack>
            )}
            {!detail.description && pros.length === 0 && cons.length === 0 && (
                <Text size="sm" c="dimmed">
                    Нет дополнительной информации по этому паттерну.
                </Text>
            )}
        </Stack>
    );
}

function PatternCards({ result }: { result: SessionCompleteResult | null }) {
    const patternDetails = result?.patternDetails?.filter((p) => p?.name?.trim()) ?? [];
    const fallbackPatterns = result?.patterns?.filter(Boolean) ?? [];
    const fallbackDetail: PatternDetailResponse = {
        name: "",
        description: result?.description ?? null,
        pros: result?.pros ?? [],
        cons: result?.cons ?? [],
    };

    const items =
        patternDetails.length > 0
            ? patternDetails
            : fallbackPatterns.map((name) => ({ ...fallbackDetail, name }));
    if (items.length === 0) {
        return (
            <Text size="sm" c="dimmed">
                Паттерны не определены.
            </Text>
        );
    }

    return (
        <Stack gap="sm">
            {items.map((pattern) => (
                <Paper key={pattern.name} p="md" withBorder radius="md">
                    <Stack gap="sm">
                        <Group justify="space-between" align="center">
                            <Text fw={600}>{pattern.name}</Text>
                            <Badge variant="light" color={successColor}>
                                Паттерн
                            </Badge>
                        </Group>
                        <PatternDetailsBlock detail={pattern} />
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
}

export default function SessionDetailPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [data, setData] = useState<CombinedSessionTreeResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMobile = useMediaQuery("(max-width: 767px)");

    const sessionState = location.state as SessionRouteState | null;
    const backTarget = sessionState?.navContext ?? { label: "Главная", path: "/", id: "home" };

    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }
        navigate(backTarget.path);
    };

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
                        <Button mt="md" variant="subtle" size="sm" onClick={handleGoBack}>
                            Назад
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
                <Space h="md" />
                <Stack gap="lg">
                    <div>
                        <Group justify="space-between" align="center" wrap="wrap">
                            <Breadcrumbs>
                                <Anchor
                                    component="button"
                                    type="button"
                                    c="dimmed"
                                    underline="never"
                                    onClick={() => navigate(backTarget.path)}
                                >
                                    {backTarget.label}
                                </Anchor>
                                <Text size="sm" c="dimmed">
                                    №{sessionId}
                                </Text>
                            </Breadcrumbs>
                            <Button variant="light" size="sm" color={mainColor} onClick={handleGoBack}>
                                Назад
                            </Button>
                        </Group>
                        <Title order={isMobile ? 3 : 2} c={mainColor} mt="xs">
                            Сессия: {projectName}
                        </Title>
                        <Text size="sm" c="dimmed">
                            Завершена: {formatDate(completedAt)}
                        </Text>
                    </div>

                    {styleTree && (
                        <div>
                            <Stack gap="md">
                                <Group justify="space-between" align="center">
                                    <Text fw={600} size="lg">
                                        Результат по стилю
                                    </Text>
                                </Group>
                                <Paper p="md" withBorder radius="md">
                                    <Stack gap="sm">
                                        <Group justify="space-between" align="center" wrap="wrap">
                                            <Text fw={700} size="lg">
                                                {styleTree.result?.architectureStyle ?? "—"}
                                            </Text>
                                            <Badge variant="light" color={mainColor}>
                                                Стиль
                                            </Badge>
                                        </Group>
                                        <ResultBlock result={styleTree.result} />
                                    </Stack>
                                </Paper>
                                <Paper p="md" withBorder radius="md">
                                    <Stack gap="sm">
                                        <Text fw={600}>Ход выбора по дереву стилей</Text>
                                        <Text size="sm" c="dimmed">
                                            Визуализация последовательности вопросов и ответов.
                                        </Text>
                                        <SessionFlowGraph tree={styleTree.tree} accentColor={mainColor} />
                                    </Stack>
                                </Paper>
                            </Stack>
                        </div>
                    )}
                    <Divider label="" labelPosition="left" />
                    {patternsTree && (
                        <div>
                            <Stack gap="md">
                                <Text fw={600} size="lg">
                                    Результат по паттернам
                                </Text>
                                <PatternCards result={patternsTree.result} />
                                <Paper p="md" withBorder radius="md">
                                    <Stack gap="sm">
                                        <Text fw={600}>Ход выбора по дереву паттернов</Text>
                                        <Text size="sm" c="dimmed">
                                            Визуализация последовательности вопросов и ответов.
                                        </Text>
                                        <SessionFlowGraph tree={patternsTree.tree} accentColor={successColor} />
                                    </Stack>
                                </Paper>
                            </Stack>
                        </div>
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
