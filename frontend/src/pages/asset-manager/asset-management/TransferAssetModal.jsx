import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { userAPI, assignmentAPI } from '../../../services/api';
import { AlertCircle, ArrowRightLeft } from 'lucide-react';
import './TransferAssetModal.css';

const TransferAssetModal = ({ isOpen, onClose, onSuccess, asset }) => {
  const [employees, setEmployees] = useState([]);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && asset) {
      const fetchEmployees = async () => {
        try {
          const res = await userAPI.getUsers({ role: 'Employee', status: 'Active' });
          if (res.data.success) {
            // Filter out currently assigned employee
            const filtered = res.data.users.filter(
              (u) => String(u._id) !== String(asset.assignedTo?._id)
            );
            setEmployees(filtered);
            if (filtered.length > 0) setNewEmployeeId(filtered[0]._id);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchEmployees();
      setNewLocation(asset.location || 'Headquarters');
      setError('');
    }
  }, [isOpen, asset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newEmployeeId) {
      setError('Please select recipient employee.');
      return;
    }

    try {
      setLoading(true);
      await assignmentAPI.transferAsset(asset.currentAssignment?._id || asset.currentAssignment, {
        newEmployeeId,
        newLocation,
        remarks
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  if (!asset) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Asset Ownership"
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
            icon={ArrowRightLeft}
          >
            {loading ? 'Transferring...' : 'Confirm Transfer'}
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

      <form onSubmit={handleSubmit} className="transfer-form-stack">
        <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
          <div><strong>Asset:</strong> {asset.assetName} [{asset.assetTag}]</div>
          <div style={{ marginTop: '0.2rem', color: '#64748b' }}>
            <strong>Currently with:</strong> {asset.assignedTo?.firstName} {asset.assignedTo?.lastName} ({asset.assignedTo?.employeeId})
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>New Employee Recipient *</label>
          <select
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            value={newEmployeeId}
            onChange={(e) => setNewEmployeeId(e.target.value)}
            required
          >
            <option value="">-- Choose New Employee --</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName} ({emp.employeeId})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>New Asset Location</label>
          <input
            type="text"
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Transfer Reason / Remarks</label>
          <textarea
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
            rows="3"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Department relocation, role change, handover..."
          />
        </div>
      </form>
    </Modal>
  );
};

export default TransferAssetModal;
