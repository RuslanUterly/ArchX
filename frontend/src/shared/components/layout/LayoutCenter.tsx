import type {ReactNode} from "react";

export default function LayoutCenter({ children }: { children: ReactNode }) {
    return (
        <div className="container-fill-height">
            {children}
        </div>
    );
}