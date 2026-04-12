import { Box, Button, Group, Modal, Select, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
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

interface FilterRow {
    id: string;
    field: string | null;
    operator: string | null;
    value: string;
}

const createRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getOperatorOptions = (fieldType: FilterFieldType): FilterExpressionOption[] => {
    if (fieldType === "string") {
        return [
            { value: "contains", label: "Содержит" },
            { value: "not_contains", label: "Не содержит" },
            { value: "starts_with", label: "Начинается с" },
            { value: "ends_with", label: "Заканчивается на" },
            { value: "equals", label: "Равно" },
            { value: "not_equals", label: "Не равно" },
        ];
    }

    if (fieldType === "number" || fieldType === "date") {
        return [
            { value: "equals", label: "Равно" },
            { value: "not_equals", label: "Не равно" },
            { value: "greater", label: "Больше" },
            { value: "greater_or_equal", label: "Больше или равно" },
            { value: "less", label: "Меньше" },
            { value: "less_or_equal", label: "Меньше или равно" },
        ];
    }

    if (fieldType === "enum") {
        return [
            { value: "equals", label: "Равно" },
            { value: "not_equals", label: "Не равно" },
        ];
    }

    return [
        { value: "contains", label: "Содержит" },
        { value: "not_contains", label: "Не содержит" },
    ];
};

const buildExpression = (
    fieldType: FilterFieldType,
    operator: string | null,
    rawValue: string,
): string | null => {
    if (!operator) return null;

    const value = rawValue.trim();
    if (!value) return null;

    if (fieldType === "string") {
        switch (operator) {
            case "contains":
                return value;
            case "not_contains":
                return `!=%${value}%`;
            case "starts_with":
                return `${value}%`;
            case "ends_with":
                return `%${value}`;
            case "equals":
                return `=${value}`;
            case "not_equals":
                return `!=${value}`;
            default:
                return null;
        }
    }

    if (fieldType === "enum") {
        if (operator === "equals")
            return `=${value}`;
        if (operator === "not_equals")
            return `!=${value}`;
        return null;
    }

    switch (operator) {
        case "equals":
            return `=${value}`;
        case "not_equals":
            return `!=${value}`;
        case "greater":
            return `>${value}`;
        case "greater_or_equal":
            return `>=${value}`;
        case "less":
            return `<${value}`;
        case "less_or_equal":
            return `<=${value}`;
        default:
            return null;
    }
};

const parseExpression = (
    fieldType: FilterFieldType,
    expression: string,
): { operator: string | null; value: string } => {
    const expr = expression.trim();
    if (!expr) return { operator: null, value: "" };

    if (fieldType === "number" || fieldType === "date") {
        if (expr.startsWith(">=")) return { operator: "greater_or_equal", value: expr.slice(2) };
        if (expr.startsWith("<=")) return { operator: "less_or_equal", value: expr.slice(2) };
        if (expr.startsWith("!=")) return { operator: "not_equals", value: expr.slice(2) };
        if (expr.startsWith(">")) return { operator: "greater", value: expr.slice(1) };
        if (expr.startsWith("<")) return { operator: "less", value: expr.slice(1) };
        if (expr.startsWith("=")) return { operator: "equals", value: expr.slice(1) };
        return { operator: "equals", value: expr };
    }

    if (fieldType === "enum") {
        if (expr.startsWith("!=")) return { operator: "not_equals", value: expr.slice(2) };
        if (expr.startsWith("=")) return { operator: "equals", value: expr.slice(1) };
        return { operator: "equals", value: expr };
    }

    if (expr.startsWith("!=%") && expr.endsWith("%"))
        return { operator: "not_contains", value: expr.slice(3, -1) };
    if (expr.startsWith("!=")) return { operator: "not_equals", value: expr.slice(2) };
    if (expr.startsWith("=")) return { operator: "equals", value: expr.slice(1) };
    if (expr.startsWith("%") && expr.endsWith("%")) return { operator: "contains", value: expr.slice(1, -1) };
    if (expr.startsWith("%")) return { operator: "ends_with", value: expr.slice(1) };
    if (expr.endsWith("%")) return { operator: "starts_with", value: expr.slice(0, -1) };
    return { operator: "contains", value: expr };
};

const mapEnumValueToLabel = (
    enumOptions: EnumFilterOption[] | undefined,
    rawValue: string,
) => {
    return enumOptions?.find((option) => option.value === rawValue)?.label ?? rawValue;
};

export const formatFilterDisplayValue = (
    fieldOptions: QueryFilterFieldOption[],
    field: string,
    expression: string,
) => {
    const fieldMeta = fieldOptions.find((option) => option.value === field);
    if (!fieldMeta || fieldMeta.type !== "enum")
        return expression;

    const parsed = parseExpression(fieldMeta.type, expression);
    const labelValue = mapEnumValueToLabel(fieldMeta.enumOptions, parsed.value);
    if (parsed.operator === "not_equals")
        return `!=${labelValue}`;
    return labelValue;
};

export default function QueryFiltersModal({
    opened,
    title,
    fieldOptions,
    filters,
    onClose,
    onSave,
}: QueryFiltersModalProps) {
    const [rows, setRows] = useState<FilterRow[]>([]);

    const createEmptyRow = (defaultField?: string | null): FilterRow => {
        const field = defaultField ?? fieldOptions[0]?.value ?? null;
        const fieldMeta = fieldOptions.find((option) => option.value === field);
        const operator = fieldMeta ? getOperatorOptions(fieldMeta.type)[0]?.value ?? null : null;
        const value = fieldMeta?.type === "enum" ? fieldMeta.enumOptions?.[0]?.value ?? "" : "";
        return { id: createRowId(), field, operator, value };
    };

    useEffect(() => {
        if (!opened) return;

        const parsedRows: FilterRow[] = [];
        for (const [field, expression] of Object.entries(filters)) {
            const fieldMeta = fieldOptions.find((option) => option.value === field);
            if (!fieldMeta) continue;

            const parsed = parseExpression(fieldMeta.type, expression);
            const defaultOperator = getOperatorOptions(fieldMeta.type)[0]?.value ?? null;

            parsedRows.push({
                id: createRowId(),
                field,
                operator: parsed.operator ?? defaultOperator,
                value: parsed.value,
            });
        }

        setRows(parsedRows.length > 0 ? parsedRows : [createEmptyRow()]);
    }, [fieldOptions, filters, opened]);

    const updateRow = (rowId: string, updater: (row: FilterRow) => FilterRow) => {
        setRows((prev) => prev.map((row) => (row.id === rowId ? updater(row) : row)));
    };

    const addRow = () => {
        setRows((prev) => [...prev, createEmptyRow()]);
    };

    const removeRow = (rowId: string) => {
        setRows((prev) => {
            const next = prev.filter((row) => row.id !== rowId);
            return next.length > 0 ? next : [createEmptyRow()];
        });
    };

    return (
        <Modal opened={opened} onClose={onClose} title={title} size="xl" centered>
            <Stack gap="md">
                <Stack gap="xs">
                    {rows.map((row, index) => {
                        const selectedField = fieldOptions.find((option) => option.value === row.field) ?? null;
                        const selectedFieldLabel = selectedField?.label ?? "поле";
                        const operatorOptions = selectedField
                            ? getOperatorOptions(selectedField.type)
                            : [];

                        return (
                            <Group key={row.id} align="flex-end" wrap="nowrap">
                                <Box style={{ flex: 1 }}>
                                    <Select
                                        label={index === 0 ? "Поле" : undefined}
                                        placeholder="Выберите поле"
                                        data={fieldOptions}
                                        value={row.field}
                                        onChange={(nextField) => {
                                            const fieldMeta = fieldOptions.find((option) => option.value === nextField) ?? null;
                                            const nextOperator = fieldMeta
                                                ? getOperatorOptions(fieldMeta.type)[0]?.value ?? null
                                                : null;
                                            const nextValue = fieldMeta?.type === "enum"
                                                ? fieldMeta.enumOptions?.[0]?.value ?? ""
                                                : "";

                                            updateRow(row.id, () => ({
                                                ...row,
                                                field: nextField,
                                                operator: nextOperator,
                                                value: nextValue,
                                            }));
                                        }}
                                        searchable
                                        nothingFoundMessage="Поле не найдено"
                                    />
                                </Box>
                                <Box style={{ flex: 1 }}>
                                    <Select
                                        label={index === 0 ? `Выражение для ${selectedFieldLabel}` : undefined}
                                        placeholder="Выберите выражение"
                                        data={operatorOptions}
                                        value={row.operator}
                                        onChange={(nextOperator) => {
                                            updateRow(row.id, (current) => ({ ...current, operator: nextOperator }));
                                        }}
                                        disabled={!selectedField}
                                    />
                                </Box>
                                <Box style={{ flex: 1 }}>
                                    {selectedField?.type === "enum" ? (
                                        <Select
                                            label={index === 0 ? "Значение" : undefined}
                                            placeholder="Выберите значение"
                                            data={selectedField.enumOptions ?? []}
                                            value={row.value}
                                            onChange={(nextValue) => {
                                                updateRow(row.id, (current) => ({ ...current, value: nextValue ?? "" }));
                                            }}
                                            searchable
                                            nothingFoundMessage="Значение не найдено"
                                        />
                                    ) : (
                                        <TextInput
                                            label={index === 0 ? `Значение для ${selectedFieldLabel}` : undefined}
                                            placeholder="Введите значение"
                                            value={row.value}
                                            onChange={(e) => {
                                                const nextValue = e.currentTarget.value;
                                                updateRow(row.id, (current) => ({ ...current, value: nextValue }));
                                            }}
                                            type={selectedField?.type === "date" ? "date" : "text"}
                                        />
                                    )}
                                </Box>
                                <Button
                                    variant="subtle"
                                    color="red"
                                    onClick={() => removeRow(row.id)}
                                >
                                    Удалить
                                </Button>
                            </Group>
                        );
                    })}
                </Stack>

                <Group justify="flex-start">
                    <Button variant="light" color={mainColor} onClick={addRow}>
                        Добавить фильтр
                    </Button>
                </Group>

                <Group justify="flex-end" mt="sm">
                    <Button variant="default" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button
                        color={mainColor}
                        onClick={async () => {
                            const nextFilters: Record<string, string> = {};

                            for (const row of rows) {
                                const field = row.field?.trim();
                                if (!field) continue;

                                const fieldMeta = fieldOptions.find((option) => option.value === field);
                                if (!fieldMeta) continue;

                                const expression = buildExpression(fieldMeta.type, row.operator, row.value);
                                if (!expression) continue;

                                nextFilters[field] = expression;
                            }

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
