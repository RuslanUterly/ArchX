import { useMemo } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    type Edge,
    type Node,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import type { QuestionNodeResponse } from "../api.ts";

interface SessionFlowGraphProps {
    tree: QuestionNodeResponse;
    accentColor?: string;
}

interface LinearNode {
    id: string;
    question: string;
    answer: string | null;
}

function flattenTree(tree: QuestionNodeResponse): LinearNode[] {
    const result: LinearNode[] = [];
    let current: QuestionNodeResponse | null = tree;

    while (current) {
        result.push({
            id: String(current.nodeId),
            question: current.question,
            answer: current.answer,
        });
        current = current.nextNode;
    }

    return result;
}

function buildGraph(tree: QuestionNodeResponse, accentColor: string) {
    const chain = flattenTree(tree);
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
        rankdir: "TB",
        nodesep: 64,
        ranksep: 84,
        marginx: 24,
        marginy: 24,
    });

    chain.forEach((item) => {
        dagreGraph.setNode(item.id, { width: 320, height: 92 });
    });

    const edges: Edge[] = [];
    for (let i = 0; i < chain.length - 1; i += 1) {
        const source = chain[i];
        const target = chain[i + 1];
        dagreGraph.setEdge(source.id, target.id, { label: target.answer ?? "—" });
        edges.push({
            id: `${source.id}-${target.id}`,
            source: source.id,
            target: target.id,
            label: target.answer ?? "—",
            style: { strokeWidth: 1.5, stroke: accentColor },
            labelStyle: { fontSize: 11, fill: "var(--mantine-color-dimmed)" },
        });
    }

    dagre.layout(dagreGraph);

    const nodes: Node[] = chain.map((item, index) => {
        const n = dagreGraph.node(item.id);
        return {
            id: item.id,
            position: { x: n.x - n.width / 2, y: n.y - n.height / 2 },
            data: {
                label: (
                    <div style={{ textAlign: "left" }}>
                        <div
                            style={{
                                fontSize: 12,
                                color: "var(--mantine-color-dimmed)",
                                marginBottom: 4,
                            }}
                        >
                            Шаг {index + 1}
                        </div>
                        <div style={{ fontWeight: 400, fontSize: 12 }}>{item.question}</div>
                    </div>
                ),
            },
            style: {
                border: `1px solid ${accentColor}`,
                borderLeft: `1px solid ${accentColor}`,
                borderRadius: 8,
                background: "var(--mantine-color-body)",
                color: "var(--mantine-color-text)",
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '10px',
                fontSize: '12px',
                fontWeight: 400,
            },
            draggable: false,
            selectable: false,
        };
    });

    return { nodes, edges };
}

export default function SessionFlowGraph({ tree, accentColor = "#4056a1" }: SessionFlowGraphProps) {
    const { nodes, edges } = useMemo(() => buildGraph(tree, accentColor), [tree, accentColor]);

    return (
        <div style={{ width: "100%", height: 520 }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.35}
                maxZoom={1.5}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
            >
                <Background gap={20} size={1} />
                <Controls showInteractive={false} />
                <MiniMap
                    pannable
                    zoomable
                    style={{ backgroundColor: "var(--mantine-color-body)" }}
                />
            </ReactFlow>
        </div>
    );
}
