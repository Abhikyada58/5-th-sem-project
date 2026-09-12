import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

function App() {
  const [message, setMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Test API connection
    axios.get(import.meta.env.VITE_API_URL + '/health')
      .then(res => {
        setMessage(res.data.message);
      })
      .catch(err => {
        console.error(err);
        setMessage('Failed to connect to API');
      });

    // Test Socket connection
    const socket = io(import.meta.env.VITE_SOCKET_URL);
    socket.on('connect', () => {
      setSocketConnected(true);
    });
    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">SmartAttend</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-700">API Status:</h2>
          <p className={`text-sm ${message.includes('running') ? 'text-green-600' : 'text-red-600'}`}>
            {message || 'Connecting...'}
          </p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Socket Status:</h2>
          <p className={`text-sm ${socketConnected ? 'text-green-600' : 'text-red-600'}`}>
            {socketConnected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
