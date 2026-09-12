import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, LogOut, User as UserIcon, LayoutDashboard, 
  Users, BookOpen, Clock, FileText, Settings, ShieldCheck, QrCode
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Navigation config based on role
  const getNavLinks = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { name: 'Students', path: '/admin/students', icon: Users },
          { name: 'Teachers', path: '/admin/teachers', icon: Users },
          { name: 'Classes', path: '/admin/classes', icon: BookOpen },
          { name: 'Subjects', path: '/admin/subjects', icon: BookOpen },
          { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
        ];
      case 'TEACHER':
        return [
          { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
          { name: 'Reports', path: '/teacher/reports', icon: FileText },
        ];
      case 'STUDENT':
        return [
          { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
          { name: 'Scan QR', path: '/student/scan-qr', icon: QrCode },
          { name: 'Profile', path: '/student/profile', icon: UserIcon },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-indigo-600 lg:bg-white border-b border-indigo-700 lg:border-gray-200">
          <Link to={`/${user?.role.toLowerCase()}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white lg:bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-600 lg:text-white" />
            </div>
            <span className="text-xl font-bold text-white lg:text-gray-900 tracking-tight">SmartAttend</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-indigo-100 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-4rem)] p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
            Menu
          </div>
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-900 focus:outline-none rounded-md"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Breadcrumb / Title (Optional) */}
            <h2 className="text-lg font-semibold text-gray-800 hidden sm:block capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-3 focus:outline-none hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200 shadow-sm">
                  {user?.fullName?.charAt(0)}
                </div>
              </button>

              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 z-20 border border-gray-100 ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                      <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    {user?.role === 'STUDENT' && (
                      <Link 
                        to="/student/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <UserIcon className="w-4 h-4 mr-2 text-gray-400" /> Profile
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
