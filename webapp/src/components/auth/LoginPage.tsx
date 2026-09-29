import { AuthStory } from './AuthStory';
import { BrandMark } from '../layout/BrandMark';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { ThemeToggle } from '../layout/ThemeToggle';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      const health = await authService.checkHealth();
      if (isMounted) {
        setBackendStatus(health.online ? 'online' : 'offline');
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }

    try {
      await login(email, password);
    } catch {
      // error handled by AuthContext
    }
  };

  const activeError = localError || error;

  return (
    <div className="auth-wrapper auth-layout">
      <AuthStory />
      <div className="auth-card glass-panel">
        <div className="auth-top-actions">
          <ThemeToggle />
        </div>
        <div className="auth-header">
          <div className="auth-logo-badge">
            <BrandMark />
            <span>EcoGuard Operations</span>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">
            Sign in to access Central Wildlife Monitoring & Conservation Analytics
          </p>

          <div className={`connection-status ${backendStatus}`} role="status">
            <span className="status-dot" />
            {backendStatus === 'online' ? 'Connected to EcoGuard' : backendStatus === 'offline' ? 'Service unavailable. Please try again shortly.' : 'Connecting to EcoGuard…'}
          </div>
        </div>

        {activeError && (
          <div className="alert-error">
            <span>⚠️</span>
            <span>{activeError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Official Email Address
            </label>
            <input
              id="login-email"
              type="email" autoComplete="email"
              className="form-input"
              placeholder="e.g. user@ecoguard.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password" autoComplete="current-password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an official account? </span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Register here
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
