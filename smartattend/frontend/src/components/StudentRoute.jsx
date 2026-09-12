import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'STUDENT') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Force setup if first login
  if (user.firstLogin && location.pathname !== '/student/setup') {
    return <Navigate to="/student/setup" replace />;
  }

  // Force face enrollment if setup is done but face is not enrolled
  if (!user.firstLogin && !user.faceEnrolled && location.pathname !== '/student/face-enrollment' && location.pathname !== '/student/setup') {
    return <Navigate to="/student/face-enrollment" replace />;
  }

  return children;
}
