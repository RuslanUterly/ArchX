import {
    Alert,
    Button,
    Container,
    Group,
    Modal,
    Paper,
    Select,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBriefcase, IconChartBarPopular, IconAt, IconPencil } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import {
    GRADE_OPTIONS,
    USER_TYPE_OPTIONS,
    labelForGrade,
    labelForUserType,
} from "../../auth/labels";
import type { Grade, UserType } from "../../auth/types";
import { useProfileQuery, useUpdateProfile } from "../hooks";
import { mainColor } from "../../../shared/components/theme/colors.ts";

function ProfileField({ label, value }: { label: string; value: string }) {
    return (
        <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {label}
            </Text>
            <Text size="md">{value}</Text>
        </Stack>
    );
}

export default function ProfilePage() {
    const { data, isLoading, isError, error } = useProfileQuery();
    const updateMutation = useUpdateProfile();
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

    const [draftUserType, setDraftUserType] = useState<string | null>(null);
    const [draftGrade, setDraftGrade] = useState<string | null>(null);

    useEffect(() => {
        if (!editOpened || !data) return;
        setDraftUserType(String(data.userType));
        setDraftGrade(String(data.grade));
    }, [editOpened, data]);

    const handleOpenEdit = () => {
        updateMutation.reset();
        openEdit();
    };

    const handleSaveEdit = () => {
        if (draftUserType === null || draftGrade === null) return;
        updateMutation.mutate(
            {
                userType: Number(draftUserType) as UserType,
                grade: Number(draftGrade) as Grade,
            },
            {
                onSuccess: () => closeEdit(),
            },
        );
    };

    const canSaveInModal =
        draftUserType !== null && draftGrade !== null && !updateMutation.isPending;

    if (isLoading) {
        return (
            <Container size="sm" py="xl">
                <Text>Загрузка…</Text>
            </Container>
        );
    }

    if (isError || !data) {
        return (
            <Container size="sm" py="xl">
                <Alert color="red" title="Ошибка">
                    {error instanceof Error ? error.message : "Не удалось загрузить профиль"}
                </Alert>
            </Container>
        );
    }

    return (
        <Container size="md" py="xl" style={{ width: "100%" }}>
            <Paper p="lg" radius="md" withBorder>
                <Stack gap="lg">
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Title order={2}>Профиль</Title>
                        <Button
                            leftSection={<IconPencil size={16} />}
                            variant="light"
                            color={mainColor}
                            onClick={handleOpenEdit}
                        >
                            Изменить
                        </Button>
                    </Group>

                    <Stack gap="md">
                        <Group gap="sm" align="flex-start" wrap="nowrap">
                            <IconAt size={18} style={{ marginTop: 2, opacity: 0.5 }} />
                            <ProfileField label="Email" value={data.email} />
                        </Group>
                        <Group gap="sm" align="flex-start" wrap="nowrap">
                            <IconBriefcase size={18} style={{ marginTop: 2, opacity: 0.5 }} />
                            <ProfileField
                                label="Должность / роль"
                                value={labelForUserType(data.userType)}
                            />
                        </Group>
                        <Group gap="sm" align="flex-start" wrap="nowrap">
                            <IconChartBarPopular size={18} style={{ marginTop: 2, opacity: 0.5 }} />
                            <ProfileField label="Грейд" value={labelForGrade(data.grade)} />
                        </Group>
                    </Stack>
                </Stack>
            </Paper>

            <Modal
                opened={editOpened}
                onClose={closeEdit}
                title="Редактирование профиля"
                centered
            >
                <Stack gap="md">
                    <Select
                        label="Должность / роль"
                        placeholder="Выберите вариант"
                        data={USER_TYPE_OPTIONS}
                        value={draftUserType}
                        onChange={setDraftUserType}
                        leftSection={<IconBriefcase size={16} />}
                        searchable
                        nothingFoundMessage="Нет совпадений"
                    />
                    <Select
                        label="Грейд"
                        placeholder="Выберите грейд"
                        data={GRADE_OPTIONS}
                        value={draftGrade}
                        onChange={setDraftGrade}
                        leftSection={<IconChartBarPopular size={16} />}
                        searchable
                        nothingFoundMessage="Нет совпадений"
                    />
                    {updateMutation.isError && (
                        <Alert color="red">
                            {updateMutation.error instanceof Error
                                ? updateMutation.error.message
                                : "Не удалось сохранить"}
                        </Alert>
                    )}
                    <Group justify="flex-end" mt="sm">
                        <Button variant="default" onClick={closeEdit}>
                            Отмена
                        </Button>
                        <Button color={mainColor} onClick={handleSaveEdit} disabled={!canSaveInModal}>
                            Сохранить
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}
