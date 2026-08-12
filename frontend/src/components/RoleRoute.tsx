import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface RoleRouteProps {
  roles: Role[];
  children: ReactNode;
}

export default function RoleRoute({ roles, children }: RoleRouteProps) {
  const { user, hasRole } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole(...roles)) {
    return (
      <div className="card">
        <div className="card-body empty-state">
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
