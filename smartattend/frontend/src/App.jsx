import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Role-based Protected Routes */}
          <Route path="/admin" element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <Dashboard title="Admin Dashboard" />
            </RoleRoute>
          } />
          
          <Route path="/teacher" element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <Dashboard title="Teacher Dashboard" />
            </RoleRoute>
          } />

          <Route path="/student" element={
            <RoleRoute allowedRoles={['STUDENT']}>
              <Dashboard title="Student Dashboard" />
            </RoleRoute>
          } />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
