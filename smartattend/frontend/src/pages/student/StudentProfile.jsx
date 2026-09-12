import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, BookOpen, Calendar, Key, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axios.get(import.meta.env.VITE_API_URL + '/student/profile')
      .then(res => setProfile(res.data.user))
      .catch(() => toast.error('Failed to load profile'));
  }, []);

  if (!profile) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-blue-600 px-6 py-8 text-white">
          <h1 className="text-3xl font-bold">{profile.fullName}</h1>
          <p className="opacity-90 mt-1">{profile.studentId ? `Student ID: ${profile.studentId}` : 'No Student ID set'}</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2 text-gray-800">Contact Information</h3>
              <div className="flex items-center text-gray-700">
                <Mail className="w-5 h-5 mr-3 text-gray-400" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Phone className="w-5 h-5 mr-3 text-gray-400" />
                <span>{profile.phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2 text-gray-800">Academic Details</h3>
              <div className="flex items-center text-gray-700">
                <BookOpen className="w-5 h-5 mr-3 text-gray-400" />
                <span>Class: {profile.classId?.name || 'Unassigned'}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                <span>Academic Year: {profile.academicYear || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold border-b pb-2 text-gray-800">Security & Biometrics</h3>
              <div className="flex items-center text-gray-700">
                <ShieldCheck className={`w-5 h-5 mr-3 ${profile.faceEnrolled ? 'text-green-500' : 'text-orange-500'}`} />
                <span>Face ID Status: <strong className={profile.faceEnrolled ? 'text-green-600' : 'text-orange-600'}>{profile.faceEnrolled ? 'Enrolled' : 'Not Enrolled'}</strong></span>
              </div>
              <div className="flex items-center text-gray-700">
                <Key className="w-5 h-5 mr-3 text-gray-400" />
                <span>AI ID: {profile.aiId || 'Not assigned'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
