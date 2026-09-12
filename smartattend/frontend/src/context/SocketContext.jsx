import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server:', newSocket.id);
      
      // If user has a classId (Student), join that room
      if (user.classId) {
        // Handle if classId is populated object or string
        const classIdString = typeof user.classId === 'object' ? user.classId._id : user.classId;
        newSocket.emit('join-class', classIdString);
      }
      // If teacher, they might join multiple rooms or just wait to emit when they start a session. 
      // We will handle teacher joining rooms in their dashboard.
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]); // Re-run if user changes (login/logout)

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
