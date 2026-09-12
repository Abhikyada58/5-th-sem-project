import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { Play, XCircle, Clock, QrCode } from 'lucide-react';

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

    const handleStudentEntered = (data) => {
      toast(`${data.studentName} is verifying their face...`, { icon: '👀' });
    };

    socket.on('attendance-updated', handleAttendanceUpdated);
    socket.on('student-entered-session', handleStudentEntered);

    return () => {
      socket.off('attendance-updated', handleAttendanceUpdated);
      socket.off('student-entered-session', handleStudentEntered);
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
    <div className="space-y-6">
      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column: Form & Active Sessions */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Start Session Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center">
              <Play className="w-5 h-5 mr-2 text-indigo-600" /> Start Session
            </h2>
            <form onSubmit={handleStartSession} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject & Class</label>
                <select 
                  className="w-full bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm border p-2.5 text-sm"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  required
                >
                  <option value="">Select subject...</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.classId.name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration</label>
                <select 
                  className="w-full bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm border p-2.5 text-sm"
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
                className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
              >
                Start Scanning
              </button>
            </form>
          </div>

          {/* Background Active Sessions List */}
          {activeSessions.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Background Sessions</h2>
              <ul className="space-y-3">
                {activeSessions.map(session => (
                  <li key={session._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{session.subjectId.name}</p>
                      <p className="text-xs text-gray-500">Exp: {new Date(session.expiresAt).toLocaleTimeString()}</p>
                    </div>
                    <button 
                      onClick={() => handleCloseSession(session._id)}
                      className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
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

        {/* Right Column: Projector Live QR Display */}
        <div className="xl:col-span-3">
          {currentLiveSession ? (
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-indigo-50 flex flex-col items-center justify-center text-center min-h-[600px] relative overflow-hidden">
              {/* Subtle background pulse */}
              <div className="absolute inset-0 bg-indigo-50/30 animate-pulse rounded-3xl pointer-events-none"></div>
              
              <div className="relative z-10 w-full flex flex-col items-center">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">{currentLiveSession.subjectName}</h2>
                <p className="text-xl text-gray-500 mb-10 font-medium">{currentLiveSession.className}</p>
                
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-10 inline-block">
                  <QRCodeSVG 
                    value={JSON.stringify({ 
                      sessionId: currentLiveSession._id, 
                      token: currentLiveSession.rawToken 
                    })} 
                    size={360}
                    level="H"
                    className="mx-auto"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center text-4xl font-mono text-indigo-600 font-bold bg-indigo-50 px-8 py-4 rounded-2xl border border-indigo-100">
                    <Clock className="w-8 h-8 mr-4" />
                    {formatTime(countdown)}
                  </div>
                  
                  <button 
                    onClick={() => handleCloseSession(currentLiveSession._id)}
                    className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-bold hover:bg-red-100 transition-colors border border-red-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-32 h-32 mb-6 bg-indigo-50 rounded-full flex items-center justify-center">
                <QrCode className="w-16 h-16 text-indigo-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Projector Ready</h3>
              <p className="text-gray-500 max-w-sm text-lg">Start a session on the left to project a dynamic QR code for your classroom.</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
