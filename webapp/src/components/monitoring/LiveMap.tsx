import React, { useState, useRef } from 'react';
import type { CollaredAnimal, RiskZone, WildlifeAlert } from '../../types/wildlife';
import { Icon } from '../layout/Icon';

interface LiveMapProps {
  animals: CollaredAnimal[];
  zones: RiskZone[];
  alerts: WildlifeAlert[];
  selectedPark: string;
  onSelectAnimal?: (animal: CollaredAnimal) => void;
  onSelectAlert?: (alert: WildlifeAlert) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  animals,
  zones,
  alerts,
  selectedPark,
  onSelectAnimal,
  onSelectAlert,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedPin, setSelectedPin] = useState<CollaredAnimal | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [showAnimals, setShowAnimals] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [mapMode, setMapMode] = useState<'dark-topo' | 'satellite' | 'infrared'>('dark-topo');

  const containerRef = useRef<HTMLDivElement>(null);

  // Sri Lanka Parks Geographic Bounding Boxes -> SVG Coordinate Conversion
  const getParkBounds = (park: string) => {
    if (park.includes('Wilpattu')) {
      return { minLat: 8.35, maxLat: 8.55, minLng: 79.82, maxLng: 80.15 };
    }
    if (park.includes('Udawalawe')) {
      return { minLat: 6.40, maxLat: 6.55, minLng: 80.80, maxLng: 80.98 };
    }
    // Default Yala National Park
    return { minLat: 6.22, maxLat: 6.48, minLng: 81.30, maxLng: 81.62 };
  };

  const bounds = getParkBounds(selectedPark);

  const projectCoord = (lat: number, lng: number) => {
    const svgWidth = 900;
    const svgHeight = 560;
    const padding = 60;

    const xNorm = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
    const yNorm = 1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);

    const x = padding + Math.max(0, Math.min(1, xNorm)) * (svgWidth - padding * 2);
    const y = padding + Math.max(0, Math.min(1, yNorm)) * (svgHeight - padding * 2);

    return { x, y };
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('.map-popup-card') ||
      (e.target as HTMLElement).closest('.map-controls-float')
    ) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(0.7, Math.min(3.5, prev + delta)));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedPin(null);
  };

  const getSpeciesColor = (species: string) => {
    switch (species) {
      case 'Asian Elephant':
        return '#abc587';
      case 'Sri Lankan Leopard':
        return '#f4a261';
      case 'Sloth Bear':
        return '#e76f51';
      case 'Spotted Deer':
        return '#2a9d8f';
      case 'Mugger Crocodile':
        return '#457b9d';
      default:
        return '#e9c46a';
    }
  };

  const filteredAnimals = animals.filter(
    (a) => !selectedPark || selectedPark === 'All Parks' || a.park === selectedPark
  );

  const filteredZones = zones.filter(
    (z) => !selectedPark || selectedPark === 'All Parks' || z.park === selectedPark
  );

  return (
    <div className="live-map-container" ref={containerRef}>
      {/* Top Map Toolbar */}
      <div className="map-toolbar">
        <div className="map-legend">
          <span style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="radar" size={16} /> Live Radar Telemetry
          </span>
          <div className="legend-item">
            <span className="legend-zone-box" style={{ background: 'rgba(230, 57, 70, 0.4)', border: '1px solid #e63946' }} />
            <span>High-Risk Geofence</span>
          </div>
          <div className="legend-item">
            <span className="legend-zone-box" style={{ background: 'rgba(255, 183, 3, 0.3)', border: '1px solid #ffb703' }} />
            <span>Buffer Warning Zone</span>
          </div>
          <div className="legend-item">
            <span className="legend-zone-box" style={{ background: 'rgba(46, 196, 182, 0.25)', border: '1px solid #2ec4b6' }} />
            <span>Core Sanctuary</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#e63946', boxShadow: '0 0 6px #e63946' }} />
            <span>Animal at Risk</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#2ec4b6' }} />
            <span>Safe Animal</span>
          </div>
        </div>

        {/* Layer Toggles & Mode */}
        <div className="map-actions">
          <select
            className="filter-select"
            value={mapMode}
            onChange={(e) => setMapMode(e.target.value as any)}
            title="Switch Map Visual Layer"
          >
            <option value="dark-topo">Topographic Dark</option>
            <option value="satellite">Satellite Vegetation</option>
            <option value="infrared">Thermal / IR Threat</option>
          </select>

          <button
            className={`btn-detail ${showAnimals ? 'active' : ''}`}
            onClick={() => setShowAnimals(!showAnimals)}
            title="Toggle Collared Animals"
            style={{ padding: '6px 10px' }}
          >
            <Icon name="paw" size={14} /> Wildlife
          </button>

          <button
            className={`btn-detail ${showZones ? 'active' : ''}`}
            onClick={() => setShowZones(!showZones)}
            title="Toggle Risk Zones Layer"
            style={{ padding: '6px 10px' }}
          >
            <Icon name="shield" size={14} /> Zones
          </button>

          <button
            className={`btn-detail ${showTrails ? 'active' : ''}`}
            onClick={() => setShowTrails(!showTrails)}
            title="Toggle Movement Breadcrumb Trails"
            style={{ padding: '6px 10px' }}
          >
            <Icon name="route" size={14} /> Trails
          </button>

          <button
            className={`btn-detail ${showBoundaries ? 'active' : ''}`}
            onClick={() => setShowBoundaries(!showBoundaries)}
            title="Toggle Perimeter Boundary"
            style={{ padding: '6px 10px' }}
          >
            <Icon name="crosshair" size={14} /> Boundary
          </button>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div
        className={`map-viewport-wrapper mode-${mapMode}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          className="map-svg-canvas"
          viewBox="0 0 900 560"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid background */}
            <pattern id="topoGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
            </pattern>
            {/* Radar scanner pulse animation */}
            <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </radialGradient>
            {/* High-risk glow */}
            <radialGradient id="highRiskGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e63946" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#e63946" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Map Content Group with Pan & Zoom transform */}
          <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
            {/* Base Background Grid */}
            <rect x="0" y="0" width="900" height="560" fill="url(#topoGrid)" />

            {/* Park Boundary Contour */}
            {showBoundaries && (
              <g className="park-boundaries">
                <path
                  d="M 80,90 Q 250,50 520,70 T 820,130 Q 860,340 760,490 T 320,510 Q 110,480 80,310 Z"
                  fill="rgba(171, 197, 135, 0.04)"
                  stroke="var(--primary)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  opacity="0.7"
                />
                <text x="100" y="80" fill="var(--primary)" fontSize="11" fontWeight="600" opacity="0.6">
                  {selectedPark.toUpperCase()} BOUNDARY PERIMETER
                </text>
              </g>
            )}

            {/* Topographic Elevation Contours */}
            <g className="topo-contours" stroke="rgba(255,255,255,0.05)" fill="none" strokeWidth="1">
              <path d="M 120,180 Q 280,140 450,220 T 700,240" />
              <path d="M 160,260 Q 320,220 500,290 T 750,330" />
              <path d="M 200,340 Q 380,310 560,360 T 780,410" />
              {/* Waterway / Menik River Path */}
              <path
                d="M 60,360 Q 280,340 500,420 T 840,460"
                stroke="#2a9d8f"
                strokeWidth="3.5"
                strokeOpacity="0.4"
                strokeLinecap="round"
              />
              <text x="520" y="440" fill="#2a9d8f" fontSize="9" fontWeight="600" opacity="0.7">
                Menik River Waterway
              </text>
            </g>

            {/* Risk Zones Polygons */}
            {showZones &&
              filteredZones.map((zone) => {
                const pointsStr = zone.coordinates
                  .map((c) => {
                    const pt = projectCoord(c.latitude, c.longitude);
                    return `${pt.x},${pt.y}`;
                  })
                  .join(' ');

                const isHighRisk = zone.riskLevel === 'High Risk';
                const isWarning = zone.riskLevel === 'Moderate Warning';
                const fillColor = isHighRisk
                  ? 'rgba(230, 57, 70, 0.16)'
                  : isWarning
                  ? 'rgba(255, 183, 3, 0.14)'
                  : 'rgba(46, 196, 182, 0.12)';

                const strokeColor = isHighRisk
                  ? '#e63946'
                  : isWarning
                  ? '#ffb703'
                  : '#2ec4b6';

                const centerPt = projectCoord(
                  zone.coordinates[0]?.latitude || 6.35,
                  zone.coordinates[0]?.longitude || 81.45
                );

                return (
                  <g key={zone.zoneId} className="zone-polygon-group">
                    <polygon
                      points={pointsStr}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isHighRisk ? 2 : 1.2}
                      strokeDasharray={isHighRisk ? '5 3' : 'none'}
                    />
                    <text
                      x={centerPt.x + 10}
                      y={centerPt.y + 16}
                      fill={strokeColor}
                      fontSize="10"
                      fontWeight="600"
                      opacity="0.85"
                    >
                      {zone.name}
                    </text>
                  </g>
                );
              })}

            {/* Movement History Breadcrumb Trails */}
            {showTrails &&
              filteredAnimals.map((animal) => {
                if (!animal.locationHistory || animal.locationHistory.length < 2) return null;
                const pathStr = animal.locationHistory
                  .map((loc, i) => {
                    const pt = projectCoord(loc.latitude, loc.longitude);
                    return `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
                  })
                  .join(' ');

                return (
                  <g key={`trail-${animal.collarId}`}>
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={getSpeciesColor(animal.species)}
                      strokeWidth="1.8"
                      strokeDasharray="3 3"
                      strokeOpacity="0.6"
                    />
                    {animal.locationHistory.map((loc, idx) => {
                      const pt = projectCoord(loc.latitude, loc.longitude);
                      return (
                        <circle
                          key={`pt-${animal.collarId}-${idx}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={2}
                          fill={getSpeciesColor(animal.species)}
                          opacity={0.4 + idx * 0.15}
                        />
                      );
                    })}
                  </g>
                );
              })}

            {/* Collared Animal Pins */}
            {showAnimals &&
              filteredAnimals.map((animal) => {
                const pt = projectCoord(
                  animal.currentLocation.latitude,
                  animal.currentLocation.longitude
                );
                const isAtRisk = animal.status === 'High Risk' || animal.isInHighRiskZone;
                const isWarning = animal.status === 'Warning';
                const isSelected = selectedPin?.collarId === animal.collarId;

                const pinColor = isAtRisk
                  ? '#e63946'
                  : isWarning
                  ? '#ffb703'
                  : '#2ec4b6';

                return (
                  <g
                    key={animal.collarId}
                    className="animal-pin-marker"
                    transform={`translate(${pt.x}, ${pt.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPin(animal);
                      if (onSelectAnimal) onSelectAnimal(animal);
                    }}
                  >
                    {/* Animated Pulsing Ring if at risk */}
                    {isAtRisk && (
                      <circle cx="0" cy="0" r="18" fill="url(#highRiskGlow)">
                        <animate
                          attributeName="r"
                          values="12;24;12"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.8;0.2;0.8"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Outer Target Ring */}
                    <circle
                      cx="0"
                      cy="0"
                      r={isSelected ? 14 : 10}
                      fill="rgba(18, 26, 20, 0.85)"
                      stroke={pinColor}
                      strokeWidth={isSelected ? 2.5 : 1.8}
                    />

                    {/* Inner Species Dot */}
                    <circle cx="0" cy="0" r="5" fill={pinColor} />

                    {/* Heading Vector Needle */}
                    {animal.currentLocation.heading !== undefined && (
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="-16"
                        stroke={pinColor}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        transform={`rotate(${animal.currentLocation.heading})`}
                      />
                    )}

                    {/* Collar Label Tag */}
                    <text
                      x="14"
                      y="4"
                      className="animal-pin-label"
                      fill={pinColor}
                    >
                      {animal.name.split(' ')[0]} ({animal.animalId})
                    </text>
                  </g>
                );
              })}
          </g>
        </svg>

        {/* Selected Animal Telemetry Popup Card */}
        {selectedPin && (
          <div className="map-popup-card">
            <div className="popup-header">
              <div>
                <h4 className="popup-title">{selectedPin.name}</h4>
                <div className="popup-sub">{selectedPin.species} • {selectedPin.animalId}</div>
              </div>
              <button
                className="icon-button"
                style={{ width: 24, height: 24 }}
                onClick={() => setSelectedPin(null)}
                aria-label="Close popup"
              >
                <Icon name="close" size={14} />
              </button>
            </div>

            <div style={{ margin: '8px 0' }}>
              <span
                className={`status-pill ${
                  selectedPin.status === 'High Risk'
                    ? 'high-risk'
                    : selectedPin.status === 'Warning'
                    ? 'warning'
                    : 'safe'
                }`}
              >
                {selectedPin.status}
              </span>
            </div>

            <div className="popup-grid">
              <div className="popup-field">
                <label>Current Zone</label>
                <span>{selectedPin.currentZoneName || 'Core Sanctuary'}</span>
              </div>
              <div className="popup-field">
                <label>Velocity</label>
                <span>{selectedPin.currentLocation.speedKmh || 0} km/h</span>
              </div>
              <div className="popup-field">
                <label>Battery</label>
                <span>{selectedPin.batteryLevel}%</span>
              </div>
              <div className="popup-field">
                <label>Signal</label>
                <span>{selectedPin.signalStrength}</span>
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 10px' }}>
              GPS: {selectedPin.currentLocation.latitude.toFixed(4)}° N, {selectedPin.currentLocation.longitude.toFixed(4)}° E
            </div>

            <div className="popup-actions">
              {onSelectAnimal && (
                <button
                  className="btn-detail"
                  style={{ flex: 1 }}
                  onClick={() => onSelectAnimal(selectedPin)}
                >
                  <Icon name="info" size={14} /> Animal Profile
                </button>
              )}
              {selectedPin.status === 'High Risk' && onSelectAlert && (
                <button
                  className="btn-ping"
                  style={{ flex: 1, borderColor: '#e63946', color: '#ff4d5e' }}
                  onClick={() => {
                    const matchedAlert = alerts.find(
                      (al) => al.collarId === selectedPin.collarId || al.animalId === selectedPin.animalId
                    );
                    if (matchedAlert) onSelectAlert(matchedAlert);
                  }}
                >
                  <Icon name="alert" size={14} /> View Alert
                </button>
              )}
            </div>
          </div>
        )}

        {/* GPS Coordinate HUD Display */}
        <div className="map-hud-coordinates">
          <Icon name="crosshair" size={14} />
          <span>PARK: {selectedPark.toUpperCase()}</span>
          <span>•</span>
          <span>LAT: {bounds.minLat.toFixed(3)}° - {bounds.maxLat.toFixed(3)}° N</span>
          <span>•</span>
          <span>ZOOM: {(zoomLevel * 100).toFixed(0)}%</span>
        </div>

        {/* Floating Map Zoom / Pan Controls */}
        <div className="map-controls-float">
          <button className="map-btn-float" onClick={() => handleZoom(0.25)} title="Zoom In">
            <Icon name="plus" size={18} />
          </button>
          <button className="map-btn-float" onClick={() => handleZoom(-0.25)} title="Zoom Out">
            <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>−</span>
          </button>
          <button className="map-btn-float" onClick={resetView} title="Reset View">
            <Icon name="refresh" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
