import {
    Badge,
    Box,
    Container,
    Divider,
    Group,
    Loader,
    Paper,
    Progress,
    SimpleGrid,
    Space,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { IconArrowNarrowDown, IconArrowNarrowUp, IconChartLine, IconHash } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useAuthStore } from "../../auth/store.ts";
import { getStatistics, type AdminStatistics, type StatisticsResponse } from "../api.ts";
import { gradeLabel, professionLabel } from "../labels.ts";

function StatTile({ label, value }: { label: string; value: number | string }) {
    return (
        <Paper p="md" radius="md" withBorder bg="var(--mantine-color-body)">
            <Stack gap={6}>
                <Text size="xs" c="dimmed" fw={600}>
                    {label}
                </Text>
                <Group justify="space-between" align="flex-end" wrap="nowrap">
                    <Text fw={700} size="xl" c={mainColor}>
                        {value}
                    </Text>
                    <IconChartLine size={18} color="var(--mantine-color-dimmed)" />
                </Group>
            </Stack>
        </Paper>
    );
}

function formatShortDate(date: string) {
    return new Date(date).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
    });
}

function DailyLineChartCard({
    title,
    rows,
}: {
    title: string;
    rows: { date: string; count: number }[];
}) {
    const data = rows.slice(-30);
    const total = data.reduce((sum, row) => sum + row.count, 0);
    const maxCount = Math.max(1, ...data.map((row) => row.count));
    const average = data.length > 0 ? Math.round(total / data.length) : 0;
    const current = data[data.length - 1]?.count ?? 0;
    const previous = data[data.length - 2]?.count ?? 0;
    const delta = current - previous;

    const chartHeight = 180;
    const chartWidth = 640;
    const paddingX = 26;
    const paddingTop = 16;
    const paddingBottom = 28;
    const innerWidth = chartWidth - paddingX * 2;
    const innerHeight = chartHeight - paddingTop - paddingBottom;

    const points = data.map((row, index) => {
        const x =
            data.length === 1 ? paddingX + innerWidth / 2 : paddingX + (index / (data.length - 1)) * innerWidth;
        const y = paddingTop + innerHeight - (row.count / maxCount) * innerHeight;
        return { x, y, count: row.count };
    });
    const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
    const areaPath =
        points.length > 0
            ? `${linePath} L${points[points.length - 1].x} ${paddingTop + innerHeight} L${points[0].x} ${paddingTop + innerHeight} Z`
            : "";
    const chartId = `stat-gradient-${title.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase()}`;
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const activePoint = selectedIndex !== null ? points[selectedIndex] : null;
    const activeRow = selectedIndex !== null ? data[selectedIndex] : null;
    const tooltipLeftPercent = activePoint ? (activePoint.x / chartWidth) * 100 : 0;

    const getClosestPointIndex = (event: React.MouseEvent<SVGSVGElement>) => {
        if (points.length === 0) return null;
        const bounds = event.currentTarget.getBoundingClientRect();
        const relativeX = ((event.clientX - bounds.left) / bounds.width) * chartWidth;
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;
        points.forEach((point, index) => {
            const distance = Math.abs(point.x - relativeX);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });
        return nearestIndex;
    };

    const handleChartClick = (event: React.MouseEvent<SVGSVGElement>) => {
        const nextIndex = getClosestPointIndex(event);
        if (nextIndex === null) return;
        setSelectedIndex((prev) => (prev === nextIndex ? null : nextIndex));
    };

    const labelDates = Array.from(
        new Set([data[0]?.date, data[Math.floor((data.length - 1) / 2)]?.date, data[data.length - 1]?.date].filter(Boolean)),
    ) as string[];

    return (
        <Paper p="md" radius="md" withBorder>
            <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                    <Text fw={600}>{title}</Text>
                    <Badge variant="light" color={mainColor}>
                        30 дней
                    </Badge>
                </Group>

                {data.length === 0 ? (
                    <Text size="sm" c="dimmed">
                        Нет данных по дням.
                    </Text>
                ) : (
                    <>
                        <Group grow>
                            <Paper p="xs" radius="sm" withBorder>
                                <Text size="xs" c="dimmed">
                                    Всего за период
                                </Text>
                                <Text fw={700}>{total}</Text>
                            </Paper>
                            <Paper p="xs" radius="sm" withBorder>
                                <Text size="xs" c="dimmed">
                                    Среднее в день
                                </Text>
                                <Text fw={700}>{average}</Text>
                            </Paper>
                            <Paper p="xs" radius="sm" withBorder>
                                <Text size="xs" c="dimmed">
                                    Последний день
                                </Text>
                                <Group gap={6}>
                                    <Text fw={700}>{current}</Text>
                                    {delta !== 0 && (
                                        <Badge
                                            size="sm"
                                            variant="light"
                                            color={delta > 0 ? "green" : "red"}
                                            leftSection={
                                                delta > 0 ? (
                                                    <IconArrowNarrowUp size={14} />
                                                ) : (
                                                    <IconArrowNarrowDown size={14} />
                                                )
                                            }
                                        >
                                            {Math.abs(delta)}
                                        </Badge>
                                    )}
                                </Group>
                            </Paper>
                        </Group>

                        <Box pos="relative">
                            <Box
                                component="svg"
                                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                style={{ width: "100%", height: 200, display: "block", cursor: "pointer" }}
                                onClick={handleChartClick}
                            >
                                <defs>
                                    <linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={mainColor} stopOpacity="0.25" />
                                        <stop offset="100%" stopColor={mainColor} stopOpacity="0.02" />
                                    </linearGradient>
                                </defs>
                                {[0, 0.25, 0.5, 0.75, 1].map((step) => {
                                    const y = paddingTop + innerHeight * step;
                                    return (
                                        <line
                                            key={step}
                                            x1={paddingX}
                                            y1={y}
                                            x2={chartWidth - paddingX}
                                            y2={y}
                                            stroke="var(--mantine-color-gray-3)"
                                            strokeDasharray="4 4"
                                        />
                                    );
                                })}
                                {activePoint && (
                                    <line
                                        x1={activePoint.x}
                                        y1={paddingTop}
                                        x2={activePoint.x}
                                        y2={paddingTop + innerHeight}
                                        stroke={mainColor}
                                        strokeOpacity={0.35}
                                        strokeDasharray="6 4"
                                    />
                                )}
                                {areaPath && (
                                    <path
                                        d={areaPath}
                                        fill={`url(#${chartId})`}
                                        stroke="none"
                                    />
                                )}
                                {linePath && (
                                    <path
                                        d={linePath}
                                        fill="none"
                                        stroke={mainColor}
                                        strokeWidth={2.5}
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                    />
                                )}
                                {points.map((point, index) => (
                                    <circle
                                        key={index}
                                        cx={point.x}
                                        cy={point.y}
                                        r={index === selectedIndex ? 5 : index === points.length - 1 ? 4 : 2.8}
                                        fill={mainColor}
                                        stroke={index === selectedIndex ? "white" : "none"}
                                        strokeWidth={index === selectedIndex ? 2 : 0}
                                    />
                                ))}
                            </Box>

                            {activeRow && (
                                <Paper
                                    p={6}
                                    radius="sm"
                                    withBorder
                                    shadow="sm"
                                    style={{
                                        position: "absolute",
                                        top: 10,
                                        left: `${tooltipLeftPercent}%`,
                                        transform: "translateX(-50%)",
                                        pointerEvents: "none",
                                        minWidth: 134,
                                        maxWidth: 180,
                                        zIndex: 1,
                                    }}
                                >
                                    <Text size="xs" fw={600}>
                                        {formatShortDate(activeRow.date)}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        Количество: {activeRow.count}
                                    </Text>
                                </Paper>
                            )}
                        </Box>

                        <Group justify="space-between" gap="xs">
                            {labelDates.map((date, index) => (
                                <Text key={`${date}-${index}`} size="xs" c="dimmed">
                                    {formatShortDate(date)}
                                </Text>
                            ))}
                        </Group>
                    </>
                )}
            </Stack>
        </Paper>
    );
}

function RankedList({
    items,
    emptyHint,
}: {
    items: { name: string; count: number }[];
    emptyHint: string;
}) {
    const topValue = Math.max(1, ...items.map((item) => item.count));

    if (items.length === 0) {
        return (
            <Text size="sm" c="dimmed">
                {emptyHint}
            </Text>
        );
    }

    return (
        <Stack gap="sm">
            {items.map((item, index) => {
                const percent = Math.round((item.count / topValue) * 100);
                return (
                    <Paper key={item.name} p="sm" radius="sm" withBorder>
                        <Group justify="space-between" align="flex-start" wrap="nowrap" mb={6}>
                            <Group gap="xs" wrap="nowrap">
                                <Badge
                                    size="lg"
                                    radius="sm"
                                    variant={index === 0 ? "filled" : "light"}
                                    color={index === 0 ? mainColor : "gray"}
                                    leftSection={<IconHash size={12} />}
                                >
                                    {index + 1}
                                </Badge>
                                <Text size="sm" lineClamp={2}>
                                    {item.name}
                                </Text>
                            </Group>
                            <Text size="sm" fw={600} c={mainColor} style={{ flexShrink: 0 }}>
                                {item.count}
                            </Text>
                        </Group>
                        <Progress value={percent} color={mainColor} size="sm" radius="xl" />
                    </Paper>
                );
            })}
        </Stack>
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
            <Stack gap="sm">
                <Text fw={600}>{title}</Text>
                <RankedList items={items} emptyHint={emptyHint} />
            </Stack>
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
                        <Stack gap="sm">
                            <Group justify="space-between">
                                <Text fw={600} size="sm">
                                    {gradeLabel(b.grade)}
                                </Text>
                                <Badge variant="light" color={mainColor}>
                                    {b.topItems.reduce((sum, item) => sum + item.count, 0)} событий
                                </Badge>
                            </Group>
                            <Divider />
                            <RankedList items={b.topItems} emptyHint={emptyHint} />
                        </Stack>
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
                        <Stack gap="sm">
                            <Group justify="space-between">
                                <Text fw={600} size="sm">
                                    {professionLabel(b.profession)}
                                </Text>
                                <Badge variant="light" color={mainColor}>
                                    {b.topItems.reduce((sum, item) => sum + item.count, 0)} событий
                                </Badge>
                            </Group>
                            <Divider />
                            <RankedList
                                items={b.topItems}
                                emptyHint="Пока нет данных по завершённым сессиям с паттернами."
                            />
                        </Stack>
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
                <DailyLineChartCard title="Новые сессии по дням (старт)" rows={admin.sessionsPerDay} />
                <DailyLineChartCard title="Обращения по дням" rows={admin.feedbackTicketsPerDay} />
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
