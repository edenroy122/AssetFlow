import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { userAPI, assignmentAPI } from '../../../services/api';
import { AlertCircle, UserCheck } from 'lucide-react';
import './AssignAssetModal.css';

const AssignAssetModal = ({
  isOpen,
  onClose,
  onSuccess,
  asset,
  presetEmployeeId = null,
  requestId = null
}) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(presetEmployeeId || '');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [conditionAtAssignment, setConditionAtAssignment] = useState('Good');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchEmployees = async () => {
        try {
          const response = await userAPI.getUsers({ role: 'Employee', status: 'Active' });
          if (response.data.success) {
            setEmployees(response.data.users);
            if (presetEmployeeId) {
              setSelectedEmployee(presetEmployeeId);
            } else if (response.data.users.length > 0) {
              setSelectedEmployee(response.data.users[0]._id);
            }
          }
        } catch (err) {
          console.error('Error fetching employees:', err);
        }
      };
      fetchEmployees();
      setConditionAtAssignment(asset?.condition || 'Good');
      setError('');
    }
  }, [isOpen, asset, presetEmployeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setError('Please select an employee.');
      return;
    }

    try {
      setLoading(true);
      await assignmentAPI.assignAsset({
        assetId: asset._id,
        employeeId: selectedEmployee,
        expectedReturnDate,
        conditionAtAssignment,
        remarks,
        requestId
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign asset');
    } finally {
      setLoading(false);
    }
  };

  if (!asset) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Asset to Employee"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            icon={UserCheck}
          >
            {loading ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </>
      }
    >
      {error && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="modal-form-stack">
        <div className="asset-preview-bar">
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{asset.assetName}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Tag: {asset.assetTag} | {asset.brand} {asset.model}
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669' }}>
            Available
          </div>
        </div>

        <div className="modal-form-group">
          <label className="modal-form-label">
            Select Employee <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            className="modal-form-select"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            required
          >
            <option value="">-- Choose Employee --</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName} ({emp.employeeId}) {emp.designation ? `• ${emp.designation}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-form-group">
          <label className="modal-form-label">Condition at Handover</label>
          <select
            className="modal-form-select"
            value={conditionAtAssignment}
            onChange={(e) => setConditionAtAssignment(e.target.value)}
          >
            <option value="New">New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>
        </div>

        <div className="modal-form-group">
          <label className="modal-form-label">Expected Return Date (Optional)</label>
          <input
            type="date"
            className="modal-form-input"
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
          />
        </div>

        <div className="modal-form-group">
          <label className="modal-form-label">Assignment Remarks / Notes</label>
          <textarea
            className="modal-form-textarea"
            rows="3"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Provisioned with power adapter, mouse and carry bag"
          />
        </div>
      </form>
    </Modal>
  );
};

export default AssignAssetModal;
