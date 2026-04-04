import { Alert, Button, Group, Modal, Select, Stack } from "@mantine/core";
import { IconBriefcase, IconChartBarPopular } from "@tabler/icons-react";
import { GRADE_OPTIONS, USER_TYPE_OPTIONS } from "../../auth/labels.ts";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useProfileStore } from "../store.ts";

export function EditProfileModal() {
    const editModalOpen = useProfileStore((s) => s.editModalOpen);
    const draftUserType = useProfileStore((s) => s.draftUserType);
    const draftGrade = useProfileStore((s) => s.draftGrade);
    const saving = useProfileStore((s) => s.saving);
    const saveError = useProfileStore((s) => s.saveError);
    const closeEditModal = useProfileStore((s) => s.closeEditModal);
    const setDraftUserType = useProfileStore((s) => s.setDraftUserType);
    const setDraftGrade = useProfileStore((s) => s.setDraftGrade);
    const saveProfile = useProfileStore((s) => s.saveProfile);

    const canSave =
        draftUserType !== null && draftGrade !== null && !saving;

    return (
        <Modal
            opened={editModalOpen}
            onClose={closeEditModal}
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
                {saveError && (
                    <Alert color="red">{saveError}</Alert>
                )}
                <Group justify="flex-end" mt="sm">
                    <Button variant="default" onClick={closeEditModal}>
                        Отмена
                    </Button>
                    <Button color={mainColor} onClick={() => void saveProfile()} disabled={!canSave}>
                        Сохранить
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
