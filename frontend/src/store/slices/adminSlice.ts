import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';
import { JobStatus } from '../../types/enums';

interface DashboardStats {
  jobs: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  companies: {
    total: number;
    top: Array<{ name: string; jobCount: number }>;
  };
  applications: {
    total: number;
  };
  recentJobs: Array<any>;
}

interface AdminState {
  stats: DashboardStats | null;
  auditLogs: Array<{
    id: string;
    action: string;
    userId: string;
    details: string;
    timestamp: string;
  }>;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  stats: null,
  auditLogs: [],
  loading: false,
  error: null
};

export const getDashboardStats = createAsyncThunk(
  'admin/getDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/admin/stats');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch stats');
    }
  }
);

export const updateJobStatus = createAsyncThunk(
  'admin/updateJobStatus',
  async ({ jobId, status }: { jobId: string; status: JobStatus }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/jobs/admin/jobs/${jobId}/status`, { status });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update job status');
    }
  }
);

export const getAuditLogs = createAsyncThunk(
  'admin/getAuditLogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/admin/audit-logs');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch audit logs');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    resetAdminState: (state) => {
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get dashboard stats
      .addCase(getDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update job status
      .addCase(updateJobStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateJobStatus.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateJobStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get audit logs
      .addCase(getAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.auditLogs = action.payload;
      })
      .addCase(getAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { resetAdminState } = adminSlice.actions;
export default adminSlice.reducer; 