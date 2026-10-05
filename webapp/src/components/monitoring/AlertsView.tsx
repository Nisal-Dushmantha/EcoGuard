import React, { useState } from 'react';
import type { WildlifeAlert } from '../../types/wildlife';
import { Icon } from '../layout/Icon';

interface AlertsViewProps {
  alerts: WildlifeAlert[];
  selectedPark: string;
  onSelectAlert: (alert: WildlifeAlert) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  selectedPark,
  onSelectAlert,
  onAcknowledgeAlert,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedPark && selectedPark !== 'All Parks' && alert.park !== selectedPark) {
      return false;
    }
    if (statusFilter !== 'All' && alert.status !== statusFilter) {
      return false;
    }
    if (severityFilter !== 'All' && alert.severity !== severityFilter) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchId = alert.alertId.toLowerCase().includes(q);
      const matchAnimal = alert.animalName.toLowerCase().includes(q);
      const matchSpecies = alert.species.toLowerCase().includes(q);
      const matchZone = alert.zoneName.toLowerCase().includes(q);
      if (!matchId && !matchAnimal && !matchSpecies && !matchZone) return false;
    }
    return true;
  });

  const getSeverityClass = (sev: string) => {
    switch (sev) {
      case 'High Risk':
        return 'high-risk';
      case 'Warning':
        return 'warning';
      default:
        return 'safe';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="status-pill danger"><span className="pulse-dot danger" /> Unresolved</span>;
      case 'Acknowledged':
        return <span className="status-pill warning"><span className="pulse-dot warning" /> Triage in Progress</span>;
      case 'Resolved':
        return <span className="status-pill safe"><Icon name="check" size={12} /> Resolved</span>;
      default:
        return <span className="status-pill inactive">{status}</span>;
    }
  };

  const timeAgo = (dateStr: string | Date) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    return `${hours}h ${diff % 60}m ago`;
  };

  return (
    <div className="alerts-view">
      {/* Filters & Search */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">
            <Icon name="search" size={16} />
          </span>
          <input
            type="text"
            placeholder="Search alerts by ID, animal, zone or species..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses ({alerts.length})</option>
          <option value="Active">Active / Pending ({alerts.filter((a) => a.status === 'Active').length})</option>
          <option value="Acknowledged">Acknowledged ({alerts.filter((a) => a.status === 'Acknowledged').length})</option>
          <option value="Resolved">Resolved ({alerts.filter((a) => a.status === 'Resolved').length})</option>
        </select>

        <select
          className="filter-select"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="All">All Severities</option>
          <option value="High Risk">High Risk Hotspots</option>
          <option value="Warning">Moderate Warnings</option>
          <option value="Info">Informational</option>
        </select>
      </div>

      {/* Alerts Table */}
      {filteredAlerts.length === 0 ? (
        <div className="card-panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Icon name="check" size={36} />
          <h3 style={{ marginTop: 12, color: 'var(--text-main)' }}>No alerts matching your criteria</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            All collared animals are currently within safe boundaries.
          </p>
        </div>
      ) : (
        <div className="alerts-table-wrapper">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Alert ID & Severity</th>
                <th>Tracked Animal</th>
                <th>Breached Risk Zone</th>
                <th>Trigger Reason</th>
                <th>Time & Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => {
                const sevClass = getSeverityClass(alert.severity);
                const isUnread = alert.status === 'Active';

                return (
                  <tr key={alert.alertId} className={isUnread ? 'unread-alert' : ''}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`pulse-dot ${sevClass}`} />
                        <div>
                          <strong style={{ display: 'block', fontSize: 13 }}>{alert.alertId}</strong>
                          <span className={`status-pill ${sevClass}`} style={{ fontSize: 9, padding: '2px 6px', marginTop: 2 }}>
                            {alert.severity}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="alert-animal-cell">
                        <div className={`animal-avatar ${sevClass}`} style={{ width: 32, height: 32, fontSize: 14 }}>
                          <Icon name="paw" size={16} />
                        </div>
                        <div>
                          <strong>{alert.animalName}</strong>
                          <small style={{ display: 'block', color: 'var(--text-muted)' }}>
                            {alert.species} ({alert.animalId})
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="shield" size={14} />
                        <div>
                          <strong>{alert.zoneName}</strong>
                          <small style={{ display: 'block', color: 'var(--text-muted)' }}>{alert.park}</small>
                        </div>
                      </div>
                    </td>

                    <td style={{ maxWidth: 280 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {alert.triggerReason}
                      </span>
                    </td>

                    <td>
                      <div>
                        <div style={{ marginBottom: 4 }}>{getStatusBadge(alert.status)}</div>
                        <small style={{ color: 'var(--text-muted)' }}>
                          {timeAgo(alert.triggeredAt)}
                        </small>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn-detail"
                          onClick={() => onSelectAlert(alert)}
                          title="View detailed triage modal"
                        >
                          <Icon name="info" size={14} /> Triage
                        </button>
                        {alert.status === 'Active' && onAcknowledgeAlert && (
                          <button
                            className="btn-ping"
                            style={{ borderColor: '#e63946', color: '#ff4d5e' }}
                            onClick={() => onAcknowledgeAlert(alert.alertId)}
                            title="Fast Acknowledge"
                          >
                            <Icon name="check" size={14} /> Ack
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
