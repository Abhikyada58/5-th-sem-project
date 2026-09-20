import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';
import StudentRoute from './components/StudentRoute';
import { Toaster } from 'react-hot-toast';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import DashboardLayout from './layouts/DashboardLayout';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import StudentManagement from './pages/admin/StudentManagement';
import TeacherManagement from './pages/admin/TeacherManagement';
import ClassManagement from './pages/admin/ClassManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import AuditLogs from './pages/admin/AuditLogs';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherReports from './pages/teacher/TeacherReports';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSetup from './pages/student/StudentSetup';
import FaceEnrollment from './pages/student/FaceEnrollment';
import StudentProfile from './pages/student/StudentProfile';
import QRScanner from './pages/student/QRScanner';
import FaceVerification from './pages/student/FaceVerification';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<RoleRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminDashboard /></DashboardLayout></RoleRoute>} />
            <Route path="/admin/students" element={<RoleRoute allowedRoles={['ADMIN']}><DashboardLayout><StudentManagement /></DashboardLayout></RoleRoute>} />
            <Route path="/admin/teachers" element={<RoleRoute allowedRoles={['ADMIN']}><DashboardLayout><TeacherManagement /></DashboardLayout></RoleRoute>} />
            <Route path="/admin/classes" element={<RoleRoute allowedRoles={['ADMIN']}><DashboardLayout><ClassManagement /></DashboardLayout></RoleRoute>} />
            <Route path="/admin/subjects" element={<RoleRoute allowedRoles={['ADMIN']}><DashboardLayout><SubjectManagement /></DashboardLayout></RoleRoute>} />
            <Route path="/admin/audit-logs" element={<RoleRoute allowedRoles={['ADMIN']}><DashboardLayout><AuditLogs /></DashboardLayout></RoleRoute>} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={<RoleRoute allowedRoles={['TEACHER']}><DashboardLayout><TeacherDashboard /></DashboardLayout></RoleRoute>} />
            <Route path="/teacher/reports" element={<RoleRoute allowedRoles={['TEACHER']}><DashboardLayout><TeacherReports /></DashboardLayout></RoleRoute>} />

            {/* Student Setup & Onboarding (No Sidebar Layout) */}
            <Route path="/student/setup" element={<ProtectedRoute><StudentSetup /></ProtectedRoute>} />
            <Route path="/student/face-enrollment" element={<ProtectedRoute><FaceEnrollment /></ProtectedRoute>} />
            <Route path="/student/verify-face" element={<ProtectedRoute><FaceVerification /></ProtectedRoute>} />
            <Route path="/student/scan-qr" element={<StudentRoute><QRScanner /></StudentRoute>} />

            {/* Student Dashboard Routes */}
            <Route path="/student" element={<StudentRoute><DashboardLayout><StudentDashboard /></DashboardLayout></StudentRoute>} />
            <Route path="/student/profile" element={<StudentRoute><DashboardLayout><StudentProfile /></DashboardLayout></StudentRoute>} />

          </Routes>
          <Toaster position="top-right" />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
