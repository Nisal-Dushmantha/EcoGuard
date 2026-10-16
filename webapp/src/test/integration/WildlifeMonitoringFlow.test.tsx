import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WildlifeModule } from '../../components/monitoring/WildlifeModule';
import { wildlifeService } from '../../services/wildlifeService';
import type { CollaredAnimal, RiskZone, WildlifeAlert, MonitoringOverview } from '../../types/wildlife';

const mockOverview: MonitoringOverview = {
  park: 'Yala National Park',
  totalCollared: 3,
  animalsInHighRisk: 1,
  animalsSafe: 2,
  animalsWarning: 0,
  lowBatteryCollars: 0,
  activeAlertsCount: 1,
  acknowledgedAlertsCount: 0,
  resolvedAlertsCount: 1,
  speciesBreakdown: { 'Asian Elephant': 2, 'Sri Lankan Leopard': 1 },
  zonesCount: 2,
  highRiskZonesCount: 1,
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
    ageYears: 32,
    weightKg: 4250,
    park: 'Yala National Park',
    currentLocation: {
      latitude: 6.372,
      longitude: 81.528,
      timestamp: new Date().toISOString(),
      speedKmh: 4.8,
    },
    batteryLevel: 88,
    signalStrength: 'Strong',
    status: 'High Risk',
    currentZoneId: 'ZONE-YALA-01',
    currentZoneName: 'Menik River Poaching Buffer',
    isInHighRiskZone: true,
    lastPingAt: new Date().toISOString(),
    locationHistory: [],
  },
  {
    collarId: 'COL-LEO-012',
    animalId: 'LEO-012',
    name: 'Kalu',
    species: 'Sri Lankan Leopard',
    sex: 'Female',
    ageYears: 6,
    weightKg: 68,
    park: 'Yala National Park',
    currentLocation: {
      latitude: 6.335,
      longitude: 81.455,
      timestamp: new Date().toISOString(),
      speedKmh: 1.2,
    },
    batteryLevel: 92,
    signalStrength: 'Strong',
    status: 'Safe',
    currentZoneId: 'ZONE-YALA-04',
    currentZoneName: 'Block I Core Nature Reserve',
    isInHighRiskZone: false,
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
    description: 'Dense scrubland corridor vulnerable to illegal snares.',
    areaKm2: 18.4,
    alertTriggerThresholdMeters: 150,
    recommendedSOP: 'Immediate drone reconnaissance and dispatch Sector Charlie patrol.',
    activeAnimalCount: 1,
    coordinates: [
      { latitude: 6.368, longitude: 81.512 },
      { latitude: 6.395, longitude: 81.545 },
    ],
  },
  {
    zoneId: 'ZONE-YALA-04',
    name: 'Block I Core Sanctuary',
    park: 'Yala National Park',
    riskLevel: 'Safe',
    hazardType: 'Core Protected Sanctuary',
    description: 'Pristine primary habitat with rich waterholes.',
    areaKm2: 86.5,
    alertTriggerThresholdMeters: 50,
    recommendedSOP: 'Standard routine monitoring.',
    activeAnimalCount: 1,
    coordinates: [
      { latitude: 6.315, longitude: 81.425 },
      { latitude: 6.385, longitude: 81.445 },
    ],
  },
];

const mockAlerts: WildlifeAlert[] = [
  {
    alertId: 'ALT-INT-001',
    collarId: 'COL-ELE-084',
    animalId: 'ELE-084',
    animalName: 'Gemunu (Tusker)',
    species: 'Asian Elephant',
    zoneId: 'ZONE-YALA-01',
    zoneName: 'Menik River Poaching Buffer',
    park: 'Yala National Park',
    severity: 'High Risk',
    status: 'Active',
    triggerReason: 'Elephant entered high risk poaching corridor.',
    triggeredAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    location: {
      latitude: 6.372,
      longitude: 81.528,
      sector: 'Sector Charlie Riverbank',
    },
  },
];

describe('Wildlife Monitoring Flow Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(wildlifeService, 'getOverview').mockResolvedValue(mockOverview);
    vi.spyOn(wildlifeService, 'getAnimals').mockResolvedValue(mockAnimals);
    vi.spyOn(wildlifeService, 'getZones').mockResolvedValue(mockZones);
    vi.spyOn(wildlifeService, 'getAlerts').mockResolvedValue(mockAlerts);
  });

  it('loads telemetry overview and integrates KPI cards navigation with tabs', async () => {
    render(<WildlifeModule userPark="Yala National Park" userName="Park Manager Silva" />);

    // Verify operations center header
    await waitFor(() => {
      expect(screen.getByText(/Park Manager Wildlife Operations Center/i)).toBeInTheDocument();
    });

    // Check KPI metrics loaded from service
    await waitFor(() => {
      expect(screen.getByText('Active Collars')).toBeInTheDocument();
      expect(screen.getByText('At-Risk Wildlife')).toBeInTheDocument();
    });

    // Navigate to Geofence Alerts tab
    const alertsTab = screen.getByRole('button', { name: /Geofence Alerts/i });
    fireEvent.click(alertsTab);

    // Verify Alerts view rendered with active alert from telemetry service
    await waitFor(() => {
      expect(screen.getByText('ALT-INT-001')).toBeInTheDocument();
      expect(screen.getByText(/Elephant entered high risk poaching corridor/i)).toBeInTheDocument();
    });
  });

  it('completes the full End-to-End Alert Triage and Resolution workflow', async () => {
    const ackSpy = vi.spyOn(wildlifeService, 'acknowledgeAlert').mockImplementation(async (alertId, notes, name, rangers) => ({
      ...mockAlerts[0],
      status: 'Acknowledged',
      acknowledgedBy: name || 'Park Manager Silva',
      acknowledgedAt: new Date().toISOString(),
      managerNotes: notes || 'Immediate dispatch ordered',
      dispatchedRangers: rangers || ['Sector Charlie Response Unit'],
    }));

    const resolveSpy = vi.spyOn(wildlifeService, 'resolveAlert').mockImplementation(async (alertId, notes, name) => ({
      ...mockAlerts[0],
      status: 'Resolved',
      resolvedBy: name || 'Park Manager Silva',
      resolvedAt: new Date().toISOString(),
      resolutionNotes: notes || 'Area cleared',
    }));

    render(<WildlifeModule userPark="Yala National Park" userName="Park Manager Silva" />);

    // Navigate to Alerts tab
    const alertsTab = screen.getByRole('button', { name: /Geofence Alerts/i });
    fireEvent.click(alertsTab);

    await waitFor(() => {
      expect(screen.getByText('ALT-INT-001')).toBeInTheDocument();
    });

    // 1. Click Triage to open modal
    const triageBtn = screen.getByRole('button', { name: /Triage/i });
    fireEvent.click(triageBtn);

    // Verify modal is open with telemetry data
    await waitFor(() => {
      expect(screen.getByText(/Alert Details & Incident Triage/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Gemunu \(Tusker\)/i).length).toBeGreaterThan(0);
    });

    // 2. Add Manager Notes and Acknowledge
    const notesInput = screen.getByPlaceholderText(/Enter management directives/i);
    fireEvent.change(notesInput, { target: { value: 'Dispatched Charlie Unit for boundary patrol' } });

    const ackSubmitBtn = screen.getByRole('button', { name: /Acknowledge & Dispatch Rangers/i });
    fireEvent.click(ackSubmitBtn);

    await waitFor(() => {
      expect(ackSpy).toHaveBeenCalledWith(
        'ALT-INT-001',
        'Dispatched Charlie Unit for boundary patrol',
        'Park Manager Silva',
        ['Sector Charlie Response Unit']
      );
    });

    // 3. Resolve Incident from Modal
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Resolve Incident/i })).toBeInTheDocument();
    });

    const openResolveBtn = screen.getByRole('button', { name: /Resolve Incident/i });
    fireEvent.click(openResolveBtn);

    const resolveNotesInput = screen.getByPlaceholderText(/Detail how the animal was returned to safe grounds/i);
    fireEvent.change(resolveNotesInput, { target: { value: 'Elephant safely guided back into core reserve.' } });

    const confirmResolveBtn = screen.getByRole('button', { name: /Confirm Resolution/i });
    fireEvent.click(confirmResolveBtn);

    await waitFor(() => {
      expect(resolveSpy).toHaveBeenCalledWith(
        'ALT-INT-001',
        'Elephant safely guided back into core reserve.',
        'Park Manager Silva'
      );
    });

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeBtn);
  });

  it('synchronizes all telemetry when National Park is switched', async () => {
    render(<WildlifeModule userPark="Yala National Park" userName="Park Manager Silva" />);

    const parkSelect = screen.getByRole('combobox', { name: /Select National Park/i });
    fireEvent.change(parkSelect, { target: { value: 'Wilpattu National Park' } });

    await waitFor(() => {
      expect(wildlifeService.getOverview).toHaveBeenCalledWith('Wilpattu National Park');
      expect(wildlifeService.getAnimals).toHaveBeenCalledWith({ park: 'Wilpattu National Park' });
      expect(wildlifeService.getZones).toHaveBeenCalledWith('Wilpattu National Park');
      expect(wildlifeService.getAlerts).toHaveBeenCalledWith({ park: 'Wilpattu National Park' });
    });
  });
});
