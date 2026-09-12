import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Unauthorized</h1>
      <p className="text-gray-700 mb-6">You do not have permission to view this page based on your current role.</p>
      <Link to="/login" className="text-blue-600 hover:underline">Go back to login</Link>
    </div>
  );
}
