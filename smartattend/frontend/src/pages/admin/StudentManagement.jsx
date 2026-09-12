import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Edit2, Trash2, ShieldAlert, KeyRound, Calendar } from 'lucide-react';
import Modal from '../../components/ui/Modal';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + '/admin/students');
      setStudents(res.data.students);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await axios.delete(import.meta.env.VITE_API_URL + `/admin/students/${id}`);
      toast.success('Student deleted');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to delete student');
    }
  };

  const toggleStatus = async (student) => {
    const newStatus = student.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await axios.patch(import.meta.env.VITE_API_URL + `/admin/users/${student._id}/status`, { accountStatus: newStatus });
      toast.success(`Account marked as ${newStatus}`);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleSetExpiry = async (student) => {
    const defaultDate = student.accountExpiresAt ? new Date(student.accountExpiresAt).toISOString().split('T')[0] : '';
    const dateInput = window.prompt('Set Expiry Date (YYYY-MM-DD). Leave empty to remove expiry.', defaultDate);
    
    if (dateInput === null) return; // Cancelled
    
    try {
      await axios.patch(import.meta.env.VITE_API_URL + `/admin/users/${student._id}/validity`, { 
        accountExpiresAt: dateInput ? new Date(dateInput) : null 
      });
      toast.success('Expiry date updated');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to update validity');
    }
  };

  const handleResetFace = async (id) => {
    if (!window.confirm('Are you sure you want to reset facial biometrics for this student?')) return;
    try {
      await axios.put(import.meta.env.VITE_API_URL + `/admin/users/${id}/reset-face`);
      toast.success('Face enrollment reset successfully');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to reset face enrollment');
    }
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.studentId && s.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
        <input 
          type="text" 
          placeholder="Search students..." 
          className="w-full sm:w-72 bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm border px-4 py-2 text-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button 
          onClick={() => { setCurrentStudent(null); setIsModalOpen(true); }}
          className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 text-sm font-semibold shadow-sm transition-colors"
        >
          Add New Student
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-white border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-semibold">
              <th className="p-5">Student ID</th>
              <th className="p-5">Student Details</th>
              <th className="p-5">Class</th>
              <th className="p-5">Status</th>
              <th className="p-5">Valid Until</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [1,2,3,4,5].map(i => (
                <tr key={i} className="animate-pulse">
                  <td className="p-5"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                  <td className="p-5">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-48"></div>
                  </td>
                  <td className="p-5"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                  <td className="p-5"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
                  <td className="p-5"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                  <td className="p-5"><div className="h-8 bg-gray-200 rounded w-32 ml-auto"></div></td>
                </tr>
              ))
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-10 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShieldAlert className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-lg font-medium text-gray-700">No students found</p>
                  <p className="text-sm">Adjust your search or add a new student.</p>
                </td>
              </tr>
            ) : filteredStudents.map(student => (
              <tr key={student._id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="p-5 text-sm font-semibold text-gray-900">{student.studentId || '-'}</td>
                <td className="p-5">
                  <div className="font-bold text-sm text-gray-900">{student.fullName}</div>
                  <div className="text-xs text-gray-500 font-medium">{student.email}</div>
                </td>
                <td className="p-5 text-sm text-gray-600 font-medium">{student.classId?.name || 'Unassigned'}</td>
                <td className="p-5">
                  <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${student.accountStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {student.accountStatus}
                  </span>
                </td>
                <td className="p-5 text-sm text-gray-700 font-medium">
                  {student.accountExpiresAt ? (
                    <span className={new Date(student.accountExpiresAt) < new Date() ? 'text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-md' : ''}>
                      {new Date(student.accountExpiresAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Forever</span>
                  )}
                </td>
                <td className="p-5 flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleSetExpiry(student)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Set Expiry">
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleStatus(student)} className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Toggle Status">
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleResetFace(student._id)} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Reset Face ID">
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setCurrentStudent(student); setIsModalOpen(true); }} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(student._id)} className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={currentStudent ? 'Edit Student' : 'Add Student'}
      >
        {/* Very basic placeholder form, easily expandable */}
        <p className="text-gray-600 mb-4">
          This form handles {currentStudent ? 'editing' : 'creating'} a student. Form fields go here connecting to the <code>/api/admin/students</code> endpoints.
        </p>
        <div className="flex justify-end">
          <button onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md mr-2">Cancel</button>
          <button onClick={() => setIsModalOpen(false)} className="bg-blue-600 text-white px-4 py-2 rounded-md">Save</button>
        </div>
      </Modal>
    </div>
  );
}
