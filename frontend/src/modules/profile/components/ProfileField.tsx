import { Stack, Text } from "@mantine/core";

interface ProfileFieldProps {
    label: string;
    value: string;
}

export function ProfileField({ label, value }: ProfileFieldProps) {
    return (
        <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {label}
            </Text>
            <Text size="md">{value}</Text>
        </Stack>
    );
}
