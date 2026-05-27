import {Center, Container, Paper} from '@mantine/core';
import { useMediaQuery } from "@mantine/hooks";
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
    const isMobile = useMediaQuery("(max-width: 767px)");

    return (
        <Center>
            <Container size={720} style={{ width: "100%" }}>
                <Paper p={isMobile ? "sm" : "md"} radius="md" withBorder>
                    <ForgotPasswordForm />
                </Paper>
            </Container>
        </Center>
    );
}
