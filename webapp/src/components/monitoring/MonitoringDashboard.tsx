import React from 'react';
import type { MonitoringOverview, CollaredAnimal, RiskZone, WildlifeAlert } from '../../types/wildlife';
import { Icon } from '../layout/Icon';
import { LiveMap } from './LiveMap';

interface MonitoringDashboardProps {
  overview: MonitoringOverview | null;
  animals: CollaredAnimal[];
  zones: RiskZone[];
  alerts: WildlifeAlert[];
  selectedPark: string;
  onChangeTab: (tab: 'dashboard' | 'tracking' | 'map' | 'zones' | 'alerts') => void;
  onSelectAnimal: (animal: CollaredAnimal) => void;
  onSelectAlert: (alert: WildlifeAlert) => void;
  onSimulatePing: (collarId: string) => void;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  overview,
  animals,
  zones,
  alerts,
  selectedPark,
  onChangeTab,
  onSelectAnimal,
  onSelectAlert,
  onSimulatePing,
}) => {
  const activeAlerts = alerts.filter((a) => a.status === 'Active');
  const animalsAtRisk = animals.filter((a) => a.status === 'High Risk' || a.isInHighRiskZone);

  const timeAgo = (dateStr: string | Date) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    return `${hours}h ${diff % 60}m ago`;
  };

  return (
    <div className="monitoring-dashboard">
      {/* Top KPI Metrics Grid */}
      <div className="kpi-grid">
        {/* Tracked Collars */}
        <div className="kpi-card" onClick={() => onChangeTab('tracking')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Active Collars</span>
            <div className="kpi-icon-wrap safe">
              <Icon name="paw" size={18} />
            </div>
          </div>
          <div className="kpi-value">{overview?.totalCollared || animals.length}</div>
          <div className="kpi-subtext">
            {overview?.animalsSafe || animals.filter((a) => a.status === 'Safe').length} in Safe Sanctuary
          </div>
        </div>

        {/* Animals in High-Risk Zones */}
        <div
          className={`kpi-card ${animalsAtRisk.length > 0 ? 'alert-highlight' : ''}`}
          onClick={() => onChangeTab('tracking')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-top">
            <span className="kpi-label">At-Risk Wildlife</span>
            <div className="kpi-icon-wrap danger">
              <Icon name="alert" size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: animalsAtRisk.length > 0 ? '#ff4d5e' : 'var(--text-main)' }}>
            {overview?.animalsInHighRisk || animalsAtRisk.length}
          </div>
          <div className="kpi-subtext">
            {animalsAtRisk.length > 0 ? 'Inside danger perimeter' : 'No boundary breaches'}
          </div>
        </div>

        {/* Active Geofence Alerts */}
        <div
          className={`kpi-card ${activeAlerts.length > 0 ? 'alert-highlight' : ''}`}
          onClick={() => onChangeTab('alerts')}
          style={{ cursor: 'pointer' }}
        >
          <div className="kpi-top">
            <span className="kpi-label">Pending Alerts</span>
            <div className="kpi-icon-wrap danger">
              <Icon name="bell" size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: activeAlerts.length > 0 ? '#ff4d5e' : 'var(--text-main)' }}>
            {overview?.activeAlertsCount || activeAlerts.length}
          </div>
          <div className="kpi-subtext">Requires Manager triage</div>
        </div>

        {/* Risk Zones Count */}
        <div className="kpi-card" onClick={() => onChangeTab('zones')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Monitored Zones</span>
            <div className="kpi-icon-wrap warning">
              <Icon name="shield" size={18} />
            </div>
          </div>
          <div className="kpi-value">{overview?.zonesCount || zones.length}</div>
          <div className="kpi-subtext">
            {overview?.highRiskZonesCount || zones.filter((z) => z.riskLevel === 'High Risk').length} High-Risk Hotspots
          </div>
        </div>

        {/* Low Battery Collars */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Collar Battery Status</span>
            <div className="kpi-icon-wrap safe">
              <Icon name="battery" size={18} />
            </div>
          </div>
          <div className="kpi-value">
            {overview?.lowBatteryCollars || animals.filter((a) => a.batteryLevel < 50).length}
          </div>
          <div className="kpi-subtext">Collars &lt;50% charge</div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="dashboard-columns">
        {/* Left Column: Live Radar Map Canvas */}
        <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="panel-title">
              <Icon name="radar" size={18} />
              <span>Real-Time Wildlife Radar & Boundaries</span>
            </div>
            <button className="panel-action-btn" onClick={() => onChangeTab('map')}>
              <span>Full Screen Map</span>
              <Icon name="arrow" size={14} />
            </button>
          </div>
          <div style={{ height: 480 }}>
            <LiveMap
              animals={animals}
              zones={zones}
              alerts={alerts}
              selectedPark={selectedPark}
              onSelectAnimal={onSelectAnimal}
              onSelectAlert={onSelectAlert}
              onSimulatePing={onSimulatePing}
            />
          </div>
        </div>

        {/* Right Column: Active Alerts Feed & Species Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Active Alerts Panel */}
          <div className="card-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Icon name="bell" size={17} />
                <span>Active Geofence Breaches</span>
                {activeAlerts.length > 0 && (
                  <span className="tab-badge danger">{activeAlerts.length}</span>
                )}
              </div>
              <button className="panel-action-btn" onClick={() => onChangeTab('alerts')}>
                <span>View All</span>
                <Icon name="arrow" size={13} />
              </button>
            </div>

            {activeAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)' }}>
                <Icon name="check" size={28} />
                <p style={{ margin: '8px 0 0 0', fontSize: 13 }}>No active breaches detected</p>
                <small>Park boundaries are secure</small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.alertId}
                    style={{
                      background: 'rgba(230, 57, 70, 0.08)',
                      border: '1px solid rgba(230, 57, 70, 0.3)',
                      borderRadius: 10,
                      padding: 12,
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                    }}
                    onClick={() => onSelectAlert(alert)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <strong style={{ fontSize: 13, color: 'var(--text-main)' }}>{alert.animalName}</strong>
                      <span className="status-pill high-risk" style={{ fontSize: 9, padding: '2px 6px' }}>
                        {alert.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Breached: <strong>{alert.zoneName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <small style={{ color: 'var(--text-dim)' }}>{timeAgo(alert.triggeredAt)}</small>
                      <button
                        className="btn-primary"
                        style={{ padding: '4px 10px', fontSize: 11, minHeight: 'auto' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAlert(alert);
                        }}
                      >
                        Triage & Ack
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Species Breakdown */}
          <div className="card-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Icon name="paw" size={17} />
                <span>Species Under Monitoring</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {overview?.speciesBreakdown &&
                Object.entries(overview.speciesBreakdown).map(([species, count]) => {
                  const percent = Math.round((count / (overview.totalCollared || 1)) * 100);
                  return (
                    <div key={species}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 550 }}>{species}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{count} Animals ({percent}%)</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--bg-panel-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            background: 'var(--primary)',
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Recent Activity Updates Ticker */}
          <div className="card-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Icon name="activity" size={17} />
                <span>Monitoring Feed</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {overview?.recentUpdates && overview.recentUpdates.length > 0 ? (
                overview.recentUpdates.slice(0, 4).map((upd) => (
                  <div
                    key={upd.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      fontSize: 12,
                      paddingBottom: 8,
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span
                      className={`pulse-dot ${
                        upd.type === 'High Risk' ? 'high-risk' : upd.type === 'Warning' ? 'warning' : 'safe'
                      }`}
                      style={{ marginTop: 5 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{upd.title}</strong>
                        <small style={{ color: 'var(--text-dim)' }}>{timeAgo(upd.time)}</small>
                      </div>
                      <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: 11 }}>
                        {upd.message}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No recent telemetry changes.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
