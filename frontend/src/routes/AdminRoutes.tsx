import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard } from '../components/admin/Dashboard';
import { AuditLogs } from '../components/admin/AuditLogs';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { UserRole } from '../types/enums';

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute roles={[UserRole.ADMIN]}>
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={[UserRole.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute roles={[UserRole.ADMIN]}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}; 