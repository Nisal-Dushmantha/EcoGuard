import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { Navbar } from './components/layout/Navbar';

function MainApplication() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'reports' | 'monitoring'>('reports');

  if (isLoading) {
    return (
      <div className="auth-wrapper">
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ width: '2rem', height: '2rem', marginBottom: '1rem' }}></div>
          <div>Initializing EcoGuard Operations Portal...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (authView === 'login') {
      return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
    }
    return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main style={{ flex: 1, padding: '2rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
        {activeTab === 'reports' ? (
          <div>
            {/* Role Header Banner */}
            <div
              className="glass-panel"
              style={{
                padding: '1.75rem',
                marginBottom: '2rem',
                borderLeft: '4px solid var(--primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Central Operations Portal • UC04 Module
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-main)' }}>
                  Conservation Analytics & Reporting Engine
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  Authenticated as <strong>{user.name}</strong> ({user.role}) for <strong>{user.assignedPark}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.75rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: 600,
                  }}
                >
                  🟢 Role-Based Session Active
                </span>
              </div>
            </div>

            {/* Role-Specific Content Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>👤</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Role Permissions</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Your assigned role determines reporting and management clearance across the national park network.
                </p>
                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <div style={{ marginBottom: '0.4rem' }}>
                    <strong>Role:</strong> {user.role}
                  </div>
                  <div style={{ marginBottom: '0.4rem' }}>
                    <strong>Assigned Zone:</strong> {user.assignedPark}
                  </div>
                  <div>
                    <strong>Clearance:</strong>{' '}
                    {user.role === 'Park Manager' || user.role === 'Admin'
                      ? 'Full Access (Generate Reports, View Incident & Conflict Analytics, Resource Planning)'
                      : user.role === 'Conservation Researcher'
                      ? 'Analytical Access (Trend Analysis & Historical Records)'
                      : 'Field Access (Incident Reporting & Field Patrols)'}
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📋</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>UC04 Next Step</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Ready to generate formal conservation reports for <strong>{user.assignedPark}</strong> or all areas.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div>✓ Incident Statistics (UC01 Data Integration)</div>
                  <div>✓ Patrol Coverage & Sector Analysis</div>
                  <div>✓ Human-Wildlife Conflict Trends (UC03 Data Integration)</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📡</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              UC02 – Track and Alert Collared Animal
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto', fontSize: '0.9rem' }}>
              This module is assigned to <strong>Chamodya</strong>. Nisal's module (UC04 – Generate Conservation Reports) operates independently under the Conservation Reports tab.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApplication />
    </AuthProvider>
  );
}

export default App;
