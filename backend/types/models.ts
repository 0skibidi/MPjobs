export enum JobType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  TEMPORARY = 'temporary'
}

export enum JobStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYER = 'employer',
  JOBSEEKER = 'jobseeker'
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

export interface Location {
  city: string;
  state: string;
  country: string;
  remote: boolean;
} 