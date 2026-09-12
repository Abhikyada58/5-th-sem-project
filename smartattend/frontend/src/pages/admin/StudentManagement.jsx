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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-6 border-b flex justify-between items-center">
        <input 
          type="text" 
          placeholder="Search students..." 
          className="border border-gray-300 rounded-md px-4 py-2 w-64 text-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button 
          onClick={() => { setCurrentStudent(null); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
        >
          Add New Student
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-gray-500 text-xs uppercase">Student ID</th>
              <th className="p-4 font-semibold text-gray-500 text-xs uppercase">Name</th>
              <th className="p-4 font-semibold text-gray-500 text-xs uppercase">Class</th>
              <th className="p-4 font-semibold text-gray-500 text-xs uppercase">Status</th>
              <th className="p-4 font-semibold text-gray-500 text-xs uppercase">Valid Until</th>
              <th className="p-4 font-semibold text-gray-500 text-xs uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-4 text-center text-sm text-gray-500">Loading...</td></tr>
            ) : filteredStudents.map(student => (
              <tr key={student._id} className="border-b hover:bg-gray-50">
                <td className="p-4 text-sm font-medium text-gray-900">{student.studentId || '-'}</td>
                <td className="p-4 text-sm text-gray-700">
                  <div className="font-medium">{student.fullName}</div>
                  <div className="text-xs text-gray-500">{student.email}</div>
                </td>
                <td className="p-4 text-sm text-gray-700">{student.classId?.name || 'Unassigned'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${student.accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {student.accountStatus}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-700">
                  {student.accountExpiresAt ? (
                    <span className={new Date(student.accountExpiresAt) < new Date() ? 'text-red-500 font-bold' : ''}>
                      {new Date(student.accountExpiresAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-gray-400">Forever</span>
                  )}
                </td>
                <td className="p-4 flex justify-end space-x-2">
                  <button onClick={() => handleSetExpiry(student)} className="p-2 text-gray-500 hover:text-indigo-600 bg-gray-100 rounded-md" title="Set Expiry">
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleStatus(student)} className="p-2 text-gray-500 hover:text-orange-600 bg-gray-100 rounded-md" title="Toggle Status">
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleResetFace(student._id)} className="p-2 text-gray-500 hover:text-purple-600 bg-gray-100 rounded-md" title="Reset Face ID">
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setCurrentStudent(student); setIsModalOpen(true); }} className="p-2 text-gray-500 hover:text-blue-600 bg-gray-100 rounded-md" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(student._id)} className="p-2 text-gray-500 hover:text-red-600 bg-gray-100 rounded-md" title="Delete">
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
