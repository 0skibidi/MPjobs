export enum JobType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  VOLUNTEERING = 'volunteering',
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

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INTERVIEWED = 'INTERVIEWED',
  HIRED = 'HIRED',
  WITHDRAWN = 'WITHDRAWN'
} 