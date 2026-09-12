import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Edit2, Trash2, ShieldAlert, KeyRound } from 'lucide-react';
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

  const handleResetFace = async (id) => {
    if (!window.confirm('Are you sure you want to reset facial biometrics for this student?')) return;
    try {
      await axios.put(import.meta.env.VITE_API_URL + `/admin/students/${id}/reset-face`);
      toast.success('Face enrollment reset successfully');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to reset face enrollment');
    }
  };

  const toggleStatus = async (student) => {
    const newStatus = student.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await axios.put(import.meta.env.VITE_API_URL + `/admin/students/${student._id}/status`, { accountStatus: newStatus });
      toast.success(`Account marked as ${newStatus}`);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.studentId && s.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b flex justify-between items-center">
        <input 
          type="text" 
          placeholder="Search students..." 
          className="border rounded-md px-4 py-2 w-64"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button 
          onClick={() => { setCurrentStudent(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Student
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-gray-600 text-sm">Student ID</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Name</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Email</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Class</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
            ) : filteredStudents.map(student => (
              <tr key={student._id} className="border-b hover:bg-gray-50">
                <td className="p-4 text-sm font-medium text-gray-900">{student.studentId || '-'}</td>
                <td className="p-4 text-sm text-gray-700">{student.fullName}</td>
                <td className="p-4 text-sm text-gray-700">{student.email}</td>
                <td className="p-4 text-sm text-gray-700">{student.classId?.name || 'Unassigned'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${student.accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {student.accountStatus}
                  </span>
                </td>
                <td className="p-4 flex justify-end space-x-2">
                  <button onClick={() => toggleStatus(student)} className="p-2 text-gray-500 hover:text-orange-600" title="Toggle Status">
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleResetFace(student._id)} className="p-2 text-gray-500 hover:text-purple-600" title="Reset Face ID">
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setCurrentStudent(student); setIsModalOpen(true); }} className="p-2 text-gray-500 hover:text-blue-600" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(student._id)} className="p-2 text-gray-500 hover:text-red-600" title="Delete">
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
