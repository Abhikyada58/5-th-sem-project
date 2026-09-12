import { useAuth } from '../context/AuthContext';

export default function Dashboard({ title }) {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          <button 
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Welcome, {user.fullName}!</h2>
          <div className="bg-gray-100 p-4 rounded-md">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            {user.studentId && <p><strong>Student ID:</strong> {user.studentId}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
