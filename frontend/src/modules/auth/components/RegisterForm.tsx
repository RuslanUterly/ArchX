import {Anchor, Button, Group, Select, Stack, Text, TextInput, Title} from '@mantine/core';
import { useState } from 'react';
import { useRegister } from '../hooks';
import {mainColor} from "../../../shared/components/theme/colors.ts";
import {IconAt, IconBriefcase, IconLock} from "@tabler/icons-react";
import {useNavigate} from "react-router-dom";
import { UserType } from '../types';

const USER_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: String(UserType.Architect), label: 'Архитектор ПО' },
    { value: String(UserType.TeamLead), label: 'Тимлид / ведущий разработчик' },
    { value: String(UserType.BackendDeveloper), label: 'Backend-разработчик' },
    { value: String(UserType.FullstackDeveloper), label: 'Fullstack-разработчик' },
    { value: String(UserType.DevOps), label: 'DevOps / SRE' },
    { value: String(UserType.SystemsAnalyst), label: 'Системный аналитик' },
    { value: String(UserType.Student), label: 'Студент' },
    { value: String(UserType.Other), label: 'Другое' },
];

export const RegisterForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState<string | null>(null);
    const registerMutation = useRegister();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userType === null) return;
        registerMutation.mutate(
            { email, password, userType: Number(userType) as UserType },
            { onSuccess: () => onSuccess?.() },
        );
    };

    const canSubmit = Boolean(email.trim() && password && userType !== null);

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
                <Select
                    label="Ваша должность / роль"
                    placeholder="Выберите вариант"
                    data={USER_TYPE_OPTIONS}
                    value={userType}
                    onChange={setUserType}
                    leftSection={<IconBriefcase size={16} />}
                    required
                    searchable
                    nothingFoundMessage="Нет совпадений"
                />
                <Group justify="space-between" align="baseline">
                    <Text mt="md">
                        Уже есть аккаунт?{' '}
                        <Anchor c={mainColor} component="button" type="button" onClick={() => navigate('/auth/login')}>
                            Войдите
                        </Anchor>
                    </Text>
                    <Button type="submit" color={mainColor} loading={registerMutation.status === "pending"} disabled={!canSubmit}>
                        Регистрация
                    </Button>
                </Group>    
            </Stack>
        </form>
    );
};
