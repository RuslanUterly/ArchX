import { useState, useEffect, useMemo } from "react";
import { Button, Group, Stack, TextInput, Textarea, TagsInput, Select } from "@mantine/core";
import { useDecisionTreeEditorStore } from "../store.ts";

export default function NodeEditorForm() {
    const updateSelectedNode = useDecisionTreeEditorStore((s) => s.updateSelectedNode);
    const addChildQuestion = useDecisionTreeEditorStore((s) => s.addChildQuestion);
    const addChildResult = useDecisionTreeEditorStore((s) => s.addChildResult);
    const removeSelectedNode = useDecisionTreeEditorStore((s) => s.removeSelectedNode);
    const loading = useDecisionTreeEditorStore((s) => s.loading);

    const selectedNodeId = useDecisionTreeEditorStore((s) => s.selectedNodeId);
    const nodes = useDecisionTreeEditorStore((s) => s.nodes);

    const selectedNode = useMemo(() => {
        if (!selectedNodeId) return null;
        return nodes[selectedNodeId] || null;
    }, [selectedNodeId, nodes]);

    const [condition, setCondition] = useState("");

    const [questionText, setQuestionText] = useState("");
    const [architectureStyle, setArchitectureStyle] = useState("");
    const [description, setDescription] = useState("");
    const [patterns, setPatterns] = useState<string[]>([]);
    const [pros, setPros] = useState<string[]>([]);
    const [cons, setCons] = useState<string[]>([]);
    const [type, setType] = useState<"Question" | "Result">("Question");

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

    const canAddBranch = condition.trim().length > 0;

    return (
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
                <Button variant="light" onClick={handleSave} loading={loading}>
                    Сохранить узел
                </Button>
                <Button color="red" variant="outline" onClick={removeSelectedNode} loading={loading}>
                    Удалить узел
                </Button>
            </Group>

            <Group grow mt="sm">
                <TextInput
                    label="Условие для новой ветки"
                    placeholder="Например: Высокая нагрузка"
                    value={condition}
                    onChange={(event) => setCondition(event.currentTarget.value)}
                />
            </Group>

            <Group justify="flex-start">
                <Button
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
    );
}

