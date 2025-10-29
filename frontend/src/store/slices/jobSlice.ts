import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { JobState, JobFormData, Job } from '../../types/job';
import axios from '../../api/axios';

const initialState: JobState = {
  jobs: [],
  currentJob: null,
  loading: false,
  error: null,
  success: false
};

export const createJob = createAsyncThunk(
  'jobs/create',
  async (formData: JobFormData, { rejectWithValue }) => {
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'logo' && value instanceof File) {
          form.append(key, value);
        } else if (typeof value === 'object') {
          form.append(key, JSON.stringify(value));
        } else {
          form.append(key, String(value));
        }
      });

      const response = await axios.post('/jobs', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data.job;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create job');
    }
  }
);

export const getJobs = createAsyncThunk(
  'jobs/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/jobs');
      return response.data.data.jobs;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch jobs');
    }
  }
);

const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    resetJobState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    setCurrentJob: (state, action) => {
      state.currentJob = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create job
      .addCase(createJob.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.jobs.unshift(action.payload);
      })
      .addCase(createJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get jobs
      .addCase(getJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload;
      })
      .addCase(getJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { resetJobState, setCurrentJob } = jobSlice.actions;
export default jobSlice.reducer; 