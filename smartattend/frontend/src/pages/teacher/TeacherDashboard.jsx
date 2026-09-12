import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Play, XCircle, Clock } from 'lucide-react';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const socket = useSocket();
  
  const [subjects, setSubjects] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedSubject, setSelectedSubject] = useState('');
  const [duration, setDuration] = useState(5);
  
  // Live Session State
  const [currentLiveSession, setCurrentLiveSession] = useState(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjRes, sessRes] = await Promise.all([
        axios.get(import.meta.env.VITE_API_URL + '/sessions/subjects'),
        axios.get(import.meta.env.VITE_API_URL + '/sessions/active')
      ]);
      setSubjects(subjRes.data.subjects);
      setActiveSessions(sessRes.data.sessions);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (currentLiveSession) {
      timer = setInterval(() => {
        const remaining = Math.floor((new Date(currentLiveSession.expiresAt).getTime() - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(timer);
          setCountdown(0);
          toast('Session has expired', { icon: '⏱️' });
          setCurrentLiveSession(null);
          fetchData();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentLiveSession]);

  useEffect(() => {
    if (!socket) return;
    
    // Join all class rooms the teacher is teaching so they can hear events
    if (subjects.length > 0) {
      subjects.forEach(s => {
        socket.emit('join-class', typeof s.classId === 'object' ? s.classId._id : s.classId);
      });
    }

    const handleAttendanceUpdated = (data) => {
      toast.success(`${data.studentName} marked present!`, { icon: '✅' });
      // We could update a live participant list state here
    };

    socket.on('attendance-updated', handleAttendanceUpdated);

    return () => {
      socket.off('attendance-updated', handleAttendanceUpdated);
    };
  }, [socket, subjects]);

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return toast.error('Please select a subject');
    
    const subject = subjects.find(s => s._id === selectedSubject);
    if (!subject) return;

    try {
      const res = await axios.post(import.meta.env.VITE_API_URL + '/sessions/start', {
        classId: subject.classId._id,
        subjectId: subject._id,
        durationMinutes: duration
      });
      
      const sessionData = {
        ...res.data.session,
        rawToken: res.data.rawToken,
        subjectName: subject.name,
        className: subject.classId.name
      };
      
      setCurrentLiveSession(sessionData);
      toast.success('Session started successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start session');
    }
  };

  const handleCloseSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to close this session early?')) return;
    try {
      await axios.post(import.meta.env.VITE_API_URL + `/sessions/${sessionId}/close`);
      toast.success('Session closed');
      if (currentLiveSession?._id === sessionId) {
        setCurrentLiveSession(null);
      }
      fetchData();
    } catch (err) {
      toast.error('Failed to close session');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
            <p className="text-gray-500">Welcome, {user.fullName}</p>
          </div>
          <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium">Logout</button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Form & Active Sessions */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Start Session Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Play className="w-5 h-5 mr-2 text-indigo-600" /> Start Attendance
              </h2>
              <form onSubmit={handleStartSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject & Class</label>
                  <select 
                    className="w-full border-gray-300 rounded-md shadow-sm border p-2"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    required
                  >
                    <option value="">Select...</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.classId.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select 
                    className="w-full border-gray-300 rounded-md shadow-sm border p-2"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    <option value={1}>1 Minute (Test)</option>
                    <option value={5}>5 Minutes</option>
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={!!currentLiveSession}
                  className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Start New Session
                </button>
              </form>
            </div>

            {/* Background Active Sessions List (if they leave the live view) */}
            {activeSessions.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Background Sessions</h2>
                <ul className="space-y-3">
                  {activeSessions.map(session => (
                    <li key={session._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-semibold text-sm">{session.subjectId.name}</p>
                        <p className="text-xs text-gray-500">Exp: {new Date(session.expiresAt).toLocaleTimeString()}</p>
                      </div>
                      <button 
                        onClick={() => handleCloseSession(session._id)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                        title="Close Session"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Live QR Display */}
          <div className="lg:col-span-2">
            {currentLiveSession ? (
              <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-indigo-100 flex flex-col items-center text-center h-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentLiveSession.subjectName}</h2>
                <p className="text-gray-500 mb-6">{currentLiveSession.className}</p>
                
                <div className="bg-gray-100 p-4 rounded-xl mb-8">
                  {/* Secure QR Payload */}
                  <QRCodeSVG 
                    value={JSON.stringify({ 
                      sessionId: currentLiveSession._id, 
                      token: currentLiveSession.rawToken 
                    })} 
                    size={300}
                    level="H"
                  />
                </div>

                <div className="flex items-center text-3xl font-mono text-indigo-600 mb-8 font-bold bg-indigo-50 px-6 py-3 rounded-full">
                  <Clock className="w-8 h-8 mr-3" />
                  {formatTime(countdown)}
                </div>
                
                <button 
                  onClick={() => handleCloseSession(currentLiveSession._id)}
                  className="bg-red-100 text-red-700 px-6 py-3 rounded-full font-semibold hover:bg-red-200 transition-colors"
                >
                  Close Session Early
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <div className="w-24 h-24 mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-500 mb-2">No Active Display</h3>
                <p>Start an attendance session from the left menu to generate a dynamic QR code for your students to scan.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
