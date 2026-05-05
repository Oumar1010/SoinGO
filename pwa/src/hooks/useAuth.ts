import { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  nom: string;
  email: string;
  role: string;
}

const api = axios.create({ baseURL: '/api' });

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sg_user');
    const token = localStorage.getItem('sg_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('sg_token', data.access_token);
    localStorage.setItem('sg_user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
    setUser(data.user);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return { user, login, logout, api };
}
