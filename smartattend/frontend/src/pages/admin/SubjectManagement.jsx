import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Trash2 } from 'lucide-react';

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    classId: '',
    teacherId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjRes, clsRes, tchrRes] = await Promise.all([
        axios.get(import.meta.env.VITE_API_URL + '/admin/subjects'),
        axios.get(import.meta.env.VITE_API_URL + '/admin/classes'),
        axios.get(import.meta.env.VITE_API_URL + '/admin/teachers')
      ]);
      setSubjects(subjRes.data.subjects);
      setClasses(clsRes.data.classes);
      setTeachers(tchrRes.data.teachers);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(import.meta.env.VITE_API_URL + '/admin/subjects', formData);
      toast.success('Subject created successfully!');
      setFormData({ name: '', code: '', classId: '', teacherId: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create subject');
    }
  };

  if (loading) return <div className="p-8">Loading subjects...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl">
            <BookOpen className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subject Management</h1>
            <p className="text-gray-500 text-sm">Assign subjects to classes and teachers.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          {showForm ? 'Cancel' : <><Plus className="w-5 h-5" /> Add Subject</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject Name</label>
              <input type="text" required placeholder="e.g. Data Structures"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject Code</label>
              <input type="text" required placeholder="e.g. CS-201"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
                value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Class</label>
              <select required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})}>
                <option value="">Select Class...</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name} ({c.semester} Sem)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teacher</label>
              <select required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})}>
                <option value="">Select Teacher...</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-medium hover:bg-indigo-700">
                Save Subject
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="py-4 px-6 font-semibold text-sm text-gray-600">Code</th>
              <th className="py-4 px-6 font-semibold text-sm text-gray-600">Name</th>
              <th className="py-4 px-6 font-semibold text-sm text-gray-600">Class</th>
              <th className="py-4 px-6 font-semibold text-sm text-gray-600">Teacher</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subjects.length === 0 ? (
              <tr><td colSpan="4" className="py-12 text-center text-gray-500">No subjects found. Add one above.</td></tr>
            ) : (
              subjects.map(subject => (
                <tr key={subject._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{subject.code}</td>
                  <td className="py-4 px-6 text-gray-600">{subject.name}</td>
                  <td className="py-4 px-6 text-gray-600">{subject.classId?.name}</td>
                  <td className="py-4 px-6 text-gray-600">{subject.teacherId?.fullName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
