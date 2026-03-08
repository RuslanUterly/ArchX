import type {ReactNode} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../modules/auth/store';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[];
    redirectTo?: string;
}

export default function ProtectedRoute({
    children,
    allowedRoles,
    redirectTo = "/decision-tree",
}: ProtectedRouteProps) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const roles = useAuthStore((s) => s.roles);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const normalizedRoles = roles.map((role) => role.toLowerCase());
        const hasAccess = allowedRoles.some((role) =>
            normalizedRoles.includes(role.toLowerCase()),
        );

        if (!hasAccess) {
            return <Navigate to={redirectTo} replace />;
        }
    }

    return <>{children}</>;
}
