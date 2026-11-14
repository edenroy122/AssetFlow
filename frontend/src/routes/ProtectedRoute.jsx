import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          backgroundColor: '#f8fafc',
          color: '#475569'
        }}
      >
        <RefreshCw size={32} className="spin-icon" style={{ color: '#2563eb' }} />
        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Validating session credentials...</span>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's authorized dashboard
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
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
