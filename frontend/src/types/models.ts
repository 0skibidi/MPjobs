import { Job } from './job';
import { ApplicationStatus, UserRole } from './enums';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  resume?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  coverLetter: string;
  resumeUrl?: string;
  createdAt: string;
  updatedAt: string;
  job: Job;
  user: {
    id: string;
    name: string;
    email: string;
  };
} 