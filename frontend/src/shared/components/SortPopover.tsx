import {
    Button,
    Group,
    Popover,
    Radio,
    CheckIcon,
    Stack,
    Text,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { mainColor } from "./theme/colors.ts";

export interface SortFieldOption {
    value: string;
    label: string;
    ascLabel?: string;
    descLabel?: string;
}

interface SortPopoverProps {
    field: string;
    order: "asc" | "desc";
    options: SortFieldOption[];
    onApply: (field: string, order: "asc" | "desc") => Promise<void> | void;
}

export default function SortPopover({
    field,
    order,
    options,
    onApply,
}: SortPopoverProps) {
    const [opened, setOpened] = useState(false);
    const [draftField, setDraftField] = useState(field);
    const [draftOrder, setDraftOrder] = useState<"asc" | "desc">(order);

    useEffect(() => {
        if (opened) return;
        setDraftField(field);
        setDraftOrder(order);
    }, [field, opened, order]);

    const selectedOption = useMemo(
        () => options.find((option) => option.value === draftField) ?? options[0],
        [draftField, options],
    );

    return (
        <Popover
            opened={opened}
            onChange={setOpened}
            position="bottom-end"
            withArrow
            shadow="md"
            width={320}
        >
            <Popover.Target>
                <Button variant="light" color={mainColor} onClick={() => setOpened((prev) => !prev)}>
                    Сортировка
                </Button>
            </Popover.Target>

            <Popover.Dropdown>
                <Stack gap="md">
                    <Radio.Group
                        label="Поле сортировки"
                        value={draftField}
                        onChange={setDraftField}
                    >
                        <Stack gap="xs" mt="xs">
                            {options.map((option) => (
                                <Radio
                                    color={mainColor}
                                    icon={CheckIcon}
                                    key={option.value}
                                    value={option.value}
                                    label={option.label}
                                    variant="outline"
                                />
                            ))}
                        </Stack>
                    </Radio.Group>

                    <Radio.Group
                        label="Направление"
                        value={draftOrder}
                        onChange={(nextValue) => setDraftOrder(nextValue as "asc" | "desc")}
                    >
                        <Stack gap="xs" mt="xs">
                            <Radio
                                color={mainColor}
                                value="desc"
                                label={selectedOption?.descLabel ?? "По убыванию"}
                                variant="outline"
                                icon={CheckIcon}
                            />
                            <Radio
                                color={mainColor}
                                value="asc"
                                label={selectedOption?.ascLabel ?? "По возрастанию"}
                                variant="outline"
                                icon={CheckIcon}
                            />
                        </Stack>
                    </Radio.Group>

                    <Group justify="space-between">
                        <Text size="xs" c="dimmed">
                            Настройка применяется ко всему списку
                        </Text>
                        <Button
                            size="compact-sm"
                            color={mainColor}
                            onClick={async () => {
                                await onApply(draftField, draftOrder);
                                setOpened(false);
                            }}
                        >
                            Применить
                        </Button>
                    </Group>
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
}
