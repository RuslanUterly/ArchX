import { Button, Group, Modal, Select, Stack, Text, TextInput } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { mainColor } from "./theme/colors.ts";

type FilterFieldType = "string" | "number" | "date" | "enum";

interface FilterExpressionOption {
    value: string;
    label: string;
}

export interface EnumFilterOption {
    value: string;
    label: string;
}

export interface QueryFilterFieldOption {
    value: string;
    label: string;
    type: FilterFieldType;
    enumOptions?: EnumFilterOption[];
}

interface QueryFiltersModalProps {
    opened: boolean;
    title: string;
    fieldOptions: QueryFilterFieldOption[];
    filters: Record<string, string>;
    onClose: () => void;
    onSave: (filters: Record<string, string>) => Promise<void> | void;
}

export default function QueryFiltersModal({
    opened,
    title,
    fieldOptions,
    filters,
    onClose,
    onSave,
}: QueryFiltersModalProps) {
    const [draftFilters, setDraftFilters] = useState<Record<string, string>>({});
    const [field, setField] = useState<string | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [value, setValue] = useState("");

    useEffect(() => {
        if (!opened) return;
        setDraftFilters(filters);
        setField((currentField) => currentField ?? fieldOptions[0]?.value ?? null);
    }, [filters, opened]);

    const selectedField = useMemo(
        () => fieldOptions.find((option) => option.value === field) ?? null,
        [field, fieldOptions],
    );

    const selectedFieldLabel = selectedField?.label ?? "поле";

    const operatorOptions = useMemo<FilterExpressionOption[]>(() => {
        if (!selectedField) return [];

        if (selectedField.type === "string") {
            return [
                { value: "contains", label: "Содержит" },
                { value: "not_contains", label: "Не содержит" },
                { value: "starts_with", label: "Начинается с" },
                { value: "ends_with", label: "Заканчивается на" },
                { value: "equals", label: "Равно" },
                { value: "not_equals", label: "Не равно" },
            ];
        }

        if (selectedField.type === "number" || selectedField.type === "date") {
            return [
                { value: "equals", label: "Равно" },
                { value: "not_equals", label: "Не равно" },
                { value: "greater", label: "Больше" },
                { value: "greater_or_equal", label: "Больше или равно" },
                { value: "less", label: "Меньше" },
                { value: "less_or_equal", label: "Меньше или равно" },
            ];
        }

        return [
            { value: "contains", label: "Содержит" },
            { value: "not_contains", label: "Не содержит" },
        ];
    }, [selectedField]);

    useEffect(() => {
        const nextOperator = operatorOptions[0]?.value ?? null;
        setOperator(nextOperator);

        if (selectedField?.type === "enum") {
            setValue(selectedField.enumOptions?.[0]?.value ?? "");
            return;
        }

        setValue("");
    }, [field, operatorOptions, selectedField?.enumOptions, selectedField?.type]);

    const buildExpression = () => {
        if (!selectedField || !operator) return null;

        const trimmedValue = value.trim();
        if (!trimmedValue) return null;

        if (selectedField.type === "string") {
            switch (operator) {
                case "contains":
                    return trimmedValue;
                case "not_contains":
                    return `!=%${trimmedValue}%`;
                case "starts_with":
                    return `${trimmedValue}%`;
                case "ends_with":
                    return `%${trimmedValue}`;
                case "equals":
                    return `=${trimmedValue}`;
                case "not_equals":
                    return `!=${trimmedValue}`;
                default:
                    return null;
            }
        }

        if (selectedField.type === "enum") {
            if (operator === "contains")
                return trimmedValue;
            if (operator === "not_contains")
                return `!=%${trimmedValue}%`;
            return null;
        }

        switch (operator) {
            case "equals":
                return `=${trimmedValue}`;
            case "not_equals":
                return `!=${trimmedValue}`;
            case "greater":
                return `>${trimmedValue}`;
            case "greater_or_equal":
                return `>=${trimmedValue}`;
            case "less":
                return `<${trimmedValue}`;
            case "less_or_equal":
                return `<=${trimmedValue}`;
            default:
                return null;
        }
    };

    const addFilter = () => {
        if (!field) return;
        const expression = buildExpression();
        if (!expression) return;

        setDraftFilters((prev) => ({ ...prev, [field]: expression }));
    };

    const removeFilter = (filterField: string) => {
        setDraftFilters((prev) => {
            const next = { ...prev };
            delete next[filterField];
            return next;
        });
    };

    const rows = Object.entries(draftFilters);

    return (
        <Modal opened={opened} onClose={onClose} title={title} size="lg" centered>
            <Stack gap="md">
                <Group grow align="flex-end" wrap="nowrap">
                    <Select
                        label="Поле"
                        placeholder="Выберите поле"
                        data={fieldOptions}
                        value={field}
                        onChange={setField}
                        searchable
                        nothingFoundMessage="Поле не найдено"
                    />
                    <Select
                        label={`Выражение для ${selectedFieldLabel}`}
                        placeholder="Выберите выражение"
                        data={operatorOptions}
                        value={operator}
                        onChange={setOperator}
                        disabled={!selectedField}
                    />
                    {selectedField?.type === "enum" ? (
                        <Select
                            label="Значение"
                            placeholder="Выберите значение"
                            data={selectedField.enumOptions ?? []}
                            value={value}
                            onChange={(nextValue) => setValue(nextValue ?? "")}
                            searchable
                            nothingFoundMessage="Значение не найдено"
                        />
                    ) : (
                        <TextInput
                            label={`Значение для ${selectedFieldLabel}`}
                            placeholder="Введите значение"
                            value={value}
                            onChange={(e) => setValue(e.currentTarget.value)}
                            type={selectedField?.type === "date" ? "date" : "text"}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addFilter();
                                }
                            }}
                        />
                    )}
                </Group>

                <Group justify="flex-end">
                    <Button variant="light" color={mainColor} onClick={addFilter} disabled={!field || !operator || !value.trim()}>
                        Добавить фильтр
                    </Button>
                </Group>

                {rows.length === 0 ? (
                    <Text size="sm" c="dimmed">
                        Фильтры пока не добавлены.
                    </Text>
                ) : (
                    <Stack gap="xs">
                        {rows.map(([filterField, value]) => {
                            const label = fieldOptions.find((option) => option.value === filterField)?.label ?? filterField;
                            return (
                                <Group key={filterField} justify="space-between" wrap="nowrap">
                                    <Text size="sm">
                                        {label}: <Text span fw={600}>{value}</Text>
                                    </Text>
                                    <Button
                                        variant="subtle"
                                        color="red"
                                        size="compact-sm"
                                        onClick={() => removeFilter(filterField)}
                                    >
                                        Удалить
                                    </Button>
                                </Group>
                            );
                        })}
                    </Stack>
                )}

                <Group justify="flex-end" mt="sm">
                    <Button variant="default" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button
                        color={mainColor}
                        onClick={async () => {
                            const currentExpression = buildExpression();
                            const nextFilters = field && currentExpression
                                ? { ...draftFilters, [field]: currentExpression }
                                : draftFilters;
                            await onSave(nextFilters);
                            onClose();
                        }}
                    >
                        Применить
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
