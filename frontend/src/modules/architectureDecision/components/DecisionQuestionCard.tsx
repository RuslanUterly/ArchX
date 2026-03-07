import { Button, Stack, Text } from "@mantine/core";
import { mainColor } from "../../../shared/components/theme/colors.ts";

interface DecisionQuestionCardProps {
    question: string;
    options: string[];
    onAnswer: (answer: string) => void;
    loading: boolean;
}

export default function DecisionQuestionCard(props: DecisionQuestionCardProps) {
    const { question, options, onAnswer, loading } = props;

    return (
        <Stack gap="md">
            <Text fw={500}>{question}</Text>

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

