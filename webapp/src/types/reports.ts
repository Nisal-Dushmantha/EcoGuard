export type ReportSectionType =
  | 'incidentStatistics'
  | 'patrolCoverage'
  | 'conflictTrends';

export interface ParkLocation {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
}

export interface ParkConfig {
  id: string;
  name: string;
  code: string;
  province: string;
  totalAreaSqKm: number;
  centerCoordinates: {
    latitude: number;
    longitude: number;
  };
  locations: ParkLocation[];
}

export interface ReportCriteria {
  park: string;
  startDate: string;
  endDate: string;
  location: string;
  sections: ReportSectionType[];
}

export interface AnalyticsSummary {
  totalIncidents: number;
  totalPatrols: number;
  patrolDistanceKm: number;
  totalConflicts: number;
  highRiskAreas: Array<{
    location: string;
    incidents: number;
    conflicts: number;
    totalAlerts: number;
  }>;
  incidentsByType: Array<{ type: string; count: number }>;
  conflictsBySpecies: Array<{ species: string; count: number }>;
  conflictsBySeverity: Array<{ severity: string; count: number }>;
  patrolsBySector: Array<{ sector: string; count: number; totalKm: number }>;
  dbConnected: boolean;
}

export interface IncidentRecord {
  id: string;
  type: string;
  ranger?: string;
  location: string;
  coordinates?: { latitude: number; longitude: number };
  status: string;
  date: string;
  description: string;
}

export interface PatrolRecord {
  id: string;
  ranger: string;
  sector: string;
  type: string;
  distanceKm: number;
  status: string;
  date: string;
}

export interface ConflictRecord {
  id: string;
  type: string;
  species: string;
  severity: string;
  location: string;
  status: string;
  date: string;
  description: string;
}

export interface GeneratedReport {
  noData: boolean;
  message?: string;
  reportId?: string;
  park: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  location: string;
  sections: ReportSectionType[];
  generatedAt: string;
  generatedBy: string;
  summary: {
    totalIncidents: number;
    totalPatrols: number;
    totalPatrolDistanceKm: number;
    totalConflicts: number;
  };
  incidentStatistics?: {
    totalCount: number;
    byType: Array<{ type: string; count: number }>;
    byLocation: Array<{ location: string; count: number }>;
    byDate: Array<{ date: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    records: IncidentRecord[];
  };
  patrolCoverage?: {
    totalPatrols: number;
    totalDistanceKm: number;
    bySector: Array<{ sector: string; count: number; distanceKm: number }>;
    byType: Array<{ type: string; count: number }>;
    byDate: Array<{ date: string; count: number }>;
    records: PatrolRecord[];
  };
  conflictTrends?: {
    totalConflicts: number;
    byType: Array<{ type: string; count: number }>;
    bySpecies: Array<{ species: string; count: number }>;
    bySeverity: Array<{ severity: string; count: number }>;
    byLocation: Array<{ location: string; count: number }>;
    byDate: Array<{ date: string; count: number }>;
    records: ConflictRecord[];
  };
}
