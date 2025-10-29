import { Job, JobFormData } from './job';
import { UserRole, ApplicationStatus } from './enums';

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

// Job Types
export interface JobsResponse {
  status: string;
  results: number;
  total: number;
  data: {
    jobs: Job[];
  };
}

export interface JobResponse {
  status: string;
  data: {
    job: Job;
  };
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
  resume?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  status: string;
  results: number;
  total: number;
  data: {
    users: User[];
  };
}

export interface UserResponse {
  status: string;
  data: {
    user: User;
  };
}

// Admin Types
export interface DashboardStats {
  jobs: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  users: {
    total: number;
    byRole: Record<UserRole, number>;
  };
  companies: {
    total: number;
    top: Array<{
      name: string;
      jobCount: number;
    }>;
  };
  applications: {
    total: number;
  };
  recentJobs: Job[];
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  details: string;
  timestamp: string;
}

export interface DashboardResponse {
  status: string;
  data: DashboardStats;
}

export interface AuditLogsResponse {
  status: string;
  data: {
    logs: AuditLog[];
  };
}

// Upload Types
export interface UploadResponse {
  status: string;
  data: {
    url: string;
  };
}

// Application Types
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

export interface ApplicationResponse {
  status: string;
  data: {
    application: Application;
  };
}

export interface ApplicationsResponse {
  status: string;
  results: number;
  total: number;
  data: {
    applications: Application[];
  };
}

// Error Types
export interface ApiError {
  status: string;
  message: string;
} 