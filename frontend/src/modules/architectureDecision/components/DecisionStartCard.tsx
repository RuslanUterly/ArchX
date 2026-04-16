import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { mainColor } from "../../../shared/components/theme/colors.ts";

interface DecisionStartCardProps {
    projectName: string;
    onProjectNameChange: (value: string) => void;
    onStart: () => void;
    loading: boolean;
}

export default function DecisionStartCard(props: DecisionStartCardProps) {
    const { projectName, onProjectNameChange, onStart, loading } = props;
    const isMobile = useMediaQuery("(max-width: 767px)");

    return (
        <Stack gap="sm">
            <Text c="dimmed">
                Укажите название проекта и начните опрос. Вопросы будут подбираться на основе
                предыдущих ответов.
            </Text>

            <TextInput
                label="Название проекта"
                placeholder="Например, CRM для отдела продаж"
                value={projectName}
                onChange={(event) => onProjectNameChange(event.currentTarget.value)}
            />

            <Group justify="space-between" mt="md" align="flex-start" wrap="wrap">
                <Text size="sm" c="dimmed">
                    Будет запущено дерево выбора архитектурного стиля.
                </Text>
                <Button color={mainColor} onClick={onStart} loading={loading} fullWidth={isMobile}>
                    Начать опрос
                </Button>
            </Group>
        </Stack>
    );
}

