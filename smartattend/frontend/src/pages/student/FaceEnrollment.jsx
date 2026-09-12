import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function FaceEnrollment() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <ShieldAlert className="w-16 h-16 mx-auto text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Face Enrollment Required</h2>
        <p className="text-gray-600 mb-6">
          Face enrollment is required before attendance can be marked. Please complete this step to access your dashboard.
        </p>
        
        <div className="bg-gray-100 p-8 rounded-lg mb-6 border-2 border-dashed border-gray-300">
          {/* We will build the actual camera implementation later */}
          <p className="text-gray-500 italic">[ Camera / Biometric Setup UI goes here ]</p>
        </div>

        <button 
          onClick={logout}
          className="text-gray-500 hover:text-gray-700 underline text-sm"
        >
          Logout for now
        </button>
      </div>
    </div>
  );
}
