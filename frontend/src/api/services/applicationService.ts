import axios from '../axios';
import { Application, ApplicationResponse, ApplicationsResponse } from '../../types/api';
import { ApplicationStatus } from '../../types/enums';

export const applicationService = {
  async getUserApplications(): Promise<ApplicationsResponse> {
    const response = await axios.get<ApplicationsResponse>('/jobs/applications/user');
    return response.data;
  },

  async getApplicationsByJobId(jobId: string): Promise<ApplicationsResponse> {
    const response = await axios.get<ApplicationsResponse>(`/applications/job/${jobId}`);
    return response.data;
  },

  async getApplicationById(id: string): Promise<ApplicationResponse> {
    const response = await axios.get<ApplicationResponse>(`/jobs/applications/${id}`);
    return response.data;
  },

  async createApplication(data: {
    jobId: string;
    coverLetter: string;
    resumeId?: string;
  }): Promise<ApplicationResponse> {
    const response = await axios.post<ApplicationResponse>('/applications', data);
    return response.data;
  },

  async updateApplicationStatus(
    id: string,
    status: ApplicationStatus
  ): Promise<ApplicationResponse> {
    const response = await axios.put<ApplicationResponse>(`/applications/${id}/status`, {
      status
    });
    return response.data;
  },

  async withdrawApplication(id: string): Promise<void> {
    await axios.delete(`/jobs/applications/${id}`);
  }
}; 