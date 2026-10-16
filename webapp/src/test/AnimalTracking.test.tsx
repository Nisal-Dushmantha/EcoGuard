import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnimalTracking } from '../components/monitoring/AnimalTracking';
import type { CollaredAnimal } from '../types/wildlife';

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
      altitude: 42,
      timestamp: new Date().toISOString(),
      speedKmh: 4.8,
      heading: 120,
    },
    batteryLevel: 88,
    signalStrength: 'Strong',
    status: 'High Risk',
    currentZoneId: 'ZONE-YALA-01',
    currentZoneName: 'Menik River Poaching Buffer',
    isInHighRiskZone: true,
    lastPingAt: new Date().toISOString(),
    locationHistory: [
      {
        latitude: 6.37,
        longitude: 81.52,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        speedKmh: 3.2,
      },
    ],
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
      altitude: 35,
      timestamp: new Date().toISOString(),
      speedKmh: 1.2,
      heading: 45,
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
  {
    collarId: 'COL-BEAR-005',
    animalId: 'BEAR-005',
    name: 'Balu',
    species: 'Sloth Bear',
    sex: 'Male',
    ageYears: 9,
    weightKg: 110,
    park: 'Wilpattu National Park',
    currentLocation: {
      latitude: 8.45,
      longitude: 80.02,
      altitude: 20,
      timestamp: new Date().toISOString(),
      speedKmh: 0.5,
      heading: 90,
    },
    batteryLevel: 75,
    signalStrength: 'Moderate',
    status: 'Safe',
    currentZoneId: 'ZONE-WILP-02',
    currentZoneName: 'Kala Oya Basin',
    isInHighRiskZone: false,
    lastPingAt: new Date().toISOString(),
    locationHistory: [],
  },
];

describe('AnimalTracking Component', () => {
  it('renders collar tracking cards for animals', () => {
    render(
      <AnimalTracking
        animals={mockAnimals}
        selectedPark="All Parks"
      />
    );

    expect(screen.getByText('Gemunu (Tusker)')).toBeInTheDocument();
    expect(screen.getByText('Kalu (Panther)')).toBeInTheDocument();
    expect(screen.getByText('Balu')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('24%')).toBeInTheDocument();
  });

  it('filters animals by park', () => {
    render(
      <AnimalTracking
        animals={mockAnimals}
        selectedPark="Wilpattu National Park"
      />
    );

    expect(screen.getByText('Balu')).toBeInTheDocument();
    expect(screen.queryByText('Gemunu (Tusker)')).not.toBeInTheDocument();
  });

  it('filters animals by search query', () => {
    render(
      <AnimalTracking
        animals={mockAnimals}
        selectedPark="All Parks"
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search collared wildlife by name/i);
    fireEvent.change(searchInput, { target: { value: 'Kalu' } });

    expect(screen.getByText('Kalu (Panther)')).toBeInTheDocument();
    expect(screen.queryByText('Gemunu (Tusker)')).not.toBeInTheDocument();
  });

  it('filters animals by species select dropdown', () => {
    const { container } = render(
      <AnimalTracking
        animals={mockAnimals}
        selectedPark="All Parks"
      />
    );

    const speciesSelect = container.querySelectorAll('select.filter-select')[0];
    fireEvent.change(speciesSelect, { target: { value: 'Asian Elephant' } });

    expect(screen.getByText('Gemunu (Tusker)')).toBeInTheDocument();
    expect(screen.queryByText('Kalu (Panther)')).not.toBeInTheDocument();
  });

  it('filters animals by risk status', () => {
    const { container } = render(
      <AnimalTracking
        animals={mockAnimals}
        selectedPark="All Parks"
      />
    );

    const statusSelect = container.querySelectorAll('select.filter-select')[1];
    fireEvent.change(statusSelect, { target: { value: 'High Risk' } });

    expect(screen.getByText('Gemunu (Tusker)')).toBeInTheDocument();
    expect(screen.queryByText('Kalu (Panther)')).not.toBeInTheDocument();
  });

  it('opens animal dossier modal when "Details" is clicked', () => {
    render(
      <AnimalTracking
        animals={mockAnimals}
        selectedPark="All Parks"
      />
    );

    const detailsButtons = screen.getAllByRole('button', { name: /Details/i });
    fireEvent.click(detailsButtons[0]);

    expect(screen.getByText(/Collared Wildlife Dossier — Gemunu \(Tusker\)/i)).toBeInTheDocument();
    expect(screen.getByText(/VHF\/GPS Collar Diagnostics/i)).toBeInTheDocument();
    expect(screen.getByText('COL-ELE-084')).toBeInTheDocument();
  });

  it('calls onSelectAnimalForMap callback when "Locate" button is clicked', () => {
    const handleLocate = vi.fn();
    render(
      <AnimalTracking
        animals={mockAnimals}
        selectedPark="All Parks"
        onSelectAnimalForMap={handleLocate}
      />
    );

    const locateButtons = screen.getAllByRole('button', { name: /Locate/i });
    fireEvent.click(locateButtons[0]);

    expect(handleLocate).toHaveBeenCalledWith(mockAnimals[0]);
  });
});
