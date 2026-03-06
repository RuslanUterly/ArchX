import { Button, Container, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useAuthStore } from "../../auth/store.ts";

export default function HomePage() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    return (
        <Container size="md">
            <Paper p="lg" radius="md" withBorder>
                <Stack gap="md">
                    <Title order={2} c={mainColor}>
                        ArchX
                    </Title>
                    <Text c="dimmed">
                        Поможем выбрать архитектурный стиль и подходящие паттерны на основе короткого
                        опросника. Вопросы подбираются динамически по вашим ответам.
                    </Text>

                    <Group justify="space-between" mt="sm">
                        {isAuthenticated ? (
                            <>
                                <Text size="sm" c="dimmed">
                                    Вы авторизованы — можно начинать.
                                </Text>
                                <Button color={mainColor} onClick={() => navigate("/decision-tree")}>
                                    Начать опрос
                                </Button>
                            </>
                        ) : (
                            <>
                                <Text size="sm" c="dimmed">
                                    Чтобы начать, нужно войти в аккаунт.
                                </Text>
                                <Group>
                                    <Button
                                        color={mainColor}
                                        variant="outline"
                                        onClick={() => navigate("/auth/register")}
                                    >
                                        Регистрация
                                    </Button>
                                    <Button
                                        color={mainColor}
                                        onClick={() => navigate("/auth/login")}
                                    >
                                        Войти
                                    </Button>
                                </Group>
                            </>
                        )}
                    </Group>
                </Stack>
            </Paper>
        </Container>
    );
}

