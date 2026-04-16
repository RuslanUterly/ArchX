import { Button, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
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
    const isMobile = useMediaQuery("(max-width: 767px)");

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
                        fullWidth={isMobile}
                        style={{
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            textAlign: "left",
                            height: "auto",
                            paddingTop: 10,
                            paddingBottom: 10,
                        }}
                    >
                        {option}
                    </Button>
                ))}
            </Stack>
        </Stack>
    );
}

