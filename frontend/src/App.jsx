import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Finance from './pages/Finance';
import Lend from './pages/Lend';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public-only routes (redirect logged-in users to /) */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            {/* Authenticated user routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/lend" element={<Lend />} />

                {/* Super Admin only route */}
                <Route element={<ProtectedRoute requiredRole="SUPER_ADMIN" />}>
                  <Route path="/admin" element={<Admin />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
