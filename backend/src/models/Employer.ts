import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IEmployer extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  companyName: string;
  companyDescription?: string;
  industry: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  website?: string;
  logo?: string; // URL to company logo
  employeeCount?: number;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const employerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyDescription: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    required: false,
    trim: true
  },
  location: {
    city: {
      type: String,
      required: false
    },
    state: {
      type: String,
      required: false
    },
    country: {
      type: String,
      required: true,
      default: 'USA'
    }
  },
  website: {
    type: String,
    trim: true
  },
  logo: String,
  employeeCount: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
employerSchema.pre('save', async function(next) {
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
employerSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

export const comparePassword = employerSchema.methods.comparePassword;

// Use mongoose.models to check if the model already exists before creating it
export default mongoose.models.Employer || mongoose.model<IEmployer>('Employer', employerSchema); 