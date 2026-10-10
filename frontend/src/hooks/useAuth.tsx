import { useState, useCallback, createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../services/api';
import type { TokenResponse } from '../types';

interface AuthContextType {
  user: TokenResponse | null;
  login: (email: string, password: string) => Promise<TokenResponse>;
  loginAsDemo: () => TokenResponse;
  logout: () => void;
  isAuthenticated: boolean;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TokenResponse | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('is_demo_mode') === 'true';
  });

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.removeItem('is_demo_mode');
    setIsDemoMode(false);
    setUser(data);
    return data;
  }, []);

  const loginAsDemo = useCallback(() => {
    const demoUser: TokenResponse = {
      access_token: 'demo_token_' + Date.now(),
      token_type: 'bearer',
      user_id: 1,
      email: 'admin@riskmanager.ai',
      role: 'admin',
    };
    localStorage.setItem('access_token', demoUser.access_token);
    localStorage.setItem('user', JSON.stringify(demoUser));
    localStorage.setItem('is_demo_mode', 'true');
    setIsDemoMode(true);
    setUser(demoUser);
    return demoUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('is_demo_mode');
    setIsDemoMode(false);
    setUser(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
      if (e.key === 'is_demo_mode') {
        setIsDemoMode(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginAsDemo,
        logout,
        isAuthenticated: !!user,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
