import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';
import StudentRoute from './components/StudentRoute';

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

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSetup from './pages/student/StudentSetup';
import FaceEnrollment from './pages/student/FaceEnrollment';
import StudentProfile from './pages/student/StudentProfile';
import QRScanner from './pages/student/QRScanner';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
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
              <TeacherDashboard />
            </RoleRoute>
          } />

          {/* Student Routes */}
          <Route path="/student/setup" element={<ProtectedRoute><StudentSetup /></ProtectedRoute>} />
          <Route path="/student/face-enrollment" element={<ProtectedRoute><FaceEnrollment /></ProtectedRoute>} />
          
          <Route path="/student" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
          <Route path="/student/profile" element={<StudentRoute><StudentProfile /></StudentRoute>} />
          <Route path="/student/scan-qr" element={<StudentRoute><QRScanner /></StudentRoute>} />

          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
