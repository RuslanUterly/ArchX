import { useState, useMemo } from "react";
import {
    Button,
    Container,
    Paper,
    Stack,
    Text,
    TextInput,
    Title,
    Group,
    List,
    ThemeIcon,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useAuthStore } from "../../auth/store.ts";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import type {
    AnswerResponse,
    CompletedStyleResponse,
    ResultNodeResponse,
    SessionResponse,
    TreeTypeValue,
} from "../api.ts";
import { TreeType, continueWithPatterns, postAnswer, startSession } from "../api.ts";
import LayoutCenter from "../../../shared/components/layout/LayoutCenter.tsx";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
    sub?: string;
}

interface DecisionState {
    sessionId: number;
    treeType: TreeTypeValue;
    currentQuestion: string | null;
    options: string[];
    completed: boolean;
    result: ResultNodeResponse | null;
    canContinueWithPatterns: boolean;
    mode: "style" | "patterns";
}

const isCompletedStyleResponse = (
    response: AnswerResponse,
): response is CompletedStyleResponse => {
    return (response as CompletedStyleResponse).canContinueWithPatterns !== undefined;
};

const mapSessionToState = (
    session: SessionResponse,
    prev?: DecisionState | null,
): DecisionState => ({
    sessionId: session.id,
    treeType: session.treeType,
    currentQuestion: session.currentQuestion,
    options: session.options ?? [],
    completed: session.completed,
    result: session.result ?? null,
    canContinueWithPatterns: prev?.canContinueWithPatterns ?? false,
    mode: prev?.mode ?? (session.treeType === TreeType.ArchitectureStyle ? "style" : "patterns"),
});

export default function DecisionTreePage() {
    const token = useAuthStore((s) => s.accessToken);

    const userId = useMemo(() => {
        if (!token) return null;
        try {
            const decoded = jwtDecode<JwtPayload>(token);
            return decoded.sub ? Number(decoded.sub) : null;
        } catch {
            return null;
        }
    }, [token]);

    const [projectName, setProjectName] = useState<string>("");
    const [state, setState] = useState<DecisionState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStart = async () => {
        if (!userId) {
            setError("Не удалось определить пользователя. Перезайдите в систему.");
            return;
        }

        if (!projectName.trim()) {
            setError("Введите название проекта.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const session = await startSession(userId, {
                projectName: projectName.trim(),
                treeType: TreeType.ArchitectureStyle,
            });

            setState(
                mapSessionToState(session, {
                    sessionId: session.id,
                    treeType: session.treeType,
                    currentQuestion: session.currentQuestion,
                    options: session.options ?? [],
                    completed: session.completed,
                    result: session.result ?? null,
                    canContinueWithPatterns: false,
                    mode: "style",
                }),
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка при запуске сессии");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (answer: string) => {
        if (!state) return;

        setLoading(true);
        setError(null);

        try {
            const response = await postAnswer(state.sessionId, answer);

            if (isCompletedStyleResponse(response)) {
                const result: ResultNodeResponse = {
                    architectureStyle: response.architectureStyle ?? undefined,
                    patterns: response.patterns,
                    description: response.description ?? undefined,
                    pros: response.pros,
                    cons: response.cons,
                };

                setState({
                    ...state,
                    completed: true,
                    currentQuestion: null,
                    options: [],
                    result,
                    canContinueWithPatterns: response.canContinueWithPatterns,
                });
            } else {
                setState(mapSessionToState(response, state));
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Ошибка при отправке ответа");
        } finally {
            setLoading(false);
        }
    };

    const handleContinueWithPatterns = async () => {
        if (!state) return;

        setLoading(true);
        setError(null);

        try {
            const session = await continueWithPatterns(state.sessionId);
            setState(
                mapSessionToState(session, {
                    ...state,
                    canContinueWithPatterns: false,
                    mode: "patterns",
                }),
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : "Не удалось начать опрос по паттернам");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setState(null);
        setProjectName("");
        setError(null);
    };

    const renderResult = (result: ResultNodeResponse | null) => {
        if (!result) return null;

        return (
            <Stack gap="sm">
                {result.architectureStyle && (
                    <Text fw={600} size="lg">
                        Рекомендуемый стиль: {result.architectureStyle}
                    </Text>
                )}

                {result.description && <Text>{result.description}</Text>}

                {result.pros && result.pros.length > 0 && (
                    <Stack gap={4}>
                        <Text fw={500}>Плюсы:</Text>
                        <List spacing={4}>
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
                        <Text fw={500}>Минусы:</Text>
                        <List spacing={4}>
                            {result.cons.map((item) => (
                                <List.Item key={item}>{item}</List.Item>
                            ))}
                        </List>
                    </Stack>
                )}

                {result.patterns && result.patterns.length > 0 && (
                    <Stack gap={4}>
                        <Text fw={500}>
                            {state?.mode === "style"
                                ? "Рекомендуемые паттерны:"
                                : "Подходящие паттерны:"}
                        </Text>
                        <List spacing={4}>
                            {result.patterns.map((pattern) => (
                                <List.Item key={pattern}>{pattern}</List.Item>
                            ))}
                        </List>
                    </Stack>
                )}
            </Stack>
        );
    };

    return (
        <LayoutCenter>
            <Container size="md">
                <Paper p="lg" radius="md" withBorder>
                    <Stack gap="lg">
                        <Title order={2} c={mainColor}>
                            Опросник по архитектурным решениям
                        </Title>

                        {!state && (
                            <Stack gap="sm">
                                <Text c="dimmed">
                                    Укажите название проекта и начните опрос. Вопросы будут
                                    подбираться на основе предыдущих ответов.
                                </Text>

                                <TextInput
                                    label="Название проекта"
                                    placeholder="Например, CRM для отдела продаж"
                                    value={projectName}
                                    onChange={(event) => setProjectName(event.currentTarget.value)}
                                />

                                <Group justify="space-between" mt="md">
                                    <Text size="sm" c="dimmed">
                                        Будет запущено дерево выбора архитектурного стиля.
                                    </Text>
                                    <Button
                                        color={mainColor}
                                        onClick={handleStart}
                                        loading={loading}
                                    >
                                        Начать опрос
                                    </Button>
                                </Group>
                            </Stack>
                        )}

                        {state && (
                            <Stack gap="lg">
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">
                                        Проект: <b>{projectName}</b>
                                    </Text>
                                    <Button variant="subtle" color="red" onClick={handleReset}>
                                        Начать заново
                                    </Button>
                                </Group>

                                {!state.completed && state.currentQuestion && (
                                    <Stack gap="md">
                                        <Text fw={500}>{state.currentQuestion}</Text>

                                        <Stack gap="xs">
                                            {state.options.map((option) => (
                                                <Button
                                                    key={option}
                                                    variant="outline"
                                                    color={mainColor}
                                                    disabled={loading}
                                                    onClick={() => handleAnswer(option)}
                                                >
                                                    {option}
                                                </Button>
                                            ))}
                                        </Stack>
                                    </Stack>
                                )}

                                {state.completed && (
                                    <Stack gap="md">
                                        <Text fw={600} size="lg">
                                            Результат опроса
                                        </Text>
                                        {renderResult(state.result)}

                                        {state.mode === "style" &&
                                            state.canContinueWithPatterns && (
                                                <Group mt="sm">
                                                    <Button
                                                        color={mainColor}
                                                        onClick={handleContinueWithPatterns}
                                                        loading={loading}
                                                    >
                                                        Продолжить с выбором паттернов
                                                    </Button>
                                                </Group>
                                            )}
                                    </Stack>
                                )}
                            </Stack>
                        )}

                        {error && (
                            <Text c="red" size="sm">
                                {error}
                            </Text>
                        )}
                    </Stack>
                </Paper>
            </Container>
        </LayoutCenter>
    );
}

