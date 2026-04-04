import { Button, Group, Paper, Stack, Title } from "@mantine/core";
import { IconAt, IconBriefcase, IconChartBarPopular, IconPencil } from "@tabler/icons-react";
import { labelForGrade, labelForUserType } from "../../auth/labels.ts";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useProfileStore } from "../store.ts";
import { ProfileField } from "./ProfileField.tsx";

export function ProfileViewCard() {
    const profile = useProfileStore((s) => s.profile);
    const openEditModal = useProfileStore((s) => s.openEditModal);

    if (!profile) return null;

    return (
        <Paper p="lg" radius="md" withBorder>
            <Stack gap="lg">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Title order={2}>Профиль</Title>
                    <Button
                        leftSection={<IconPencil size={16} />}
                        variant="light"
                        color={mainColor}
                        onClick={openEditModal}
                    >
                        Изменить
                    </Button>
                </Group>

                <Stack gap="md">
                    <Group gap="sm" align="flex-start" wrap="nowrap">
                        <IconAt size={18} style={{ marginTop: 2, opacity: 0.5 }} />
                        <ProfileField label="Email" value={profile.email} />
                    </Group>
                    <Group gap="sm" align="flex-start" wrap="nowrap">
                        <IconBriefcase size={18} style={{ marginTop: 2, opacity: 0.5 }} />
                        <ProfileField
                            label="Должность / роль"
                            value={labelForUserType(profile.userType)}
                        />
                    </Group>
                    <Group gap="sm" align="flex-start" wrap="nowrap">
                        <IconChartBarPopular size={18} style={{ marginTop: 2, opacity: 0.5 }} />
                        <ProfileField label="Грейд" value={labelForGrade(profile.grade)} />
                    </Group>
                </Stack>
            </Stack>
        </Paper>
    );
}
