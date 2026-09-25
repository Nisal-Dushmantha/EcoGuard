import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types/auth';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    assignedPark?: string;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('ecoguard_token');
      const savedUser = localStorage.getItem('ecoguard_user');

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          // Verify with server in background
          const res = await authService.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('ecoguard_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session verification expired or unreachable:', err);
          // Keep local session if server is offline or clear if unauthorized
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.login({ email, password });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('ecoguard_token', res.token);
      localStorage.setItem('ecoguard_user', JSON.stringify(res.user));
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    assignedPark?: string;
  }): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.register(data);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('ecoguard_token', res.token);
      localStorage.setItem('ecoguard_user', JSON.stringify(res.user));
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ecoguard_token');
    localStorage.removeItem('ecoguard_user');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
