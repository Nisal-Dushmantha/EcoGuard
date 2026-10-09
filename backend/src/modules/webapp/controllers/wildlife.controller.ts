import { Request, Response } from 'express';
import { wildlifeService } from '../services/wildlife.service.js';

export const getMonitoringOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const park = req.query.park as string | undefined;
    const data = await wildlifeService.getMonitoringOverview(park);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching monitoring overview:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch monitoring overview' });
  }
};

export const getAnimals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { park, species, status, search } = req.query;
    const animals = await wildlifeService.getAnimals({
      park: park as string,
      species: species as string,
      status: status as string,
      search: search as string,
    });
    res.json({ success: true, count: animals.length, data: animals });
  } catch (error: any) {
    console.error('Error fetching collared animals:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch collared animals' });
  }
};

export const getAnimalById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const animal = await wildlifeService.getAnimalById(id);
    if (!animal) {
      res.status(404).json({ success: false, error: 'Animal not found' });
      return;
    }
    res.json({ success: true, data: animal });
  } catch (error: any) {
    console.error('Error fetching animal details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch animal details' });
  }
};

export const getRiskZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const park = req.query.park as string | undefined;
    const zones = await wildlifeService.getRiskZones(park);
    res.json({ success: true, count: zones.length, data: zones });
  } catch (error: any) {
    console.error('Error fetching risk zones:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch risk zones' });
  }
};

export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { park, status, severity, search } = req.query;
    const alerts = await wildlifeService.getAlerts({
      park: park as string,
      status: status as string,
      severity: severity as string,
      search: search as string,
    });
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error: any) {
    console.error('Error fetching wildlife alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch wildlife alerts' });
  }
};

export const getAlertById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const alert = await wildlifeService.getAlertById(id);
    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }
    res.json({ success: true, data: alert });
  } catch (error: any) {
    console.error('Error fetching alert details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch alert details' });
  }
};

export const acknowledgeAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { managerName, managerNotes, dispatchedRangers } = req.body;
    const alert = await wildlifeService.acknowledgeAlert(
      id,
      managerName || (req as any).user?.name || 'Park Manager',
      managerNotes,
      dispatchedRangers
    );
    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }
    res.json({ success: true, message: 'Alert acknowledged successfully', data: alert });
  } catch (error: any) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ success: false, error: 'Failed to acknowledge alert' });
  }
};

export const resolveAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { managerName, resolutionNotes } = req.body;
    const alert = await wildlifeService.resolveAlert(
      id,
      managerName || (req as any).user?.name || 'Park Manager',
      resolutionNotes
    );
    if (!alert) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }
    res.json({ success: true, message: 'Alert resolved successfully', data: alert });
  } catch (error: any) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve alert' });
  }
};

export const simulatePing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { collarId, deltaLat, deltaLng } = req.body;
    const animal = await wildlifeService.simulateCollarPing(collarId, deltaLat, deltaLng);
    if (!animal) {
      res.status(404).json({ success: false, error: 'Animal/Collar not found' });
      return;
    }
    res.json({ success: true, message: 'Collar telemetry updated', data: animal });
  } catch (error: any) {
    console.error('Error simulating ping:', error);
    res.status(500).json({ success: false, error: 'Failed to simulate ping' });
  }
};
