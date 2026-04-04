import {
    Anchor,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Text,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useAuthStore } from "../../auth/store.ts";
import {
    getPublicStatistics,
    getStatistics,
    type PublicStatistics,
    type StatisticsResponse,
} from "../api.ts";

function StatCell({ label, value }: { label: string; value: number | string }) {
    return (
        <Stack gap={2}>
            <Text size="xs" c="dimmed" lh={1.3}>
                {label}
            </Text>
            <Text fw={600} size="lg" c={mainColor}>
                {value}
            </Text>
        </Stack>
    );
}

export default function StatisticsMiniBlock() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const [publicData, setPublicData] = useState<PublicStatistics | null>(null);
    const [authData, setAuthData] = useState<StatisticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const run = async () => {
            try {
                if (isAuthenticated) {
                    const s = await getStatistics();
                    if (!cancelled) setAuthData(s);
                } else {
                    const p = await getPublicStatistics();
                    if (!cancelled) setPublicData(p);
                }
            } catch (e) {
                if (!cancelled)
                    setError(e instanceof Error ? e.message : "Ошибка загрузки");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

    return (
        <Paper p="md" radius="md" withBorder>
            <Stack gap="sm">
                <Group justify="space-between" align="flex-start" wrap="wrap">
                    <Text fw={600} c={mainColor}>
                        Статистика
                    </Text>
                    {isAuthenticated && (
                        <Anchor component={Link} to="/statistics" size="sm" c={mainColor}>
                            Подробнее
                        </Anchor>
                    )}
                </Group>

                {loading && (
                    <Group justify="center" py="xs">
                        <Loader size="sm" color={mainColor} />
                    </Group>
                )}
                {error && (
                    <Text size="sm" c="red">
                        {error}
                    </Text>
                )}

                {!loading && !error && isAuthenticated && authData && (
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                        <StatCell
                            label="Сессий в сервисе"
                            value={authData.personal.globalTotalSessions}
                        />
                        <StatCell label="Ваших сессий" value={authData.personal.myTotalSessions} />
                        <StatCell
                            label="Завершено вами"
                            value={authData.personal.myCompletedSessions}
                        />
                        <StatCell
                            label="Обращений в поддержку"
                            value={authData.personal.myFeedbackTickets}
                        />
                    </SimpleGrid>
                )}

                {!loading && !error && !isAuthenticated && publicData && (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        <StatCell label="Всего сессий" value={publicData.totalSessions} />
                        <StatCell label="Пользователей" value={publicData.registeredUsers} />
                    </SimpleGrid>
                )}
            </Stack>
        </Paper>
    );
}
