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

  useEffect(() => {
    if (!user?.id) return undefined;
    let active = true;
    api.get('/users/me').then(({ data }) => {
      if (!active) return;
      setUser((current) => {
        if (!current || current.id !== data.id) return current;
        const updatedUser = {
          ...current,
          username: data.username,
          fullName: data.fullName,
          email: data.email,
          avatarUrl: data.avatarUrl
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      });
    }).catch(() => {});
    return () => { active = false; };
  }, [user?.id]);

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

  const updateProfile = async (payload, avatarFile) => {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (avatarFile) formData.append('avatar', avatarFile);
    const { data } = await api.put('/users/me', formData);
    const updatedUser = { ...user, ...data };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return data;
  };

  const syncProfile = (profile) => {
    const updatedUser = { ...user, ...profile };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, register, updateProfile, syncProfile, logout }}>{children}</AuthCtx.Provider>;
}
