import { IncidentType } from '../constants/incidentTypes';
import { SyncStatus } from '../constants/syncStatus';

export interface IncidentLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  addressSummary?: string;
}

export interface LocalIncidentRecord {
  localId: string;
  backendId?: string;
  rangerId: string;
  rangerName?: string;
  incidentType: IncidentType;
  latitude: number;
  longitude: number;
  accuracy?: number;
  addressSummary?: string;
  description: string;
  photoUri?: string;
  photoBase64?: string;
  reportedAt: string;
  syncStatus: SyncStatus;
  syncAttempts: number;
  lastSyncError?: string;
  createdAt: string;
  updatedAt: string;
  clientReferenceId: string;
}

export interface CreateIncidentFormValues {
  incidentType: IncidentType | '';
  location: IncidentLocation | null;
  photoUri: string | null;
  photoBase64?: string | null;
  description: string;
}

export interface RangerUser {
  rangerId: string;
  name: string;
  email: string;
  role: 'Ranger';
  assignedPark: string;
  badgeNumber?: string;
  token?: string;
}

export interface RangerAlert {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  read: boolean;
  type: 'risk' | 'incident_ack' | 'sync_warning' | 'status_update';
}
