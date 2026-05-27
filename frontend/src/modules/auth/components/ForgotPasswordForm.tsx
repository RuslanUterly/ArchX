import {Alert, Anchor, Button, CloseButton, Group, Stack, Text, TextInput, Title} from '@mantine/core';
import { useState } from 'react';
import { useMediaQuery } from "@mantine/hooks";
import { IconAt } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useForgotPassword } from '../hooks';
import {mainColor} from "../../../shared/components/theme/colors.ts";

export const ForgotPasswordForm = () => {
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width: 767px)");
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSent, setIsSent] = useState(false);
    const forgotPasswordMutation = useForgotPassword();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSent(false);

        forgotPasswordMutation.mutate(
            { email },
            {
                onSuccess: () => setIsSent(true),
                onError: (err) => setError(err.message),
            },
        );
    };

    const canSubmit = Boolean(email.trim());

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <Title order={isMobile ? 3 : 2}>
                    Восстановление пароля
                </Title>
                <Text c="dimmed">
                    Введите email, и мы отправим ссылку для сброса пароля.
                </Text>
                {isSent && (
                    <Alert color="green">
                        Если такой email зарегистрирован, письмо для восстановления пароля отправлено.
                    </Alert>
                )}
                {error && (
                    <Alert color="red" title="Ошибка">
                        {error}
                    </Alert>
                )}
                <TextInput
                    label="Email"
                    value={email}
                    leftSection={<IconAt size={16}/>}
                    rightSectionPointerEvents="all"
                    rightSection={
                        <CloseButton
                            aria-label="Clear input"
                            onClick={() => setEmail('')}
                            style={{ display: email ? undefined : 'none' }}
                        />
                    }
                    onChange={(e) => setEmail(e.currentTarget.value)}
                />
                <Group justify="space-between" align="baseline" wrap="wrap">
                    <Anchor c={mainColor} component="button" type="button" onClick={() => navigate('/auth/login')}>
                        Вернуться ко входу
                    </Anchor>
                    <Button
                        type="submit"
                        color={mainColor}
                        loading={forgotPasswordMutation.status === "pending"}
                        disabled={!canSubmit}
                        fullWidth={Boolean(isMobile)}
                    >
                        Отправить письмо
                    </Button>
                </Group>
            </Stack>
        </form>
    );
};
