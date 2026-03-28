import { create } from "zustand";
import type { TreeTypeValue } from "../architectureDecision/api.ts";
import { TreeType } from "../architectureDecision/api.ts";
import type { NodeHierarchy, EditorNode, EditorLink, NodeRequest } from "./api.ts";
import {
    addLink,
    deleteNode,
    getTreeHierarchy,
    insertBranch,
    updateNode,
    updateLink,
} from "./api.ts";

export interface FlatNode extends EditorNode {
    depth: number;
}

interface EditorState {
    treeType: TreeTypeValue;
    hierarchy: NodeHierarchy[];
    nodes: Record<number, FlatNode>;
    selectedNodeId: number | null;
    loading: boolean;
    error: string | null;

    // derived helpers
    selectedNode: EditorNode | null;

    // actions
    setTreeType: (treeType: TreeTypeValue) => void;
    loadTree: () => Promise<void>;
    selectNode: (id: number | null) => void;
    updateSelectedNode: (patch: Partial<NodeRequest>) => Promise<void>;
    getOutgoingLinks: (nodeId: number) => EditorLink[];
    updateLinkCondition: (linkId: number, newCondition: string) => Promise<void>;
    addChildQuestion: (parentId: number, condition: string) => Promise<void>;
    addChildResult: (parentId: number, condition: string) => Promise<void>;
    linkToExistingChild: (parentId: number, childId: number, condition: string) => Promise<void>;
    removeSelectedNode: () => Promise<void>;
    clearError: () => void;
}

function findNodeInHierarchy(hierarchy: NodeHierarchy[], nodeId: number): NodeHierarchy | null {
    for (const root of hierarchy) {
        const found = walk(root, nodeId);
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
}

const flattenHierarchy = (hierarchy: NodeHierarchy[]): Record<number, FlatNode> => {
    const result: Record<number, FlatNode> = {};

    const walk = (node: NodeHierarchy, depth: number) => {
        const id = node.node.id;
        if (id != null) {
            const prev = result[id];
            if (!prev || depth < prev.depth) {
                result[id] = {
                    ...node.node,
                    depth,
                };
            }
        }
        node.children.forEach((child) => walk(child, depth + 1));
    };

    hierarchy.forEach((h) => walk(h, 0));
    return result;
};

/** Все уникальные рёбра графа (для проверки циклов при добавлении связи). */
export function collectAllLinksFromHierarchy(hierarchy: NodeHierarchy[]): EditorLink[] {
    const list: EditorLink[] = [];
    const seen = new Set<string>();
    const keyOf = (l: EditorLink) =>
        l.id != null ? `id:${l.id}` : `${l.parentId}-${l.childId}-${l.condition}`;

    const walk = (h: NodeHierarchy) => {
        for (const l of h.outgoingLinks) {
            const k = keyOf(l);
            if (seen.has(k)) continue;
            seen.add(k);
            list.push(l);
        }
        for (const c of h.children) walk(c);
    };

    hierarchy.forEach(walk);
    return list;
}

/** true, если из childId уже есть путь к parentId (добавление parent→child замкнёт цикл). */
export function wouldCreateCycle(
    links: EditorLink[],
    parentId: number,
    childId: number,
): boolean {
    if (parentId === childId) return true;
    const adj = new Map<number, number[]>();
    for (const l of links) {
        const arr = adj.get(l.parentId);
        if (arr) arr.push(l.childId);
        else adj.set(l.parentId, [l.childId]);
    }
    const stack = [childId];
    const visited = new Set<number>();
    while (stack.length > 0) {
        const n = stack.pop()!;
        if (n === parentId) return true;
        if (visited.has(n)) continue;
        visited.add(n);
        const next = adj.get(n);
        if (next) for (const x of next) stack.push(x);
    }
    return false;
}

export const useDecisionTreeEditorStore = create<EditorState>((set, get) => ({
    treeType: TreeType.ArchitectureStyle,
    hierarchy: [],
    nodes: {},
    selectedNodeId: null,
    loading: false,
    error: null,

    get selectedNode() {
        const id = get().selectedNodeId;
        if (id == null) return null;
        console.log("Нода", get().nodes);
        return get().nodes[id] ?? null;
    },

    setTreeType: (treeType) => set({ treeType }),

    clearError: () => set({ error: null }),

    loadTree: async () => {
        const treeType = get().treeType;
        set({ loading: true, error: null });
        try {
            const hierarchy = await getTreeHierarchy(treeType);
            const flat = flattenHierarchy(hierarchy);
            set({
                hierarchy,
                nodes: flat,
                selectedNodeId: null,
            });
        } catch (e) {
            set({
                error:
                    e instanceof Error ? e.message : "Не удалось загрузить дерево решений",
            });
        } finally {
            set({ loading: false });
        }
    },

    selectNode: (id) => set({ selectedNodeId: id }),

    getOutgoingLinks: (nodeId) => {
        const hierarchy = get().hierarchy;
        const found = findNodeInHierarchy(hierarchy, nodeId);
        return found?.outgoingLinks ?? [];
    },

    updateLinkCondition: async (linkId, newCondition) => {
        set({ loading: true, error: null });
        try {
            await updateLink(linkId, { newCondition });
            await get().loadTree();
        } catch (e) {
            set({
                error:
                    e instanceof Error ? e.message : "Не удалось обновить ответ (связь)",
            });
        } finally {
            set({ loading: false });
        }
    },

    updateSelectedNode: async (patch) => {
        const state = get();
        const id = state.selectedNodeId;
        if (id == null) return;

        const current = state.nodes[id];
        if (!current) return;

        set({ loading: true, error: null });
        try {
            const payload: NodeRequest = {
                treeType: current.treeType,
                type: patch.type ?? current.type,
                questionText:
                    patch.questionText !== undefined
                        ? patch.questionText
                        : current.questionText ?? null,
                architectureStyle:
                    patch.architectureStyle !== undefined
                        ? patch.architectureStyle
                        : current.architectureStyle ?? null,
                patterns:
                    patch.patterns !== undefined
                        ? patch.patterns
                        : current.patterns ?? null,
                description:
                    patch.description !== undefined
                        ? patch.description
                        : current.description ?? null,
                pros:
                    patch.pros !== undefined ? patch.pros : current.pros ?? null,
                cons:
                    patch.cons !== undefined ? patch.cons : current.cons ?? null,
            };

            await updateNode(id, payload);
            await get().loadTree();
            set({ selectedNodeId: id });
        } catch (e) {
            set({
                error:
                    e instanceof Error ? e.message : "Не удалось обновить узел",
            });
        } finally {
            set({ loading: false });
        }
    },

    addChildQuestion: async (parentId, condition) => {
        const { treeType } = get();
        set({ loading: true, error: null });
        try {
            await insertBranch(parentId, condition, {
                treeType,
                type: "Question",
                questionText: "Новый вопрос",
            });
            await get().loadTree();
        } catch (e) {
            set({
                error:
                    e instanceof Error ? e.message : "Не удалось добавить вопрос",
            });
        } finally {
            set({ loading: false });
        }
    },

    addChildResult: async (parentId, condition) => {
        const { treeType } = get();
        set({ loading: true, error: null });
        try {
            await insertBranch(parentId, condition, {
                treeType,
                type: "Result",
                architectureStyle: "Новый результат",
            });
            await get().loadTree();
        } catch (e) {
            set({
                error:
                    e instanceof Error ? e.message : "Не удалось добавить результат",
            });
        } finally {
            set({ loading: false });
        }
    },

    linkToExistingChild: async (parentId, childId, condition) => {
        const trimmed = condition.trim();
        if (!trimmed) {
            set({ error: "Укажите условие (ответ) для связи" });
            return;
        }
        if (parentId === childId) {
            set({ error: "Нельзя связать узел сам с собой" });
            return;
        }
        const links = collectAllLinksFromHierarchy(get().hierarchy);
        if (wouldCreateCycle(links, parentId, childId)) {
            set({ error: "Такая связь создаст цикл в графе" });
            return;
        }
        set({ loading: true, error: null });
        try {
            await addLink({ parentId, childId, condition: trimmed });
            await get().loadTree();
            set({ selectedNodeId: parentId });
        } catch (e) {
            set({
                error:
                    e instanceof Error ? e.message : "Не удалось добавить связь к существующему узлу",
            });
        } finally {
            set({ loading: false });
        }
    },

    removeSelectedNode: async () => {
        const id = get().selectedNodeId;
        if (id == null) return;

        set({ loading: true, error: null });
        try {
            await deleteNode(id, true);
            await get().loadTree();
            set({ selectedNodeId: null });
        } catch (e) {
            set({
                error:
                    e instanceof Error ? e.message : "Не удалось удалить узел",
            });
        } finally {
            set({ loading: false });
        }
    },
}));

