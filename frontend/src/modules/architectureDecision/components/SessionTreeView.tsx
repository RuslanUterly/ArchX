import { Paper, Stack, Text } from "@mantine/core";
import type { QuestionNodeResponse } from "../api.ts";
import { mainColor } from "../../../shared/components/theme/colors.ts";

interface SessionTreeViewProps {
    tree: QuestionNodeResponse;
    title: string;
    accentColor?: string;
}

function NodeChain({ node, depth = 0 }: { node: QuestionNodeResponse; depth?: number }) {
    const indent = depth * 16;
    return (
        <Stack gap={4} style={{ marginLeft: indent }}>
            <Paper p="xs" radius="sm" withBorder style={{ borderLeftWidth: 3, borderLeftColor: mainColor }}>
                <Text size="sm" fw={500}>
                    {node.question ?? ""}
                </Text>
                {node.answer != null && node.answer !== "" && (
                    <Text size="xs" c="dimmed" mt={4}>
                        Ответ: {node.answer}
                    </Text>
                )}
            </Paper>
            {node.nextNode && <NodeChain node={node.nextNode} depth={depth + 1} />}
        </Stack>
    );
}

export default function SessionTreeView({ tree, title, accentColor }: SessionTreeViewProps) {
    const color = accentColor ?? mainColor;
    return (
        <Stack gap="sm">
            <Text fw={600} size="md" c={color}>
                {title}
            </Text>
            <NodeChain node={tree} />
        </Stack>
    );
}
