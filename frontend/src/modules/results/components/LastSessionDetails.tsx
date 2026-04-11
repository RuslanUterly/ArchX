import { Badge, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import type { SessionCompleteResponse } from "../../architectureDecision/api.ts";
import {
    formatSessionDate,
    isArchitectureStyleSession,
    resolveSessionStyleName,
} from "../sessionUtils.ts";

interface LastSessionDetailsProps {
    session: SessionCompleteResponse;
    sectionAction?: {
        label: string;
        onClick: () => void;
    };
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <Stack gap={2}>
            <Text size="xs" c="dimmed" fw={500}>
                {label}
            </Text>
            <Text size="sm" fw={500}>
                {value}
            </Text>
        </Stack>
    );
}

export function LastSessionDetails({ session, sectionAction }: LastSessionDetailsProps) {
    const navigate = useNavigate();
    const isStyle = isArchitectureStyleSession(session);
    const styleName = resolveSessionStyleName(session);
    const patterns = session.result?.patterns?.filter(Boolean) ?? [];
    const description = session.result?.description?.trim() || null;
    const sessionTypeLabel = isStyle ? "Архитектурный стиль" : "Паттерны";

    return (
        <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
                <Group justify="space-between" align="center" wrap="wrap">
                    <Title order={4} c={mainColor}>
                        Последняя сессия
                    </Title>
                    <Group gap="xs">
                        {sectionAction && (
                            <Button
                                size="xs"
                                variant="outline"
                                color={mainColor}
                                onClick={sectionAction.onClick}
                            >
                                {sectionAction.label}
                            </Button>
                        )}
                        <Button
                            size="xs"
                            variant="light"
                            color={mainColor}
                            onClick={() => navigate(`/sessions/${session.id}`)}
                        >
                            Подробнее
                        </Button>
                    </Group>
                </Group>
                <Group gap="xs">
                    <Badge variant="light" color={mainColor}>
                        {sessionTypeLabel}
                    </Badge>
                    <Text size="xs" c="dimmed">
                        #{session.id}
                    </Text>
                </Group>

                <Paper p="sm" radius="sm" withBorder>
                    {isStyle ? (
                        <Stack gap="sm">
                            <InfoRow label="Название проекта" value={session.projectName} />
                            <InfoRow label="Стиль" value={styleName ?? "—"} />
                            <InfoRow
                                label="Дата и время"
                                value={formatSessionDate(session.completedAt)}
                            />
                            <InfoRow label="Описание" value={description ?? "—"} />
                        </Stack>
                    ) : (
                        <Stack gap="sm">
                            <InfoRow label="Стиль" value={styleName ?? "—"} />
                            <InfoRow
                                label="Паттерны"
                                value={patterns.length > 0 ? patterns.join(", ") : "—"}
                            />
                            <InfoRow
                                label="Дата и время"
                                value={formatSessionDate(session.completedAt)}
                            />
                            <InfoRow label="Название проекта" value={session.projectName} />
                        </Stack>
                    )}
                </Paper>
            </Stack>
        </Paper>
    );
}
