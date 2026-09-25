import mongoose, { Document, Schema } from 'mongoose';

export type IncidentType =
  | 'Snare Detected'
  | 'Animal Carcass'
  | 'Illegal Campsite'
  | 'Suspicious Footprints'
  | 'Poaching Evidence'
  | 'Injured Animal'
  | 'Other Wildlife Incident';

export type IncidentStatus = 'Reported' | 'Under Investigation' | 'Resolved' | 'Dismissed';
export type SyncSource = 'online' | 'offline_sync';

export interface IIncidentLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  addressSummary?: string;
}

export interface IIncident extends Document {
  incidentId: string;
  rangerId: string;
  rangerName?: string;
  incidentType: IncidentType;
  location: IIncidentLocation;
  description: string;
  photoUrl?: string;
  reportedAt: Date;
  syncSource: SyncSource;
  clientReferenceId: string;
  status: IncidentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    incidentId: {
      type: String,
      required: [true, 'Incident ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    rangerId: {
      type: String,
      required: [true, 'Ranger ID is required'],
      trim: true,
      index: true,
    },
    rangerName: {
      type: String,
      trim: true,
      default: 'Field Ranger',
    },
    incidentType: {
      type: String,
      required: [true, 'Incident Type is required'],
      enum: [
        'Snare Detected',
        'Animal Carcass',
        'Illegal Campsite',
        'Suspicious Footprints',
        'Poaching Evidence',
        'Injured Animal',
        'Other Wildlife Incident',
      ],
      index: true,
    },
    location: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
      },
      accuracy: {
        type: Number,
        default: 0,
      },
      addressSummary: {
        type: String,
        default: '',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters'],
    },
    photoUrl: {
      type: String,
      default: '',
    },
    reportedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    syncSource: {
      type: String,
      enum: ['online', 'offline_sync'],
      default: 'online',
    },
    clientReferenceId: {
      type: String,
      required: [true, 'Client Reference ID / Idempotency Key is required'],
      unique: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Reported', 'Under Investigation', 'Resolved', 'Dismissed'],
      default: 'Reported',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for rapid field queries
IncidentSchema.index({ rangerId: 1, reportedAt: -1 });

export const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);
export default Incident;
