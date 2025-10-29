import axios from '../axios';
import { DashboardResponse, AuditLogsResponse } from '../../types/api';
import { JobStatus } from '../../types/enums';

export const adminService = {
  async getDashboardStats(): Promise<DashboardResponse> {
    const response = await axios.get<DashboardResponse>('/admin/stats');
    return response.data;
  },

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogsResponse> {
    const response = await axios.get<AuditLogsResponse>('/admin/audit-logs', {
      params
    });
    return response.data;
  },

  async updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
    await axios.patch(`/jobs/admin/jobs/${jobId}/status`, { status });
  },

  async generateReport(params: {
    type: 'jobs' | 'users' | 'applications';
    format: 'csv' | 'pdf';
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const response = await axios.get('/admin/reports', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  async getSystemMetrics(): Promise<{
    cpu: number;
    memory: number;
    storage: number;
    activeUsers: number;
  }> {
    const response = await axios.get('/admin/metrics');
    return response.data;
  }
}; 