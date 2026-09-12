import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    axios.get(import.meta.env.VITE_API_URL + '/admin/audit-logs')
      .then(res => setLogs(res.data.logs))
      .catch(console.error);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">System Audit Logs</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-700">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">Time</th>
              <th className="p-3">Action</th>
              <th className="p-3">Resource</th>
              <th className="p-3">User</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log._id} className="border-b">
                <td className="p-3">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-3 font-semibold">{log.action}</td>
                <td className="p-3">{log.resource}</td>
                <td className="p-3">{log.userId?.fullName || 'System'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
