import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WildlifeModule } from '../../components/monitoring/WildlifeModule';
import { wildlifeService } from '../../services/wildlifeService';
import type { CollaredAnimal, RiskZone, WildlifeAlert } from '../../types/wildlife';

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
    name: 'Kalu (Panther)',
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
    batteryLevel: 24,
    signalStrength: 'Moderate',
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
    name: 'Block I Core Nature Reserve',
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
    alertId: 'ALT-INT-002',
    collarId: 'COL-LEO-012',
    animalId: 'LEO-012',
    animalName: 'Kalu (Panther)',
    species: 'Sri Lankan Leopard',
    zoneId: 'ZONE-YALA-04',
    zoneName: 'Block I Core Nature Reserve',
    park: 'Yala National Park',
    severity: 'Warning',
    status: 'Active',
    triggerReason: 'Collar battery level critically low (24%)',
    triggeredAt: new Date().toISOString(),
    location: {
      latitude: 6.335,
      longitude: 81.455,
    },
  },
];

describe('Collar Tracking & Spatial Telemetry Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(wildlifeService, 'getOverview').mockResolvedValue({
      park: 'Yala National Park',
      totalCollared: 2,
      animalsInHighRisk: 1,
      animalsSafe: 1,
      animalsWarning: 0,
      lowBatteryCollars: 1,
      activeAlertsCount: 1,
      acknowledgedAlertsCount: 0,
      resolvedAlertsCount: 0,
      speciesBreakdown: { 'Asian Elephant': 1, 'Sri Lankan Leopard': 1 },
      zonesCount: 2,
      highRiskZonesCount: 1,
      normalZonesCount: 1,
      recentUpdates: [],
      lastTelemetrySync: new Date().toISOString(),
    });
    vi.spyOn(wildlifeService, 'getAnimals').mockResolvedValue(mockAnimals);
    vi.spyOn(wildlifeService, 'getZones').mockResolvedValue(mockZones);
    vi.spyOn(wildlifeService, 'getAlerts').mockResolvedValue(mockAlerts);
  });

  it('routes to Live Map when locating an animal from Animal Tracking view', async () => {
    render(<WildlifeModule userPark="Yala National Park" userName="Park Manager Silva" />);

    // Switch to Animal Tracking tab
    const trackingTab = screen.getByRole('button', { name: /Animal Tracking/i });
    fireEvent.click(trackingTab);

    // Locate Gemunu
    await waitFor(() => {
      expect(screen.getByText('Gemunu (Tusker)')).toBeInTheDocument();
    });

    const locateButtons = screen.getAllByRole('button', { name: /Locate/i });
    fireEvent.click(locateButtons[0]);

    // Should switch tab to Live Map and display spatial telemetry
    await waitFor(() => {
      expect(screen.getByText(/Live Radar Telemetry/i)).toBeInTheDocument();
    });
  });

  it('integrates Risk Zone view and shows live collared animals inside the sector', async () => {
    render(<WildlifeModule userPark="Yala National Park" userName="Park Manager Silva" />);

    // Switch to Risk Zones tab
    const zonesTab = screen.getByRole('button', { name: /Risk Zones/i });
    fireEvent.click(zonesTab);

    await waitFor(() => {
      expect(screen.getByText('Menik River Poaching Buffer')).toBeInTheDocument();
      // Verifies that Gemunu is detected inside the Menik River sector
      expect(screen.getByText('Gemunu (Tusker) (Asian Elephant)')).toBeInTheDocument();
      expect(screen.getByText('Kalu (Panther) (Sri Lankan Leopard)')).toBeInTheDocument();
    });
  });

  it('integrates quick-acknowledgement on alerts table opening triage modal to confirm dispatch', async () => {
    const ackSpy = vi.spyOn(wildlifeService, 'acknowledgeAlert').mockResolvedValue({
      ...mockAlerts[0],
      status: 'Acknowledged',
      acknowledgedBy: 'Park Manager Silva',
      acknowledgedAt: new Date().toISOString(),
    });

    render(<WildlifeModule userPark="Yala National Park" userName="Park Manager Silva" />);

    // Switch to Alerts tab
    const alertsTab = screen.getByRole('button', { name: /Geofence Alerts/i });
    fireEvent.click(alertsTab);

    await waitFor(() => {
      expect(screen.getByText('ALT-INT-002')).toBeInTheDocument();
    });

    // Click Fast Acknowledge ('Ack') button -> opens Triage Modal
    const ackBtn = screen.getByTitle('Fast Acknowledge');
    fireEvent.click(ackBtn);

    await waitFor(() => {
      expect(screen.getByText(/Collar Battery Alert & Maintenance Triage/i)).toBeInTheDocument();
    });

    // Confirm acknowledgement in modal
    const submitAckBtn = screen.getByRole('button', { name: /Acknowledge & Dispatch Rangers/i });
    fireEvent.click(submitAckBtn);

    await waitFor(() => {
      expect(ackSpy).toHaveBeenCalledWith(
        'ALT-INT-002',
        expect.any(String),
        'Park Manager Silva',
        expect.any(Array)
      );
    });
  });
});
