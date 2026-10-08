import mongoose, { Document, Schema } from 'mongoose';

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

export interface IRiskZone extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const GeoCoordinateSchema = new Schema<IGeoCoordinate>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const RiskZoneSchema = new Schema<IRiskZone>(
  {
    zoneId: {
      type: String,
      required: [true, 'Zone ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      trim: true,
    },
    park: {
      type: String,
      required: true,
      default: 'Yala National Park',
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['Safe', 'Moderate Warning', 'High Risk'],
      default: 'Moderate Warning',
      index: true,
    },
    hazardType: {
      type: String,
      required: true,
      enum: [
        'Poaching Hotspot',
        'Railway Corridor',
        'Highway Traffic Hazard',
        'Human Settlement Buffer',
        'Agricultural Encroachment',
        'Water Resource Scarcity',
        'Core Protected Sanctuary',
      ],
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    areaKm2: {
      type: Number,
      default: 12.5,
    },
    coordinates: {
      type: [GeoCoordinateSchema],
      required: true,
      default: [],
    },
    alertTriggerThresholdMeters: {
      type: Number,
      default: 200,
    },
    recommendedSOP: {
      type: String,
      default: 'Deploy rapid patrol team and alert local wildlife buffer units.',
    },
  },
  { timestamps: true }
);

RiskZoneSchema.index({ park: 1, riskLevel: 1 });

export const RiskZone = mongoose.model<IRiskZone>('RiskZone', RiskZoneSchema);
export default RiskZone;
