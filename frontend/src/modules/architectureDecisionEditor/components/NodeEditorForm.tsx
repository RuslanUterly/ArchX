import { useState, useEffect, useMemo } from "react";
import {
    Box,
    Button,
    Group,
    Select,
    Stack,
    Tabs,
    TagsInput,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import {
    useDecisionTreeEditorStore,
    collectAllLinksFromHierarchy,
    wouldCreateCycle,
} from "../store.ts";
import { mainColor } from "../../../shared/components/theme/colors.ts";

export default function NodeEditorForm() {
    const updateSelectedNode = useDecisionTreeEditorStore((s) => s.updateSelectedNode);
    const addChildQuestion = useDecisionTreeEditorStore((s) => s.addChildQuestion);
    const addChildResult = useDecisionTreeEditorStore((s) => s.addChildResult);
    const removeSelectedNode = useDecisionTreeEditorStore((s) => s.removeSelectedNode);
    const getOutgoingLinks = useDecisionTreeEditorStore((s) => s.getOutgoingLinks);
    const updateLinkCondition = useDecisionTreeEditorStore((s) => s.updateLinkCondition);
    const removeOutgoingLink = useDecisionTreeEditorStore((s) => s.removeOutgoingLink);
    const linkToExistingChild = useDecisionTreeEditorStore((s) => s.linkToExistingChild);
    const loading = useDecisionTreeEditorStore((s) => s.loading);

    const selectedNodeId = useDecisionTreeEditorStore((s) => s.selectedNodeId);
    const nodes = useDecisionTreeEditorStore((s) => s.nodes);
    const hierarchy = useDecisionTreeEditorStore((s) => s.hierarchy);

    const selectedNode = useMemo(() => {
        if (!selectedNodeId) return null;
        return nodes[selectedNodeId] || null;
    }, [selectedNodeId, nodes]);

    const outgoingLinks = useMemo(() => {
        if (!selectedNodeId) return [];
        return getOutgoingLinks(selectedNodeId);
    }, [selectedNodeId, getOutgoingLinks, hierarchy]);

    const [condition, setCondition] = useState("");
    const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
    const [editingLinkCondition, setEditingLinkCondition] = useState("");

    const [questionText, setQuestionText] = useState("");
    const [architectureStyle, setArchitectureStyle] = useState("");
    const [description, setDescription] = useState("");
    const [patterns, setPatterns] = useState<string[]>([]);
    const [pros, setPros] = useState<string[]>([]);
    const [cons, setCons] = useState<string[]>([]);
    const [type, setType] = useState<"Question" | "Result">("Question");
    const [existingTargetId, setExistingTargetId] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedNode) return;

        setQuestionText(selectedNode.questionText ?? "");
        setArchitectureStyle(selectedNode.architectureStyle ?? "");
        setDescription(selectedNode.description ?? "");
        setPatterns(selectedNode.patterns ?? []);
        setPros(selectedNode.pros ?? []);
        setCons(selectedNode.cons ?? []);
        setType((selectedNode.type as "Question" | "Result") ?? "Question");
    }, [selectedNode]);

    useEffect(() => {
        if (editingLinkId == null) return;
        const link = outgoingLinks.find((l) => l.id === editingLinkId);
        setEditingLinkCondition(link?.condition ?? "");
    }, [editingLinkId, outgoingLinks]);

    const targetNodeOptions = useMemo(() => {
        return Object.values(nodes)
            .filter((n) => n.id != null && n.id !== selectedNodeId)
            .map((n) => {
                const id = n.id as number;
                const label =
                    n.type === "Result"
                        ? (n.architectureStyle?.trim() || n.description?.trim() || `Результат #${id}`)
                        : (n.questionText?.trim() || `Вопрос #${id}`);
                return { value: String(id), label: `#${id} — ${label}` };
            })
            .sort((a, b) => a.label.localeCompare(b.label, "ru"));
    }, [nodes, selectedNodeId]);

    const canAddBranch = condition.trim().length > 0;
    const existingTargetNum = existingTargetId != null ? Number(existingTargetId) : NaN;
    const canLinkExisting =
        selectedNodeId != null &&
        canAddBranch &&
        Number.isFinite(existingTargetNum) &&
        !wouldCreateCycle(
            collectAllLinksFromHierarchy(hierarchy),
            selectedNodeId,
            existingTargetNum,
        );

    if (!selectedNode) {
        return null;
    }

    const handleSave = async () => {
        await updateSelectedNode({
            type,
            questionText: questionText || null,
            architectureStyle: architectureStyle || null,
            description: description || null,
            patterns,
            pros,
            cons,
        });
    };

    const childLinkCaption = (childId: number) => {
        const n = nodes[childId];
        if (!n) return `→ узел #${childId}`;
        const label =
            n.type === "Result"
                ? (n.architectureStyle?.trim() || n.description?.trim() || `Результат #${childId}`)
                : (n.questionText?.trim() || `Вопрос #${childId}`);
        return `→ #${childId} — ${label}`;
    };

    return (
        <Tabs color={mainColor} defaultValue="node" keepMounted={false}>
            <Tabs.List grow>
                <Tabs.Tab value="node">Узел</Tabs.Tab>
                <Tabs.Tab value="edges">Связи</Tabs.Tab>
                <Tabs.Tab value="existing">К существующему</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="node" pt="md">
                <Stack gap="sm">
                    <Select
                        label="Тип узла"
                        data={[
                            { value: "Question", label: "Вопрос" },
                            { value: "Result", label: "Результат" },
                        ]}
                        value={type}
                        onChange={(value) => setType((value as "Question" | "Result") ?? "Question")}
                    />

                    {type === "Question" && (
                        <Textarea
                            label="Текст вопроса"
                            value={questionText}
                            onChange={(event) => setQuestionText(event.currentTarget.value)}
                            minRows={2}
                        />
                    )}

                    {type === "Result" && (
                        <TextInput
                            label="Архитектурный стиль"
                            value={architectureStyle}
                            onChange={(event) => setArchitectureStyle(event.currentTarget.value)}
                        />
                    )}

                    <Textarea
                        label="Описание"
                        value={description}
                        onChange={(event) => setDescription(event.currentTarget.value)}
                        minRows={2}
                    />

                    <TagsInput
                        label="Паттерны"
                        value={patterns}
                        onChange={setPatterns}
                        placeholder="Добавьте паттерн и нажмите Enter"
                    />

                    <TagsInput
                        label="Плюсы"
                        value={pros}
                        onChange={setPros}
                        placeholder="Добавьте плюс и нажмите Enter"
                    />

                    <TagsInput
                        label="Минусы"
                        value={cons}
                        onChange={setCons}
                        placeholder="Добавьте минус и нажмите Enter"
                    />

                    <Group justify="space-between" mt="sm">
                        <Button color={mainColor} variant="outline" onClick={handleSave} loading={loading}>
                            Сохранить узел
                        </Button>
                        <Button color="red" variant="subtle" onClick={removeSelectedNode} loading={loading}>
                            Удалить узел
                        </Button>
                    </Group>
                </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="edges" pt="md">
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Редактирование исходящих рёбер и создание новых веток (новый дочерний узел).
                    </Text>

                    {outgoingLinks.length === 0 ? (
                        <Text size="sm" c="dimmed">
                            Нет исходящих связей.
                        </Text>
                    ) : (
                        <Stack gap="xs">
                            {outgoingLinks.map((link) => (
                                <Box key={link.id ?? link.childId}>
                                    {editingLinkId === link.id && link.id != null ? (
                                        <Group gap="xs" wrap="nowrap">
                                            <TextInput
                                                size="xs"
                                                placeholder="Текст ответа"
                                                value={editingLinkCondition}
                                                onChange={(e) => setEditingLinkCondition(e.currentTarget.value)}
                                                style={{ flex: 1 }}
                                            />
                                            <Button
                                                size="xs"
                                                loading={loading}
                                                onClick={() => {
                                                    void updateLinkCondition(link.id!, editingLinkCondition.trim());
                                                    setEditingLinkId(null);
                                                }}
                                            >
                                                Сохранить
                                            </Button>
                                            <Button
                                                size="xs"
                                                variant="subtle"
                                                onClick={() => setEditingLinkId(null)}
                                            >
                                                Отмена
                                            </Button>
                                        </Group>
                                    ) : (
                                        <Stack gap={4}>
                                            <Text size="xs" c="dimmed">
                                                {childLinkCaption(link.childId)}
                                            </Text>
                                            <Group gap="xs" wrap="nowrap" justify="space-between">
                                                <Text size="sm" c="dimmed">
                                                    {link.condition || "(без текста)"}
                                                </Text>
                                                {link.id != null && (
                                                    <Group gap="xs" wrap="nowrap">
                                                        <Button
                                                            color={mainColor}
                                                            size="xs"
                                                            variant="light"
                                                            onClick={() => setEditingLinkId(link.id)}
                                                        >
                                                            Изменить
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            variant="subtle"
                                                            color="red"
                                                            loading={loading}
                                                            onClick={() => {
                                                                if (
                                                                    !window.confirm(
                                                                        "Удалить эту связь? Узел-потомок останется в дереве, если на него ведут другие рёбра.",
                                                                    )
                                                                ) {
                                                                    return;
                                                                }
                                                                void removeOutgoingLink(link.id!);
                                                            }}
                                                        >
                                                            Удалить ребро
                                                        </Button>
                                                    </Group>
                                                )}
                                            </Group>
                                        </Stack>
                                    )}
                                </Box>
                            ))}
                        </Stack>
                    )}

                    <TextInput
                        label="Условие новой ветки"
                        description="Текст ответа на текущий узел; должен быть уникальным среди исходящих связей."
                        placeholder="Например: Высокая нагрузка"
                        value={condition}
                        onChange={(event) => setCondition(event.currentTarget.value)}
                    />

                    <Group justify="flex-start">
                        <Button
                            color={mainColor}
                            variant="outline"
                            disabled={!canAddBranch}
                            loading={loading}
                            onClick={() => {
                                if (!canAddBranch || !selectedNode.id) return;
                                void addChildQuestion(selectedNode.id, condition.trim());
                                setCondition("");
                            }}
                        >
                            Добавить вопрос по условию
                        </Button>
                        <Button
                            color={mainColor}
                            variant="outline"
                            disabled={!canAddBranch}
                            loading={loading}
                            onClick={() => {
                                if (!canAddBranch || !selectedNode.id) return;
                                void addChildResult(selectedNode.id, condition.trim());
                                setCondition("");
                            }}
                        >
                            Добавить результат по условию
                        </Button>
                    </Group>
                </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="existing" pt="md">
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Добавить ребро к уже существующему узлу (несколько веток к одному узлу, как на схемах
                        микросервисов).
                    </Text>

                    <TextInput
                        label="Условие связи"
                        description="Должно быть уникальным среди исходящих связей этого узла."
                        placeholder="Например: Высокая нагрузка"
                        value={condition}
                        onChange={(event) => setCondition(event.currentTarget.value)}
                    />

                    <Select
                        label="Целевой узел"
                        placeholder="Выберите узел"
                        searchable
                        clearable
                        data={targetNodeOptions}
                        value={existingTargetId}
                        onChange={setExistingTargetId}
                    />

                    <Button
                        color={mainColor}
                        variant="outline"
                        disabled={!canLinkExisting}
                        loading={loading}
                        onClick={() => {
                            if (!canLinkExisting || selectedNodeId == null || !Number.isFinite(existingTargetNum))
                                return;
                            void linkToExistingChild(selectedNodeId, existingTargetNum, condition.trim());
                            setCondition("");
                            setExistingTargetId(null);
                        }}
                    >
                        Добавить связь к выбранному узлу
                    </Button>
                </Stack>
            </Tabs.Panel>
        </Tabs>
    );
}

