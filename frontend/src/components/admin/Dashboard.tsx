import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getDashboardStats } from '../../store/slices/adminSlice';
import { RootState } from '../../store';
import { StatCard } from './StatCard';
import { RecentJobsTable } from './RecentJobsTable';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((state: RootState) => state.admin);

  React.useEffect(() => {
    dispatch(getDashboardStats());
  }, [dispatch]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) {
    return null;
  }

  const jobStatusData = [
    { name: 'Pending', value: stats.jobs.pending },
    { name: 'Approved', value: stats.jobs.approved },
    { name: 'Rejected', value: stats.jobs.rejected }
  ];

  const userRoleData = Object.entries(stats.users.byRole).map(([role, count]) => ({
    name: role,
    value: count
  }));

  const topCompaniesData = stats.companies.top.map(company => ({
    name: company.name,
    jobs: company.jobCount
  }));

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Jobs"
            value={stats.jobs.total}
            icon="work"
            color="#0088FE"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.users.total}
            icon="people"
            color="#00C49F"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Companies"
            value={stats.companies.total}
            icon="business"
            color="#FFBB28"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Applications"
            value={stats.applications.total}
            icon="description"
            color="#FF8042"
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Job Status Distribution
            </Typography>
            <PieChart width={400} height={300}>
              <Pie
                data={jobStatusData}
                cx={200}
                cy={150}
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {jobStatusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Companies by Job Posts
            </Typography>
            <BarChart
              width={400}
              height={300}
              data={topCompaniesData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="jobs" fill="#8884d8" />
            </BarChart>
          </Paper>
        </Grid>

        {/* Recent Jobs Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Jobs
            </Typography>
            <RecentJobsTable jobs={stats.recentJobs} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}; 