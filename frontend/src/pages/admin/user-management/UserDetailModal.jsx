import React, { useState } from 'react';
import WorkspaceDetail from '../../../components/common/WorkspaceDetail';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { userAPI } from '../../../services/api';
import { Edit2, LockKeyhole, Trash2 } from 'lucide-react';
import './UserDetailModal.css';

const UserDetailModal = ({ isOpen, user, onClose, onEdit, onDelete }) => {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  if (!isOpen || !user) return null;

  const closePasswordModal = () => {
    if (savingPassword) return;
    setChangePasswordOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.trim().length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      await userAPI.changePassword(user._id, { currentPassword, newPassword, confirmPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password changed successfully.');
    } catch (error) {
      setPasswordError(error.response?.data?.message || error.message || 'Unable to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const actions = (
    <div className="udm-action-box">
      <div className="udm-action-caption">
        <strong>Manage user</strong>
        <span>Update this account</span>
      </div>
      <div className="udm-actions">
        <button type="button" className="udm-btn udm-btn-edit" onClick={() => onEdit(user)}>
          <Edit2 size={15} />
          <span>Edit User</span>
        </button>
        <button type="button" className="udm-btn udm-btn-password" onClick={() => setChangePasswordOpen(true)}>
          <LockKeyhole size={15} />
          <span>Change Password</span>
        </button>
        <button
          type="button"
          className="udm-btn udm-btn-delete"
          disabled={user.role === 'Admin'}
          title={user.role === 'Admin' ? 'Admin cannot be deleted' : ''}
          onClick={() => onDelete(user)}
        >
          <Trash2 size={15} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <WorkspaceDetail title="User Information" onBack={onClose}>
        {actions}

        <div className="udm-section-heading">
          <div>
            <h2>User details</h2>
            <p>Basic account information</p>
          </div>
        </div>

        <div className="udm-info-list">
          <div className="udm-info-row">
            <span className="udm-label">Employee ID</span>
            <span className="udm-value mono">{user.employeeId || 'Not provided'}</span>
          </div>
          <div className="udm-info-row">
            <span className="udm-label">Name</span>
            <span className="udm-value">{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Not provided'}</span>
          </div>
          <div className="udm-info-row">
            <span className="udm-label">Email</span>
            <span className="udm-value">{user.email || 'Not provided'}</span>
          </div>
          <div className="udm-info-row">
            <span className="udm-label">Role</span>
            <span className="udm-value">{user.role || 'Not provided'}</span>
          </div>
          <div className="udm-info-row">
            <span className="udm-label">Phone Number</span>
            <span className="udm-value">{user.phoneNumber || 'Not provided'}</span>
          </div>
          <div className="udm-info-row">
            <span className="udm-label">Location</span>
            <span className="udm-value">{user.location || 'Not provided'}</span>
          </div>
          {user.role === 'Employee' && (
            <div className="udm-info-row">
              <span className="udm-label">Designation</span>
              <span className="udm-value">{user.designation || 'Not provided'}</span>
            </div>
          )}
          <div className="udm-info-row">
            <span className="udm-label">Account Status</span>
            <span className="udm-value">{user.status || 'Not provided'}</span>
          </div>
        </div>
      </WorkspaceDetail>

      <Modal
        isOpen={changePasswordOpen}
        onClose={closePasswordModal}
        title="Change User Password"
        size="sm"
        footer={(
          <>
            <Button variant="secondary" onClick={closePasswordModal} disabled={savingPassword}>Cancel</Button>
            <Button variant="primary" type="submit" form="udm-password-form" disabled={savingPassword}>
              {savingPassword ? 'Saving...' : 'Save Password'}
            </Button>
          </>
        )}
      >
        <form id="udm-password-form" className="udm-password-form" onSubmit={handlePasswordChange}>
          <p>Enter the current password and confirm the new password for <strong>{user.email}</strong>.</p>
          <label htmlFor="udm-current-password">Current password</label>
          <input
            id="udm-current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
          <label htmlFor="udm-new-password">New password</label>
          <input
            id="udm-new-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <label htmlFor="udm-confirm-password">Confirm new password</label>
          <input
            id="udm-confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          {passwordError && <div className="udm-password-message error">{passwordError}</div>}
          {passwordSuccess && <div className="udm-password-message success">{passwordSuccess}</div>}
        </form>
      </Modal>
    </>
  );
};

export default UserDetailModal;
