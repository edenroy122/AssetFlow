import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Auth Components
import Login from '../components/auth/Login';
import Logout from '../components/auth/Logout';

// Protected Route Guard
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import AssetManagerLayout from '../layouts/AssetManagerLayout';
import SupportLayout from '../layouts/SupportLayout';
import EmployeeLayout from '../layouts/EmployeeLayout';

// Admin Pages
import AdminDashboard from '../pages/admin/dashboard/AdminDashboard';
import UserManagement from '../pages/admin/user-management/UserManagement';
import AuditLog from '../pages/admin/audit-log/AuditLog';

// Asset Manager Pages
import AssetManagerDashboard from '../pages/asset-manager/dashboard/AssetManagerDashboard';
import AssetManagement from '../pages/asset-manager/asset-management/AssetManagement';
import RequestManagement from '../pages/asset-manager/request-management/RequestManagement';

// Support Team Pages
import SupportDashboard from '../pages/support/dashboard/SupportDashboard';
import SupportRequests from '../pages/support/requests/SupportRequests';

import TechnicianWorkOrders from '../pages/technician/work-orders/TechnicianWorkOrders';
import RepairManagement from '../pages/technician/repair-management/RepairManagement';

// Employee Pages
import EmployeeDashboard from '../pages/employee/dashboard/EmployeeDashboard';
import MyAssets from '../pages/employee/my-assets/MyAssets';
import AssetRequests from '../pages/employee/asset-requests/AssetRequests';
import MyRequests from '../pages/employee/my-requests/MyRequests';
import EmployeeAssetHistory from '../pages/employee/asset-history/EmployeeAssetHistory';

// Common
import ProfilePage from '../pages/profile/ProfilePage';

// Helper component for root '/' redirect
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'Admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'Asset Manager':
      return <Navigate to="/asset-manager/dashboard" replace />;
    case 'Support Team':
      return <Navigate to="/support/dashboard" replace />;
    case 'Employee':
      return <Navigate to="/employee/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root Redirection */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/assets" element={<AssetManagement />} />
          <Route path="/admin/audit-logs" element={<AuditLog />} />
        </Route>
      </Route>

      {/* Asset Manager Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Asset Manager']} />}>
        <Route element={<AssetManagerLayout />}>
          <Route path="/asset-manager/dashboard" element={<AssetManagerDashboard />} />
          <Route path="/asset-manager/assets" element={<AssetManagement />} />
          <Route path="/asset-manager/requests" element={<RequestManagement />} />
        </Route>
      </Route>

      {/* Support Team Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Support Team']} />}>
        <Route element={<SupportLayout />}>
          <Route path="/support/dashboard" element={<SupportDashboard />} />
          <Route path="/support/requests" element={<SupportRequests />} />
          <Route path="/support/work-orders" element={<TechnicianWorkOrders />} />
          <Route path="/support/repairs" element={<RepairManagement />} />
          <Route path="/support/assets" element={<AssetManagement />} />
        </Route>
      </Route>

      {/* Employee Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Employee']} />}>
        <Route element={<EmployeeLayout />}>
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/employee/my-assets" element={<MyAssets />} />
          <Route path="/employee/asset-requests" element={<AssetRequests />} />
          <Route path="/employee/my-requests" element={<MyRequests />} />
          <Route path="/employee/history" element={<EmployeeAssetHistory />} />
        </Route>
      </Route>

      {/* Shared profile route: render the matching portal shell for every role. */}
      <Route element={<ProtectedRoute allowedRoles={['Admin', 'Asset Manager', 'Support Team', 'Employee']} />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback for undefined routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
