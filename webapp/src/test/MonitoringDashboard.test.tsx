import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonitoringDashboard } from '../components/monitoring/MonitoringDashboard';
import type { MonitoringOverview, CollaredAnimal, RiskZone, WildlifeAlert } from '../types/wildlife';

const mockOverview: MonitoringOverview = {
  park: 'Yala National Park',
  totalCollared: 6,
  animalsInHighRisk: 2,
  animalsSafe: 4,
  animalsWarning: 0,
  lowBatteryCollars: 1,
  activeAlertsCount: 1,
  acknowledgedAlertsCount: 1,
  resolvedAlertsCount: 2,
  speciesBreakdown: { 'Asian Elephant': 4, 'Sri Lankan Leopard': 2 },
  zonesCount: 3,
  highRiskZonesCount: 2,
  normalZonesCount: 1,
  recentUpdates: [],
  lastTelemetrySync: new Date().toISOString(),
};

const mockAnimals: CollaredAnimal[] = [
  {
    collarId: 'COL-ELE-084',
    animalId: 'ELE-084',
    name: 'Gemunu (Tusker)',
    species: 'Asian Elephant',
    sex: 'Male',
    park: 'Yala National Park',
    currentLocation: { latitude: 6.37, longitude: 81.52, timestamp: new Date().toISOString() },
    batteryLevel: 88,
    signalStrength: 'Strong',
    status: 'High Risk',
    isInHighRiskZone: true,
    lastPingAt: new Date().toISOString(),
    locationHistory: [],
  },
];

const mockZones: RiskZone[] = [
  {
    zoneId: 'ZONE-YALA-01',
    name: 'Menik River Poaching Buffer',
    park: 'Yala National Park',
    riskLevel: 'High Risk',
    hazardType: 'Poaching Hotspot',
    description: 'Poaching buffer',
    areaKm2: 18,
    alertTriggerThresholdMeters: 150,
    recommendedSOP: 'Drone reconnaissance',
    activeAnimalCount: 1,
    coordinates: [],
  },
];

const mockAlerts: WildlifeAlert[] = [
  {
    alertId: 'ALT-DASH-001',
    collarId: 'COL-ELE-084',
    animalId: 'ELE-084',
    animalName: 'Gemunu (Tusker)',
    species: 'Asian Elephant',
    zoneId: 'ZONE-YALA-01',
    zoneName: 'Menik River Poaching Buffer',
    park: 'Yala National Park',
    severity: 'High Risk',
    status: 'Active',
    triggerReason: 'Perimeter breach',
    triggeredAt: new Date().toISOString(),
    location: { latitude: 6.37, longitude: 81.52 },
  },
  {
    alertId: 'ALT-BAT-002',
    collarId: 'COL-LEO-012',
    animalId: 'LEO-012',
    animalName: 'Kalu (Panther)',
    species: 'Sri Lankan Leopard',
    zoneId: 'ZONE-YALA-04',
    zoneName: 'Block I Core',
    park: 'Yala National Park',
    severity: 'Warning',
    status: 'Active',
    triggerReason: 'battery low',
    triggeredAt: new Date().toISOString(),
    location: { latitude: 6.33, longitude: 81.45 },
  },
];

describe('MonitoringDashboard Component', () => {
  it('renders KPI metrics and triggers tab switching on KPI card clicks', () => {
    const handleChangeTab = vi.fn();
    render(
      <MonitoringDashboard
        overview={mockOverview}
        animals={mockAnimals}
        zones={mockZones}
        alerts={mockAlerts}
        selectedPark="Yala National Park"
        onChangeTab={handleChangeTab}
        onSelectAnimal={vi.fn()}
        onSelectAlert={vi.fn()}
      />
    );

    expect(screen.getByText('Active Collars')).toBeInTheDocument();
    expect(screen.getByText('At-Risk Wildlife')).toBeInTheDocument();
    expect(screen.getByText('Pending Alerts')).toBeInTheDocument();

    // Click Active Collars KPI
    fireEvent.click(screen.getByText('Active Collars').closest('.kpi-card')!);
    expect(handleChangeTab).toHaveBeenCalledWith('tracking');

    // Click Pending Alerts KPI
    fireEvent.click(screen.getByText('Pending Alerts').closest('.kpi-card')!);
    expect(handleChangeTab).toHaveBeenCalledWith('alerts');

    // Click Monitored Zones KPI
    fireEvent.click(screen.getByText('Monitored Zones').closest('.kpi-card')!);
    expect(handleChangeTab).toHaveBeenCalledWith('zones');
  });

  it('renders species distribution and trigger buttons for full screen map', () => {
    const handleChangeTab = vi.fn();
    const handleSelectAlert = vi.fn();

    render(
      <MonitoringDashboard
        overview={mockOverview}
        animals={mockAnimals}
        zones={mockZones}
        alerts={mockAlerts}
        selectedPark="Yala National Park"
        onChangeTab={handleChangeTab}
        onSelectAnimal={vi.fn()}
        onSelectAlert={handleSelectAlert}
      />
    );

    expect(screen.getByText('Species Under Monitoring')).toBeInTheDocument();
    expect(screen.getByText(/Asian Elephant/i)).toBeInTheDocument();

    // Full screen map button
    const mapBtn = screen.getByRole('button', { name: /Full Screen Map/i });
    fireEvent.click(mapBtn);
    expect(handleChangeTab).toHaveBeenCalledWith('map');

    // View all alerts button
    const viewAllBtn = screen.getByRole('button', { name: /View All/i });
    fireEvent.click(viewAllBtn);
    expect(handleChangeTab).toHaveBeenCalledWith('alerts');

    // Click triage button on alert feed card
    const triageBtns = screen.getAllByRole('button', { name: /Triage & Ack/i });
    fireEvent.click(triageBtns[0]);
    expect(handleSelectAlert).toHaveBeenCalledWith(mockAlerts[0]);
  });
});
