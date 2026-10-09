import { useState, useCallback } from 'react';
import { authApi } from '../services/api';
import type { TokenResponse } from '../types';

export function useAuth() {
  const [user, setUser] = useState<TokenResponse | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  return { user, login, logout, isAuthenticated: !!user };
}
