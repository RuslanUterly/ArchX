import { ActionIcon, useMantineTheme, useMantineColorScheme } from '@mantine/core';

export function ThemeToggle() {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const theme = useMantineTheme();
    const ThemeIcon = theme.other.icons.theme[colorScheme];

    return (
        <ActionIcon
            onClick={() => toggleColorScheme()}
            size="lg"
            variant="default"
            aria-label="Переключить тему"
        >
            <ThemeIcon size={20} />
        </ActionIcon>
    );
}