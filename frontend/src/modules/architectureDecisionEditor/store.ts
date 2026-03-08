import { create } from "zustand";
import type { TreeTypeValue } from "../architectureDecision/api.ts";
import { TreeType } from "../architectureDecision/api.ts";
import type { NodeHierarchy, EditorNode, NodeRequest } from "./api.ts";
import { deleteNode, getTreeHierarchy, insertBranch, updateNode } from "./api.ts";

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
    addChildQuestion: (parentId: number, condition: string) => Promise<void>;
    addChildResult: (parentId: number, condition: string) => Promise<void>;
    removeSelectedNode: () => Promise<void>;
    clearError: () => void;
}

const flattenHierarchy = (hierarchy: NodeHierarchy[]): Record<number, FlatNode> => {
    const result: Record<number, FlatNode> = {};

    const walk = (node: NodeHierarchy, depth: number) => {
        const id = node.node.id;
        if (id != null) {
            result[id] = {
                ...node.node,
                depth,
            };
        }
        node.children.forEach((child) => walk(child, depth + 1));
    };

    hierarchy.forEach((h) => walk(h, 0));
    return result;
};

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

