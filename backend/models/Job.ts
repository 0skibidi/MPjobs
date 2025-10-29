import mongoose, { Schema, Document } from 'mongoose';

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  TEMPORARY = 'TEMPORARY'
}

export enum JobStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED'
}

export interface IJob extends Document {
  title: string;
  company: mongoose.Types.ObjectId;
  postedBy: mongoose.Types.ObjectId;
  description: string;
  requirements: string[];
  location: string;
  jobType: JobType;
  status: JobStatus;
  salaryMin: number;
  salaryMax: number;
  applicationDeadline?: Date;
  skills: string[];
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string;
}

const JobSchema = new Schema<IJob>({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  postedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Job poster is required']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  jobType: {
    type: String,
    enum: Object.values(JobType),
    required: [true, 'Job type is required']
  },
  status: {
    type: String,
    enum: Object.values(JobStatus),
    default: JobStatus.PENDING
  },
  salaryMin: {
    type: Number,
    required: [true, 'Minimum salary is required']
  },
  salaryMax: {
    type: Number,
    required: [true, 'Maximum salary is required']
  },
  applicationDeadline: {
    type: Date
  },
  skills: [{
    type: String,
    trim: true
  }],
  viewsCount: {
    type: Number,
    default: 0
  },
  adminNotes: {
    type: String
  }
}, {
  timestamps: true
});

// indexes for optimizing job searches
JobSchema.index({ title: 'text', description: 'text', skills: 'text' });
JobSchema.index({ status: 1 });
JobSchema.index({ jobType: 1 });
JobSchema.index({ postedBy: 1 });
JobSchema.index({ createdAt: -1 });

// pre-save middleware to make sure the salary range is valid
JobSchema.pre('save', function(next) {
  if (this.salaryMin > this.salaryMax) {
    return next(new Error('Minimum salary cannot be greater than maximum salary'));
  }
  next();
});

export const Job = mongoose.model<IJob>('Job', JobSchema); 