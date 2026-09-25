import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types/auth';

interface NavbarProps {
  activeTab: 'reports' | 'monitoring';
  onSelectTab: (tab: 'reports' | 'monitoring') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeClass = (role?: UserRole): string => {
    switch (role) {
      case 'Park Manager':
        return 'badge-park-manager';
      case 'Conservation Researcher':
        return 'badge-researcher';
      case 'Ranger':
        return 'badge-ranger';
      case 'Admin':
        return 'badge-admin';
      default:
        return 'badge-park-manager';
    }
  };

  return (
    <header className="app-navbar">
      <div className="nav-brand">
        <div className="brand-icon">🛡️</div>
        <div>
          <div className="brand-name">EcoGuard</div>
          <div className="brand-sub">Central Wildlife Operations</div>
        </div>
      </div>

      <nav className="nav-links">
        <button
          type="button"
          className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => onSelectTab('reports')}
        >
          <span>📊</span>
          <span>Conservation Reports (Nisal - UC04)</span>
        </button>

        <button
          type="button"
          className={`nav-tab ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => onSelectTab('monitoring')}
        >
          <span>📡</span>
          <span>Wildlife Monitoring (Chamodya - UC02)</span>
        </button>
      </nav>

      <div className="user-badge-container">
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-park">📍 {user?.assignedPark}</div>
        </div>

        <span className={`badge-role ${getRoleBadgeClass(user?.role)}`}>
          {user?.role || 'Staff'}
        </span>

        <button type="button" className="btn-logout" onClick={logout} title="Sign Out">
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default Navbar;
