import {
    ActionIcon,
    Alert,
    Container,
    Group,
    Loader,
    Paper,
    Select,
    Stack,
    Space,
    Text,
    Title,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useEffect } from "react";
import { mainColor } from "../../../shared/components/theme/colors.ts";
import { useDecisionTreeEditorStore } from "../store.ts";
import { TreeType, type TreeTypeValue } from "../../architectureDecision/api.ts";
import TreeGraph from "../components/TreeGraph.tsx";
import NodeEditorForm from "../components/NodeEditorForm.tsx";
import { useMediaQuery } from "@mantine/hooks";

const treeTypeOptions = [
    { value: String(TreeType.ArchitectureStyle), label: "Архитектурные стили" },
    { value: String(TreeType.MonolithPatterns), label: "Паттерны монолита" },
    { value: String(TreeType.ModularMonolithPatterns), label: "Паттерны модульного монолита" },
    { value: String(TreeType.MicroservicesPatterns), label: "Паттерны микросервисов" },
];

export default function DecisionTreeEditorPage() {
    const treeType = useDecisionTreeEditorStore((s) => s.treeType);
    const setTreeType = useDecisionTreeEditorStore((s) => s.setTreeType);
    const loadTree = useDecisionTreeEditorStore((s) => s.loadTree);
    const hierarchy = useDecisionTreeEditorStore((s) => s.hierarchy);
    const loading = useDecisionTreeEditorStore((s) => s.loading);
    const error = useDecisionTreeEditorStore((s) => s.error);
    const clearError = useDecisionTreeEditorStore((s) => s.clearError);
    const isMobile = useMediaQuery("(max-width: 767px)");

    useEffect(() => {
        void loadTree();
    }, [treeType, loadTree]);

    return (
        <Container size="md" style={{ width: "100%" }}>
            <Space h="xl" />
            <Stack gap="md">
                <Group justify="space-between" wrap="wrap">
                    <Title order={isMobile ? 3 : 2} c={mainColor}>
                        Редактор дерева решений
                    </Title>
                    <Group wrap="nowrap" style={{ width: isMobile ? "100%" : undefined }}>
                        <Select
                            data={treeTypeOptions}
                            value={String(treeType)}
                            onChange={(value) => {
                                if (!value) return;
                                setTreeType(value as unknown as TreeTypeValue);
                            }}
                            style={{ minWidth: isMobile ? 0 : 260, flex: isMobile ? 1 : undefined }}
                        />
                        <ActionIcon
                            variant="light"
                            color={mainColor}
                            size="lg"
                            onClick={() => loadTree()}
                            loading={loading}
                            aria-label="Обновить дерево"
                        >
                            <IconRefresh size={20} stroke={1.5} />
                        </ActionIcon>
                    </Group>
                </Group>

                {loading && (
                    <Group justify="center">
                        <Loader size="sm" />
                        <Text size="sm" c="dimmed">
                            Загрузка дерева...
                        </Text>
                    </Group>
                )}

                {error && (
                    <Alert
                        color="red"
                        variant="light"
                        withCloseButton
                        onClose={clearError}
                    >
                        {error}
                    </Alert>
                )}

                <Paper p="md" radius="md" withBorder>
                    <Stack gap="md">
                        <Text fw={500}>Редактирование узла</Text>
                        <Text size="sm" c="dimmed">
                            Выберите узел на визуальном дереве справа, затем измените его
                            свойства или добавьте ветку.
                        </Text>
                        <NodeEditorForm />
                    </Stack>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                    <Text fw={500} mb="sm">
                        Визуальное дерево
                    </Text>
                    {hierarchy.length > 0 ? (
                        <TreeGraph hierarchy={hierarchy} />
                    ) : (
                        <Text size="sm" c="dimmed">
                            Дерево пустое для выбранного типа. Импортируйте данные или
                            создайте корневой узел через API.
                        </Text>
                    )}
                </Paper>
            </Stack>
            <Space h="xl" />
        </Container>
    );
}

