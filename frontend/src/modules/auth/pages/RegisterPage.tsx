import {Container, Paper, Center} from '@mantine/core';
import { useMediaQuery } from "@mantine/hooks";
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';

export default function RegisterPage() {
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width: 767px)");

    return (
        <Center>
            <Container size="sm" style={{ width: "100%" }}>
                <Paper p={isMobile ? "sm" : "md"} radius="md" withBorder>
                    <RegisterForm onSuccess={() => navigate('/auth/login')} />
                </Paper>
            </Container>
        </Center>
    );
}
