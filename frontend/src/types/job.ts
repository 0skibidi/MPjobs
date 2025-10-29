import { JobType, JobStatus } from './enums';

export interface Location {
  city: string;
  state: string;
  country: string;
  remote: boolean;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  INTERVIEW = 'INTERVIEW'
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  resumeUrl: string;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
}

export interface JobFormData {
  title: string;
  description: string;
  requirements: string[];
  location: Location;
  salaryRange: SalaryRange;
  jobType: JobType;
  applicationDeadline: string;
  applicationEmail: string;
  skills: string[];
  logo?: File;
}

export interface Job extends Omit<JobFormData, 'logo'> {
  _id: string;
  company: {
    _id: string;
    name: string;
    logo: string;
  };
  status: JobStatus;
  viewsCount: number;
  applicationClickCount: number;
  applications: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobState {
  jobs: Job[];
  currentJob: Job | null;
  loading: boolean;
  error: string | null;
  success: boolean;
} 