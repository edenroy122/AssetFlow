import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AssetFlowLogo from '../common/AssetFlowLogo';
import {
  LayoutDashboard,
  PackageCheck,
  Boxes,
  Wrench,
  UserCheck,
  LogOut
} from 'lucide-react';
import './SupportSidebar.css';

const SupportSidebar = () => {
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
          <span className="brand-role-tag support-tag">Support Team</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/support/dashboard"
          className={({ isActive }) => `nav-link-item support-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/support/requests"
          className={({ isActive }) => `nav-link-item support-link ${isActive ? 'active' : ''}`}
        >
          <PackageCheck size={18} />
          <span>Request Management</span>
        </NavLink>

        <NavLink
          to="/support/work-orders"
          className={({ isActive }) => `nav-link-item support-link ${isActive ? 'active' : ''}`}
        >
          <Wrench size={18} />
          <span>Work Orders</span>
        </NavLink>

        <NavLink
          to="/support/assets"
          className={({ isActive }) => `nav-link-item support-link ${isActive ? 'active' : ''}`}
        >
          <Boxes size={18} />
          <span>Asset Inventory</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-link-item support-link ${isActive ? 'active' : ''}`}
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

export default SupportSidebar;
