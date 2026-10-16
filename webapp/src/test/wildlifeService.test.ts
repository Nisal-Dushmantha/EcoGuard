import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wildlifeService } from '../services/wildlifeService';
import { api } from '../services/api';

describe('wildlifeService Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getOverview', () => {
    it('returns telemetry overview with fallback data when API fails or is offline', async () => {
      vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network error'));

      const overview = await wildlifeService.getOverview('Yala National Park');
      expect(overview).toBeDefined();
      expect(overview.totalCollared).toBeGreaterThan(0);
      expect(overview.speciesBreakdown).toBeDefined();
      expect(overview.activeAlertsCount).toBeGreaterThanOrEqual(0);
      expect(overview.park).toBe('Yala National Park');
    });

    it('returns API data when API request succeeds', async () => {
      const mockData = {
        park: 'Yala National Park',
        totalCollared: 15,
        animalsInHighRisk: 3,
        animalsSafe: 10,
        animalsWarning: 2,
        lowBatteryCollars: 1,
        activeAlertsCount: 2,
        acknowledgedAlertsCount: 1,
        resolvedAlertsCount: 4,
        speciesBreakdown: { 'Asian Elephant': 10, 'Sri Lankan Leopard': 5 },
        zonesCount: 4,
        highRiskZonesCount: 2,
        normalZonesCount: 2,
        recentUpdates: [],
        lastTelemetrySync: new Date().toISOString(),
      };

      vi.spyOn(api, 'get').mockResolvedValueOnce({
        data: mockData,
        status: 200,
        headers: new Headers(),
      });

      const overview = await wildlifeService.getOverview('Yala National Park');
      expect(overview).toEqual(mockData);
    });
  });

  describe('getAnimals', () => {
    it('filters fallback animals by search keyword', async () => {
      vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network error'));

      const animals = await wildlifeService.getAnimals({ search: 'Gemunu' });
      expect(animals.length).toBeGreaterThan(0);
      expect(animals.every((a) => a.name.includes('Gemunu') || a.animalId.includes('Gemunu'))).toBe(true);
    });

    it('filters fallback animals by species', async () => {
      vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network error'));

      const animals = await wildlifeService.getAnimals({ species: 'Asian Elephant' });
      expect(animals.length).toBeGreaterThan(0);
      expect(animals.every((a) => a.species === 'Asian Elephant')).toBe(true);
    });

    it('filters fallback animals by status', async () => {
      vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network error'));

      const highRiskAnimals = await wildlifeService.getAnimals({ status: 'High Risk' });
      expect(highRiskAnimals.every((a) => a.status === 'High Risk')).toBe(true);
    });
  });

  describe('getAnimalById', () => {
    it('finds animal by collarId or animalId', async () => {
      vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network error'));

      const animal = await wildlifeService.getAnimalById('COL-ELE-084');
      expect(animal).not.toBeNull();
      expect(animal?.name).toContain('Gemunu');
    });

    it('returns null for non-existent animal id', async () => {
      vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network error'));

      const animal = await wildlifeService.getAnimalById('NON-EXISTENT-ID');
      expect(animal).toBeNull();
    });
  });

  describe('getZones', () => {
    it('returns risk zones list for park', async () => {
      vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network error'));

      const zones = await wildlifeService.getZones('Yala National Park');
      expect(zones.length).toBeGreaterThan(0);
      expect(zones[0]).toHaveProperty('zoneId');
      expect(zones[0]).toHaveProperty('riskLevel');
      expect(zones[0]).toHaveProperty('recommendedSOP');
    });
  });

  describe('Alerts Workflow (getAlerts, acknowledgeAlert, resolveAlert)', () => {
    it('filters alerts by status', async () => {
      vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network error'));

      const activeAlerts = await wildlifeService.getAlerts({ status: 'Active' });
      expect(activeAlerts.every((a) => a.status === 'Active')).toBe(true);
    });

    it('acknowledges an alert and updates status with notes and dispatched unit', async () => {
      vi.spyOn(api, 'post').mockRejectedValueOnce(new Error('Fallback test'));

      const updated = await wildlifeService.acknowledgeAlert(
        'ALT-2026-0941',
        'Deploying rapid response team immediately.',
        'Warden Silva',
        ['Sector Charlie Unit']
      );

      expect(updated.status).toBe('Acknowledged');
      expect(updated.acknowledgedBy).toBe('Warden Silva');
      expect(updated.managerNotes).toBe('Deploying rapid response team immediately.');
      expect(updated.dispatchedRangers).toContain('Sector Charlie Unit');
    });

    it('resolves an alert with resolution notes', async () => {
      vi.spyOn(api, 'post').mockRejectedValueOnce(new Error('Fallback test'));

      const resolved = await wildlifeService.resolveAlert(
        'ALT-2026-0941',
        'Animal guided safely back into core reserve.',
        'Warden Silva'
      );

      expect(resolved.status).toBe('Resolved');
      expect(resolved.resolvedBy).toBe('Warden Silva');
      expect(resolved.resolutionNotes).toBe('Animal guided safely back into core reserve.');
    });
  });

  describe('simulatePing', () => {
    it('simulates GPS ping update on existing collar', async () => {
      vi.spyOn(api, 'post').mockRejectedValueOnce(new Error('Fallback test'));

      const updatedAnimal = await wildlifeService.simulatePing('COL-ELE-084');
      expect(updatedAnimal).toBeDefined();
      expect(updatedAnimal.collarId).toBe('COL-ELE-084');
      expect(updatedAnimal.currentLocation.timestamp).toBeDefined();
    });

    it('throws error when simulating ping for invalid collar id', async () => {
      vi.spyOn(api, 'post').mockRejectedValueOnce(new Error('Fallback test'));

      await expect(wildlifeService.simulatePing('INVALID-COLLAR-ID')).rejects.toThrow('Animal not found');
    });
  });
});
