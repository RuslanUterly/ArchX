import {Button, Center, Container, Text, Title} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../modules/auth/store";
import {mainColor} from "../components/theme/colors.ts";

export const NotFoundPage = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return (
        <Center style={{ textAlign: 'center' }}>
            <Container size="sm">
                <Title size={200} order={1} c={mainColor}>404</Title>
                <Text size="lg" mt="md">
                    Страница не найдена
                </Text>
                {isAuthenticated ? (
                    <Button mt="xl" color={mainColor} onClick={() => navigate("/")}>
                        Вернуться
                    </Button>
                ) : (
                    <Button mt="xl" color={mainColor} onClick={() =>navigate("/auth/login")}>
                        Авторизоваться
                    </Button>
                )}
            </Container>
        </Center>
    );
};
