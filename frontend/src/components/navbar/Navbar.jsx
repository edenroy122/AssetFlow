import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import './Navbar.css';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getRoleClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'admin';
      case 'Asset Manager':
        return 'asset-manager';
      case 'Support Team':
        return 'support';
      case 'Employee':
        return 'employee';
      default:
        return '';
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <header className="ams-navbar">
      <div className="navbar-right">
        <NotificationDropdown />

        {user && (
          <button
            type="button"
            className="user-badge-container"
            onClick={() => navigate('/profile')}
            title="View Profile"
          >
            <div className="user-avatar-circle">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="user-meta-info">
              <span className="user-meta-name">
                {user.firstName} {user.lastName}
              </span>
              <span className={`role-pill ${getRoleClass(user.role)}`}>
                {user.role}
              </span>
            </div>
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
