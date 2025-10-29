export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  VOLUNTEERING = 'VOLUNTEERING',
  INTERNSHIP = 'INTERNSHIP',
  TEMPORARY = 'TEMPORARY'
}

export enum JobStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED'
}

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYER = 'employer',
  JOBSEEKER = 'jobseeker'
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

export interface Location {
  street?: string;
  city: string;
  state: string;
  country?: string;
  remote: boolean;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
} 