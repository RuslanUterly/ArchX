import {Anchor, Button, CloseButton, Group, PasswordInput, Stack, Text, TextInput, Title} from '@mantine/core';
import { useState } from 'react';
import { useLogin } from '../hooks';
import {mainColor} from "../../../shared/components/theme/colors.ts";
import {IconAt, IconLock} from "@tabler/icons-react";
import {useNavigate} from "react-router-dom";

export const LoginForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const loginMutation = useLogin();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate({ email, password }, {
            onSuccess: () => onSuccess?.(),
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <Title order={2}>
                    Вход
                </Title>
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
                <PasswordInput
                    label="Password"
                    type="password"
                    value={password}
                    leftSection={<IconLock size={16}/>}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                />
                <Group justify="space-between" align="baseline">
                    <Text mt="md">
                        Нет аккаунта?{' '}
                        <Anchor c={mainColor} component="button" type="button" onClick={() => navigate('/auth/register')}>
                            Зарегистрируйтесь
                        </Anchor>
                    </Text>
                    <Button type="submit" color={mainColor} loading={loginMutation.status === "pending"}>
                        Вход
                    </Button>
                </Group>
            </Stack>
        </form>
    );
};
