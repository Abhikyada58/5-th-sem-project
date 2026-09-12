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
    <div className="space-y-6">
      {/* Live Session Alert */}
      {activeSession ? (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-2xl shadow-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between border border-indigo-700 animate-pulse-slow">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <h2 className="text-2xl font-extrabold flex items-center justify-center md:justify-start mb-2 tracking-tight">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-ping mr-3 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              Active Attendance Session
            </h2>
            <p className="text-indigo-100 text-lg font-medium">
              {activeSession.subjectName} ({activeSession.className})
            </p>
            <p className="text-sm text-indigo-200 mt-2 flex items-center justify-center md:justify-start">
              <Clock className="w-4 h-4 mr-1.5" /> Closes at {new Date(activeSession.expiresAt).toLocaleTimeString()}
            </p>
          </div>
          <button 
            onClick={handleJoinSession}
            className="w-full md:w-auto bg-white text-indigo-700 px-8 py-4 rounded-xl font-bold shadow-xl hover:bg-indigo-50 hover:scale-105 transition-all flex items-center justify-center text-lg"
          >
            <Play className="w-6 h-6 mr-2 fill-current" /> Mark Present
          </button>
        </div>
      ) : (
        <div className="bg-white p-10 text-center rounded-2xl shadow-sm border border-gray-100 text-gray-500">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">No active sessions right now</h2>
          <p className="mt-2 text-gray-500 text-lg">When your teacher starts a session, it will appear here automatically.</p>
        </div>
      )}

      {/* Analytics Section */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-gray-200 h-32 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mb-3"><TrendingUp className="w-6 h-6" /></div>
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1">Overall</p>
              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{summary?.percentage || 0}%</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mb-3"><CheckCircle className="w-6 h-6" /></div>
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1">Present</p>
              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{summary?.present || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl mb-3"><AlertCircle className="w-6 h-6" /></div>
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1">Absent</p>
              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{summary?.absent || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl mb-3"><Clock className="w-6 h-6" /></div>
              <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-1">Late</p>
              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{summary?.late || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Subject Progress */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <BookOpen className="w-6 h-6 mr-3 text-indigo-600" /> Subject Progress
              </h2>
              {subjectSummary.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No subject data available.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {subjectSummary.map((sub) => (
                    <div key={sub._id}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-gray-800">{sub.subjectName}</span>
                        <span className={`font-extrabold ${sub.percentage < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {sub.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${sub.percentage < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${sub.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* History Table */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-indigo-600" /> Recent History
              </h2>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No attendance history.</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  <ul className="space-y-3">
                    {history.map((record) => (
                      <li key={record._id} className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl border border-gray-100">
                        <div>
                          <p className="font-bold text-gray-800 text-sm mb-1">{record.subjectId.name}</p>
                          <p className="text-xs text-gray-500 font-medium">{new Date(record.markedAt).toLocaleDateString()} • {new Date(record.markedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : 
                          record.status === 'ABSENT' ? 'bg-rose-100 text-rose-800' : 
                          'bg-amber-100 text-amber-800'
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
  );
}
