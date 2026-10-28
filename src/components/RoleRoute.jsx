import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';

/**
 * Lets through only users whose role is in `roles`.
 * Logged-out users go to login. Logged-in users with the wrong role go to their dashboard.
 */
export default function RoleRoute({ roles = [], children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="center-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!profile) return <div className="center-screen"><div className="spinner" /></div>;
  if (!roles.includes(profile.role)) return <Navigate to="/dashboard" replace />;

  return children;
}