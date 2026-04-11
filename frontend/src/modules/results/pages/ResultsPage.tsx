import {
    Badge,
    Box,
    Container,
    Divider,
    Group,
    Loader,
    Pagination,
    Space,
    Stack,
    Text,
    Title,
    UnstyledButton,
} from "@mantine/core";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { RESULTS_PAGE_SIZE } from "../api.ts";
import { LastSessionDetails } from "../components/LastSessionDetails.tsx";
import {
    formatSessionDate,
    getSessionTypeLabel,
    sessionSummaryLabel,
} from "../sessionUtils.ts";
import { useResultsStore } from "../store.ts";
import classes from "./ResultsPage.module.css";

export default function ResultsPage() {
    const navigate = useNavigate();

    const latestSession = useResultsStore((s) => s.latestSession);
    const sessions = useResultsStore((s) => s.sessions);
    const totalCount = useResultsStore((s) => s.totalCount);
    const page = useResultsStore((s) => s.page);
    const latestLoading = useResultsStore((s) => s.latestLoading);
    const listLoading = useResultsStore((s) => s.listLoading);
    const latestError = useResultsStore((s) => s.latestError);
    const listError = useResultsStore((s) => s.listError);
    const loadLatest = useResultsStore((s) => s.loadLatest);
    const loadList = useResultsStore((s) => s.loadList);
    const setPage = useResultsStore((s) => s.setPage);

    useEffect(() => {
        void loadLatest();
        void loadList();
    }, [loadLatest, loadList]);

    const totalPages = Math.max(1, Math.ceil(totalCount / RESULTS_PAGE_SIZE));
    const from = totalCount === 0 ? 0 : (page - 1) * RESULTS_PAGE_SIZE + 1;
    const to = Math.min(page * RESULTS_PAGE_SIZE, totalCount);

    return (
        <Container size="md" style={{ width: "100%" }}>
            <Space h="xl" />
            <Stack gap="lg">
                <Title order={2} c={mainColor}>
                    Результаты
                </Title>

                <Stack gap="md">
                    {(latestError || listError) && (
                        <Stack gap={4}>
                            {latestError && (
                                <Text c="red" size="sm">
                                    {latestError}
                                </Text>
                            )}
                            {listError && (
                                <Text c="red" size="sm">
                                    {listError}
                                </Text>
                            )}
                        </Stack>
                    )}

                    {latestLoading ? (
                        <Group justify="center" py="md">
                            <Loader size="sm" color={mainColor} />
                        </Group>
                    ) : latestSession ? (
                        <LastSessionDetails session={latestSession} />
                    ) : !latestError ? (
                        <Text c="dimmed" size="sm">
                            Пока нет завершённых сессий. Пройдите опрос на главной, чтобы появились
                            результаты.
                        </Text>
                    ) : null}

                    <Divider label="Все сессии" labelPosition="left" />

                    {listLoading ? (
                        <Group justify="center" py="md">
                            <Loader size="sm" color={mainColor} />
                        </Group>
                    ) : listError ? null : sessions.length === 0 ? (
                        <Text c="dimmed" size="sm">
                            Нет сессий для отображения.
                        </Text>
                    ) : (
                        <Stack gap="sm">
                            <Group justify="space-between" align="center">
                                <Text size="sm" c="dimmed">
                                    Показано {from}–{to} из {totalCount}
                                </Text>
                                <Badge variant="dot" color={mainColor}>
                                    История сессий
                                </Badge>
                            </Group>

                            <Box className={classes.sessionsList}>
                                {sessions.map((session) => (
                                    <UnstyledButton
                                        key={session.id}
                                        onClick={() => navigate(`/sessions/${session.id}`)}
                                        className={classes.sessionRow}
                                    >
                                        <Stack gap={6} className={classes.rowContent}>
                                            <Group justify="space-between" align="flex-start">
                                                <Group gap="xs">
                                                    <Text fw={600}>{session.projectName}</Text>
                                                </Group>
                                                <Group>
                                                    <Badge variant="light" color={mainColor}>
                                                            {getSessionTypeLabel(session)}
                                                    </Badge>
                                                    <Text size="xs" c="dimmed">
                                                        #{session.id}
                                                    </Text>
                                                </Group>
                                            </Group>
                                            <Text size="sm" c="dimmed">
                                                {sessionSummaryLabel(session)}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {formatSessionDate(session.completedAt)}
                                            </Text>
                                        </Stack>
                                    </UnstyledButton>
                                ))}
                            </Box>
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
                        </Stack>
                    )}
                </Stack>
            </Stack>
            <Space h="xl" />
        </Container>
    );
}
