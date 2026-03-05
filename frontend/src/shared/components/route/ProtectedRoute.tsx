import type {ReactNode} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../modules/auth/store';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
