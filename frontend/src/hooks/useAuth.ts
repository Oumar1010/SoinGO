import { useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  nom: string;
  email: string;
  role: 'ADMIN' | 'COORDO' | 'AIDE_SOIGNANT';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('soingo_user');
    const token = localStorage.getItem('soingo_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('soingo_token', data.access_token);
    localStorage.setItem('soingo_user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('soingo_token');
    localStorage.removeItem('soingo_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return { user, loading, login, logout };
}
