import { AuthStory } from './AuthStory';
import { BrandMark } from '../layout/BrandMark';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/auth';
import { authService } from '../../services/api';
import { ThemeToggle } from '../layout/ThemeToggle';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

const AVAILABLE_PARKS = [
  'Yala National Park',
  'Wilpattu National Park',
  'Udawalawe National Park',
  'Minneriya National Park',
  'Sinharaja Forest Reserve',
];

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Park Manager');
  const [assignedPark, setAssignedPark] = useState(AVAILABLE_PARKS[0]);
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

    if (!name.trim() || !email.trim() || !password.trim()) {
      setLocalError('Please complete all required fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      await register({
        name,
        email,
        password,
        role,
        assignedPark,
      });
    } catch {
      // handled by AuthContext
    }
  };

  const activeError = localError || error;

  return (
    <div className="auth-wrapper auth-layout">
      <AuthStory />
      <div className="auth-card glass-panel" style={{ maxWidth: '540px' }}>
        <div className="auth-top-actions">
          <ThemeToggle />
        </div>
        <div className="auth-header">
          <div className="auth-logo-badge">
            <BrandMark />
            <span>EcoGuard Registration</span>
          </div>
          <h1 className="auth-title">Join your conservation team</h1>
          <p className="auth-subtitle">
            Register personnel for Wildlife Conservation & Operations Management
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
            <label className="form-label" htmlFor="reg-name">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder="e.g. Nisal Dushmantha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              Official Email Address
            </label>
            <input
              id="reg-email"
              type="email" autoComplete="email"
              className="form-input"
              placeholder="e.g. nisal@ecoguard.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-role">
                System Role
              </label>
              <select
                id="reg-role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isLoading}
              >
                <option value="Park Manager">Park Manager</option>
                <option value="Conservation Researcher">Conservation Researcher</option>
                <option value="Ranger">Ranger / Field Officer</option>
                <option value="Admin">System Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-park">
                Assigned National Park
              </label>
              <select
                id="reg-park"
                className="form-select"
                value={assignedPark}
                onChange={(e) => setAssignedPark(e.target.value)}
                disabled={isLoading}
              >
                {AVAILABLE_PARKS.map((park) => (
                  <option key={park} value={park}>
                    {park}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password (min 6 chars)
              </label>
              <input
                id="reg-password"
                type="password" autoComplete="new-password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type="password" autoComplete="new-password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Registering Personnel...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
