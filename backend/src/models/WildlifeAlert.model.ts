import mongoose, { Document, Schema } from 'mongoose';

export type AlertSeverity = 'High Risk' | 'Warning' | 'Info';
export type AlertStatus = 'Active' | 'Acknowledged' | 'Resolved';

export interface IWildlifeAlert extends Document {
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
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  managerNotes?: string;
  dispatchedRangers?: string[];
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WildlifeAlertSchema = new Schema<IWildlifeAlert>(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    collarId: {
      type: String,
      required: true,
      index: true,
    },
    animalId: {
      type: String,
      required: true,
      index: true,
    },
    animalName: {
      type: String,
      required: true,
    },
    species: {
      type: String,
      required: true,
    },
    park: {
      type: String,
      required: true,
      default: 'Yala National Park',
      index: true,
    },
    zoneId: {
      type: String,
      required: true,
      index: true,
    },
    zoneName: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['High Risk', 'Warning', 'Info'],
      default: 'High Risk',
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Acknowledged', 'Resolved'],
      default: 'Active',
      index: true,
    },
    triggerReason: {
      type: String,
      required: true,
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      sector: { type: String, default: 'Sector A' },
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    acknowledgedAt: { type: Date },
    acknowledgedBy: { type: String },
    managerNotes: { type: String, default: '' },
    dispatchedRangers: { type: [String], default: [] },
    resolvedAt: { type: Date },
    resolvedBy: { type: String },
    resolutionNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

WildlifeAlertSchema.index({ park: 1, status: 1 });
WildlifeAlertSchema.index({ severity: 1, status: 1 });

export const WildlifeAlert = mongoose.model<IWildlifeAlert>(
  'WildlifeAlert',
  WildlifeAlertSchema
);
export default WildlifeAlert;
