import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState type="fullscreen" message="Authenticating your session..." />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
