import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IJobSeeker extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  skills: string[];
  education: {
    school: string;
    degree: string;
    graduationYear: number;
  }[];
  experience: {
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description: string;
  }[];
  resume?: string; // URL to stored resume
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const jobSeekerSchema = new mongoose.Schema({
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
  skills: [{
    type: String,
    trim: true
  }],
  education: [{
    school: {
      type: String,
      required: true
    },
    degree: {
      type: String,
      required: true
    },
    graduationYear: {
      type: Number,
      required: true
    }
  }],
  experience: [{
    title: {
      type: String,
      required: true
    },
    company: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    description: String
  }],
  resume: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
jobSeekerSchema.pre('save', async function(next) {
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
jobSeekerSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

export default mongoose.model<IJobSeeker>('JobSeeker', jobSeekerSchema); 