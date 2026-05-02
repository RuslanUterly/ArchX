import { Container, Paper, Stack, Text, Title, Space, Group, Button } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import LayoutCenter from "../../../shared/components/layout/LayoutCenter.tsx";
import { useDecisionTreeStore } from "../store.ts";
import DecisionStartCard from "../components/DecisionStartCard.tsx";
import DecisionQuestionCard from "../components/DecisionQuestionCard.tsx";
import DecisionResultCard from "../components/DecisionResultCard.tsx";

export default function DecisionTreePage() {
    const projectName = useDecisionTreeStore((s) => s.projectName);
    const session = useDecisionTreeStore((s) => s.session);
    const loading = useDecisionTreeStore((s) => s.loading);
    const error = useDecisionTreeStore((s) => s.error);
    const setProjectName = useDecisionTreeStore((s) => s.setProjectName);
    const start = useDecisionTreeStore((s) => s.start);
    const answer = useDecisionTreeStore((s) => s.answer);
    const continueWithPatterns = useDecisionTreeStore((s) => s.continueWithPatterns);
    const reset = useDecisionTreeStore((s) => s.reset);
    const clearError = useDecisionTreeStore((s) => s.clearError);
    const isMobile = useMediaQuery("(max-width: 767px)");
    const selectedArchitectureStyle = useDecisionTreeStore((s) => s.session?.selectedArchitectureStyle ?? null);
    const selectedArchitectureDescription = useDecisionTreeStore(
        (s) => s.session?.selectedArchitectureDescription ?? null,
    );

    return (
        <LayoutCenter>
            <Container size="md" w="100%" px={isMobile ? "xs" : "md"}>
                <Paper p={isMobile ? "md" : "lg"} radius="md" withBorder w="100%">
                    <Stack gap="lg">
                        <Title order={isMobile ? 3 : 2} c={mainColor}>
                            Опросник по архитектурным решениям
                        </Title>

                        {!session && (
                            <DecisionStartCard
                                projectName={projectName}
                                onProjectNameChange={(value) => {
                                    if (error) clearError();
                                    setProjectName(value);
                                }}
                                onStart={start}
                                loading={loading}
                            />
                        )}

                        {session && (
                            <Stack gap="lg">
                                <Group justify="space-between" align="center" wrap="wrap">
                                    <Text size="sm" c="dimmed">
                                        Проект: <b>{projectName}</b>
                                    </Text>
                                    <Button
                                        variant="subtle"
                                        color="red"
                                        onClick={reset}
                                    >
                                        Начать заново
                                    </Button>
                                </Group>

                                {!session.completed && session.currentQuestion && (
                                    <DecisionQuestionCard
                                        question={session.currentQuestion}
                                        description={session.currentQuestionDescription}
                                        options={session.options}
                                        onAnswer={answer}
                                        loading={loading}
                                    />
                                )}

                                {session.completed && (
                                    <DecisionResultCard
                                        result={session.result}
                                        mode={session.mode}
                                        canContinueWithPatterns={session.canContinueWithPatterns}
                                        onContinueWithPatterns={continueWithPatterns}
                                        loading={loading}
                                        selectedArchitectureStyle={selectedArchitectureStyle}
                                        selectedArchitectureDescription={selectedArchitectureDescription}
                                    />
                                )}
                            </Stack>
                        )}

                        {error && (
                            <Text c="red" size="sm">
                                {error}
                            </Text>
                        )}
                    </Stack>
                </Paper>
                <Space h="md" />
            </Container>
        </LayoutCenter>
    );
}

