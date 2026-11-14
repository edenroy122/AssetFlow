import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AssetFlowLogo from '../common/AssetFlowLogo';
import {
  LayoutDashboard,
  Laptop,
  PlusCircle,
  FileCheck2,
  History,
  UserCheck,
  LogOut
} from 'lucide-react';
import './EmployeeSidebar.css';

const EmployeeSidebar = () => {
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
          <span className="brand-role-tag">Employee Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/employee/dashboard"
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/employee/my-assets"
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <Laptop size={18} />
          <span>My Assets</span>
        </NavLink>

        <NavLink
          to="/employee/asset-requests"
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <PlusCircle size={18} />
          <span>Asset Requests</span>
        </NavLink>

        <NavLink
          to="/employee/my-requests"
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <FileCheck2 size={18} />
          <span>My Requests</span>
        </NavLink>

        <NavLink
          to="/employee/history"
          className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
        >
          <History size={18} />
          <span>Asset History</span>
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

export default EmployeeSidebar;
