import {Center, Container, Paper } from '@mantine/core';
import { useMediaQuery } from "@mantine/hooks";
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';
    const isMobile = useMediaQuery("(max-width: 767px)");

    return (
        <Center>
            <Container size={720} style={{ width: "100%" }}>
                <Paper p={isMobile ? "sm" : "md"} radius="md" withBorder>
                    <LoginForm onSuccess={() => navigate(from, { replace: true })} />
                </Paper>
            </Container> 
        </Center>
    );
}
