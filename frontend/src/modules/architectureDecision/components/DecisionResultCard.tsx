import type { ResultNodeResponse } from "../api.ts";
import { Badge, Button, Group, List, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";
import { mainColor } from "../../../shared/components/theme/colors.ts";

interface DecisionResultCardProps {
    title?: string;
    result: ResultNodeResponse | null;
    mode: "style" | "patterns";
    canContinueWithPatterns: boolean;
    onContinueWithPatterns: () => void;
    loading: boolean;
    selectedArchitectureStyle?: string | null;
    selectedArchitectureDescription?: string | null;
}

export default function DecisionResultCard(props: DecisionResultCardProps) {
    const {
        title = "Результат опроса",
        result,
        mode,
        canContinueWithPatterns,
        onContinueWithPatterns,
        loading,
        selectedArchitectureStyle,
        selectedArchitectureDescription,
    } = props;
    const isMobile = useMediaQuery("(max-width: 767px)");
    const navigate = useNavigate();

    if (!result) return null;
    const rawArchitectureStyle = result.architectureStyle?.trim() ?? null;
    const selectedStyle = selectedArchitectureStyle?.trim() || null;
    const selectedDescription = selectedArchitectureDescription?.trim() || null;

    const displayArchitectureStyle =
        mode === "patterns" ? selectedStyle || rawArchitectureStyle : rawArchitectureStyle || selectedStyle;
    const displayDescription =
        mode === "patterns"
            ? selectedDescription || result.description?.trim() || null
            : result.description?.trim() || selectedDescription;

    return (
        <Stack gap="md">
            <Text fw={600} size="lg">
                {title}
            </Text>

            <Stack gap="sm">
                {displayArchitectureStyle && (
                    <Text fw={600} size="lg">
                        Рекомендуемый стиль: {displayArchitectureStyle}
                    </Text>
                )}

                {displayDescription && <Text>{displayDescription}</Text>}

                {result.pros && result.pros.length > 0 && (
                    <Stack gap={4}>
                        <Text fw={500}>Плюсы:</Text>
                        <List spacing={4}>
                            {result.pros.map((item) => (
                                <List.Item
                                    key={item}
                                    icon={
                                        <ThemeIcon color="green" size={20} radius="xl">
                                            <IconCheck size={14} />
                                        </ThemeIcon>
                                    }
                                >
                                    {item}
                                </List.Item>
                            ))}
                        </List>
                    </Stack>
                )}

                {result.cons && result.cons.length > 0 && (
                    <Stack gap={4}>
                        <Text fw={500}>Минусы:</Text>
                        <List spacing={4}>
                            {result.cons.map((item) => (
                                <List.Item key={item}>{item}</List.Item>
                            ))}
                        </List>
                    </Stack>
                )}

                {result.patterns && result.patterns.length > 0 && mode === "style" && (
                    <Stack gap={4}>
                        <Text fw={500}>
                            {mode === "style" ? "Рекомендуемые паттерны:" : "Подходящие паттерны:"}
                        </Text>
                        <List spacing={4}>
                            {result.patterns.map((pattern) => (
                                <List.Item key={pattern}>{pattern}</List.Item>
                            ))}
                        </List>
                    </Stack>
                )}

                {result.patterns && result.patterns.length > 0 && mode === "patterns" && (
                    <Stack gap="xs">
                        <Text fw={500}>Подходящие паттерны:</Text>
                        <Group gap="xs" wrap="wrap">
                            {result.patterns.map((pattern) => (
                                <Badge key={pattern} color={mainColor} variant="light" size="md">
                                    {pattern}
                                </Badge>
                            ))}
                        </Group>
                    </Stack>
                )}
            </Stack>

            {mode === "style" && canContinueWithPatterns && (
                <Group mt="sm" wrap="wrap">
                    <Button
                        color={mainColor}
                        onClick={onContinueWithPatterns}
                        loading={loading}
                        fullWidth={isMobile}
                    >
                        Продолжить с выбором паттернов
                    </Button>
                    <Button
                        variant="light"
                        color={mainColor}
                        onClick={() => navigate("/")}
                        fullWidth={isMobile}
                    >
                        На главную
                    </Button>
                </Group>
            )}

            {mode === "patterns" && (
                <Button
                    color={mainColor}
                    variant="light"
                    onClick={() => navigate("/results")}
                    fullWidth={isMobile}
                >
                    Подробнее
                </Button>
            )}
        </Stack>
    );
}

