import {Center, Container, Paper } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from?.pathname || '/';

    return (
        <Center>
            <Container size={720}>
                <Paper p="md" radius="md" withBorder>
                    <LoginForm onSuccess={() => navigate(from, { replace: true })} />
                </Paper>
            </Container> 
        </Center>
    );
}
