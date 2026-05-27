import {Center, Container, Paper} from '@mantine/core';
import { useMediaQuery } from "@mantine/hooks";
import { useSearchParams } from "react-router-dom";
import { ResetPasswordForm } from '../components/ResetPasswordForm';

export default function ResetPasswordPage() {
    const isMobile = useMediaQuery("(max-width: 767px)");
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") ?? "";
    const token = searchParams.get("token") ?? "";

    return (
        <Center>
            <Container size={720} style={{ width: "100%" }}>
                <Paper p={isMobile ? "sm" : "md"} radius="md" withBorder>
                    <ResetPasswordForm email={email} token={token} />
                </Paper>
            </Container>
        </Center>
    );
}
