import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { Edit2, KeyRound } from 'lucide-react';
import './Profile.css';

const LOCATIONS = ['Domlur', 'Devanahalli', 'Kovilpatti', 'Hyderabad'];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';

  const openEditProfile = () => {
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      location: user?.location || LOCATIONS[0],
      designation: user?.designation || ''
    });
    setEditError('');
    setProfileNotice('');
    setEditProfileOpen(true);
  };

  const closeEditProfile = () => {
    if (savingProfile) return;
    setEditProfileOpen(false);
    setEditError('');
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setEditError('');
    try {
      setSavingProfile(true);
      const response = await authAPI.updateProfile(editForm);
      updateUser(response.data.user);
      setProfileNotice(response.data.message || 'Profile updated successfully.');
      setEditProfileOpen(false);
    } catch (error) {
      setEditError(error.response?.data?.message || error.message || 'Unable to update your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const closePasswordModal = () => {
    if (savingPassword) return;
    setPasswordModalOpen(false);
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
      const response = await authAPI.changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(response.data.message || 'Password changed successfully.');
    } catch (error) {
      setPasswordError(error.response?.data?.message || error.message || 'Unable to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const fields = [
    ['Employee ID', user?.employeeId],
    ['Name', fullName],
    ['Email', user?.email],
    ['Role', user?.role],
    ['Phone Number', user?.phoneNumber],
    ['Location', user?.location],
    ...(user?.role === 'Employee' ? [['Designation', user?.designation]] : []),
    ['Account Status', user?.status]
  ];

  return (
    <div className="profile-page">
      <header className="profile-page-heading">
        <span className="profile-eyebrow">ACCOUNT</span>
        <h1>User Profile</h1>
        <p>View and manage your personal and organization account details.</p>
      </header>

      <section className="profile-action-box" aria-label="Profile actions">
        <div className="profile-action-caption">
          <strong>Manage your profile</strong>
          <span>Update your information or account password.</span>
        </div>
        <div className="profile-actions">
          <button type="button" className="profile-action-btn edit" onClick={openEditProfile}>
            <Edit2 size={15} />
            Edit Profile
          </button>
          <button type="button" className="profile-action-btn password" onClick={() => {
            setPasswordError('');
            setPasswordSuccess('');
            setProfileNotice('');
            setPasswordModalOpen(true);
          }}>
            <KeyRound size={15} />
            Change Password
          </button>
        </div>
      </section>

      {profileNotice && <div className="profile-notice" role="status">{profileNotice}</div>}

      <section className="profile-details-card" aria-labelledby="profile-details-title">
        <div className="profile-section-heading">
          <h2 id="profile-details-title">User Information</h2>
          <p>Your saved account details</p>
        </div>
        <div className="profile-info-list">
          {fields.map(([label, value]) => (
            <div className="profile-info-row" key={label}>
              <span className="profile-label">{label}</span>
              <span className="profile-value">{value || 'Not provided'}</span>
            </div>
          ))}
        </div>
      </section>

      <Modal
        isOpen={editProfileOpen}
        onClose={closeEditProfile}
        title="Edit Profile"
        size="md"
        footer={(
          <>
            <Button variant="secondary" onClick={closeEditProfile} disabled={savingProfile}>Cancel</Button>
            <Button variant="primary" type="submit" form="profile-edit-form" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        )}
      >
        <form id="profile-edit-form" className="profile-edit-form" onSubmit={handleProfileSave}>
          <div className="profile-form-grid">
            <div className="profile-form-field">
              <label htmlFor="profile-first-name">First name</label>
              <input id="profile-first-name" name="firstName" value={editForm.firstName || ''} onChange={handleProfileChange} required />
            </div>
            <div className="profile-form-field">
              <label htmlFor="profile-last-name">Last name</label>
              <input id="profile-last-name" name="lastName" value={editForm.lastName || ''} onChange={handleProfileChange} required />
            </div>
            <div className="profile-form-field profile-form-field-full">
              <label htmlFor="profile-email">Email</label>
              <input id="profile-email" name="email" type="email" value={editForm.email || ''} onChange={handleProfileChange} required />
            </div>
            <div className="profile-form-field">
              <label htmlFor="profile-phone">Phone number</label>
              <input id="profile-phone" name="phoneNumber" type="tel" value={editForm.phoneNumber || ''} onChange={handleProfileChange} />
            </div>
            <div className="profile-form-field">
              <label htmlFor="profile-location">Location</label>
              <select id="profile-location" name="location" value={editForm.location || LOCATIONS[0]} onChange={handleProfileChange}>
                {LOCATIONS.map((location) => <option key={location} value={location}>{location}</option>)}
              </select>
            </div>
            {user?.role === 'Employee' && (
              <div className="profile-form-field profile-form-field-full">
                <label htmlFor="profile-designation">Designation</label>
                <input id="profile-designation" name="designation" value={editForm.designation || ''} onChange={handleProfileChange} />
              </div>
            )}
          </div>
          {editError && <div className="profile-password-message error">{editError}</div>}
        </form>
      </Modal>

      <Modal
        isOpen={passwordModalOpen}
        onClose={closePasswordModal}
        title="Change Password"
        size="sm"
        footer={(
          <>
            <Button variant="secondary" onClick={closePasswordModal} disabled={savingPassword}>Cancel</Button>
            <Button variant="primary" type="submit" form="profile-password-form" disabled={savingPassword}>
              {savingPassword ? 'Saving...' : 'Save Password'}
            </Button>
          </>
        )}
      >
        <form id="profile-password-form" className="profile-password-form" onSubmit={handlePasswordChange}>
          <p>Enter your current password, then choose and confirm a new password.</p>
          <label htmlFor="profile-current-password">Current password</label>
          <input id="profile-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          <label htmlFor="profile-new-password">New password</label>
          <input id="profile-new-password" type="password" autoComplete="new-password" minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          <label htmlFor="profile-confirm-password">Confirm new password</label>
          <input id="profile-confirm-password" type="password" autoComplete="new-password" minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          {passwordError && <div className="profile-password-message error">{passwordError}</div>}
          {passwordSuccess && <div className="profile-password-message success">{passwordSuccess}</div>}
        </form>
      </Modal>
    </div>
  );
};

export default Profile;
