import {
    Anchor,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Text,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useAuthStore } from "../../auth/store.ts";
import {
    getPublicStatistics,
    getStatistics,
    type PublicStatistics,
    type StatisticsResponse,
} from "../api.ts";

interface AdminOverviewMini {
    totalSessions: number;
    registeredUsers: number;
    completedSessions: number;
    feedbackTickets: number;
}

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
    const roles = useAuthStore((s) => s.roles);
    const isAdmin = useMemo(
        () => roles.some((r) => r.toLowerCase() === "admin"),
        [roles],
    );

    const [publicData, setPublicData] = useState<PublicStatistics | null>(null);
    const [authData, setAuthData] = useState<StatisticsResponse | null>(null);
    const [adminOverview, setAdminOverview] = useState<AdminOverviewMini | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setPublicData(null);
        setAuthData(null);
        setAdminOverview(null);

        const run = async () => {
            try {
                if (!isAuthenticated) {
                    const p = await getPublicStatistics();
                    if (!cancelled) setPublicData(p);
                    return;
                }

                if (isAdmin) {
                    const [p, s] = await Promise.all([getPublicStatistics(), getStatistics()]);
                    if (!cancelled) {
                        setAdminOverview({
                            totalSessions: p.totalSessions,
                            registeredUsers: p.registeredUsers,
                            completedSessions: s.admin?.completedSessionsTotal ?? 0,
                            feedbackTickets: s.admin?.feedbackTicketsTotal ?? 0,
                        });
                    }
                    return;
                }

                const s = await getStatistics();
                if (!cancelled) setAuthData(s);
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
    }, [isAuthenticated, isAdmin]);

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

                {!loading && !error && isAuthenticated && isAdmin && adminOverview && (
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                        <StatCell label="Всего сессий" value={adminOverview.totalSessions} />
                        <StatCell label="Пользователей" value={adminOverview.registeredUsers} />
                        <StatCell
                            label="Завершённых сессий"
                            value={adminOverview.completedSessions}
                        />
                        <StatCell label="Обращений в поддержку" value={adminOverview.feedbackTickets} />
                    </SimpleGrid>
                )}

                {!loading && !error && isAuthenticated && !isAdmin && authData && (
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
