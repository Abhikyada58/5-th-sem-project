import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, BookOpen, Clock, Activity, AlertTriangle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(import.meta.env.VITE_API_URL + '/admin/stats');
        setStats(res.data.stats);
      } catch (err) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading statistics...</div>;
  if (!stats) return null;

  const cards = [
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'bg-blue-500' },
    { title: 'Total Teachers', value: stats.totalTeachers, icon: UserCheck, color: 'bg-green-500' },
    { title: 'Total Classes', value: stats.totalClasses, icon: BookOpen, color: 'bg-purple-500' },
    { title: 'Active Sessions', value: stats.activeSessions, icon: Activity, color: 'bg-indigo-500' },
    { title: "Today's Attendance", value: stats.todaysAttendance, icon: Clock, color: 'bg-teal-500' },
    { title: 'Missing Face ID', value: stats.studentsWithoutFace, icon: AlertTriangle, color: 'bg-orange-500' },
    { title: 'Expired Accounts', value: stats.expiredAccounts, icon: XCircle, color: 'bg-red-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="bg-white rounded-lg shadow-sm p-6 flex items-center">
            <div className={`p-4 rounded-full text-white ${card.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
