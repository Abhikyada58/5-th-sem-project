import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get(import.meta.env.VITE_API_URL + '/admin/teachers');
        setTeachers(res.data.teachers);
      } catch (err) {
        toast.error('Failed to load teachers');
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Teacher Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage instructor accounts and assignments.</p>
        </div>
        <button 
          className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 text-sm font-semibold shadow-sm transition-colors"
        >
          Add New Teacher
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-white border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <th className="p-5">Name & Email</th>
              <th className="p-5">Role</th>
              <th className="p-5">Status</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [1,2,3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td className="p-5">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-48"></div>
                  </td>
                  <td className="p-5"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                  <td className="p-5"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
                  <td className="p-5"><div className="h-8 bg-gray-200 rounded w-24 ml-auto"></div></td>
                </tr>
              ))
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-10 text-center text-gray-500">
                  <p className="text-lg font-medium text-gray-700">No teachers found</p>
                </td>
              </tr>
            ) : teachers.map(t => (
              <tr key={t._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="p-5">
                  <div className="font-bold text-sm text-gray-900">{t.fullName}</div>
                  <div className="text-xs text-gray-500 font-medium">{t.email}</div>
                </td>
                <td className="p-5">
                  <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-indigo-100 text-indigo-700">
                    {t.role}
                  </span>
                </td>
                <td className="p-5">
                  <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${t.accountStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {t.accountStatus || 'ACTIVE'}
                  </span>
                </td>
                <td className="p-5 flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                   <button className="text-indigo-600 hover:text-indigo-900 text-sm font-semibold">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
