import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { assetAPI, userAPI, repairAPI } from '../../../services/api';
import { Wrench, AlertCircle } from 'lucide-react';
import './CreateWorkOrderModal.css';

const CreateWorkOrderModal = ({ isOpen, onClose, onSuccess, initialAsset = null }) => {
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [repairDescription, setRepairDescription] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          let [assetsRes, techsRes] = await Promise.all([
            assetAPI.getAssets({ limit: 100 }),
            userAPI.getUsers({ role: 'Support Team', status: 'Active' })
          ]);

          const availableTechs = techsRes.data?.users || [];

          if (assetsRes.data.success) {
            // Filter eligible assets (not retired or lost)
            const eligible = assetsRes.data.assets.filter(
              (a) => a.status !== 'Retired' && a.status !== 'Lost'
            );
            setAssets(eligible);
            if (initialAsset) {
              setSelectedAssetId(initialAsset._id);
            } else if (eligible.length > 0) {
              setSelectedAssetId(eligible[0]._id);
            }
          }

          setTechnicians(availableTechs);
          if (availableTechs.length > 0) {
            setSelectedTechnicianId(availableTechs[0]._id);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchData();
      setRepairDescription('');
      setRemarks('');
      setError('');
    }
  }, [isOpen, initialAsset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetId || !repairDescription.trim()) {
      setError('Please select an asset and enter repair description.');
      return;
    }

    try {
      setLoading(true);
      await repairAPI.createWorkOrder({
        assetId: selectedAssetId,
        assignedTechnicianId: selectedTechnicianId || null,
        repairDescription,
        remarks
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error creating work order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Maintenance Work Order"
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
            {loading ? 'Creating...' : 'Issue Work Order'}
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

      <form onSubmit={handleSubmit} className="work-order-form-stack">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Select Asset *</label>
          <select
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            required
          >
            {assets.map((asset) => (
              <option key={asset._id} value={asset._id}>
                {asset.assetName} [Tag: {asset.assetTag}] • Status: {asset.status} ({asset.condition})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Assign Support Team Member</label>
          <select
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
            value={selectedTechnicianId}
            onChange={(e) => setSelectedTechnicianId(e.target.value)}
          >
            <option value="">-- Unassigned / Assign Later --</option>
            {technicians.map((tech) => (
              <option key={tech._id} value={tech._id}>
                {tech.firstName} {tech.lastName} ({tech.employeeId}) • {tech.location}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Fault / Repair Description *</label>
          <textarea
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
            rows="3"
            value={repairDescription}
            onChange={(e) => setRepairDescription(e.target.value)}
            placeholder="e.g. Battery not charging, cracked screen, cooling fan failure..."
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Internal Instructions / Remarks</label>
          <textarea
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
            rows="2"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Priority level, vendor warranty contact details..."
          />
        </div>
      </form>
    </Modal>
  );
};

export default CreateWorkOrderModal;
