import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { Navbar } from './components/layout/Navbar';
import { ConservationModule } from './components/analytics';

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
              className="glass-panel no-print"
              style={{
                padding: '1.25rem 1.75rem',
                marginBottom: '1.5rem',
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
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--text-main)' }}>
                  Conservation Analytics & Reporting Engine
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                  Authenticated as <strong>{user.name}</strong> ({user.role}) • Stationed at <strong>{user.assignedPark}</strong>
                </p>
              </div>
            </div>

            {/* UC04 Functional Conservation Module */}
            <ConservationModule
              userPark={user.assignedPark}
              userName={user.name}
              userRole={user.role}
            />
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
    <ThemeProvider>
      <AuthProvider>
        <MainApplication />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
