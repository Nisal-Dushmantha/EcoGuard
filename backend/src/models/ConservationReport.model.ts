import mongoose, { Document, Schema } from 'mongoose';

export type ReportSection =
  | 'incidentStatistics'
  | 'patrolCoverage'
  | 'conflictTrends';

export interface IConservationReport extends Document {
  reportId: string;
  generatedBy: {
    userId?: string;
    name: string;
    role: string;
  };
  park: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  location: string;
  sections: ReportSection[];
  generatedAt: Date;
  summary: {
    totalIncidents?: number;
    totalPatrols?: number;
    totalPatrolDistanceKm?: number;
    totalConflicts?: number;
  };
  dataPayload?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ConservationReportSchema = new Schema<IConservationReport>(
  {
    reportId: {
      type: String,
      required: [true, 'Report ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    generatedBy: {
      userId: { type: String },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    park: {
      type: String,
      required: [true, 'Park name is required'],
      trim: true,
      index: true,
    },
    dateRange: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    location: {
      type: String,
      default: 'All Areas',
    },
    sections: [
      {
        type: String,
        enum: ['incidentStatistics', 'patrolCoverage', 'conflictTrends'],
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    summary: {
      totalIncidents: { type: Number, default: 0 },
      totalPatrols: { type: Number, default: 0 },
      totalPatrolDistanceKm: { type: Number, default: 0 },
      totalConflicts: { type: Number, default: 0 },
    },
    dataPayload: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

ConservationReportSchema.index({ park: 1, generatedAt: -1 });

export const ConservationReport = mongoose.model<IConservationReport>(
  'ConservationReport',
  ConservationReportSchema
);
export default ConservationReport;
