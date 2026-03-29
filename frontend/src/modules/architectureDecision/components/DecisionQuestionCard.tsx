import { Button, Stack, Text } from "@mantine/core";
import { mainColor } from "../../../shared/components/theme/colors.ts";

interface DecisionQuestionCardProps {
    question: string;
    description?: string | null;
    options: string[];
    onAnswer: (answer: string) => void;
    loading: boolean;
}

export default function DecisionQuestionCard(props: DecisionQuestionCardProps) {
    const { question, description, options, onAnswer, loading } = props;
    const desc = description?.trim();

    return (
        <Stack gap="md">
            <Stack gap="xs">
                <Text fw={500}>{question}</Text>
                {desc ? (
                    <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                        {desc}
                    </Text>
                ) : null}
            </Stack>

            <Stack gap="xs">
                {options.map((option) => (
                    <Button
                        key={option}
                        variant="outline"
                        color={mainColor}
                        disabled={loading}
                        onClick={() => onAnswer(option)}
                    >
                        {option}
                    </Button>
                ))}
            </Stack>
        </Stack>
    );
}

