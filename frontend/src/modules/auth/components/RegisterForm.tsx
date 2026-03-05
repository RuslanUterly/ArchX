import {Anchor, Button, Group, Stack, Text, TextInput, Title} from '@mantine/core';
import { useState } from 'react';
import { useRegister } from '../hooks';
import {mainColor} from "../../../shared/components/theme/colors.ts";
import {IconAt, IconLock} from "@tabler/icons-react";
import {useNavigate} from "react-router-dom";

export const RegisterForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const registerMutation = useRegister();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        registerMutation.mutate({ email, password }, {
            onSuccess: () => onSuccess?.(),
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <Title order={2}>
                    Регистрация
                </Title>
                <TextInput
                    label="Email"
                    value={email}
                    leftSection={<IconAt size={16}/>}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                />
                <TextInput
                    label="Password"
                    type="password"
                    value={password}
                    leftSection={<IconLock size={16}/>}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                />
                <Group justify="space-between" align="baseline">
                    <Text mt="md">
                        Уже есть аккаунт?{' '}
                        <Anchor c={mainColor} component="button" type="button" onClick={() => navigate('/auth/login')}>
                            Войдите
                        </Anchor>
                    </Text>
                    <Button type="submit" color={mainColor} loading={registerMutation.status === "pending"}>
                        Регистрация
                    </Button>
                </Group>    
            </Stack>
        </form>
    );
};
