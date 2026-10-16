import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WildlifeModule } from '../components/monitoring/WildlifeModule';
import { wildlifeService } from '../services/wildlifeService';

describe('WildlifeModule Integration Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders module header and default dashboard tab', async () => {
    render(<WildlifeModule userPark="Yala National Park" userName="Test Warden" />);

    expect(screen.getByText(/Park Manager Wildlife Operations Center/i)).toBeInTheDocument();
    expect(screen.getByText('Monitoring Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Animal Tracking')).toBeInTheDocument();
    expect(screen.getByText('Risk Zones')).toBeInTheDocument();
    expect(screen.getByText('Geofence Alerts')).toBeInTheDocument();
  });

  it('switches between tabs when tab buttons are clicked', async () => {
    render(<WildlifeModule userPark="Yala National Park" userName="Test Warden" />);

    // Switch to Animal Tracking tab
    const trackingTab = screen.getByRole('button', { name: /Animal Tracking/i });
    fireEvent.click(trackingTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search collared wildlife by name/i)).toBeInTheDocument();
    });

    // Switch to Risk Zones tab
    const zonesTab = screen.getByRole('button', { name: /Risk Zones/i });
    fireEvent.click(zonesTab);

    await waitFor(() => {
      expect(screen.getByText(/Park Geofence Zones & Threat Classifications/i)).toBeInTheDocument();
    });

    // Switch to Alerts tab
    const alertsTab = screen.getByRole('button', { name: /Geofence Alerts/i });
    fireEvent.click(alertsTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search alerts by ID/i)).toBeInTheDocument();
    });
  });

  it('triggers data reload when park selection changes', async () => {
    const getOverviewSpy = vi.spyOn(wildlifeService, 'getOverview');
    render(<WildlifeModule userPark="Yala National Park" userName="Test Warden" />);

    const parkSelect = screen.getByRole('combobox', { name: /Select National Park/i });
    fireEvent.change(parkSelect, { target: { value: 'Wilpattu National Park' } });

    await waitFor(() => {
      expect(getOverviewSpy).toHaveBeenCalledWith('Wilpattu National Park');
    });
  });
});
