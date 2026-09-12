import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Download, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherReports() {
  const { user, logout } = useAuth();
  
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Fetch subjects/classes on mount
    axios.get(import.meta.env.VITE_API_URL + '/sessions/subjects')
      .then(res => {
        setSubjects(res.data.subjects);
        if (res.data.subjects.length > 0) {
          setSelectedClass(res.data.subjects[0].classId._id);
        }
      })
      .catch(() => toast.error('Failed to load classes'));
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchReport();
    }
  }, [selectedClass, page, statusFilter, startDate, endDate]); // search is triggered via form submit to avoid spamming API

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        search,
        status: statusFilter,
        startDate,
        endDate
      };
      
      const res = await axios.get(import.meta.env.VITE_API_URL + `/reports/class/${selectedClass}`, { params });
      setRecords(res.data.data);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReport();
  };

  const handleExport = () => {
    if (!selectedClass) return;
    
    // Build query string
    const params = new URLSearchParams({
      classId: selectedClass,
      search,
      status: statusFilter,
      startDate,
      endDate
    });

    // We can just open this in a new tab if it's a GET request and uses Cookies.
    // Since we use Axios withCredentials, we need to download it via Blob to ensure auth headers are sent.
    toast.loading('Generating CSV...', { id: 'csv' });
    
    axios.get(import.meta.env.VITE_API_URL + `/reports/export?${params.toString()}`, {
      responseType: 'blob'
    })
    .then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Downloaded successfully', { id: 'csv' });
    })
    .catch(() => {
      toast.error('Failed to export CSV', { id: 'csv' });
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Attendance Reports</h1>
            <div className="flex space-x-4 mt-2 text-sm">
              <Link to="/teacher" className="text-gray-500 hover:text-indigo-600 font-medium">Dashboard</Link>
              <span className="text-gray-300">|</span>
              <span className="text-indigo-600 font-medium">Reports</span>
            </div>
          </div>
          <button onClick={logout} className="text-red-500 hover:text-red-700 font-medium">Logout</button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-end">
          
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="w-full md:w-48">
              <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
              <select 
                className="w-full border-gray-300 rounded-md border p-2 text-sm"
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setPage(1); }}
              >
                {subjects.map(s => (
                  <option key={s.classId._id} value={s.classId._id}>{s.classId.name} ({s.name})</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-36">
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select 
                className="w-full border-gray-300 rounded-md border p-2 text-sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
              </select>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                <input type="date" className="border-gray-300 rounded-md border p-2 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                <input type="date" className="border-gray-300 rounded-md border p-2 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
            <form onSubmit={handleSearch} className="flex relative">
              <input 
                type="text" 
                placeholder="Search student..." 
                className="border-gray-300 rounded-md border p-2 pl-9 text-sm w-full md:w-48"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <button type="submit" className="hidden">Search</button>
            </form>
            
            <button 
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center text-sm font-medium whitespace-nowrap"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading records...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No attendance records found for this filter.</td></tr>
                ) : (
                  records.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(record.markedAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(record.markedAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.studentId?.fullName || 'Deleted User'}</div>
                        <div className="text-xs text-gray-500">ID: {record.studentId?.studentId || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.subjectId?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'PRESENT' ? 'bg-green-100 text-green-800' : 
                          record.status === 'ABSENT' ? 'bg-red-100 text-red-800' : 
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.faceVerified ? (
                          <div className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 mr-1" /> Face Match</div>
                        ) : (
                          <div className="text-red-500 text-xs mt-1">Failed: {record.failureReason}</div>
                        )}
                        {record.verificationScore && <div className="text-xs text-gray-400 mt-1">Score: {record.verificationScore.toFixed(4)}</div>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && records.length > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
