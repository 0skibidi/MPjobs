import axios from '../axios';
import { JobsResponse, JobResponse } from '../../types/api';
import { JobFormData } from '../../types/job';

export const jobsService = {
  async getJobs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    type?: string;
    skills?: string[];
  }): Promise<JobsResponse> {
    const response = await axios.get<JobsResponse>('/jobs', { params });
    return response.data;
  },

  async getJob(id: string): Promise<JobResponse> {
    const response = await axios.get<JobResponse>(`/jobs/${id}`);
    return response.data;
  },

  async createJob(data: JobFormData): Promise<JobResponse> {
    const response = await axios.post<JobResponse>('/jobs', data);
    return response.data;
  },

  async updateJob(id: string, data: Partial<JobFormData>): Promise<JobResponse> {
    const response = await axios.put<JobResponse>(`/jobs/${id}`, data);
    return response.data;
  },

  async deleteJob(id: string): Promise<void> {
    await axios.delete(`/jobs/${id}`);
  },

  async applyToJob(jobId: string, data: FormData): Promise<void> {
    await axios.post(`/jobs/${jobId}/apply`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  async getMyApplications(): Promise<JobsResponse> {
    const response = await axios.get<JobsResponse>('/jobs/applications');
    return response.data;
  },

  async getCompanyJobs(): Promise<JobsResponse> {
    const response = await axios.get<JobsResponse>('/jobs/company');
    return response.data;
  }
}; 