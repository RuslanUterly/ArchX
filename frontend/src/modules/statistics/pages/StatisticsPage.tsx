import {
    Container,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Space,
    Stack,
    Table,
    Text,
    Title,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useAuthStore } from "../../auth/store.ts";
import { getStatistics, type AdminStatistics, type StatisticsResponse } from "../api.ts";
import { gradeLabel, professionLabel } from "../labels.ts";

function StatTile({ label, value }: { label: string; value: number | string }) {
    return (
        <Paper p="md" radius="md" withBorder>
            <Text size="xs" c="dimmed" mb={4}>
                {label}
            </Text>
            <Text fw={700} size="xl" c={mainColor}>
                {value}
            </Text>
        </Paper>
    );
}

function DailyTable({
    title,
    rows,
}: {
    title: string;
    rows: { date: string; count: number }[];
}) {
    const tail = rows.slice(-14);
    return (
        <Paper p="md" radius="md" withBorder>
            <Text fw={600} mb="sm">
                {title}
            </Text>
            <Table striped highlightOnHover verticalSpacing="xs" fz="sm">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Дата</Table.Th>
                        <Table.Th style={{ textAlign: "right" }}>Количество</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {tail.map((r) => (
                        <Table.Tr key={r.date}>
                            <Table.Td>
                                {new Date(r.date).toLocaleDateString("ru-RU", {
                                    day: "2-digit",
                                    month: "2-digit",
                                })}
                            </Table.Td>
                            <Table.Td style={{ textAlign: "right" }}>{r.count}</Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
            <Text size="xs" c="dimmed" mt="xs">
                Показаны последние 14 дней из 30.
            </Text>
        </Paper>
    );
}

function OverallTopList({
    title,
    items,
    emptyHint,
}: {
    title: string;
    items: { name: string; count: number }[];
    emptyHint: string;
}) {
    return (
        <Paper p="md" radius="md" withBorder>
            <Text fw={600} mb="sm">
                {title}
            </Text>
            {items.length === 0 ? (
                <Text size="sm" c="dimmed">
                    {emptyHint}
                </Text>
            ) : (
                <Stack gap={6}>
                    {items.map((t) => (
                        <Group key={t.name} justify="space-between" gap="xs" wrap="nowrap">
                            <Text size="sm" lineClamp={2}>
                                {t.name}
                            </Text>
                            <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                                {t.count}
                            </Text>
                        </Group>
                    ))}
                </Stack>
            )}
        </Paper>
    );
}

function GradeBreakdownBlock({
    heading,
    items,
    emptyHint,
}: {
    heading: string;
    items: { grade: number; topItems: { name: string; count: number }[] }[];
    emptyHint: string;
}) {
    return (
        <Stack gap="md">
            <Title order={4}>{heading}</Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {items.map((b) => (
                    <Paper key={b.grade} p="md" radius="md" withBorder>
                        <Text fw={600} size="sm" mb="sm">
                            {gradeLabel(b.grade)}
                        </Text>
                        {b.topItems.length === 0 ? (
                            <Text size="sm" c="dimmed">
                                {emptyHint}
                            </Text>
                        ) : (
                            <Stack gap={6}>
                                {b.topItems.map((t) => (
                                    <Group key={t.name} justify="space-between" gap="xs" wrap="nowrap">
                                        <Text size="sm" lineClamp={2}>
                                            {t.name}
                                        </Text>
                                        <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                                            {t.count}
                                        </Text>
                                    </Group>
                                ))}
                            </Stack>
                        )}
                    </Paper>
                ))}
            </SimpleGrid>
        </Stack>
    );
}

function ProfessionPatternsBlock({
    items,
}: {
    items: { profession: number; topItems: { name: string; count: number }[] }[];
}) {
    return (
        <Stack gap="md">
            <Title order={4}>Паттерны по профессии</Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {items.map((b) => (
                    <Paper key={b.profession} p="md" radius="md" withBorder>
                        <Text fw={600} size="sm" mb="sm">
                            {professionLabel(b.profession)}
                        </Text>
                        {b.topItems.length === 0 ? (
                            <Text size="sm" c="dimmed">
                                Пока нет данных по завершённым сессиям с паттернами.
                            </Text>
                        ) : (
                            <Stack gap={6}>
                                {b.topItems.map((t) => (
                                    <Group key={t.name} justify="space-between" gap="xs" wrap="nowrap">
                                        <Text size="sm" lineClamp={2}>
                                            {t.name}
                                        </Text>
                                        <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                                            {t.count}
                                        </Text>
                                    </Group>
                                ))}
                            </Stack>
                        )}
                    </Paper>
                ))}
            </SimpleGrid>
        </Stack>
    );
}

function AdminSection({ admin }: { admin: AdminStatistics }) {
    return (
        <Stack gap="xl">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                <StatTile label="Завершённых сессий" value={admin.completedSessionsTotal} />
                <StatTile label="Обращений обратной связи" value={admin.feedbackTicketsTotal} />
                <StatTile
                    label="Пользователей с сессиями"
                    value={admin.distinctUsersWithSessions}
                />
                <StatTile label="Активных за 7 дней" value={admin.activeUsersLast7Days} />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <DailyTable title="Новые сессии по дням (старт)" rows={admin.sessionsPerDay} />
                <DailyTable title="Обращения по дням" rows={admin.feedbackTicketsPerDay} />
            </SimpleGrid>

            <Stack gap="md">
                <Title order={4}>Все пользователи</Title>
                <Text size="sm" c="dimmed">
                    Учитываются все завершённые сессии. Ниже — отдельно только сессии пользователей с
                    указанным в профиле грейдом или профессией.
                </Text>
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    <OverallTopList
                        title="Популярные архитектурные стили"
                        items={admin.topArchitectureStylesOverall}
                        emptyHint="Нет завершённых сессий по выбору стиля."
                    />
                    <OverallTopList
                        title="Популярные паттерны среды"
                        items={admin.topPatternsOverall}
                        emptyHint="Нет завершённых сессий по деревьям паттернов."
                    />
                </SimpleGrid>
            </Stack>

            <GradeBreakdownBlock
                heading="Стили по грейду"
                items={admin.topArchitectureStylesByGrade}
                emptyHint="Нет завершённых сессий по выбору стиля для этого грейда."
            />

            <GradeBreakdownBlock
                heading="Паттерны по грейду"
                items={admin.topPatternsByGrade}
                emptyHint="Нет завершённых сессий по деревьям паттернов для этого грейда."
            />

            <ProfessionPatternsBlock items={admin.topPatternsByProfession} />
        </Stack>
    );
}

export default function StatisticsPage() {
    const roles = useAuthStore((s) => s.roles);
    const isAdmin = useMemo(
        () => roles.some((r) => r.toLowerCase() === "admin"),
        [roles],
    );

    const [data, setData] = useState<StatisticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        getStatistics()
            .then((r) => {
                if (!cancelled) setData(r);
            })
            .catch((e) => {
                if (!cancelled) setError(e instanceof Error ? e.message : "Ошибка загрузки");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const completionHint = useMemo(() => {
        if (!data || isAdmin) return null;
        const { myTotalSessions, myCompletedSessions } = data.personal;
        if (myTotalSessions === 0) return null;
        const pct = Math.round((myCompletedSessions / myTotalSessions) * 100);
        return `Завершено ${pct}% от всех ваших сессий (${myCompletedSessions} из ${myTotalSessions}).`;
    }, [data, isAdmin]);

    return (
        <Container size="md" style={{ width: "100%" }}>
            <Space h="xl" />
            <Stack gap="xl">
                <Title order={2} c={mainColor}>
                    Статистика
                </Title>
                <Text size="sm" c="dimmed">
                    {isAdmin
                        ? "Сводка по сервису: сессии, обращения и разрезы по аудитории."
                        : "Сводка по опросам и обращениям. Данные считаются из уже сохранённых сессий и тикетов."}
                </Text>

                {loading && (
                    <Group justify="center" py="xl">
                        <Loader color={mainColor} />
                    </Group>
                )}
                {error && (
                    <Text c="red" size="sm">
                        {error}
                    </Text>
                )}

                {!loading && !error && data && (
                    <>
                        {!isAdmin && (
                            <Stack gap="md">
                                <Title order={3}>Ваши показатели</Title>
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                    <StatTile
                                        label="Всего сессий в сервисе"
                                        value={data.personal.globalTotalSessions}
                                    />
                                    <StatTile label="Ваших сессий" value={data.personal.myTotalSessions} />
                                    <StatTile
                                        label="Завершённых вами"
                                        value={data.personal.myCompletedSessions}
                                    />
                                    <StatTile
                                        label="Обращений в поддержку"
                                        value={data.personal.myFeedbackTickets}
                                    />
                                </SimpleGrid>
                                {completionHint && (
                                    <Text size="sm" c="dimmed">
                                        {completionHint}
                                    </Text>
                                )}
                            </Stack>
                        )}

                        {data.admin && <AdminSection admin={data.admin} />}
                    </>
                )}
            </Stack>
            <Space h="xl" />
        </Container>
    );
}
