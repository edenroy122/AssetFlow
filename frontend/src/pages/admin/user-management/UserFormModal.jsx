import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { userAPI } from '../../../services/api';
import {
  AlertCircle,
  UserPlus,
  UserCheck,
  User,
  Mail,
  Hash,
  Lock,
  Shield,
  Briefcase,
  MapPin,
  Phone,
  Activity,
} from 'lucide-react';
import './UserFormModal.css';

const DESIGNATIONS = [
  'Developer',
  'Tester',
  'HR',
  'Accounts',
  'Business Analyst',
  'Support Engineer',
  'Other',
];

const LOCATIONS = ['Domlur', 'Devanahalli', 'Kovilpatti', 'Hyderabad'];

const ROLES = [
  'Admin',
  'Asset Manager',
  'Support Team',
  'Employee',
];

const UserFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  editUser = null, // null → Create Mode; object → Edit Mode
}) => {
  const isEdit = Boolean(editUser);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    password: '',
    role: 'Employee',
    designation: 'Developer',
    location: 'Domlur',
    phoneNumber: '',
    status: 'Active',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editUser) {
      setFormData({
        firstName: editUser.firstName || '',
        lastName: editUser.lastName || '',
        email: editUser.email || '',
        employeeId: editUser.employeeId || '',
        password: '',
        role: editUser.role || 'Employee',
        designation:
          editUser.role === 'Employee'
            ? editUser.designation || 'Developer'
            : '',
        location: editUser.location || 'Domlur',
        phoneNumber: editUser.phoneNumber || '',
        status: editUser.status || 'Active',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        employeeId: 'MISTRAL-',
        password: '',
        role: 'Employee',
        designation: 'Developer',
        location: 'Domlur',
        phoneNumber: '',
        status: 'Active',
      });
    }
    setError('');
  }, [editUser, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'role') {
      setFormData((prev) => ({
        ...prev,
        role: value,
        designation: value === 'Employee' ? 'Developer' : '',
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim()
    ) {
      setError('Please fill in all required personal information fields.');
      return;
    }

    if (!formData.employeeId.startsWith('MISTRAL')) {
      setError(
        "Employee ID must strictly begin with the 'MISTRAL' prefix (e.g., MISTRAL-001)."
      );
      return;
    }

    if (!isEdit && (!formData.password || formData.password.length < 6)) {
      setError('Password is required and must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const payload = { ...formData };
      if (isEdit && !payload.password) {
        delete payload.password;
      }

      const response = isEdit
        ? await userAPI.updateUser(editUser._id, payload)
        : await userAPI.createUser(payload);

      onSuccess(response?.data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Operation failed. Please check inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isMistralInvalid =
    formData.employeeId && !formData.employeeId.startsWith('MISTRAL');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit User Details' : 'Register New User'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            icon={isEdit ? UserCheck : UserPlus}
          >
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </>
      }
    >
      {/* Error banner */}
      {error && (
        <div className="ufm-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ufm-form" autoComplete="off">
        {/* ─── Section: Personal Information ─── */}
        <fieldset className="ufm-section">
          <legend className="ufm-section-title">
            <User size={15} />
            Personal Information
          </legend>

          <div className="ufm-row">
            <div className="ufm-field">
              <label className="ufm-label">
                First Name <span className="ufm-req">*</span>
              </label>
              <div className="ufm-input-wrap">
                <User size={15} className="ufm-input-icon" />
                <input
                  type="text"
                  name="firstName"
                  className="ufm-input"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                />
              </div>
            </div>

            <div className="ufm-field">
              <label className="ufm-label">
                Last Name <span className="ufm-req">*</span>
              </label>
              <div className="ufm-input-wrap">
                <User size={15} className="ufm-input-icon" />
                <input
                  type="text"
                  name="lastName"
                  className="ufm-input"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
          </div>

          <div className="ufm-row">
            <div className="ufm-field">
              <label className="ufm-label">
                Email Address <span className="ufm-req">*</span>
              </label>
              <div className="ufm-input-wrap">
                <Mail size={15} className="ufm-input-icon" />
                <input
                  type="email"
                  name="email"
                  className="ufm-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@organization.com"
                  required
                />
              </div>
            </div>

            <div className="ufm-field">
              <label className="ufm-label">
                Phone Number
              </label>
              <div className="ufm-input-wrap">
                <Phone size={15} className="ufm-input-icon" />
                <input
                  type="text"
                  name="phoneNumber"
                  className="ufm-input"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+91-9876543210"
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* ─── Section: Credentials ─── */}
        <fieldset className="ufm-section">
          <legend className="ufm-section-title">
            <Lock size={15} />
            Credentials
          </legend>

          <div className="ufm-row">
            <div className="ufm-field">
              <label className="ufm-label">
                Employee ID <span className="ufm-req">*</span>
              </label>
              <div className={`ufm-input-wrap ${isMistralInvalid ? 'ufm-input-error' : ''}`}>
                <Hash size={15} className="ufm-input-icon" />
                <input
                  type="text"
                  name="employeeId"
                  className="ufm-input"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="MISTRAL-001"
                  required
                />
              </div>
              {isMistralInvalid ? (
                <span className="ufm-hint ufm-hint-error">
                  Must start with prefix <strong>MISTRAL</strong>
                </span>
              ) : (
                <span className="ufm-hint">Format: MISTRAL-XXX</span>
              )}
            </div>

            <div className="ufm-field">
              <label className="ufm-label">
                {isEdit ? 'New Password' : 'Password'}
                {!isEdit && <span className="ufm-req">*</span>}
              </label>
              <div className="ufm-input-wrap">
                <Lock size={15} className="ufm-input-icon" />
                <input
                  type="password"
                  name="password"
                  className="ufm-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 6 characters'}
                  autoComplete="new-password"
                  required={!isEdit}
                />
              </div>
              {isEdit && (
                <span className="ufm-hint">Leave blank to keep current password</span>
              )}
            </div>
          </div>
        </fieldset>

        {/* ─── Section: Role & Assignment ─── */}
        <fieldset className="ufm-section">
          <legend className="ufm-section-title">
            <Shield size={15} />
            Role &amp; Assignment
          </legend>

          <div className="ufm-row">
            <div className="ufm-field">
              <label className="ufm-label">
                System Role <span className="ufm-req">*</span>
              </label>
              <div className="ufm-input-wrap">
                <Shield size={15} className="ufm-input-icon" />
                <select
                  name="role"
                  className="ufm-select"
                  value={formData.role}
                  onChange={handleChange}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <span className="ufm-hint">
                Only 1 Admin and 1 Asset Manager allowed
              </span>
            </div>

            <div className="ufm-field">
              <label className="ufm-label">
                Location <span className="ufm-req">*</span>
              </label>
              <div className="ufm-input-wrap">
                <MapPin size={15} className="ufm-input-icon" />
                <select
                  name="location"
                  className="ufm-select"
                  value={formData.location}
                  onChange={handleChange}
                  required
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Designation — only for Employee role */}
          {formData.role === 'Employee' && (
            <div className="ufm-designation-box">
              <div className="ufm-field">
                <label className="ufm-label ufm-label-green">
                  <Briefcase size={14} style={{ marginRight: '0.3rem' }} />
                  Employee Designation <span className="ufm-req">*</span>
                </label>
                <div className="ufm-input-wrap">
                  <Briefcase size={15} className="ufm-input-icon" />
                  <select
                    name="designation"
                    className="ufm-select"
                    value={formData.designation}
                    onChange={handleChange}
                    required
                  >
                    {DESIGNATIONS.map((desig) => (
                      <option key={desig} value={desig}>
                        {desig}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="ufm-hint ufm-hint-green">
                  Applicable only for the Employee role
                </span>
              </div>
            </div>
          )}

          <div className="ufm-row">
            <div className="ufm-field ufm-field-full">
              <label className="ufm-label">
                Account Status
              </label>
              <div className="ufm-input-wrap">
                <Activity size={15} className="ufm-input-icon" />
                <select
                  name="status"
                  className="ufm-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
};

export default UserFormModal;
