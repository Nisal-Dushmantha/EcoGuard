import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { Navbar } from './components/layout/Navbar';
import type { WorkspaceView } from './components/layout/Navbar';
import { WorkspaceClock } from './components/layout/WorkspaceClock';
import { ThemeToggle } from './components/layout/ThemeToggle';
import { Icon } from './components/layout/Icon';
import { ConservationModule } from './components/analytics';
import { WildlifeModule } from './components/monitoring';
import './workspace.css';

function MainApplication() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [view, setView] = useState<WorkspaceView>('monitoring');
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="auth-wrapper">
        <span className="spinner" />
        <span className="loading-label">Opening Park Operations Workspace…</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return authView === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className={`app-shell ${collapsed ? 'nav-compact' : ''}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar
        activeTab={view}
        onSelectTab={setView}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className="workspace-body">
        <header className="command-bar no-print">
          <div className="breadcrumb">
            <span>Workspace</span>
            <Icon name="chevron" size={13} />
            <strong>
              {view === 'monitoring'
                ? 'Wildlife Operations & Telemetry'
                : view === 'dashboard'
                ? 'Conservation Analytics'
                : 'Report Studio'}
            </strong>
          </div>
          <div className="command-actions">
            <WorkspaceClock />
            <ThemeToggle />
            <span className="command-park">
              <Icon name="pin" size={15} />
              {user.assignedPark || 'Yala National Park'}
            </span>
          </div>
        </header>

        <main className="app-main" id="main-content">
          {view === 'monitoring' ? (
            <WildlifeModule
              userPark={user.assignedPark}
              userName={user.name}
            />
          ) : (
            <ConservationModule
              userPark={user.assignedPark}
              userName={user.name}
              view={view === 'generate' ? 'generate' : 'dashboard'}
              onChangeView={setView}
            />
          )}
        </main>

        <footer className="workspace-footer no-print">
          <span>EcoGuard / Wildlife Intelligence & Geofence Telemetry</span>
          <span>Observe. Understand. Protect.</span>
        </footer>
      </div>
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
