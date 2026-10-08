import mongoose, { Document, Schema } from 'mongoose';

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
  timestamp: Date;
  speedKmh?: number;
  heading?: number;
}

export interface ICollaredAnimal extends Document {
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
  lastPingAt: Date;
  collarModel?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LocationPointSchema = new Schema<ILocationPoint>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    altitude: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    speedKmh: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
  },
  { _id: false }
);

const CollaredAnimalSchema = new Schema<ICollaredAnimal>(
  {
    collarId: {
      type: String,
      required: [true, 'Collar ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    animalId: {
      type: String,
      required: [true, 'Animal ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Animal Name is required'],
      trim: true,
    },
    species: {
      type: String,
      required: [true, 'Species is required'],
      enum: [
        'Asian Elephant',
        'Sri Lankan Leopard',
        'Sloth Bear',
        'Spotted Deer',
        'Mugger Crocodile',
        'Water Buffalo',
        'Wild Boar',
      ],
      index: true,
    },
    sex: {
      type: String,
      enum: ['Male', 'Female', 'Unknown'],
      default: 'Unknown',
    },
    ageYears: { type: Number },
    weightKg: { type: Number },
    park: {
      type: String,
      required: true,
      default: 'Yala National Park',
      index: true,
    },
    currentLocation: {
      type: LocationPointSchema,
      required: true,
    },
    locationHistory: {
      type: [LocationPointSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['Safe', 'Warning', 'High Risk', 'Inactive'],
      default: 'Safe',
      index: true,
    },
    currentZoneId: { type: String, default: null },
    currentZoneName: { type: String, default: 'Core Natural Reserve' },
    isInHighRiskZone: { type: Boolean, default: false, index: true },
    batteryLevel: { type: Number, default: 95, min: 0, max: 100 },
    signalStrength: {
      type: String,
      enum: ['Strong', 'Moderate', 'Weak', 'No Signal'],
      default: 'Strong',
    },
    lastPingAt: { type: Date, default: Date.now, index: true },
    collarModel: { type: String, default: 'EcoTrack V4 Ultra-VHF/GPS' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

CollaredAnimalSchema.index({ park: 1, status: 1 });
CollaredAnimalSchema.index({ park: 1, isInHighRiskZone: 1 });

export const CollaredAnimal = mongoose.model<ICollaredAnimal>(
  'CollaredAnimal',
  CollaredAnimalSchema
);
export default CollaredAnimal;
