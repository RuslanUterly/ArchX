import { Button, Container, Group, Loader, Paper, Space, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useAuthStore } from "../../auth/store.ts";
import { LastSessionDetails } from "../../results/components/LastSessionDetails.tsx";
import { useResultsStore } from "../../results/store.ts";
import StatisticsMiniBlock from "../../statistics/components/StatisticsMiniBlock.tsx";

export default function HomePage() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const roles = useAuthStore((s) => s.roles);
    const isAdmin = useMemo(
        () => roles.some((r) => r.toLowerCase() === "admin"),
        [roles],
    );
    const isUserRole = isAuthenticated && roles.includes("User") && !roles.includes("Admin");

    const latestSession = useResultsStore((s) => s.latestSession);
    const latestLoading = useResultsStore((s) => s.latestLoading);
    const latestError = useResultsStore((s) => s.latestError);
    const loadLatest = useResultsStore((s) => s.loadLatest);

    useEffect(() => {
        if (!isUserRole) return;
        void loadLatest();
    }, [isUserRole, loadLatest]);

    return (
        <Container size="md" style={{ width: "100%" }}>
            <Space h="xl" />
            <Stack gap="lg">
                <StatisticsMiniBlock />

                <Paper p="lg" radius="md" withBorder>
                    <Stack gap="md">
                        <Title order={2} c={mainColor}>
                            ArchX
                        </Title>
                        {
                            !isAdmin && (
                                <Text c="dimmed">
                                    Поможем выбрать архитектурный стиль и подходящие паттерны на основе
                                    короткого опросника. Вопросы подбираются динамически по вашим ответам.
                                </Text>
                            )
                        }

                        <Group justify="space-between" mt={!isAdmin ? "sm" : ""} align="flex-start" wrap="wrap">
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
                                            variant="light"
                                            onClick={() => navigate("/feedback")}
                                        >
                                            Обратная связь
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
                                        Чтобы начать, нажмите кнопку →
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
                    <div>
                        <Stack gap="md">

                            {latestError && (
                                <Text c="red" size="sm">
                                    {latestError}
                                </Text>
                            )}

                            {latestLoading ? (
                                <Group justify="center" py="md">
                                    <Loader size="sm" color={mainColor} />
                                </Group>
                            ) : latestSession ? (
                                <LastSessionDetails
                                    session={latestSession}
                                    sectionAction={{
                                        label: "Все результаты",
                                        onClick: () => navigate("/results"),
                                    }}
                                />
                            ) : !latestError ? (
                                <Text c="dimmed" size="sm">
                                    Пока нет завершённых сессий. Пройдите опрос, чтобы увидеть сводку здесь.
                                </Text>
                            ) : null}
                        </Stack>
                    </div>
                )}
            </Stack>
            <Space h="xl" />
        </Container>
    );
}
