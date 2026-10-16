import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RiskZonesView } from '../components/monitoring/RiskZonesView';
import type { RiskZone, CollaredAnimal } from '../types/wildlife';

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
];

describe('RiskZonesView Component', () => {
  it('renders risk zones and calculates active wildlife inside', () => {
    render(
      <RiskZonesView
        zones={mockZones}
        animals={mockAnimals}
        selectedPark="All Parks"
      />
    );

    expect(screen.getByText('Menik River Poaching Buffer')).toBeInTheDocument();
    expect(screen.getByText('Block I Core Sanctuary')).toBeInTheDocument();
    expect(screen.getByText('Immediate drone reconnaissance and dispatch Sector Charlie patrol.')).toBeInTheDocument();
    expect(screen.getByText('Gemunu (Tusker) (Asian Elephant)')).toBeInTheDocument();
  });

  it('filters zones by risk level', () => {
    render(
      <RiskZonesView
        zones={mockZones}
        animals={mockAnimals}
        selectedPark="All Parks"
      />
    );

    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'High Risk' } });

    expect(screen.getByText('Menik River Poaching Buffer')).toBeInTheDocument();
    expect(screen.queryByText('Block I Core Sanctuary')).not.toBeInTheDocument();
  });

  it('calls onFocusZoneOnMap when map focus button is clicked', () => {
    const handleFocus = vi.fn();
    render(
      <RiskZonesView
        zones={mockZones}
        animals={mockAnimals}
        selectedPark="All Parks"
        onFocusZoneOnMap={handleFocus}
      />
    );

    const mapButtons = screen.getAllByRole('button', { name: /View Boundary on Live Map/i });
    fireEvent.click(mapButtons[0]);

    expect(handleFocus).toHaveBeenCalledWith(mockZones[0]);
  });
});
