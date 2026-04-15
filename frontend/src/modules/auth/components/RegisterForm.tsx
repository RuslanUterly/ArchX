import {Anchor, Button, Group, Select, Stack, Text, TextInput, Title} from '@mantine/core';
import { useState } from 'react';
import { useMediaQuery } from "@mantine/hooks";
import { useRegister } from '../hooks';
import {mainColor} from "../../../shared/components/theme/colors.ts";
import {IconAt, IconBriefcase, IconChartBarPopular, IconLock} from "@tabler/icons-react";
import {useNavigate} from "react-router-dom";
import { Grade, UserType } from '../types';
import { GRADE_OPTIONS, USER_TYPE_OPTIONS } from '../labels';

export const RegisterForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width: 767px)");

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState<string | null>(null);
    const [grade, setGrade] = useState<string | null>(null);
    const registerMutation = useRegister();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userType === null || grade === null) return;
        registerMutation.mutate(
            {
                email,
                password,
                userType: Number(userType) as UserType,
                grade: Number(grade) as Grade,
            },
            { onSuccess: () => onSuccess?.() },
        );
    };

    const canSubmit = Boolean(email.trim() && password && userType !== null && grade !== null);

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <Title order={isMobile ? 3 : 2}>
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
                <Select
                    label="Грейд"
                    placeholder="Выберите грейд"
                    data={GRADE_OPTIONS}
                    value={grade}
                    onChange={setGrade}
                    leftSection={<IconChartBarPopular size={16} />}
                    required
                    searchable
                    nothingFoundMessage="Нет совпадений"
                />
                <Group justify="space-between" align="baseline" wrap="wrap">
                    <Text mt="md">
                        Уже есть аккаунт?{' '}
                        <Anchor c={mainColor} component="button" type="button" onClick={() => navigate('/auth/login')}>
                            Войдите
                        </Anchor>
                    </Text>
                    <Button
                        type="submit"
                        color={mainColor}
                        loading={registerMutation.status === "pending"}
                        disabled={!canSubmit}
                        fullWidth={Boolean(isMobile)}
                    >
                        Регистрация
                    </Button>
                </Group>    
            </Stack>
        </form>
    );
};
