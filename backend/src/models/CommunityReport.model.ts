import mongoose, { Document, Schema } from 'mongoose';

export type ConflictType =
  | 'Crop Raiding'
  | 'Property Damage'
  | 'Livestock Predation'
  | 'Human Threat/Encounter'
  | 'Electric Fence Breach'
  | 'Other Conflict';

export type AnimalSpecies =
  | 'Asian Elephant'
  | 'Sri Lankan Leopard'
  | 'Wild Boar'
  | 'Sloth Bear'
  | 'Mugger Crocodile'
  | 'Other';

export type ConflictSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type ConflictStatus = 'Pending Verification' | 'Dispatched' | 'Resolved' | 'False Alarm';

export interface ICommunityReport extends Document {
  reportId: string;
  reporterName: string;
  contactNumber?: string;
  park: string;
  locationName: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  conflictType: ConflictType;
  animalSpecies: AnimalSpecies;
  severity: ConflictSeverity;
  reportedAt: Date;
  status: ConflictStatus;
  description: string;
  actionTaken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityReportSchema = new Schema<ICommunityReport>(
  {
    reportId: {
      type: String,
      required: [true, 'Report ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    reporterName: {
      type: String,
      required: [true, 'Reporter name is required'],
      trim: true,
    },
    contactNumber: {
      type: String,
      default: '',
    },
    park: {
      type: String,
      required: [true, 'Park name is required'],
      trim: true,
      index: true,
    },
    locationName: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      index: true,
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    conflictType: {
      type: String,
      enum: [
        'Crop Raiding',
        'Property Damage',
        'Livestock Predation',
        'Human Threat/Encounter',
        'Electric Fence Breach',
        'Other Conflict',
      ],
      required: true,
      index: true,
    },
    animalSpecies: {
      type: String,
      enum: [
        'Asian Elephant',
        'Sri Lankan Leopard',
        'Wild Boar',
        'Sloth Bear',
        'Mugger Crocodile',
        'Other',
      ],
      default: 'Asian Elephant',
      index: true,
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['Pending Verification', 'Dispatched', 'Resolved', 'False Alarm'],
      default: 'Pending Verification',
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    actionTaken: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

CommunityReportSchema.index({ park: 1, reportedAt: -1 });

export const CommunityReport = mongoose.model<ICommunityReport>(
  'CommunityReport',
  CommunityReportSchema
);
export default CommunityReport;
