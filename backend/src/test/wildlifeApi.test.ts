import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';

describe('Wildlife Monitoring & Alerts Backend API Tests', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  describe('GET /api/webapp/monitoring/overview', () => {
    it('returns telemetry overview with status 200', async () => {
      const res = await request(app).get('/api/webapp/monitoring/overview');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('totalCollared');
      expect(res.body.data).toHaveProperty('animalsInHighRisk');
      expect(res.body.data).toHaveProperty('animalsSafe');
      expect(res.body.data).toHaveProperty('speciesBreakdown');
      expect(res.body.data).toHaveProperty('zonesCount');
    });

    it('filters telemetry overview by park name', async () => {
      const res = await request(app)
        .get('/api/webapp/monitoring/overview')
        .query({ park: 'Yala National Park' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.park).toBe('Yala National Park');
    });
  });

  describe('GET /api/webapp/monitoring/animals', () => {
    it('returns list of collared animals with count', async () => {
      const res = await request(app).get('/api/webapp/monitoring/animals');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('collarId');
      expect(res.body.data[0]).toHaveProperty('currentLocation');
    });

    it('filters animals by search query', async () => {
      const res = await request(app)
        .get('/api/webapp/monitoring/animals')
        .query({ search: 'Gemunu' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain('Gemunu');
    });

    it('filters animals by species and status', async () => {
      const res = await request(app)
        .get('/api/webapp/monitoring/animals')
        .query({ species: 'Asian Elephant', status: 'High Risk' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.forEach((animal: any) => {
        expect(animal.species).toBe('Asian Elephant');
        expect(animal.status).toBe('High Risk');
      });
    });
  });

  describe('GET /api/webapp/monitoring/animals/:id', () => {
    it('fetches single animal by collar ID', async () => {
      const res = await request(app).get('/api/webapp/monitoring/animals/COL-ELE-084');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.collarId).toBe('COL-ELE-084');
      expect(res.body.data.name).toContain('Gemunu');
    });

    it('returns 404 for non-existent collar ID', async () => {
      const res = await request(app).get('/api/webapp/monitoring/animals/NON-EXISTENT-COLLAR');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('error', 'Animal not found');
    });
  });

  describe('GET /api/webapp/monitoring/zones', () => {
    it('returns risk zones list', async () => {
      const res = await request(app).get('/api/webapp/monitoring/zones');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('zoneId');
      expect(res.body.data[0]).toHaveProperty('riskLevel');
      expect(res.body.data[0]).toHaveProperty('recommendedSOP');
    });

    it('filters risk zones by park', async () => {
      const res = await request(app)
        .get('/api/webapp/monitoring/zones')
        .query({ park: 'Yala National Park' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.forEach((zone: any) => {
        expect(zone.park).toBe('Yala National Park');
      });
    });
  });

  describe('GET /api/webapp/monitoring/alerts', () => {
    it('returns active and historical wildlife alerts', async () => {
      const res = await request(app).get('/api/webapp/monitoring/alerts');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('alertId');
      expect(res.body.data[0]).toHaveProperty('severity');
    });

    it('filters alerts by status and severity', async () => {
      const res = await request(app)
        .get('/api/webapp/monitoring/alerts')
        .query({ severity: 'High Risk' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      res.body.data.forEach((alert: any) => {
        expect(alert.severity).toBe('High Risk');
      });
    });
  });

  describe('GET /api/webapp/monitoring/alerts/:id', () => {
    it('returns alert details for existing alert ID', async () => {
      const res = await request(app).get('/api/webapp/monitoring/alerts/ALT-2026-0941');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.alertId).toBe('ALT-2026-0941');
    });

    it('returns 404 for invalid alert ID', async () => {
      const res = await request(app).get('/api/webapp/monitoring/alerts/ALT-INVALID-999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/webapp/monitoring/alerts/:id/acknowledge & resolve', () => {
    it('acknowledges an active alert with manager notes and dispatched squad', async () => {
      const res = await request(app)
        .post('/api/webapp/monitoring/alerts/ALT-2026-0941/acknowledge')
        .send({
          managerNotes: 'Directing drone reconnaissance squad',
          managerName: 'Nisal Dushmantha',
          dispatchedRangers: ['Sector Charlie Rapid Response Unit'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Acknowledged');
      expect(res.body.data.acknowledgedBy).toBe('Nisal Dushmantha');
      expect(res.body.data.managerNotes).toBe('Directing drone reconnaissance squad');
    });

    it('resolves an alert with resolution notes', async () => {
      const res = await request(app)
        .post('/api/webapp/monitoring/alerts/ALT-2026-0941/resolve')
        .send({
          resolutionNotes: 'Elephant safely guided back into core reserve.',
          managerName: 'Nisal Dushmantha',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Resolved');
      expect(res.body.data.resolvedBy).toBe('Nisal Dushmantha');
      expect(res.body.data.resolutionNotes).toBe('Elephant safely guided back into core reserve.');
    });
  });

  describe('POST /api/webapp/monitoring/simulate-ping', () => {
    it('simulates live collar GPS telemetry ping', async () => {
      const res = await request(app)
        .post('/api/webapp/monitoring/simulate-ping')
        .send({ collarId: 'COL-ELE-084' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.collarId).toBe('COL-ELE-084');
      expect(res.body.data.currentLocation).toHaveProperty('latitude');
      expect(res.body.data.currentLocation).toHaveProperty('longitude');
      expect(res.body.data.currentLocation).toHaveProperty('timestamp');
    });

    it('returns 404 error for ping on unknown collar', async () => {
      const res = await request(app)
        .post('/api/webapp/monitoring/simulate-ping')
        .send({ collarId: 'COL-UNKNOWN-999' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
