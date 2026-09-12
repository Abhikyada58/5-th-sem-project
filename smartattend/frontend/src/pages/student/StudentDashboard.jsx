import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';
import { Play, CheckCircle, Clock, Calendar, BookOpen, AlertCircle, TrendingUp } from 'lucide-react';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(null);
  
  // Dashboard Data State
  const [summary, setSummary] = useState(null);
  const [subjectSummary, setSubjectSummary] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch active session on mount (in case they reconnect)
    fetchActiveSession();
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sumRes, subjRes, histRes] = await Promise.all([
        axios.get(import.meta.env.VITE_API_URL + '/attendance/my-summary'),
        axios.get(import.meta.env.VITE_API_URL + '/attendance/my-subject-summary'),
        axios.get(import.meta.env.VITE_API_URL + '/attendance/my-history')
      ]);
      setSummary(sumRes.data.summary);
      setSubjectSummary(subjRes.data.summary);
      setHistory(histRes.data.history);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Analytics Section */}
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading your attendance data...</div>
        ) : (
          <div className="space-y-6">
            
            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <TrendingUp className="w-8 h-8 text-indigo-500 mb-2" />
                <p className="text-sm text-gray-500 font-medium">Overall</p>
                <p className="text-3xl font-bold text-gray-800">{summary?.percentage || 0}%</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-sm text-gray-500 font-medium">Present</p>
                <p className="text-3xl font-bold text-gray-800">{summary?.present || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-sm text-gray-500 font-medium">Absent</p>
                <p className="text-3xl font-bold text-gray-800">{summary?.absent || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <Clock className="w-8 h-8 text-orange-500 mb-2" />
                <p className="text-sm text-gray-500 font-medium">Late</p>
                <p className="text-3xl font-bold text-gray-800">{summary?.late || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subject Progress */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-indigo-500" /> Subject Progress
                </h2>
                {subjectSummary.length === 0 ? (
                  <p className="text-gray-500 text-sm">No subject data available.</p>
                ) : (
                  <div className="space-y-4">
                    {subjectSummary.map((sub) => (
                      <div key={sub._id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{sub.subjectName}</span>
                          <span className={`font-bold ${sub.percentage < 75 ? 'text-red-500' : 'text-green-500'}`}>
                            {sub.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${sub.percentage < 75 ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${sub.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* History Table */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-indigo-500" /> Recent History
                </h2>
                {history.length === 0 ? (
                  <p className="text-gray-500 text-sm">No attendance history.</p>
                ) : (
                  <div className="overflow-y-auto max-h-[300px] pr-2">
                    <ul className="space-y-3">
                      {history.map((record) => (
                        <li key={record._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{record.subjectId.name}</p>
                            <p className="text-xs text-gray-500">{new Date(record.markedAt).toLocaleDateString()} • {new Date(record.markedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            record.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 
                            record.status === 'ABSENT' ? 'bg-red-100 text-red-700' : 
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {record.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
