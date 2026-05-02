import {
    Button,
    Container,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Space,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import {
    IconChecklist,
    IconDeviceAnalytics,
    IconRouteSquare,
    IconSparkles,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useMediaQuery } from "@mantine/hooks";
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
    const isMobile = useMediaQuery("(max-width: 767px)");

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
                        <Title order={isMobile ? 3 : 2} c={mainColor}>
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
                                    <Group
                                        gap="sm"
                                        wrap="wrap"
                                        style={{ width: isMobile ? "100%" : undefined }}
                                    >
                                        <Button
                                            color={mainColor}
                                            variant="light"
                                            onClick={() => navigate("/statistics")}
                                            fullWidth={Boolean(isMobile)}
                                        >
                                            Статистика
                                        </Button>
                                        <Button
                                            color={mainColor}
                                            variant="light"
                                            onClick={() => navigate("/feedback")}
                                            fullWidth={Boolean(isMobile)}
                                        >
                                            Обратная связь
                                        </Button>
                                        <Button
                                            color={mainColor}
                                            variant="outline"
                                            onClick={() => navigate("/decision-tree/editor")}
                                            fullWidth={Boolean(isMobile)}
                                        >
                                            Редактор деревьев
                                        </Button>
                                    </Group>
                                </Stack>
                            ) : isAuthenticated ? (
                                <>
                                    <Group align="center" justify="space-between" w="100%" wrap="wrap">
                                        <Text size="sm" c="dimmed">
                                            Чтобы начать, нажмите кнопку →
                                        </Text>
                                        <Button 
                                            color={mainColor} 
                                            onClick={() => navigate("/decision-tree")}
                                            fullWidth={Boolean(isMobile)}
                                        >
                                            Начать опрос
                                        </Button>
                                    </Group>
                                </>
                            ) : (
                                <>
                                    <Group align="center" justify="space-between" w="100%" wrap="wrap">
                                        <Text size="sm" c="dimmed">
                                            Чтобы начать, нужно войти в аккаунт.
                                        </Text>
                                        <Button
                                            color={mainColor}
                                            onClick={() => navigate("/auth/login")}
                                            fullWidth={Boolean(isMobile)}
                                        >
                                            Войти
                                        </Button>
                                    </Group>
                                </>
                            )}
                        </Group>
                    </Stack>
                </Paper>

                {!isAuthenticated && (
                    <>
                        {/* <Paper p="lg" radius="md" withBorder> */}
                            <Stack gap="md">
                                <Title order={isMobile ? 4 : 3}>Что вы получите в ArchX</Title>
                                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                                    <Paper p="md" radius="md" withBorder>
                                        <Stack gap="xs">
                                            <ThemeIcon size={34} radius="xl" color={mainColor} variant="light">
                                                <IconRouteSquare size={18} />
                                            </ThemeIcon>
                                            <Text fw={600}>Рекомендация по паттернам</Text>
                                            <Text size="sm" c="dimmed">
                                                Подбираем архитектурный стиль и паттерны под ваш сценарий.
                                            </Text>
                                        </Stack>
                                    </Paper>
                                    <Paper p="md" radius="md" withBorder>
                                        <Stack gap="xs">
                                            <ThemeIcon size={34} radius="xl" color={mainColor} variant="light">
                                                <IconChecklist size={18} />
                                            </ThemeIcon>
                                            <Text fw={600}>Быстрый сценарий вопросов</Text>
                                            <Text size="sm" c="dimmed">
                                                Короткий динамический опрос без лишних шагов и сложной настройки.
                                            </Text>
                                        </Stack>
                                    </Paper>
                                    <Paper p="md" radius="md" withBorder>
                                        <Stack gap="xs">
                                            <ThemeIcon size={34} radius="xl" color={mainColor} variant="light">
                                                <IconDeviceAnalytics size={18} />
                                            </ThemeIcon>
                                            <Text fw={600}>Прозрачный результат</Text>
                                            <Text size="sm" c="dimmed">
                                                Получайте обоснованный итог и храните историю результатов в одном месте.
                                            </Text>
                                        </Stack>
                                    </Paper>
                                </SimpleGrid>
                            </Stack>
                        {/* </Paper> */}

                        {/* <Paper p="lg" radius="md" withBorder> */}
                            <Stack gap="md">
                                <Group justify="space-between" align="center" wrap="wrap">
                                    <Title order={isMobile ? 4 : 3}>Как это работает</Title>
                                    <ThemeIcon size={34} radius="xl" color={mainColor} variant="light">
                                        <IconSparkles size={18} />
                                    </ThemeIcon>
                                </Group>
                                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                                    <Paper p="md" radius="md" withBorder>
                                        <Stack gap={4}>
                                            <Text fw={700} c={mainColor}>
                                                1
                                            </Text>
                                            <Text fw={600}>Вход или регистрация</Text>
                                            <Text size="sm" c="dimmed">
                                                Создайте аккаунт, чтобы сохранять результаты и продолжать работу позже.
                                            </Text>
                                        </Stack>
                                    </Paper>
                                    <Paper p="md" radius="md" withBorder>
                                        <Stack gap={4}>
                                            <Text fw={700} c={mainColor}>
                                                2
                                            </Text>
                                            <Text fw={600}>Ответы на вопросы</Text>
                                            <Text size="sm" c="dimmed">
                                                Пройдите короткий опрос: каждое следующее поле зависит от ваших ответов.
                                            </Text>
                                        </Stack>
                                    </Paper>
                                    <Paper p="md" radius="md" withBorder>
                                        <Stack gap={4}>
                                            <Text fw={700} c={mainColor}>
                                                3
                                            </Text>
                                            <Text fw={600}>Готовая рекомендация</Text>
                                            <Text size="sm" c="dimmed">
                                                Получите результат и вернитесь к нему в любой момент из истории.
                                            </Text>
                                        </Stack>
                                    </Paper>
                                </SimpleGrid>
                                <Group justify="space-between" align="center" wrap="wrap">
                                    <Text size="sm" c="dimmed">
                                        Уже есть аккаунт? Войдите и начните первую сессию.
                                    </Text>
                                </Group>
                            </Stack>
                        {/* </Paper> */}
                    </>
                )}

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
