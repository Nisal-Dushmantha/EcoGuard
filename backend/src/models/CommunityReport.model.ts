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
export type ConflictStatus = 'Pending Verification' | 'Verified' | 'Rejected' | 'Dispatched' | 'In Progress' | 'Resolved' | 'False Alarm';

export interface ICommunityReport extends Document {
  reportId: string;
  reporterId?: string;
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
  photoUrl?: string;
  actionTaken?: string;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  assignedRangerId?: string;
  assignedRangerName?: string;
  dispatchedAt?: Date;
  dispatchedBy?: string;
  inProgressAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNote?: string;
  officerNotes?: string;
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
    reporterId: {
      type: String,
      default: '',
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
      enum: ['Pending Verification', 'Verified', 'Rejected', 'Dispatched', 'In Progress', 'Resolved', 'False Alarm'],
      default: 'Pending Verification',
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    actionTaken: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    verifiedBy: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
    },
    assignedRangerId: {
      type: String,
      default: '',
    },
    assignedRangerName: {
      type: String,
      default: '',
    },
    dispatchedAt: {
      type: Date,
    },
    dispatchedBy: {
      type: String,
      default: '',
    },
    inProgressAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: String,
      default: '',
    },
    resolutionNote: {
      type: String,
      default: '',
    },
    officerNotes: {
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
