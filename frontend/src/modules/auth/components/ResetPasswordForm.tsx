import {Alert, Anchor, Button, Group, PasswordInput, Stack, Text, Title} from '@mantine/core';
import { notifications } from "@mantine/notifications";
import { useMediaQuery } from "@mantine/hooks";
import { IconLock } from "@tabler/icons-react";
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useResetPassword } from '../hooks';
import {mainColor} from "../../../shared/components/theme/colors.ts";

interface ResetPasswordFormProps {
    email: string;
    token: string;
}

export const ResetPasswordForm = ({ email, token }: ResetPasswordFormProps) => {
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width: 767px)");
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const resetPasswordMutation = useResetPassword();

    const hasValidLink = Boolean(email && token);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!hasValidLink) {
            setError("Ссылка восстановления пароля некорректна или устарела");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Пароли не совпадают");
            return;
        }

        resetPasswordMutation.mutate(
            { email, token, newPassword },
            {
                onSuccess: () => {
                    notifications.show({
                        title: "Пароль восстановлен",
                        message: "Теперь вы можете войти с новым паролем",
                        color: "green",
                    });
                    navigate('/auth/login', { replace: true });
                },
                onError: (err) => setError(err.message),
            },
        );
    };

    const canSubmit = hasValidLink && Boolean(newPassword && confirmPassword);

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <Title order={isMobile ? 3 : 2}>
                    Новый пароль
                </Title>
                <Text c="dimmed">
                    Придумайте новый пароль для аккаунта {email || "ArchX"}.
                </Text>
                {!hasValidLink && (
                    <Alert color="red" title="Некорректная ссылка">
                        Запросите новое письмо для восстановления пароля.
                    </Alert>
                )}
                {error && (
                    <Alert color="red" title="Ошибка">
                        {error}
                    </Alert>
                )}
                <PasswordInput
                    label="Новый пароль"
                    value={newPassword}
                    leftSection={<IconLock size={16}/>}
                    onChange={(e) => setNewPassword(e.currentTarget.value)}
                />
                <PasswordInput
                    label="Повторите пароль"
                    value={confirmPassword}
                    leftSection={<IconLock size={16}/>}
                    onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                />
                <Group justify="space-between" align="baseline" wrap="wrap">
                    <Anchor c={mainColor} component="button" type="button" onClick={() => navigate('/auth/forgot-password')}>
                        Запросить новую ссылку
                    </Anchor>
                    <Button
                        type="submit"
                        color={mainColor}
                        loading={resetPasswordMutation.status === "pending"}
                        disabled={!canSubmit}
                        fullWidth={Boolean(isMobile)}
                    >
                        Сохранить пароль
                    </Button>
                </Group>
            </Stack>
        </form>
    );
};
