import mongoose, { Document, Schema } from 'mongoose';

export type PatrolType =
  | 'Routine Foot Patrol'
  | 'Vehicle Patrol'
  | 'Aerial Surveillance'
  | 'Anti-Poaching Ambush';

export type PatrolStatus = 'Completed' | 'In Progress' | 'Scheduled';

export interface IRouteCoordinate {
  latitude: number;
  longitude: number;
  timestamp?: Date;
}

export interface IPatrol extends Document {
  patrolId: string;
  rangerId: string;
  rangerName: string;
  park: string;
  sector: string;
  patrolType: PatrolType;
  startTime: Date;
  endTime?: Date;
  distanceKm: number;
  status: PatrolStatus;
  routeCoordinates: IRouteCoordinate[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatrolSchema = new Schema<IPatrol>(
  {
    patrolId: {
      type: String,
      required: [true, 'Patrol ID is required'],
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
      required: [true, 'Ranger Name is required'],
      trim: true,
    },
    park: {
      type: String,
      required: [true, 'Park name is required'],
      trim: true,
      index: true,
    },
    sector: {
      type: String,
      required: [true, 'Sector or area is required'],
      trim: true,
      index: true,
    },
    patrolType: {
      type: String,
      enum: [
        'Routine Foot Patrol',
        'Vehicle Patrol',
        'Aerial Surveillance',
        'Anti-Poaching Ambush',
      ],
      default: 'Routine Foot Patrol',
    },
    startTime: {
      type: Date,
      required: [true, 'Patrol start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Completed', 'In Progress', 'Scheduled'],
      default: 'Completed',
      index: true,
    },
    routeCoordinates: [
      {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

PatrolSchema.index({ park: 1, startTime: -1 });

export const Patrol = mongoose.model<IPatrol>('Patrol', PatrolSchema);
export default Patrol;
