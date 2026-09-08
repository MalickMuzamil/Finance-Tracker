import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';
import Card from './Card';
import Button from './Button';
import { ShieldAlert } from 'lucide-react';

export function ProtectedRoute({ requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState type="fullscreen" message="Authenticating your session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '24px' }}>
        <Card style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldAlert size={26} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Access Denied</h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px', lineHeight: 1.5 }}>
            This page requires <strong>Super Admin</strong> privileges. Your account does not have authorization to view this resource.
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/'}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState type="fullscreen" message="Authenticating your session..." />;
  }

  return user ? <Navigate to="/" replace /> : <Outlet />;
}

export default ProtectedRoute;
