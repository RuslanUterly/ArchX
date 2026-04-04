import type { ReactNode } from "react";
import { Anchor, Container, Group, Text } from "@mantine/core";
import { IconBrandGithub, IconBrandTelegram, IconNews } from "@tabler/icons-react";
import classes from "./Footer.module.css";

const linkProps = {
    target: "_blank" as const,
    rel: "noopener noreferrer",
    className: classes.link,
};

function SocialLink({
    href,
    icon,
    label,
}: {
    href: string;
    icon: ReactNode;
    label: string;
}) {
    return (
        <Anchor href={href} {...linkProps}>
            <Group gap={6} wrap="nowrap">
                {icon}
                <span>{label}</span>
            </Group>
        </Anchor>
    );
}

export function Footer() {
    return (
        <footer className={classes.root}>
            <Container size="md">
                <Group justify="space-between" align="center" wrap="wrap" gap="md" py="md">
                    <Text size="sm" c="dimmed">
                        ArchX
                    </Text>
                    <Group gap="lg" wrap="wrap">
                        <SocialLink
                            href="https://github.com/RuslanUterly"
                            icon={<IconBrandGithub size={18} stroke={1.5} />}
                            label="GitHub"
                        />
                        <SocialLink
                            href="https://vc.ru/id2776556"
                            icon={<IconNews size={18} stroke={1.5} />}
                            label="Блог на vc.ru"
                        />
                        <SocialLink
                            href="https://t.me/cloud_989"
                            icon={<IconBrandTelegram size={18} stroke={1.5} />}
                            label="Telegram"
                        />
                    </Group>
                </Group>
            </Container>
        </footer>
    );
}
