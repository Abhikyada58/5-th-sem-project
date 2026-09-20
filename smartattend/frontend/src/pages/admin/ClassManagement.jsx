import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LayoutDashboard, Plus } from 'lucide-react';

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    semester: '',
    academicYear: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + '/admin/classes');
      setClasses(res.data.classes);
    } catch (err) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(import.meta.env.VITE_API_URL + '/admin/classes', formData);
      toast.success('Class created successfully!');
      setFormData({ name: '', semester: '', academicYear: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create class');
    }
  };

  if (loading) return <div className="p-8">Loading classes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
            <p className="text-gray-500 text-sm">Manage cohorts, assign students, and configure academic years.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          {showForm ? 'Cancel' : <><Plus className="w-5 h-5" /> Add Class</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Class Name</label>
              <input type="text" required placeholder="e.g. CS-101"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Semester</label>
              <input type="text" placeholder="e.g. 1"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
                value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Academic Year</label>
              <input type="text" placeholder="e.g. 2026-2027"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
                value={formData.academicYear} onChange={e => setFormData({...formData, academicYear: e.target.value})} />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button type="submit" className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-medium hover:bg-indigo-700">
                Save Class
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-4 px-6 font-semibold text-sm text-gray-600">Name</th>
              <th className="py-4 px-6 font-semibold text-sm text-gray-600">Semester</th>
              <th className="py-4 px-6 font-semibold text-sm text-gray-600">Academic Year</th>
              <th className="py-4 px-6 font-semibold text-sm text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {classes.length === 0 ? (
              <tr><td colSpan="4" className="py-12 text-center text-gray-500">No classes found. Add one above.</td></tr>
            ) : (
              classes.map(c => (
                <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{c.name}</td>
                  <td className="py-4 px-6 text-gray-600">{c.semester || '-'}</td>
                  <td className="py-4 px-6 text-gray-600">{c.academicYear || '-'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
