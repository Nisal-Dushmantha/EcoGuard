import mongoose from 'mongoose';
import Incident, { IIncident, IncidentType } from '../../../models/Incident.model.js';

export interface CreateIncidentDTO {
  rangerId: string;
  rangerName?: string;
  incidentType: IncidentType;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    addressSummary?: string;
  };
  description: string;
  photoUrl?: string;
  reportedAt?: string | Date;
  syncSource?: 'online' | 'offline_sync';
  clientReferenceId: string;
}

// In-memory store for fallback/tests/offline MongoDB environments
const localIncidentCache: Map<string, any> = new Map();

// Generate sequential readable incident ID
const generateIncidentId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `INC-${year}-${randomSuffix}`;
};

export class IncidentService {
  /**
   * Create an incident with strict idempotency check via clientReferenceId
   */
  static async createIncident(data: CreateIncidentDTO): Promise<{ incident: any; isDuplicate: boolean }> {
    const isDbConnected = mongoose.connection.readyState === 1;

    // Check DB or cache for existing clientReferenceId (Idempotency)
    if (isDbConnected) {
      const existing = await Incident.findOne({ clientReferenceId: data.clientReferenceId });
      if (existing) {
        return { incident: existing.toObject(), isDuplicate: true };
      }
    } else {
      const cached = localIncidentCache.get(data.clientReferenceId);
      if (cached) {
        return { incident: cached, isDuplicate: true };
      }
    }

    const incidentId = await generateIncidentId();
    const reportedDate = data.reportedAt ? new Date(data.reportedAt) : new Date();

    const incidentData = {
      incidentId,
      rangerId: data.rangerId,
      rangerName: data.rangerName || 'Field Ranger',
      incidentType: data.incidentType,
      location: {
        latitude: Number(data.location.latitude),
        longitude: Number(data.location.longitude),
        accuracy: Number(data.location.accuracy || 0),
        addressSummary: data.location.addressSummary || '',
      },
      description: data.description.trim(),
      photoUrl: data.photoUrl || '',
      reportedAt: reportedDate,
      syncSource: data.syncSource || 'online',
      clientReferenceId: data.clientReferenceId,
      status: 'Reported',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isDbConnected) {
      const doc = await Incident.create(incidentData);
      localIncidentCache.set(data.clientReferenceId, doc.toObject());
      return { incident: doc.toObject(), isDuplicate: false };
    } else {
      // In-memory persistent cache fallback
      localIncidentCache.set(data.clientReferenceId, incidentData);
      return { incident: incidentData, isDuplicate: false };
    }
  }

  /**
   * Retrieve all incidents for a specific ranger
   */
  static async getRangerIncidents(rangerId: string): Promise<any[]> {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const incidents = await Incident.find({ rangerId }).sort({ reportedAt: -1 }).lean();
      return incidents;
    } else {
      const cached = Array.from(localIncidentCache.values())
        .filter((item) => item.rangerId === rangerId)
        .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
      return cached;
    }
  }

  /**
   * Get single incident by human-readable incidentId or MongoDB ID
   */
  static async getIncidentById(incidentId: string): Promise<any | null> {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      let query: any = { incidentId };
      if (mongoose.Types.ObjectId.isValid(incidentId)) {
        query = { $or: [{ _id: incidentId }, { incidentId }] };
      }
      return await Incident.findOne(query).lean();
    } else {
      const cached = Array.from(localIncidentCache.values()).find(
        (item) => item.incidentId === incidentId || item.clientReferenceId === incidentId
      );
      return cached || null;
    }
  }

  /**
   * Process a batch of pending incidents during sync
   */
  static async syncIncidents(batch: CreateIncidentDTO[]): Promise<{
    synced: any[];
    duplicates: any[];
    errors: { clientReferenceId: string; error: string }[];
  }> {
    const synced: any[] = [];
    const duplicates: any[] = [];
    const errors: { clientReferenceId: string; error: string }[] = [];

    for (const item of batch) {
      try {
        const result = await this.createIncident({
          ...item,
          syncSource: 'offline_sync',
        });
        if (result.isDuplicate) {
          duplicates.push(result.incident);
        } else {
          synced.push(result.incident);
        }
      } catch (err: any) {
        errors.push({
          clientReferenceId: item.clientReferenceId,
          error: err.message || 'Failed to sync incident',
        });
      }
    }

    return { synced, duplicates, errors };
  }
}
