import mongoose, { Schema, Document } from 'mongoose';
import { JobType, JobStatus, SalaryRange, Location } from '../types/models';

export interface IJob extends Document {
  title: string;
  company: mongoose.Types.ObjectId;
  postedBy: mongoose.Types.ObjectId;
  description: string;
  requirements: string[];
  location: Location;
  salaryRange: SalaryRange;
  jobType: JobType;
  status: JobStatus;
  applicationDeadline: Date;
  applicationEmail: string;
  skills: string[];
  viewsCount: number;
  applicationClickCount: number;
  applications: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
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
    required: false
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  requirements: [{
    type: String,
    trim: true
  }],
  location: {
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: false
    },
    country: {
      type: String,
      required: false
    },
    remote: {
      type: Boolean,
      default: false
    }
  },
  salaryRange: {
    min: {
      type: Number,
      required: [true, 'Minimum salary is required']
    },
    max: {
      type: Number,
      required: [true, 'Maximum salary is required']
    },
    currency: {
      type: String,
      default: 'USD'
    }
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
  applicationDeadline: {
    type: Date,
    required: [true, 'Application deadline is required'],
    validate: {
      validator: function(this: IJob, value: Date) {
        if (this.isNew || this.isModified('applicationDeadline')) {
          return value > new Date();
        }
        return true;
      },
      message: 'Application deadline must be in the future'
    }
  },
  applicationEmail: {
    type: String,
    required: [true, 'Application email is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(value: string) {
        // Basic email validation
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      },
      message: 'Please provide a valid email address'
    }
  },
  skills: [{
    type: String,
    trim: true
  }],
  viewsCount: {
    type: Number,
    default: 0
  },
  applicationClickCount: {
    type: Number,
    default: 0
  },
  applications: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimizing job searches
JobSchema.index({ title: 'text', description: 'text', skills: 'text' });
JobSchema.index({ status: 1 });
JobSchema.index({ jobType: 1 });
JobSchema.index({ company: 1 });
JobSchema.index({ 'location.country': 1, 'location.state': 1, 'location.city': 1 });
JobSchema.index({ applicationDeadline: 1 });
JobSchema.index({ 'salaryRange.min': 1, 'salaryRange.max': 1 });
JobSchema.index({ createdAt: -1 });

// Virtual for application count
JobSchema.virtual('applicationCount').get(function(this: IJob) {
  return this.applications.length;
});

// Pre-save middleware to ensure salary range is valid
JobSchema.pre('save', function(next) {
  if (this.isModified('salaryRange')) {
    if (this.salaryRange.min > this.salaryRange.max) {
      next(new Error('Minimum salary cannot be greater than maximum salary'));
    }
  }
  next();
});

// Pre-save middleware to trim arrays
JobSchema.pre('save', function(next) {
  if (this.isModified('skills')) {
    this.skills = this.skills.map(skill => skill.trim());
  }
  if (this.isModified('requirements')) {
    this.requirements = this.requirements.map(req => req.trim());
  }
  next();
});

// Use mongoose.models to check if the model already exists before creating it
export const Job = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema); 