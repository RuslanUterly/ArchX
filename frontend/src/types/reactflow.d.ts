declare module "reactflow" {
    export type Node = any;
    export type Edge = any;
    export type NodeMouseHandler = (event: any, node: Node) => void;

    const ReactFlow: (props: any) => JSX.Element;
    export default ReactFlow;

    export const Background: (props: any) => JSX.Element;
    export const Controls: (props: any) => JSX.Element;
    export const MiniMap: (props: any) => JSX.Element;
}

