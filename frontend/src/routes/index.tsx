import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contex/AuthContext';
import Jobs from '../pages/Jobs';
import PostJob from '../pages/PostJob';
import EmployerDashboard from '../pages/EmployerDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import JobSeekerApplications from '../pages/JobSeekerApplications';
import ApplicationDetail from '../pages/ApplicationDetail';

// Protected Route wrapper component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/jobs" />} />
      <Route path="/jobs" element={<Jobs />} />

      {/* Employer Routes */}
      <Route
        path="/post-job"
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <PostJob />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <EmployerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Job Seeker Routes */}
      <Route
        path="/applications"
        element={
          <ProtectedRoute allowedRoles={['jobseeker']}>
            <JobSeekerApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications/:id"
        element={
          <ProtectedRoute allowedRoles={['jobseeker']}>
            <ApplicationDetail />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes; 