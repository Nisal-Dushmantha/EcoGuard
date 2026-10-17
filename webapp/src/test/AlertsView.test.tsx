import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertsView } from '../components/monitoring/AlertsView';
import type { WildlifeAlert } from '../types/wildlife';

const mockAlerts: WildlifeAlert[] = [
  {
    alertId: 'ALT-2026-001',
    collarId: 'COL-ELE-084',
    animalId: 'ELE-084',
    animalName: 'Gemunu',
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
    },
  },
  {
    alertId: 'ALT-BAT-002',
    collarId: 'COL-LEO-012',
    animalId: 'LEO-012',
    animalName: 'Kalu (Panther)',
    species: 'Sri Lankan Leopard',
    zoneId: 'ZONE-YALA-04',
    zoneName: 'Block I Core Nature Reserve',
    park: 'Yala National Park',
    severity: 'Warning',
    status: 'Acknowledged',
    triggerReason: 'Collar battery dropped critically below 25%',
    triggeredAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    location: {
      latitude: 6.335,
      longitude: 81.455,
    },
  },
  {
    alertId: 'ALT-2026-003',
    collarId: 'COL-ELE-102',
    animalId: 'ELE-102',
    animalName: 'Bhanu',
    species: 'Asian Elephant',
    zoneId: 'ZONE-WILP-01',
    zoneName: 'Wilpattu West Buffer',
    park: 'Wilpattu National Park',
    severity: 'High Risk',
    status: 'Resolved',
    triggerReason: 'Elephant crossed highway perimeter.',
    triggeredAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    location: {
      latitude: 8.42,
      longitude: 80.05,
    },
  },
];

describe('AlertsView Component', () => {
  it('renders list of alerts accurately', () => {
    const handleSelect = vi.fn();
    render(
      <AlertsView
        alerts={mockAlerts}
        selectedPark="All Parks"
        onSelectAlert={handleSelect}
      />
    );

    expect(screen.getByText('ALT-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Gemunu')).toBeInTheDocument();
    expect(screen.getByText('ALT-BAT-002')).toBeInTheDocument();
    expect(screen.getByText('Kalu (Panther)')).toBeInTheDocument();
  });

  it('filters alerts when park is selected', () => {
    render(
      <AlertsView
        alerts={mockAlerts}
        selectedPark="Wilpattu National Park"
        onSelectAlert={vi.fn()}
      />
    );

    expect(screen.getByText('ALT-2026-003')).toBeInTheDocument();
    expect(screen.queryByText('ALT-2026-001')).not.toBeInTheDocument();
  });

  it('filters alerts by search term', () => {
    render(
      <AlertsView
        alerts={mockAlerts}
        selectedPark="All Parks"
        onSelectAlert={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search alerts by ID/i);
    fireEvent.change(searchInput, { target: { value: 'Kalu' } });

    expect(screen.getByText('ALT-BAT-002')).toBeInTheDocument();
    expect(screen.queryByText('ALT-2026-001')).not.toBeInTheDocument();
  });

  it('filters alerts by status', () => {
    const { container } = render(
      <AlertsView
        alerts={mockAlerts}
        selectedPark="All Parks"
        onSelectAlert={vi.fn()}
      />
    );

    const statusSelect = container.querySelectorAll('select.filter-select')[1];
    fireEvent.change(statusSelect, { target: { value: 'Active' } });

    expect(screen.getByText('ALT-2026-001')).toBeInTheDocument();
    expect(screen.queryByText('ALT-BAT-002')).not.toBeInTheDocument();
  });

  it('triggers onSelectAlert when "Triage" button is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <AlertsView
        alerts={mockAlerts}
        selectedPark="All Parks"
        onSelectAlert={handleSelect}
      />
    );

    const detailsButtons = screen.getAllByRole('button', { name: /Triage/i });
    fireEvent.click(detailsButtons[0]);

    expect(handleSelect).toHaveBeenCalledWith(mockAlerts[0]);
  });

  it('triggers onAcknowledgeAlert when "Ack" button is clicked on active alert', () => {
    const handleAcknowledge = vi.fn();
    render(
      <AlertsView
        alerts={mockAlerts}
        selectedPark="All Parks"
        onSelectAlert={vi.fn()}
        onAcknowledgeAlert={handleAcknowledge}
      />
    );

    const ackButton = screen.getByRole('button', { name: /Ack/i });
    fireEvent.click(ackButton);

    expect(handleAcknowledge).toHaveBeenCalledWith('ALT-2026-001');
  });
});
