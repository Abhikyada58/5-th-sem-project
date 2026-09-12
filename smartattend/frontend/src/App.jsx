import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/Dashboard';

// Admin Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import StudentManagement from './pages/admin/StudentManagement';
import TeacherManagement from './pages/admin/TeacherManagement';
import ClassManagement from './pages/admin/ClassManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import AuditLogs from './pages/admin/AuditLogs';

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

          {/* Admin Routes with Sidebar Layout */}
          <Route path="/admin" element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </RoleRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="teachers" element={<TeacherManagement />} />
            <Route path="classes" element={<ClassManagement />} />
            <Route path="subjects" element={<SubjectManagement />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
          
          {/* Teacher Routes */}
          <Route path="/teacher" element={
            <RoleRoute allowedRoles={['TEACHER']}>
              <Dashboard title="Teacher Dashboard" />
            </RoleRoute>
          } />

          {/* Student Routes */}
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
