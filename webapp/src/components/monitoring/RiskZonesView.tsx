import React, { useState } from 'react';
import type { RiskZone, CollaredAnimal } from '../../types/wildlife';
import { Icon } from '../layout/Icon';

interface RiskZonesViewProps {
  zones: RiskZone[];
  animals: CollaredAnimal[];
  selectedPark: string;
  onFocusZoneOnMap?: (zone: RiskZone) => void;
}

export const RiskZonesView: React.FC<RiskZonesViewProps> = ({
  zones,
  animals,
  selectedPark,
  onFocusZoneOnMap,
}) => {
  const [filterRisk, setFilterRisk] = useState<string>('All');

  const filteredZones = zones.filter((zone) => {
    if (selectedPark && selectedPark !== 'All Parks' && zone.park !== selectedPark) {
      return false;
    }
    if (filterRisk !== 'All' && zone.riskLevel !== filterRisk) {
      return false;
    }
    return true;
  });

  const getRiskClass = (level: string) => {
    switch (level) {
      case 'High Risk':
        return 'high-risk';
      case 'Moderate Warning':
        return 'warning';
      default:
        return 'safe';
    }
  };

  const getHazardIcon = (hazard: string) => {
    switch (hazard) {
      case 'Poaching Hotspot':
        return 'alert';
      case 'Railway Corridor':
      case 'Highway Traffic Hazard':
        return 'route';
      case 'Human Settlement Buffer':
        return 'shield';
      default:
        return 'leaf';
    }
  };

  return (
    <div className="risk-zones-view">
      {/* Header & Filter Controls */}
      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)', fontSize: 13, fontWeight: 600 }}>
          <Icon name="shield" size={18} />
          <span>Park Geofence Zones & Threat Classifications</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <select
            className="filter-select"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
          >
            <option value="All">All Risk Levels ({zones.length})</option>
            <option value="High Risk">High Risk Hotspots</option>
            <option value="Moderate Warning">Moderate Warning Buffers</option>
            <option value="Safe">Core Sanctuary Safe Zones</option>
          </select>
        </div>
      </div>

      {/* Grid of Risk Zones */}
      <div className="risk-zones-grid">
        {filteredZones.map((zone) => {
          const riskClass = getRiskClass(zone.riskLevel);
          // Calculate live animals inside this zone
          const liveAnimalsInside = animals.filter(
            (a) => a.currentZoneId === zone.zoneId || a.currentZoneName === zone.name
          );

          return (
            <div key={zone.zoneId} className={`zone-card ${riskClass}`}>
              <div className="zone-header">
                <div>
                  <h3 className="zone-title">{zone.name}</h3>
                  <div className="zone-hazard-tag">
                    <Icon name={getHazardIcon(zone.hazardType)} size={13} />
                    <span>{zone.hazardType} • {zone.park}</span>
                  </div>
                </div>
                <span className={`status-pill ${riskClass}`}>
                  <span className={`pulse-dot ${riskClass}`} />
                  {zone.riskLevel}
                </span>
              </div>

              <p className="zone-desc">{zone.description}</p>

              {/* Zone Metrics */}
              <div className="zone-metrics">
                <div>
                  <label>Coverage Area</label>
                  <strong>{zone.areaKm2} km²</strong>
                </div>
                <div>
                  <label>Alert Trigger</label>
                  <strong>{zone.alertTriggerThresholdMeters}m perimeter</strong>
                </div>
                <div>
                  <label>Live Wildlife</label>
                  <strong style={{ color: liveAnimalsInside.length > 0 ? (zone.riskLevel === 'High Risk' ? '#e63946' : 'var(--primary)') : 'var(--text-main)' }}>
                    {liveAnimalsInside.length} Animals
                  </strong>
                </div>
              </div>

              {/* Active Animals Inside Tag List */}
              {liveAnimalsInside.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Tracked Animals Currently in Sector:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {liveAnimalsInside.map((animal) => (
                      <span
                        key={animal.collarId}
                        style={{
                          background: 'var(--bg-panel-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-main)',
                        }}
                      >
                        {animal.name} ({animal.species})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* SOP Instruction Box */}
              <div className="sop-box">
                <strong>Park Manager SOP Protocol:</strong>
                <p>{zone.recommendedSOP}</p>
              </div>

              {/* Card Footer Actions */}
              {onFocusZoneOnMap && (
                <div style={{ marginTop: 14 }}>
                  <button
                    className="btn-detail"
                    style={{ width: '100%' }}
                    onClick={() => onFocusZoneOnMap(zone)}
                  >
                    <Icon name="map" size={14} /> View Boundary on Live Map
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
