import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Set default axios config for cookies
  axios.defaults.withCredentials = true;

  const fetchUser = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_URL + '/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(import.meta.env.VITE_API_URL + '/auth/login', { email, password });
    if (res.data.success) {
      setUser(res.data.user);
      routeByUserRole(res.data.user.role);
    }
    return res.data;
  };

  const register = async (userData) => {
    const res = await axios.post(import.meta.env.VITE_API_URL + '/auth/register', userData);
    if (res.data.success) {
      setUser(res.data.user);
      routeByUserRole(res.data.user.role);
    }
    return res.data;
  };

  const logout = async () => {
    await axios.post(import.meta.env.VITE_API_URL + '/auth/logout');
    setUser(null);
    navigate('/login');
  };

  const routeByUserRole = (role) => {
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'TEACHER') navigate('/teacher');
    else if (role === 'STUDENT') navigate('/student');
    else navigate('/unauthorized');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
