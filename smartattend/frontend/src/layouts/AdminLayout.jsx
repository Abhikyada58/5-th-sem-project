import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, UserCheck, BookOpen, GraduationCap, FileText, LogOut } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Teachers', path: '/admin/teachers', icon: UserCheck },
    { name: 'Classes', path: '/admin/classes', icon: BookOpen },
    { name: 'Subjects', path: '/admin/subjects', icon: GraduationCap },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <div className="p-6 border-b text-center">
          <h2 className="text-2xl font-bold text-blue-600">SmartAttend</h2>
          <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''}`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center p-6 bg-white shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">
            {navItems.find(i => i.path === location.pathname)?.name || 'Admin Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Hello, {user?.fullName}</span>
            <button
              onClick={logout}
              className="flex items-center text-red-600 hover:text-red-800"
            >
              <LogOut className="w-5 h-5 mr-1" />
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
