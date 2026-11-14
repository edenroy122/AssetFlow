import React, { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../../../services/api';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import UserFormModal from './UserFormModal';
import UserDetailModal from './UserDetailModal';
import {
  UserPlus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FilterX,
} from 'lucide-react';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Detail popup modal
  const [detailUserData, setDetailUserData] = useState(null);

  // Add / Edit form modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState(null);

  // Notification state
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'All') params.role = roleFilter;
      if (statusFilter !== 'All') params.status = statusFilter;

      const response = await userAPI.getUsers(params);
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      showAlert(
        err.response?.data?.message || err.message || 'Error loading users',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ---- Row click → open detail popup ---- */
  const handleRowClick = (user) => {
    setDetailUserData(user);
  };

  /* ---- Add / Edit ---- */
  const handleOpenAddModal = () => {
    setEditUserData(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditUserData(user);
    setIsFormModalOpen(true);
  };

  /* ---- Toggle status ---- */
  const handleToggleStatus = async (user) => {
    if (user.role === 'Admin') {
      showAlert('The system Admin account cannot be deactivated.', 'error');
      return;
    }

    const actionText = user.status === 'Active' ? 'deactivate' : 'activate';
    if (
      !window.confirm(
        `Are you sure you want to ${actionText} user '${user.firstName} ${user.lastName}'?`
      )
    ) {
      return;
    }

    try {
      const response = await userAPI.toggleStatus(user._id);
      showAlert(response.data.message || 'Status updated successfully');
      fetchUsers();
    } catch (err) {
      showAlert(
        err.response?.data?.message || err.message || 'Failed to toggle status',
        'error'
      );
    }
  };

  /* ---- Delete ---- */
  const handleDeleteUser = async (user) => {
    if (user.role === 'Admin') {
      showAlert('Cannot delete the root Admin account.', 'error');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete '${user.firstName} ${user.lastName}' (${user.employeeId})? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await userAPI.deleteUser(user._id);
      showAlert(response.data.message || 'User deleted successfully');
      fetchUsers();
    } catch (err) {
      showAlert(
        err.response?.data?.message || err.message || 'Failed to delete user',
        'error'
      );
    }
  };

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('All');
    setStatusFilter('All');
  };

  const getRoleVariant = (role) => {
    switch (role) {
      case 'Admin':                  return 'danger';
      case 'Asset Manager':          return 'info';
      case 'Support Team':           return 'primary';
      case 'Employee':               return 'success';
      default: return 'secondary';
    }
  };

  const getInitials = (firstName, lastName) =>
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="user-management-header">
        <div className="user-management-header-left">
          <h1>User Management</h1>
          <p>
            Admin control center: manage organization accounts, role authorizations and employee designations.
          </p>
        </div>
        <Button variant="secondary" className="ams-btn-light-grey" icon={UserPlus} onClick={handleOpenAddModal}>
          Add New User
        </Button>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div className={`management-alert ${alert.type}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {alert.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="user-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Asset Manager">Asset Manager</option>
            <option value="Support Team">Support Team</option>
            <option value="Employee">Employee</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>

          {(search || roleFilter !== 'All' || statusFilter !== 'All') && (
            <Button variant="secondary" size="sm" icon={FilterX} onClick={resetFilters}>
              Reset
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchUsers}
            title="Refresh List"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Non-Scrolling List View — Name, Email, Employee ID, Role, Location */}
      <div className="user-list-view">
        <div className="user-list-header">
          <span>Name</span>
          <span>Email</span>
          <span>Employee ID</span>
          <span>Role</span>
          <span>Location</span>
        </div>

        {loading ? (
          <div className="user-list-empty">
            <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 0.5rem' }} />
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="user-list-empty">
            <p>No users found matching the selected criteria</p>
          </div>
        ) : (
          users.map((item) => (
            <button
              key={item._id}
              type="button"
              className="user-list-row"
              onClick={() => handleRowClick(item)}
              title="Click to view user details"
            >
              <div className="user-col-name">
                <div className="user-table-avatar">
                  {getInitials(item.firstName, item.lastName)}
                </div>
                <span className="user-table-name">
                  {item.firstName} {item.lastName}
                </span>
              </div>

              <span className="user-col-email" title={item.email}>
                {item.email}
              </span>

              <span className="user-col-id">{item.employeeId}</span>

              <div className="user-col-role">
                <Badge variant={getRoleVariant(item.role)} className="ams-badge-role" withDot={false}>{item.role}</Badge>
              </div>

              <span className="user-col-location">{item.location || 'Domlur'}</span>
            </button>
          ))
        )}
      </div>

      {/* User Detail Popup Modal */}
      <UserDetailModal
        isOpen={Boolean(detailUserData)}
        onClose={() => setDetailUserData(null)}
        user={detailUserData}
        onEdit={(u) => {
          setDetailUserData(null);
          handleOpenEditModal(u);
        }}
        onDelete={(u) => {
          setDetailUserData(null);
          handleDeleteUser(u);
        }}
      />

      {/* Add / Edit Form Modal */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={(result) => {
          showAlert(
            result?.message || (editUserData
              ? 'User details updated successfully.'
              : 'New user created successfully.'),
            result?.welcomeEmailSent === false ? 'error' : 'success'
          );
          fetchUsers();
        }}
        editUser={editUserData}
      />
    </div>
  );
};

export default UserManagement;
