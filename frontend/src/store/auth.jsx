import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children, notify }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    const handleExpiredSession = () => {
      setUser(null);
      notify?.('error', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
    };
    window.addEventListener('auth:expired', handleExpiredSession);
    return () => window.removeEventListener('auth:expired', handleExpiredSession);
  }, [notify]);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('accessToken', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    const u = { id: data.id, username: data.username, email: data.email, roles: data.roles };
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    notify?.('success', 'Đăng nhập thành công');
    return u;
  };

  const register = async (payload) => {
    await api.post('/auth/register', payload);
    notify?.('success', 'Đăng ký thành công, mời đăng nhập');
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put('/users/me', payload);
    const updatedUser = { ...user, ...data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, register, updateProfile, logout }}>{children}</AuthCtx.Provider>;
}
