import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { assignmentAPI } from '../../../services/api';
import { AlertCircle, RotateCcw } from 'lucide-react';
import './ReturnAssetModal.css';

const ReturnAssetModal = ({
  isOpen,
  onClose,
  onSuccess,
  asset,
  requestId = null
}) => {
  const [conditionAtReturn, setConditionAtReturn] = useState('Good');
  const [finalStatus, setFinalStatus] = useState('Available');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConditionAtReturn(asset?.condition || 'Good');
      setFinalStatus('Available');
      setRemarks('');
      setError('');
    }
  }, [isOpen, asset]);

  // Adjust recommended status when condition changes (Workflow D)
  const handleConditionChange = (e) => {
    const cond = e.target.value;
    setConditionAtReturn(cond);
    if (cond === 'Damaged') {
      setFinalStatus('Under Maintenance');
    } else if (cond === 'Poor') {
      setFinalStatus('Under Maintenance');
    } else {
      setFinalStatus('Available');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await assignmentAPI.returnAsset(
        asset.currentAssignment?._id || asset.currentAssignment,
        {
          conditionAtReturn,
          finalStatus,
          remarks,
          requestId
        }
      );
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process return');
    } finally {
      setLoading(false);
    }
  };

  if (!asset) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Asset Return Inspection"
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
            icon={RotateCcw}
          >
            {loading ? 'Processing...' : 'Confirm Return & Update Status'}
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

      <form onSubmit={handleSubmit} className="return-form-stack">
        <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
          <div><strong>Asset:</strong> {asset.assetName} [{asset.assetTag}]</div>
          <div style={{ marginTop: '0.2rem', color: '#64748b' }}>
            <strong>Returning Employee:</strong> {asset.assignedTo?.firstName} {asset.assignedTo?.lastName} ({asset.assignedTo?.employeeId})
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Inspected Condition upon Return *</label>
          <select
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            value={conditionAtReturn}
            onChange={handleConditionChange}
            required
          >
            <option value="New">New - pristine, like new</option>
            <option value="Good">Good - normal light wear</option>
            <option value="Fair">Fair - visible signs of use</option>
            <option value="Poor">Poor - heavy wear or minor faults</option>
            <option value="Damaged">Damaged - physical damage or non-functional</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Final Asset Status (Depends on Inspection) *</label>
          <select
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            value={finalStatus}
            onChange={(e) => setFinalStatus(e.target.value)}
            required
          >
            <option value="Available">Available (Ready for next assignment)</option>
            <option value="Under Maintenance">Under Maintenance (Requires service / technician)</option>
            <option value="Damaged">Damaged (Not usable)</option>
            <option value="Retired">Retired (Remove permanently from usage)</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Inspection Notes / Remarks</label>
          <textarea
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
            rows="3"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Condition of screen, keyboard, accessories returned, battery health..."
          />
        </div>
      </form>
    </Modal>
  );
};

export default ReturnAssetModal;
