import mongoose, { Schema, Document } from 'mongoose';

export enum ApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  INTERVIEW = 'INTERVIEW'
}

export interface IJobApplication extends Document {
  job: mongoose.Types.ObjectId;
  applicant: mongoose.Types.ObjectId;
  resume: string; // Path to the uploaded resume file
  coverLetter?: string;
  status: ApplicationStatus;
  employerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>({
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job is required']
  },
  applicant: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant is required']
  },
  resume: {
    type: String,
    required: [true, 'Resume is required']
  },
  coverLetter: {
    type: String
  },
  status: {
    type: String,
    enum: Object.values(ApplicationStatus),
    default: ApplicationStatus.PENDING
  },
  employerNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for optimizing application searches
JobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
 JobApplicationSchema.index({ status: 1 });
 JobApplicationSchema.index({ createdAt: -1 });

export const JobApplication = mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema); 