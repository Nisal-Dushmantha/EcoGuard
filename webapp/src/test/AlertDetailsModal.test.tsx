import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertDetailsModal } from '../components/monitoring/AlertDetailsModal';
import type { WildlifeAlert, CollaredAnimal } from '../types/wildlife';

const activeAlert: WildlifeAlert = {
  alertId: 'ALT-2026-001',
  collarId: 'COL-ELE-084',
  animalId: 'ELE-084',
  animalName: 'Gemunu (Tusker)',
  species: 'Asian Elephant',
  zoneId: 'ZONE-YALA-01',
  zoneName: 'Menik River Poaching Buffer',
  park: 'Yala National Park',
  severity: 'High Risk',
  status: 'Active',
  triggerReason: 'Animal breached active poaching buffer zone threshold.',
  triggeredAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  location: {
    latitude: 6.372,
    longitude: 81.528,
    sector: 'Menik River South',
  },
};

const acknowledgedAlert: WildlifeAlert = {
  ...activeAlert,
  alertId: 'ALT-2026-002',
  status: 'Acknowledged',
  acknowledgedBy: 'Nisal Dushmantha',
  acknowledgedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  managerNotes: 'Dispatched patrol squad to intercept.',
  dispatchedRangers: ['Sector Charlie Response Unit'],
};

const resolvedAlert: WildlifeAlert = {
  ...activeAlert,
  alertId: 'ALT-2026-003',
  status: 'Resolved',
  resolvedBy: 'Nisal Dushmantha',
  resolvedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  resolutionNotes: 'Elephant safely guided back into sanctuary.',
};

const mockAnimal: CollaredAnimal = {
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
  isInHighRiskZone: true,
  lastPingAt: new Date().toISOString(),
  locationHistory: [],
};

describe('AlertDetailsModal Component', () => {
  it('renders nothing when alert is null', () => {
    const { container } = render(
      <AlertDetailsModal
        alert={null}
        onClose={vi.fn()}
        onAcknowledge={vi.fn()}
        onResolve={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders alert details and animal telemetry accurately', () => {
    render(
      <AlertDetailsModal
        alert={activeAlert}
        animal={mockAnimal}
        onClose={vi.fn()}
        onAcknowledge={vi.fn()}
        onResolve={vi.fn()}
      />
    );

    expect(screen.getByText(/Alert Details & Incident Triage/i)).toBeInTheDocument();
    expect(screen.getByText(/Animal breached active poaching buffer/i)).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('4.8 km/h')).toBeInTheDocument();
  });

  it('handles acknowledge submission with custom notes and dispatched ranger unit', async () => {
    const handleAcknowledge = vi.fn().mockResolvedValue(undefined);
    render(
      <AlertDetailsModal
        alert={activeAlert}
        animal={mockAnimal}
        onClose={vi.fn()}
        onAcknowledge={handleAcknowledge}
        onResolve={vi.fn()}
      />
    );

    const notesTextarea = screen.getByPlaceholderText(/Enter management directives/i);
    fireEvent.change(notesTextarea, { target: { value: 'Directing ranger team to Sector C' } });

    const submitBtn = screen.getByRole('button', { name: /Acknowledge & Dispatch Rangers/i });
    fireEvent.click(submitBtn);

    expect(handleAcknowledge).toHaveBeenCalledWith(
      'ALT-2026-001',
      'Directing ranger team to Sector C',
      ['Sector Charlie Response Unit']
    );
  });

  it('handles resolve workflow when alert is acknowledged', async () => {
    const handleResolve = vi.fn().mockResolvedValue(undefined);
    render(
      <AlertDetailsModal
        alert={acknowledgedAlert}
        animal={mockAnimal}
        onClose={vi.fn()}
        onAcknowledge={vi.fn()}
        onResolve={handleResolve}
      />
    );

    expect(screen.getByText(/Acknowledged & Under Triage/i)).toBeInTheDocument();
    expect(screen.getByText(/Dispatched patrol squad to intercept/i)).toBeInTheDocument();

    const openResolveBtn = screen.getByRole('button', { name: /Resolve Incident/i });
    fireEvent.click(openResolveBtn);

    const resolveInput = screen.getByPlaceholderText(/Detail how the animal was returned to safe grounds/i);
    fireEvent.change(resolveInput, { target: { value: 'Herd successfully relocated.' } });

    const confirmResolveBtn = screen.getByRole('button', { name: /Confirm Resolution/i });
    fireEvent.click(confirmResolveBtn);

    expect(handleResolve).toHaveBeenCalledWith('ALT-2026-002', 'Herd successfully relocated.');
  });

  it('displays resolved state when alert status is Resolved', () => {
    render(
      <AlertDetailsModal
        alert={resolvedAlert}
        animal={mockAnimal}
        onClose={vi.fn()}
        onAcknowledge={vi.fn()}
        onResolve={vi.fn()}
      />
    );

    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getByText(/Elephant safely guided back into sanctuary/i)).toBeInTheDocument();
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <AlertDetailsModal
        alert={activeAlert}
        animal={mockAnimal}
        onClose={handleClose}
        onAcknowledge={vi.fn()}
        onResolve={vi.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
