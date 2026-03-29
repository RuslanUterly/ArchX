// import type { NodeHierarchy } from "../api.ts";
// import { useMemo } from "react";
// // @ts-ignore — типы reactflow будут подтянуты после установки пакета
// import ReactFlow, {
//     Background,
//     Controls,
//     MiniMap,
//     type Edge,
//     type Node,
// } from "reactflow";
// import "reactflow/dist/style.css";
// import { useDecisionTreeEditorStore } from "../store.ts";

// interface TreeGraphProps {
//     hierarchy: NodeHierarchy[];
// }

// interface PositionedNode {
//     id: string;
//     depth: number;
//     index: number;
// }

// const buildGraph = (hierarchy: NodeHierarchy[]) => {
//     const positioned: PositionedNode[] = [];
//     const edges: Edge[] = [];

//     let rowIndexByDepth: Record<number, number> = {};

//     const walk = (node: NodeHierarchy, depth: number) => {
//         const id = node.node.id;
//         if (id == null) return;

//         const rowIndex = rowIndexByDepth[depth] ?? 0;
//         rowIndexByDepth[depth] = rowIndex + 1;

//         positioned.push({
//             id: String(id),
//             depth,
//             index: rowIndex,
//         });

//         node.children.forEach((child) => {
//             const childId = child.node.id;
//             if (childId != null) {
//                 const link = node.outgoingLinks.find(
//                     (l) => l.childId === childId,
//                 );
//                 edges.push({
//                     id: `${id}-${childId}`,
//                     source: String(id),
//                     target: String(childId),
//                     label: link?.condition,
//                     animated: false,
//                     style: { strokeWidth: 1.5 },
//                 });
//             }
//             walk(child, depth + 1);
//         });
//     };

//     hierarchy.forEach((h) => walk(h, 0));

//     const nodes: Node[] = positioned.map((p) => {
//         const x = p.index * 260;
//         const y = p.depth * 120;

//         const h = findNodeById(hierarchy, Number(p.id));
//         const label =
//             h?.node.type === "Result"
//                 ? h.node.architectureStyle ?? h.node.patterns ?? `#${p.id}`
//                 : h?.node.questionText ?? `Вопрос #${p.id}`;

//         return {
//             id: p.id,
//             data: { label },
//             position: { x, y },
//         };
//     });

//     return { nodes, edges };
// };

// const findNodeById = (
//     hierarchy: NodeHierarchy[],
//     id: number,
// ): NodeHierarchy | null => {
//     for (const root of hierarchy) {
//         const found = walk(root, id);
//         if (found) return found;
//     }
//     return null;

//     function walk(node: NodeHierarchy, searchId: number): NodeHierarchy | null {
//         if (node.node.id === searchId) return node;
//         for (const child of node.children) {
//             const c = walk(child, searchId);
//             if (c) return c;
//         }
//         return null;
//     }
// };

// export default function TreeGraph(props: TreeGraphProps) {
//     const { hierarchy } = props;
//     const selectNode = useDecisionTreeEditorStore((s) => s.selectNode);

//     const { nodes, edges } = useMemo(() => buildGraph(hierarchy), [hierarchy]);

//     return (
//         <div style={{ width: "100%", height: 500 }}>
//             <ReactFlow
//                 nodes={nodes}
//                 edges={edges}
//                 fitView={true}
//                 fitViewOptions={{
//                     padding: 0.2, // Добавляет отступы от краев
//                     includeHiddenNodes: false,
//                     minZoom: 0.5,
//                     maxZoom: 1.5
//                 }}
//                 onNodeClick={(_: any, node: any) => {
//                     selectNode(Number(node.id));
//                 }}
//             >
//                 <Background />
//                 <Controls />
//                 <MiniMap />
//             </ReactFlow>
//         </div>
//     );
// }

import type { EditorLink, NodeHierarchy } from "../api.ts";
import { useMemo } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    type Edge,
    type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { useDecisionTreeEditorStore } from "../store.ts";
import dagre from 'dagre';

interface TreeGraphProps {
    hierarchy: NodeHierarchy[];
}

const buildGraph = (hierarchy: NodeHierarchy[]) => {
    const dagreGraph = new dagre.graphlib.Graph({ multigraph: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ 
        rankdir: 'TB',
        nodesep: 100,
        ranksep: 150,
        marginx: 50,
        marginy: 50
    });

    const edges: Edge[] = [];
    const addedEdgeNames = new Set<string>();
    const expandedNodes = new Set<number>();

    const visit = (h: NodeHierarchy, parentId?: number, link?: EditorLink) => {
        const id = h.node.id;
        if (id == null) return;

        const label =
            h.node.type === "Result"
                ? h.node.architectureStyle ?? 
                    ((h.node.patterns != null && h.node.patterns?.length > 0) ? 
                        h.node?.patterns?.join("\n") : h.node.description) ?? 
                    `#${id}`
                : h.node.questionText ?? `Вопрос #${id}`;

        dagreGraph.setNode(String(id), { 
            label,
            width: 200,
            height: 80,
        });

        if (parentId != null && link != null) {
            const edgeName =
                link.id != null ? `link-${link.id}` : `e-${parentId}-${id}-${link.condition}`;
            if (!addedEdgeNames.has(edgeName)) {
                addedEdgeNames.add(edgeName);
                dagreGraph.setEdge(
                    String(parentId),
                    String(id),
                    { label: link.condition, width: 1, height: 1 },
                    edgeName,
                );
                edges.push({
                    id: edgeName,
                    source: String(parentId),
                    target: String(id),
                    label: link.condition,
                    animated: false,
                    style: { strokeWidth: 1.5 },
                });
            }
        }

        if (expandedNodes.has(id)) return;
        expandedNodes.add(id);

        const { children, outgoingLinks } = h;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const ol = outgoingLinks[i];
            if (ol && child.node.id === ol.childId) {
                visit(child, id, ol);
            } else {
                const fb = outgoingLinks.find((l) => l.childId === child.node.id);
                visit(child, id, fb);
            }
        }
    };

    hierarchy.forEach((root) => visit(root));

    // Вычисляем позиции с помощью dagre
    try {
        dagre.layout(dagreGraph);
    } catch (error) {
        console.error('Dagre layout error:', error);
        return { nodes: [], edges: [] };
    }

    // Преобразуем узлы с вычисленными позициями
    const positionedNodes: Node[] = [];

    dagreGraph.nodes().forEach((nodeId) => {
        const node = dagreGraph.node(nodeId);
        const h = findNodeById(hierarchy, Number(nodeId));
        
        if (!node) return;

        // Центрируем узел (dagre возвращает центр узла, а reactflow ожидает верхний левый угол)
        const x = node.x - (node.width / 2);
        const y = node.y - (node.height / 2);

        // Стили в зависимости от типа узла
        const isResult = h?.node.type === "Result";
        
        positionedNodes.push({
            id: nodeId,
            data: { 
                label: node.label,
                type: h?.node.type,
                condition: edges.find(e => e.target === nodeId)?.label
            },
            position: { x, y },
            style: {
                background: isResult ? '#e3f2fd' : '#ffffff',
                border: isResult ? '2px solid #1976d2' : '1px solid #ccc',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px',
                fontWeight: isResult ? 500 : 400,
                width: node.width,
                minHeight: node.height,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
            },
        });
    });

    return { nodes: positionedNodes, edges };
};

const findNodeById = (
    hierarchy: NodeHierarchy[],
    id: number,
): NodeHierarchy | null => {
    for (const root of hierarchy) {
        const found = walk(root, id);
        if (found) return found;
    }
    return null;

    function walk(node: NodeHierarchy, searchId: number): NodeHierarchy | null {
        if (node.node.id === searchId) return node;
        for (const child of node.children) {
            const c = walk(child, searchId);
            if (c) return c;
        }
        return null;
    }
};

export default function TreeGraph(props: TreeGraphProps) {
    const { hierarchy } = props;
    const selectNode = useDecisionTreeEditorStore((s) => s.selectNode);

    const { nodes, edges } = useMemo(() => {
        if (!hierarchy || hierarchy.length === 0) {
            return { nodes: [], edges: [] };
        }
        return buildGraph(hierarchy);
    }, [hierarchy]);

    // Если нет узлов, показываем заглушку
    if (nodes.length === 0) {
        return (
            <div style={{ 
                width: "100%", 
                height: 600, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f5f5f5',
                borderRadius: '8px'
            }}>
                <p style={{ color: '#666' }}>Нет данных для отображения</p>
            </div>
        );
    }

    return (
        <div style={{ width: "100%", height: 600, background: '#fafafa' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                fitViewOptions={{
                    padding: 0.2,
                }}
                onNodeClick={(_: any, node: any) => {
                    selectNode(Number(node.id));
                }}
                minZoom={0.3}
                maxZoom={1.5}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={true}
            >
                <Background color="#aaa" gap={16} />
                <Controls />
                <MiniMap 
                    nodeColor={(node: any) => {
                        return node.data?.type === "Result" ? '#1976d2' : '#fff';
                    }}
                    style={{
                        backgroundColor: '#f5f5f5',
                    }}
                />
            </ReactFlow>
        </div>
    );
}