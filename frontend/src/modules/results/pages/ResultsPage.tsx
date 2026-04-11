import {
    Container,
    Divider,
    Group,
    Loader,
    Pagination,
    Paper,
    Space,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { RESULTS_PAGE_SIZE } from "../api.ts";
import { LastSessionDetails } from "../components/LastSessionDetails.tsx";
import { formatSessionDate, sessionSummaryLabel } from "../sessionUtils.ts";
import { useResultsStore } from "../store.ts";

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

                <div>
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
                            <>
                                <Text size="sm" c="dimmed">
                                    Показано {from}–{to} из {totalCount}
                                </Text>
                                <Stack gap="xs">
                                    {sessions.map((session) => (
                                        <Paper
                                            key={session.id}
                                            p="sm"
                                            radius="sm"
                                            withBorder
                                            style={{ cursor: "pointer" }}
                                            onClick={() => navigate(`/sessions/${session.id}`)}
                                        >
                                            <Group justify="space-between">
                                                <div>
                                                    <Text fw={500}>{session.projectName}</Text>
                                                    <Text size="sm" c="dimmed">
                                                        {sessionSummaryLabel(session)} ·{" "}
                                                        {formatSessionDate(session.completedAt)}
                                                    </Text>
                                                </div>
                                                <Text size="sm" c="dimmed">
                                                    #{session.id}
                                                </Text>
                                            </Group>
                                        </Paper>
                                    ))}
                                </Stack>
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
                            </>
                        )}
                    </Stack>
                </div>
            </Stack>
            <Space h="xl" />
        </Container>
    );
}
