import React, { useState } from 'react';
import type { WildlifeAlert, CollaredAnimal } from '../../types/wildlife';
import { Icon } from '../layout/Icon';

interface AlertDetailsModalProps {
  alert: WildlifeAlert | null;
  animal?: CollaredAnimal | null;
  onClose: () => void;
  onAcknowledge: (alertId: string, notes: string, rangers?: string[]) => Promise<void>;
  onResolve: (alertId: string, notes: string) => Promise<void>;
  onFocusOnMap?: (alert: WildlifeAlert) => void;
}

export const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({
  alert,
  animal,
  onClose,
  onAcknowledge,
  onResolve,
  onFocusOnMap,
}) => {
  const [notes, setNotes] = useState('');
  const [selectedRanger, setSelectedRanger] = useState('Sector Charlie Response Unit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveInput, setShowResolveInput] = useState(false);

  if (!alert) return null;

  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    try {
      await onAcknowledge(
        alert.alertId,
        notes || 'Acknowledged by Park Manager via Operations Command Console.',
        [selectedRanger]
      );
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    setIsSubmitting(true);
    try {
      await onResolve(
        alert.alertId,
        resolutionNotes || 'Animal monitored and confirmed safe by Field Ranger team.'
      );
      setShowResolveInput(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeAgo = (dateStr: string | Date) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    return `${hours}h ${diff % 60}m ago`;
  };

  const severityClass =
    alert.severity === 'High Risk'
      ? 'high-risk'
      : alert.severity === 'Warning'
      ? 'warning'
      : 'safe';

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>
            <Icon name="bell" size={20} />
            Alert Details & Incident Triage
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Top Banner with Risk Level */}
          <div className={`modal-alert-banner ${severityClass}`}>
            <span className={`pulse-dot ${severityClass}`} style={{ marginTop: 4 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <strong style={{ fontSize: 15 }}>{alert.alertId} — {alert.zoneName}</strong>
                <span className={`status-pill ${severityClass}`}>{alert.severity}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.9 }}>{alert.triggerReason}</p>
            </div>
          </div>

          {/* 2-Column Telemetry & Incident Info */}
          <div className="modal-grid-2">
            {/* Animal Card */}
            <div className="detail-block">
              <div className="detail-block-title">Tracked Animal Profile</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                <div className={`animal-avatar ${severityClass}`} style={{ width: 44, height: 44 }}>
                  <Icon name="paw" size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text-main)' }}>{alert.animalName}</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {alert.species} • Collar: {alert.collarId}
                  </span>
                </div>
              </div>
              {animal && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 11, background: 'var(--bg-card)', padding: 8, borderRadius: 6 }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Battery</span>
                    <strong>{animal.batteryLevel}%</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Speed</span>
                    <strong>{animal.currentLocation.speedKmh || 0} km/h</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Signal</span>
                    <strong>{animal.signalStrength}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Location & Time Info */}
            <div className="detail-block">
              <div className="detail-block-title">Incident Location & Timeline</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>National Park:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{alert.park}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sector / Landmark:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{alert.location.sector || 'Boundary Zone'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>GPS Coordinates:</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>
                    {alert.location.latitude.toFixed(4)}° N, {alert.location.longitude.toFixed(4)}° E
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Triggered At:</span>
                  <strong style={{ color: 'var(--text-main)' }}>
                    {new Date(alert.triggeredAt).toLocaleTimeString()} ({timeAgo(alert.triggeredAt)})
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Radar / Geofence Visualization */}
          <div className="detail-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div className="detail-block-title" style={{ margin: 0 }}>Live Geofence Telemetry Preview</div>
              {onFocusOnMap && (
                <button
                  className="panel-action-btn"
                  onClick={() => {
                    onFocusOnMap(alert);
                    onClose();
                  }}
                >
                  <Icon name="map" size={14} /> Open Full Live Map
                </button>
              )}
            </div>
            <div className="mini-map-preview">
              <svg width="100%" height="100%" viewBox="0 0 400 140" style={{ display: 'block' }}>
                <defs>
                  <pattern id="grid-pattern-mini" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  </pattern>
                  <radialGradient id="alertGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#e63946" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#e63946" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern-mini)" />
                {/* Geofence polygon */}
                <polygon
                  points="50,20 350,30 380,120 40,110"
                  fill="rgba(230, 57, 70, 0.12)"
                  stroke="#e63946"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                <text x="60" y="40" fill="#e63946" fontSize="10" fontWeight="600" opacity="0.8">
                  HIGH-RISK GEOFENCE: {alert.zoneName}
                </text>
                {/* Animal ping position */}
                <circle cx="210" cy="75" r="22" fill="url(#alertGlow)" />
                <circle cx="210" cy="75" r="8" fill="#e63946" stroke="#ffffff" strokeWidth="2" />
                <text x="225" y="80" fill="#ffffff" fontSize="11" fontWeight="700">
                  {alert.animalName} ({alert.animalId})
                </text>
              </svg>
            </div>
          </div>

          {/* Acknowledgement Status & Action Section */}
          <div className="action-form-section">
            {alert.status === 'Active' ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label htmlFor="manager-notes">
                    Park Manager Action / Incident Triage Notes:
                  </label>
                  <textarea
                    id="manager-notes"
                    placeholder="Enter management directives, drone dispatch instructions, or boundary patrol alerts..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="dispatch-unit">Assigned Rapid Response Unit:</label>
                    <select
                      id="dispatch-unit"
                      className="form-select"
                      style={{ width: '100%' }}
                      value={selectedRanger}
                      onChange={(e) => setSelectedRanger(e.target.value)}
                    >
                      <option value="Sector Charlie Response Unit">Sector Charlie Rapid Response Unit</option>
                      <option value="Menik River Boundary Patrol">Menik River Boundary Patrol</option>
                      <option value="Wildlife Veterinary Mobile Unit">Wildlife Veterinary Mobile Unit</option>
                      <option value="Kataragama North Buffer Wardens">Kataragama North Buffer Wardens</option>
                    </select>
                  </div>
                </div>
              </>
            ) : alert.status === 'Acknowledged' ? (
              <div style={{ background: 'var(--bg-panel-subtle)', padding: 14, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="status-pill warning">Acknowledged & Under Triage</span>
                  <small style={{ color: 'var(--text-muted)' }}>
                    by {alert.acknowledgedBy || 'Park Manager'} at{' '}
                    {alert.acknowledgedAt ? new Date(alert.acknowledgedAt).toLocaleTimeString() : ''}
                  </small>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-main)' }}>
                  <strong>Notes:</strong> {alert.managerNotes || 'No notes specified.'}
                </p>
                {alert.dispatchedRangers && alert.dispatchedRangers.length > 0 && (
                  <p style={{ margin: '6px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                    <strong>Dispatched Teams:</strong> {alert.dispatchedRangers.join(', ')}
                  </p>
                )}

                {showResolveInput ? (
                  <div style={{ marginTop: 14 }}>
                    <label htmlFor="resolve-notes">Resolution Summary Notes:</label>
                    <textarea
                      id="resolve-notes"
                      placeholder="Detail how the animal was returned to safe grounds or incident concluded..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                    />
                  </div>
                ) : (
                  <button
                    className="btn-primary"
                    style={{ marginTop: 12, padding: '8px 14px', fontSize: 12 }}
                    onClick={() => setShowResolveInput(true)}
                  >
                    <Icon name="check" size={15} /> Resolve Incident
                  </button>
                )}
              </div>
            ) : (
              <div style={{ background: 'rgba(46, 196, 182, 0.1)', border: '1px solid rgba(46, 196, 182, 0.3)', padding: 14, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="status-pill safe">Resolved</span>
                  <small style={{ color: 'var(--text-muted)' }}>
                    Resolved by {alert.resolvedBy || 'Park Manager'} at{' '}
                    {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleTimeString() : ''}
                  </small>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-main)' }}>
                  <strong>Resolution:</strong> {alert.resolutionNotes || 'Safe status restored.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {alert.status === 'Active' && (
            <button
              className="btn-primary"
              onClick={handleAcknowledge}
              disabled={isSubmitting}
            >
              <Icon name="check" size={16} />
              {isSubmitting ? 'Acknowledging...' : 'Acknowledge & Dispatch Rangers'}
            </button>
          )}
          {alert.status === 'Acknowledged' && showResolveInput && (
            <button
              className="btn-primary"
              onClick={handleResolve}
              disabled={isSubmitting}
            >
              <Icon name="check" size={16} />
              {isSubmitting ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
