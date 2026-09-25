import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

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
    } catch (err: any) {
      // error handled by AuthContext
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLocalError(null);
    clearError();
    try {
      await login(demoEmail, 'password123');
    } catch (err: any) {
      // error handled by AuthContext
    }
  };

  const activeError = localError || error;

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <span>🛡️</span>
            <span>EcoGuard Operations</span>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">
            Sign in to access Central Wildlife Monitoring & Conservation Analytics
          </p>

          {/* Backend Connection Indicator */}
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}>
            {backendStatus === 'online' ? (
              <span style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                🟢 Backend Online (Port 5000)
              </span>
            ) : backendStatus === 'offline' ? (
              <span style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                🔴 Backend Offline (Start server: cd backend; npm run dev)
              </span>
            ) : (
              <span style={{ color: '#9ca3af' }}>Connecting to backend...</span>
            )}
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
              type="email"
              className="form-input"
              placeholder="e.g. manager@ecoguard.lk"
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
              type="password"
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

        <div className="demo-accounts-box">
          <div className="demo-title">⚡ Quick Evaluator Demo Accounts</div>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleQuickDemoLogin('manager@ecoguard.lk')}
              disabled={isLoading}
            >
              🌿 Park Manager
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleQuickDemoLogin('researcher@ecoguard.lk')}
              disabled={isLoading}
            >
              🔬 Researcher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
