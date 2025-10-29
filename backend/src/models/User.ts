import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'employer' | 'jobseeker' | 'admin';
  company?: mongoose.Types.ObjectId;
  resume?: string;
  appliedJobs: mongoose.Types.ObjectId[];
  savedJobs: mongoose.Types.ObjectId[];
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  role: {
    type: String,
    enum: ['employer', 'jobseeker', 'admin'],
    required: [true, 'Role is required']
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  resume: {
    type: String
  },
  appliedJobs: [{
    type: Schema.Types.ObjectId,
    ref: 'Job'
  }],
  savedJobs: [{
    type: Schema.Types.ObjectId,
    ref: 'Job'
  }],
  emailVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimizing queries - removed duplicate indexes
// Only define indexes when they're not already defined by schema options
UserSchema.index({ role: 1 });
UserSchema.index({ company: 1 }, { sparse: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Virtual populate for company details if user is an employer
UserSchema.virtual('companyDetails', {
  ref: 'Company',
  localField: 'company',
  foreignField: '_id',
  justOne: true
});

// Use mongoose.models to check if the model already exists before creating it
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 