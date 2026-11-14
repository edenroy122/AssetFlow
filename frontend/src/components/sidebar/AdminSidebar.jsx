import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AssetFlowLogo from '../common/AssetFlowLogo';
import {
  LayoutDashboard,
  Users,
  Box,
  FileText,
  UserCheck,
  LogOut
} from 'lucide-react';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar-container">
      <div className="sidebar-brand">
        <div className="brand-logo-box">
          <AssetFlowLogo size={38} />
        </div>
        <div className="brand-info">
          <span className="brand-name">AssetFlow</span>
          <span className="brand-role-tag">Admin Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>User Management</span>
        </NavLink>

        <NavLink
          to="/admin/assets"
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <Box size={18} />
          <span>Asset Management</span>
        </NavLink>

        <NavLink
          to="/admin/audit-logs"
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} />
          <span>Audit Log</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <UserCheck size={18} />
          <span>Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="nav-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
