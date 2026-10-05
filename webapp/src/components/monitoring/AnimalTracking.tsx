import React, { useState } from 'react';
import type { CollaredAnimal, AnimalSpecies, AnimalRiskStatus } from '../../types/wildlife';
import { Icon } from '../layout/Icon';

interface AnimalTrackingProps {
  animals: CollaredAnimal[];
  selectedPark: string;
  onSelectAnimalForMap?: (animal: CollaredAnimal) => void;
  onSimulatePing?: (collarId: string) => void;
}

export const AnimalTracking: React.FC<AnimalTrackingProps> = ({
  animals,
  selectedPark,
  onSelectAnimalForMap,
  onSimulatePing,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('All Species');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Status');
  const [selectedAnimal, setSelectedAnimal] = useState<CollaredAnimal | null>(null);

  const speciesList: AnimalSpecies[] = [
    'Asian Elephant',
    'Sri Lankan Leopard',
    'Sloth Bear',
    'Spotted Deer',
    'Mugger Crocodile',
    'Water Buffalo',
    'Wild Boar',
  ];

  const filteredAnimals = animals.filter((animal) => {
    if (selectedPark && selectedPark !== 'All Parks' && animal.park !== selectedPark) {
      return false;
    }
    if (selectedSpecies !== 'All Species' && animal.species !== selectedSpecies) {
      return false;
    }
    if (selectedStatus !== 'All Status' && animal.status !== selectedStatus) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = animal.name.toLowerCase().includes(q);
      const matchId = animal.animalId.toLowerCase().includes(q);
      const matchCollar = animal.collarId.toLowerCase().includes(q);
      const matchZone = animal.currentZoneName?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchCollar && !matchZone) return false;
    }
    return true;
  });

  const getStatusClass = (status: AnimalRiskStatus) => {
    switch (status) {
      case 'High Risk':
        return 'high-risk';
      case 'Warning':
        return 'warning';
      case 'Safe':
        return 'safe';
      default:
        return 'inactive';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level < 30) return '#e63946';
    if (level < 60) return '#ffb703';
    return '#2ec4b6';
  };

  return (
    <div className="animal-tracking-view">
      {/* Search & Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">
            <Icon name="search" size={16} />
          </span>
          <input
            type="text"
            placeholder="Search collared wildlife by name, ID, collar or zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={selectedSpecies}
          onChange={(e) => setSelectedSpecies(e.target.value)}
        >
          <option value="All Species">All Species ({animals.length})</option>
          {speciesList.map((sp) => (
            <option key={sp} value={sp}>
              {sp}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All Status">All Statuses</option>
          <option value="High Risk">High Risk Breach</option>
          <option value="Warning">Warning Buffer</option>
          <option value="Safe">Safe Habitat</option>
        </select>
      </div>

      {/* Grid of Collared Wildlife */}
      {filteredAnimals.length === 0 ? (
        <div className="card-panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Icon name="radar" size={36} />
          <h3 style={{ marginTop: 12, color: 'var(--text-main)' }}>No collared animals found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Try adjusting your search query or species/status filters.
          </p>
        </div>
      ) : (
        <div className="animals-grid">
          {filteredAnimals.map((animal) => {
            const isRisk = animal.status === 'High Risk';
            const statusClass = getStatusClass(animal.status);

            return (
              <div key={animal.collarId} className={`animal-card ${isRisk ? 'is-risk' : ''}`}>
                <div className="animal-card-header">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className={`animal-avatar ${isRisk ? 'risk' : ''}`}>
                      <Icon name="paw" size={22} />
                    </div>
                    <div className="animal-meta">
                      <h3>{animal.name}</h3>
                      <span>{animal.species} • {animal.animalId}</span>
                    </div>
                  </div>
                  <span className={`status-pill ${statusClass}`}>
                    <span className={`pulse-dot ${statusClass}`} />
                    {animal.status}
                  </span>
                </div>

                {/* Collar Telemetry Metrics */}
                <div className="telemetry-row">
                  <div className="telemetry-stat">
                    <small>Battery</small>
                    <strong style={{ color: getBatteryColor(animal.batteryLevel) }}>
                      {animal.batteryLevel}%
                    </strong>
                  </div>
                  <div className="telemetry-stat">
                    <small>Velocity</small>
                    <strong>{animal.currentLocation.speedKmh || 0} km/h</strong>
                  </div>
                  <div className="telemetry-stat">
                    <small>Signal</small>
                    <strong>{animal.signalStrength}</strong>
                  </div>
                </div>

                {/* Location & Risk Zone */}
                <div className="animal-location-box">
                  <div className="loc-row">
                    <Icon name="pin" size={14} />
                    <span style={{ fontFamily: 'monospace' }}>
                      {animal.currentLocation.latitude.toFixed(4)}° N, {animal.currentLocation.longitude.toFixed(4)}° E
                    </span>
                  </div>
                  <div className="loc-zone">
                    <Icon name="shield" size={13} />
                    <span>Zone: <strong>{animal.currentZoneName || 'Core Sanctuary'}</strong></span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="card-footer-actions">
                  <button
                    className="btn-detail"
                    onClick={() => setSelectedAnimal(animal)}
                  >
                    <Icon name="info" size={14} /> Details
                  </button>
                  {onSelectAnimalForMap && (
                    <button
                      className="btn-detail"
                      onClick={() => onSelectAnimalForMap(animal)}
                      title="Locate on Live Map"
                    >
                      <Icon name="map" size={14} /> Locate
                    </button>
                  )}
                  {onSimulatePing && (
                    <button
                      className="btn-ping"
                      onClick={() => onSimulatePing(animal.collarId)}
                      title="Simulate Realtime Ping"
                    >
                      <Icon name="activity" size={14} /> Ping
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Animal Profile Modal with GPS Breadcrumbs */}
      {selectedAnimal && (
        <div className="modal-overlay" onClick={() => setSelectedAnimal(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Icon name="paw" size={20} />
                Collared Wildlife Dossier — {selectedAnimal.name}
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedAnimal(null)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Profile Summary */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-panel-subtle)', padding: 16, borderRadius: 10 }}>
                <div className="animal-avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
                  <Icon name="paw" size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>{selectedAnimal.name}</h3>
                    <span className={`status-pill ${getStatusClass(selectedAnimal.status)}`}>
                      {selectedAnimal.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    {selectedAnimal.species} • Sex: {selectedAnimal.sex} • Age: {selectedAnimal.ageYears || 'Unknown'} yrs • Weight: {selectedAnimal.weightKg || 'N/A'} kg
                  </div>
                </div>
              </div>

              {/* Collar Hardware & Telemetry */}
              <div className="modal-grid-2">
                <div className="detail-block">
                  <div className="detail-block-title">VHF/GPS Collar Diagnostics</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Collar Serial:</span>
                      <strong style={{ fontFamily: 'monospace' }}>{selectedAnimal.collarId}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Collar Model:</span>
                      <strong>{selectedAnimal.collarModel || 'EcoTrack V4 Ultra-VHF'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Battery Status:</span>
                      <strong style={{ color: getBatteryColor(selectedAnimal.batteryLevel) }}>
                        {selectedAnimal.batteryLevel}% Charge
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Signal Strength:</span>
                      <strong>{selectedAnimal.signalStrength}</strong>
                    </div>
                  </div>
                </div>

                <div className="detail-block">
                  <div className="detail-block-title">Current Sector & Spatial Status</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>National Park:</span>
                      <strong>{selectedAnimal.park}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Zone Classification:</span>
                      <strong>{selectedAnimal.currentZoneName || 'Core Sanctuary'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Latitude / Longitude:</span>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>
                        {selectedAnimal.currentLocation.latitude.toFixed(4)}° N, {selectedAnimal.currentLocation.longitude.toFixed(4)}° E
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Movement Speed:</span>
                      <strong>{selectedAnimal.currentLocation.speedKmh || 0} km/h (Heading {selectedAnimal.currentLocation.heading || 0}°)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Field Notes */}
              {selectedAnimal.notes && (
                <div className="detail-block">
                  <div className="detail-block-title">Park Manager Field Notes</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-main)' }}>
                    {selectedAnimal.notes}
                  </p>
                </div>
              )}

              {/* Movement Breadcrumb History */}
              <div className="detail-block">
                <div className="detail-block-title">Recent Telemetry Waypoints & Breadcrumbs</div>
                {selectedAnimal.locationHistory && selectedAnimal.locationHistory.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                    {selectedAnimal.locationHistory.map((loc, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 10px',
                          background: 'var(--bg-card)',
                          borderRadius: 6,
                          fontSize: 11,
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>
                          Waypoint #{i + 1} ({new Date(loc.timestamp).toLocaleTimeString()})
                        </span>
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>
                          {loc.latitude.toFixed(4)}° N, {loc.longitude.toFixed(4)}° E
                        </span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          {loc.speedKmh || 0} km/h
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No historical breadcrumbs available.</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setSelectedAnimal(null)}
              >
                Close
              </button>
              {onSelectAnimalForMap && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    onSelectAnimalForMap(selectedAnimal);
                    setSelectedAnimal(null);
                  }}
                >
                  <Icon name="map" size={16} /> Locate on Live Map
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
