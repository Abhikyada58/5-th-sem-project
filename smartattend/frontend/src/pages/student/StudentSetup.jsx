import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function StudentSetup() {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    studentId: user?.studentId || '',
    aiId: user?.aiId || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    classId: user?.classId || '',
    division: user?.division || '',
    rollNumber: user?.rollNumber || '',
    academicYear: user?.academicYear || new Date().getFullYear().toString(),
    password: '' // Optional password reset
  });

  useEffect(() => {
    // Only load classes, don't require face enrollment to load this page
    axios.get(import.meta.env.VITE_API_URL + '/student/classes')
      .then(res => setClasses(res.data.classes))
      .catch(() => toast.error('Failed to load classes'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(import.meta.env.VITE_API_URL + '/student/setup-profile', formData);
      toast.success('Profile updated successfully!');
      await fetchUser(); // Refresh user context
      navigate('/student/face-enrollment');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome to SmartAttend</h2>
        <p className="text-gray-600 mb-8">Please complete your profile information before continuing.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email (Read Only)</label>
              <input type="email" disabled className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm border p-2"
                value={user?.email || ''} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Student ID *</label>
              <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">AI ID (Optional)</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={formData.aiId} onChange={e => setFormData({...formData, aiId: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input type="tel" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Class (Optional for now)</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})}>
                <option value="">Select a Class</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Division</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={formData.division} onChange={e => setFormData({...formData, division: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Roll Number</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Academic Year</label>
              <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={formData.academicYear} onChange={e => setFormData({...formData, academicYear: e.target.value})} />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Set New Password (Optional)</label>
              <input type="password" placeholder="Leave blank to keep current password" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
