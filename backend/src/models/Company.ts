import mongoose, { Schema, Document } from 'mongoose';
import { Location } from '../types/models';

export interface ICompany extends Document {
  name: string;
  description: string;
  logo: string;
  location: Location;
  industry: string;
  website: string;
  postedJobs: mongoose.Types.ObjectId[];
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters'],
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Company description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  logo: {
    type: String,
    default: 'default-company-logo.png'
  },
  location: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    remote: {
      type: Boolean,
      default: false
    }
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  website: {
    type: String,
    required: [true, 'Website is required'],
    match: [
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
      'Please provide a valid website URL'
    ]
  },
  postedJobs: [{
    type: Schema.Types.ObjectId,
    ref: 'Job'
  }],
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimizing queries
CompanySchema.index({ name: 1 });
CompanySchema.index({ industry: 1 });
CompanySchema.index({ 'location.country': 1, 'location.state': 1, 'location.city': 1 });

// Virtual populate for jobs
CompanySchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'company'
});

// Pre-save hook to trim strings
CompanySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  if (this.isModified('description')) {
    this.description = this.description.trim();
  }
  next();
});

// Use mongoose.models to check if the model already exists before creating it
export const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema); 