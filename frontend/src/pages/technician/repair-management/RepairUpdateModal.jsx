import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { repairAPI } from '../../../services/api';
import { Wrench, CheckCircle, AlertOctagon, AlertCircle } from 'lucide-react';
import './RepairUpdateModal.css';

const RepairUpdateModal = ({ isOpen, onClose, onSuccess, repair }) => {
  const [inspectionDetails, setInspectionDetails] = useState('');
  const [sparePartsUsed, setSparePartsUsed] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [repairStatus, setRepairStatus] = useState('In Progress');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && repair) {
      setInspectionDetails(repair.inspectionDetails || '');
      setSparePartsUsed(repair.sparePartsUsed || '');
      setRepairCost(repair.repairCost !== undefined ? repair.repairCost : '0');
      setRepairStatus(repair.repairStatus === 'Pending' || repair.repairStatus === 'Assigned' ? 'In Progress' : repair.repairStatus);
      setRemarks(repair.remarks || '');
      setError('');
    }
  }, [isOpen, repair]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (repairCost !== '' && (isNaN(repairCost) || Number(repairCost) < 0)) {
      setError('Repair cost must be a valid non-negative number.');
      return;
    }

    try {
      setLoading(true);
      await repairAPI.updateRepairProgress(repair._id, {
        inspectionDetails,
        sparePartsUsed,
        repairCost: Number(repairCost || 0),
        repairStatus,
        remarks
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error updating repair');
    } finally {
      setLoading(false);
    }
  };

  if (!repair) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Work Order & Repair Progress"
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
            icon={Wrench}
          >
            {loading ? 'Saving...' : 'Save Work Progress'}
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

      <form onSubmit={handleSubmit} className="repair-modal-stack">
        <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
          <div><strong>Asset:</strong> {repair.asset?.assetName} [{repair.asset?.assetTag}]</div>
          <div style={{ marginTop: '0.2rem', color: '#64748b' }}>
            <strong>Fault Reported:</strong> {repair.repairDescription}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Work Order Status *</label>
          <select
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            value={repairStatus}
            onChange={(e) => setRepairStatus(e.target.value)}
            required
          >
            <option value="In Progress">In Progress (Diagnosing / Under Service)</option>
            <option value="Completed">Completed (Fully Repaired &amp; Tested)</option>
            <option value="Unrepairable">Unrepairable (Irreparable Hardware Fault)</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Inspection &amp; Diagnosis Details</label>
          <textarea
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
            rows="3"
            value={inspectionDetails}
            onChange={(e) => setInspectionDetails(e.target.value)}
            placeholder="e.g. Diagnosed swollen battery, replaced thermal paste, tested memory modules..."
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Spare Parts Used</label>
          <input
            type="text"
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            value={sparePartsUsed}
            onChange={(e) => setSparePartsUsed(e.target.value)}
            placeholder="e.g. OEM Battery (Part #A2171), 16GB DDR5 Module"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Total Repair Cost ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            value={repairCost}
            onChange={(e) => setRepairCost(e.target.value)}
            placeholder="120.00"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Technician Remarks / Post-Service Instructions</label>
          <textarea
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
            rows="2"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Burn-in test successful, wiped clean, ready for handover."
          />
        </div>
      </form>
    </Modal>
  );
};

export default RepairUpdateModal;
