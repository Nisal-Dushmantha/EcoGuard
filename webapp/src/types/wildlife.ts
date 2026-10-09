export type AnimalSpecies =
  | 'Asian Elephant'
  | 'Sri Lankan Leopard'
  | 'Sloth Bear'
  | 'Spotted Deer'
  | 'Mugger Crocodile'
  | 'Water Buffalo'
  | 'Wild Boar';

export type AnimalRiskStatus = 'Safe' | 'Warning' | 'High Risk' | 'Inactive';

export interface ILocationPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: string | Date;
  speedKmh?: number;
  heading?: number;
}

export interface CollaredAnimal {
  _id?: string;
  collarId: string;
  animalId: string;
  name: string;
  species: AnimalSpecies;
  sex: 'Male' | 'Female' | 'Unknown';
  ageYears?: number;
  weightKg?: number;
  park: string;
  currentLocation: ILocationPoint;
  locationHistory: ILocationPoint[];
  status: AnimalRiskStatus;
  currentZoneId?: string;
  currentZoneName?: string;
  isInHighRiskZone: boolean;
  batteryLevel: number;
  signalStrength: 'Strong' | 'Moderate' | 'Weak' | 'No Signal';
  lastPingAt: string | Date;
  collarModel?: string;
  notes?: string;
}

export type RiskLevel = 'Safe' | 'Moderate Warning' | 'High Risk';
export type HazardType =
  | 'Poaching Hotspot'
  | 'Railway Corridor'
  | 'Highway Traffic Hazard'
  | 'Human Settlement Buffer'
  | 'Agricultural Encroachment'
  | 'Water Resource Scarcity'
  | 'Core Protected Sanctuary';

export interface IGeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface RiskZone {
  _id?: string;
  zoneId: string;
  name: string;
  park: string;
  riskLevel: RiskLevel;
  hazardType: HazardType;
  description: string;
  areaKm2: number;
  coordinates: IGeoCoordinate[];
  alertTriggerThresholdMeters: number;
  recommendedSOP: string;
  activeAnimalCount?: number;
}

export type AlertSeverity = 'High Risk' | 'Warning' | 'Info';
export type AlertStatus = 'Active' | 'Acknowledged' | 'Resolved';

export interface WildlifeAlert {
  _id?: string;
  alertId: string;
  collarId: string;
  animalId: string;
  animalName: string;
  species: string;
  park: string;
  zoneId: string;
  zoneName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  triggerReason: string;
  location: {
    latitude: number;
    longitude: number;
    sector?: string;
  };
  triggeredAt: string | Date;
  acknowledgedAt?: string | Date;
  acknowledgedBy?: string;
  managerNotes?: string;
  dispatchedRangers?: string[];
  resolvedAt?: string | Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface MonitoringOverview {
  park: string;
  totalCollared: number;
  animalsInHighRisk: number;
  animalsSafe: number;
  animalsWarning: number;
  lowBatteryCollars: number;
  activeAlertsCount: number;
  acknowledgedAlertsCount: number;
  resolvedAlertsCount: number;
  speciesBreakdown: Record<string, number>;
  zonesCount: number;
  highRiskZonesCount: number;
  normalZonesCount: number;
  recentUpdates: Array<{
    id: string;
    time: string | Date;
    type: string;
    title: string;
    message: string;
    zone: string;
    status: string;
  }>;
  lastTelemetrySync: string;
}
