import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { Play, CheckCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    // 1. Fetch active session on mount (in case they reconnect)
    fetchActiveSession();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // 2. Listen for real-time events
    socket.on('attendance-session-started', (session) => {
      toast('A new attendance session has started!', { icon: '🔔' });
      setActiveSession(session);
    });

    socket.on('attendance-session-closed', (sessionId) => {
      if (activeSession && activeSession._id === sessionId) {
        toast('The attendance session has closed.', { icon: '🛑' });
        setActiveSession(null);
      }
    });

    return () => {
      socket.off('attendance-session-started');
      socket.off('attendance-session-closed');
    };
  }, [socket, activeSession]);

  const fetchActiveSession = async () => {
    try {
      // In a real app, you'd make an API call to GET /api/student/active-session
      // For now, we rely heavily on sockets, but a fallback is important.
      const res = await axios.get(import.meta.env.VITE_API_URL + '/student/active-session');
      if (res.data.session) {
        setActiveSession(res.data.session);
      }
    } catch (error) {
      // Ignore 404s (no active session)
    }
  };

  const handleJoinSession = () => {
    navigate('/student/scan-qr');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user.fullName}</p>
          </div>
          <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium">Logout</button>
        </div>

        {/* Live Session Alert */}
        {activeSession ? (
          <div className="bg-indigo-600 text-white rounded-lg shadow-lg p-6 flex flex-col md:flex-row items-center justify-between animate-pulse-slow">
            <div>
              <h2 className="text-xl font-bold flex items-center mb-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-ping mr-3"></span>
                Active Attendance Session
              </h2>
              <p className="text-indigo-100">
                {activeSession.subjectName} ({activeSession.className})
              </p>
              <p className="text-sm text-indigo-200 mt-1">
                Closes at {new Date(activeSession.expiresAt).toLocaleTimeString()}
              </p>
            </div>
            <button 
              onClick={handleJoinSession}
              className="mt-4 md:mt-0 bg-white text-indigo-600 px-8 py-3 rounded-full font-bold shadow-md hover:bg-gray-100 transition-colors flex items-center"
            >
              <Play className="w-5 h-5 mr-2" /> Mark Present
            </button>
          </div>
        ) : (
          <div className="bg-white p-8 text-center rounded-lg shadow-sm border border-gray-100 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
            <h2 className="text-xl font-semibold text-gray-700">No active sessions right now.</h2>
            <p className="mt-2">When a teacher starts an attendance session, it will appear here automatically.</p>
          </div>
        )}

      </div>
    </div>
  );
}
