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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Teacher Management</h2>
      <p className="text-gray-600 mb-6">Create, edit, and assign teachers to classes and subjects.</p>
      
      {loading ? <p>Loading...</p> : (
        <ul className="divide-y divide-gray-200">
          {teachers.map(t => (
            <li key={t._id} className="py-4 flex justify-between">
              <div>
                <p className="font-medium">{t.fullName}</p>
                <p className="text-sm text-gray-500">{t.email}</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 h-6">
                TEACHER
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
