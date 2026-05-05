import { baseUrl } from "../../shared/api/options.ts";
import { throwIfResponseNotOk } from "../../shared/api/httpError.ts";
import type { TreeTypeValue } from "../architectureDecision/api.ts";
import { TreeType } from "../architectureDecision/api.ts";
import { useAuthStore } from "../auth/store.ts";

export interface EditorNode {
    id: number | null;
    treeType: TreeTypeValue;
    type: string; // "Question" | "Result"
    questionText?: string | null;
    architectureStyle?: string | null;
    patterns?: string[] | null;
    description?: string | null;
    pros?: string[] | null;
    cons?: string[] | null;
}

export interface EditorLink {
    id: number | null;
    parentId: number;
    childId: number;
    condition: string;
}

export interface NodeHierarchy {
    node: EditorNode;
    children: NodeHierarchy[];
    outgoingLinks: EditorLink[];
}

export interface InsertNodeRequest {
    node: EditorNode;
    insertAfterNodeId?: number | null;
    insertAsChildOfNodeId?: number | null;
    parentAnswerCondition?: string | null;
    insertAsBranch?: boolean;
}

export interface NodeRequest {
    treeType: TreeTypeValue;
    type: string;
    questionText?: string | null;
    architectureStyle?: string | null;
    patterns?: string[] | null;
    description?: string | null;
    pros?: string[] | null;
    cons?: string[] | null;
}

export interface LinkRequest {
    parentId: number;
    childId: number;
    condition: string;
}

export interface UpdateLinkRequest {
    newChildId?: number | null;
    newCondition?: string | null;
}

const BASE_URL = `${baseUrl}/api/v1/DecisionTreeEditor`;

const getAuthHeaders = (): HeadersInit => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
        return {};
    }
    return {
        Authorization: `Bearer ${token}`,
    };
};

export const getTreeHierarchy = async (
    treeType: TreeTypeValue = TreeType.ArchitectureStyle,
): Promise<NodeHierarchy[]> => {
    const res = await fetch(`${BASE_URL}/tree/${treeType}/hierarchy`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
    });

    await throwIfResponseNotOk(res, "Не удалось загрузить дерево");

    type RawNodeRequest = {
        id: number | null;
        treeType: TreeTypeValue;
        type: string;
        questionText?: string | null;
        architectureStyle?: string | null;
        patterns?: string[] | null;
        description?: string | null;
        pros?: string[] | null;
        cons?: string[] | null;
    };

    type RawLink = {
        id: number | null;
        parentId: number;
        childId: number;
        condition: string;
    };

    type RawNodeHierarchy = {
        node: RawNodeRequest;
        children: RawNodeHierarchy[];
        outgoingLinks: RawLink[];
    };

    const raw = (await res.json()) as RawNodeHierarchy[];
    const mapHierarchy = (h: RawNodeHierarchy): NodeHierarchy => ({
        node: {
            id: h.node.id,
            treeType: h.node.treeType,
            type: h.node.type,
            questionText: h.node.questionText ?? null,
            architectureStyle: h.node.architectureStyle ?? null,
            patterns: h.node.patterns ?? null,
            description: h.node.description ?? null,
            pros: h.node.pros ?? null,
            cons: h.node.cons ?? null,
        },
        children: h.children.map(mapHierarchy),
        outgoingLinks: h.outgoingLinks.map((l) => ({
            id: l.id,
            parentId: l.parentId,
            childId: l.childId,
            condition: l.condition,
        })),
    });
    
    return raw.map(mapHierarchy);
};

export const insertNode = async (payload: InsertNodeRequest) => {
    const res = await fetch(`${BASE_URL}/nodes/insert`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({
            node: {
                id: payload.node.id,
                treeType: payload.node.treeType,
                type: payload.node.type,
                questionText: payload.node.questionText,
                architectureStyle: payload.node.architectureStyle,
                patterns: payload.node.patterns,
                description: payload.node.description,
                pros: payload.node.pros,
                cons: payload.node.cons,
            },
            insertAfterNodeId: payload.insertAfterNodeId,
            insertAsChildOfNodeId: payload.insertAsChildOfNodeId,
            parentAnswerCondition: payload.parentAnswerCondition,
            insertAsBranch: payload.insertAsBranch ?? false,
        }),
    });

    await throwIfResponseNotOk(res, "Не удалось вставить узел");

    return res.json();
};

export const insertBranch = async (
    parentNodeId: number,
    condition: string,
    branchRoot: NodeRequest,
) => {
    const payload = {
        ...branchRoot,
        treeType: Number(branchRoot.treeType) // Отправляем как число
    };

    const res = await fetch(
        `${BASE_URL}/nodes/${parentNodeId}/branch?condition=${encodeURIComponent(condition)}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify(payload),
        },
    );

    await throwIfResponseNotOk(res, "Не удалось добавить ветку");

    return res.json();
};

export const updateNode = async (nodeId: number, payload: NodeRequest) => {
    const res = await fetch(`${BASE_URL}/nodes/${nodeId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });

    await throwIfResponseNotOk(res, "Не удалось обновить узел");

    return res.json();
};

export const deleteNode = async (nodeId: number, cascade: boolean = true) => {
    const res = await fetch(
        `${BASE_URL}/nodes/${nodeId}?cascade=${cascade ? "true" : "false"}`,
        {
            method: "DELETE",
            headers: {
                ...getAuthHeaders(),
            },
        },
    );

    await throwIfResponseNotOk(res, "Не удалось удалить узел");
};

export const addLink = async (payload: LinkRequest) => {
    const res = await fetch(`${BASE_URL}/links`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });

    await throwIfResponseNotOk(res, "Не удалось добавить связь");

    return res.json();
};

export const updateLink = async (linkId: number, payload: UpdateLinkRequest) => {
    const res = await fetch(`${BASE_URL}/links/${linkId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });

    await throwIfResponseNotOk(res, "Не удалось обновить связь");

    return res.json();
};

export const deleteLink = async (linkId: number) => {
    const res = await fetch(`${BASE_URL}/links/${linkId}`, {
        method: "DELETE",
        headers: {
            ...getAuthHeaders(),
        },
    });

    await throwIfResponseNotOk(res, "Не удалось удалить связь");
};

