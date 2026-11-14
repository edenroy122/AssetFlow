import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { assetAPI, requestAPI } from '../../../services/api';
import {
  PackageCheck,
  Search,
  CheckCircle,
  AlertCircle,
  Laptop,
  Check,
  RotateCcw,
  Wrench
} from 'lucide-react';
import './HandoverModal.css';

const HandoverModal = ({ isOpen, onClose, onSuccess, request }) => {
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');

  // Replacement specific
  const [oldAssetCondition, setOldAssetCondition] = useState('Good');
  const [oldAssetFinalStatus, setOldAssetFinalStatus] = useState('Under Maintenance');

  // General handover fields
  const [conditionAtAssignment, setConditionAtAssignment] = useState('Good');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && request) {
      setError('');
      setRemarks('');
      setSearchQuery('');
      setSelectedAssetId('');
      setOldAssetCondition('Good');
      setOldAssetFinalStatus(request.requestType === 'Return' ? 'Available' : 'Under Maintenance');

      if (request.requestType === 'New Asset' || request.requestType === 'Replacement') {
        const fetchAvailableAssets = async () => {
          try {
            setLoadingAssets(true);
            const res = await assetAPI.getAssets({ status: 'Available', limit: 500 });
            if (res.data.success) {
              setAvailableAssets(res.data.assets);
              if (res.data.assets.length > 0) {
                setSelectedAssetId(res.data.assets[0]._id);
              }
            }
          } catch (err) {
            console.error('Failed to load inventory assets', err);
          } finally {
            setLoadingAssets(false);
          }
        };

        fetchAvailableAssets();
      }
    }
  }, [isOpen, request]);

  if (!request) return null;

  const filteredAssets = availableAssets.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.assetName?.toLowerCase().includes(q) ||
      a.assetTag?.toLowerCase().includes(q) ||
      a.model?.toLowerCase().includes(q) ||
      a.serialNumber?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if ((request.requestType === 'New Asset' || request.requestType === 'Replacement') && !selectedAssetId) {
      setError('Please choose an available asset from inventory to fulfill this handover.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        remarks,
        conditionAtAssignment,
        expectedReturnDate: expectedReturnDate || undefined
      };

      if (request.requestType === 'New Asset') {
        payload.assetId = selectedAssetId;
      } else if (request.requestType === 'Replacement') {
        payload.replacementAssetId = selectedAssetId;
        payload.oldAssetCondition = oldAssetCondition;
        payload.oldAssetFinalStatus = oldAssetFinalStatus;
      } else if (request.requestType === 'Return') {
        payload.oldAssetCondition = oldAssetCondition;
        payload.oldAssetFinalStatus = oldAssetFinalStatus;
      }

      const res = await requestAPI.handoverRequest(request._id, payload);
      if (res.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Handover failed');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (request.requestType) {
      case 'New Asset':
        return `Select Asset & Handover — ${request.requestedBy?.firstName} ${request.requestedBy?.lastName}`;
      case 'Replacement':
        return `Process Asset Replacement Handover`;
      case 'Return':
        return `Verify & Accept Asset Return`;
      case 'Repair':
        return request.status === 'Approved' ? 'Confirm Asset Received for Repair' : 'Return Repaired Asset';
      default:
        return `Fulfill Request Handover`;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'space-between' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={PackageCheck}
            disabled={loading || (loadingAssets && (request.requestType === 'New Asset' || request.requestType === 'Replacement'))}
            onClick={handleSubmit}
          >
            {request.requestType === 'Return'
              ? 'Accept Return Handover'
              : request.requestType === 'Repair'
              ? request.status === 'Approved' ? 'Confirm Asset Received' : 'Complete Repair Handover'
              : 'Complete Handover & Allocate Asset'}
          </Button>
        </div>
      }
    >
      {error && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="handover-modal-body">
        {/* Request & Employee Summary */}
        <div className="handover-summary-card">
          <div className="handover-row">
            <span className="handover-label">Employee:</span>
            <span className="handover-val">
              {request.requestedBy?.firstName} {request.requestedBy?.lastName} ({request.requestedBy?.employeeId})
            </span>
          </div>
          <div className="handover-row">
            <span className="handover-label">Email / Phone:</span>
            <span className="handover-val">
              {request.requestedBy?.email || 'Email unavailable'}{request.requestedBy?.phoneNumber ? ` · ${request.requestedBy.phoneNumber}` : ''}
            </span>
          </div>
          {request.requestedBy?.designation && (
            <div className="handover-row">
              <span className="handover-label">Designation:</span>
              <span className="handover-val">{request.requestedBy.designation}</span>
            </div>
          )}
          <div className="handover-row">
            <span className="handover-label">Department / Location:</span>
            <span className="handover-val">{request.requestedBy?.location || 'HQ'}</span>
          </div>
          <div className="handover-row">
            <span className="handover-label">Request Type:</span>
            <span className="handover-val" style={{ color: '#0d9488' }}>{request.requestType}</span>
          </div>
          {request.requestedAssetName && (
            <div className="handover-row">
              <span className="handover-label">Requested Item:</span>
              <span className="handover-val">{request.requestedAssetName}</span>
            </div>
          )}
          {request.specifications && (
            <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid #e2e8f0' }}>
              <span className="handover-label">Desired Specifications:</span>
              <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500, marginTop: '0.2rem' }}>
                {request.specifications}
              </div>
            </div>
          )}
          {request.asset && (
            <div className="handover-row" style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid #e2e8f0' }}>
              <span className="handover-label">Current / Target Asset:</span>
              <span className="handover-val">
                {request.asset.assetName} [Tag: {request.asset.assetTag}]
              </span>
            </div>
          )}
          {request.reviewComment && (
            <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
              <strong>Manager Review Note:</strong> {request.reviewComment}
            </div>
          )}
        </div>

        {/* For New Asset or Replacement: Support chooses asset from inventory */}
        {(request.requestType === 'New Asset' || request.requestType === 'Replacement') && (
          <div className="inventory-selector-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                Select Asset from Available Inventory
              </div>
              <span style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 600 }}>
                {filteredAssets.length} Available
              </span>
            </div>

            <div className="inventory-search-bar">
              <Search size={16} color="#64748b" />
              <input
                type="text"
                className="inventory-search-input"
                placeholder="Search inventory by tag, model, serial, or specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loadingAssets ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                Loading available inventory...
              </div>
            ) : filteredAssets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#dc2626', fontSize: '0.85rem' }}>
                No available assets match your criteria. Please register assets into inventory first.
              </div>
            ) : (
              <>
                <div className="compact-asset-table-wrap">
                  <table className="compact-asset-table">
                    <thead>
                      <tr>
                        <th style={{ width: '38px', textAlign: 'center' }}>Select</th>
                        <th>Asset Tag</th>
                        <th>Asset Name &amp; Model</th>
                        <th>Condition</th>
                        <th>Specifications</th>
                        <th>Serial No</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset) => {
                        const isSelected = selectedAssetId === asset._id;
                        return (
                          <tr
                            key={asset._id}
                            className={`compact-asset-row ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedAssetId(asset._id)}
                          >
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="radio"
                                name="selectedHandoverAsset"
                                checked={isSelected}
                                onChange={() => setSelectedAssetId(asset._id)}
                                style={{ accentColor: '#0d9488', cursor: 'pointer' }}
                              />
                            </td>
                            <td>
                              <span className="compact-asset-tag">{asset.assetTag}</span>
                            </td>
                            <td>
                              <div className="compact-asset-title">{asset.assetName}</div>
                              <div className="compact-asset-meta">{asset.brand} {asset.model}</div>
                            </td>
                            <td>
                              <span className={`compact-badge ${asset.condition?.toLowerCase()}`}>
                                {asset.condition}
                              </span>
                            </td>
                            <td className="compact-asset-specs" title={asset.specifications || ''}>
                              {asset.specifications || '—'}
                            </td>
                            <td className="compact-asset-serial">{asset.serialNumber || '—'}</td>
                            <td>{asset.location || 'HQ'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {availableAssets.find((a) => a._id === selectedAssetId) && (
                  <div className="selected-asset-banner">
                    <Check size={16} />
                    <span>
                      Selected Asset: <strong>{availableAssets.find((a) => a._id === selectedAssetId).assetName}</strong> [Tag: <strong>{availableAssets.find((a) => a._id === selectedAssetId).assetTag}</strong>] • {availableAssets.find((a) => a._id === selectedAssetId).brand} {availableAssets.find((a) => a._id === selectedAssetId).model}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* For Replacement: Old Asset Handling */}
        {request.requestType === 'Replacement' && (
          <div style={{ background: '#fef3c7', padding: '0.85rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#92400e', marginBottom: '0.5rem' }}>
              Inspect &amp; Return Old Asset ({request.asset?.assetTag})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="handover-form-group">
                <label className="handover-form-label">Old Asset Condition</label>
                <select
                  className="handover-form-select"
                  value={oldAssetCondition}
                  onChange={(e) => setOldAssetCondition(e.target.value)}
                >
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div className="handover-form-group">
                <label className="handover-form-label">Old Asset Final Status</label>
                <select
                  className="handover-form-select"
                  value={oldAssetFinalStatus}
                  onChange={(e) => setOldAssetFinalStatus(e.target.value)}
                >
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* For Return: Return Condition & Final Status */}
        {request.requestType === 'Return' && (
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.5rem' }}>
              Inspect Returned Asset
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="handover-form-group">
                <label className="handover-form-label">Condition at Return</label>
                <select
                  className="handover-form-select"
                  value={oldAssetCondition}
                  onChange={(e) => setOldAssetCondition(e.target.value)}
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div className="handover-form-group">
                <label className="handover-form-label">Asset Restock / Final Status</label>
                <select
                  className="handover-form-select"
                  value={oldAssetFinalStatus}
                  onChange={(e) => setOldAssetFinalStatus(e.target.value)}
                >
                  <option value="Available">Available (Restock to Inventory)</option>
                  <option value="Under Maintenance">Under Maintenance (Requires Service)</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Additional Handover Parameters (Condition, Remarks) */}
        {(request.requestType === 'New Asset' || request.requestType === 'Replacement') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="handover-form-group">
              <label className="handover-form-label">Condition at Handover</label>
              <select
                className="handover-form-select"
                value={conditionAtAssignment}
                onChange={(e) => setConditionAtAssignment(e.target.value)}
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
            <div className="handover-form-group">
              <label className="handover-form-label">Expected Return Date (Optional)</label>
              <input
                type="date"
                className="handover-form-input"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="handover-form-group">
          <label className="handover-form-label">Support Handover Remarks / Physical Verification Notes</label>
          <textarea
            className="handover-form-textarea"
            rows="2"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g., Handed over laptop with charger, verified boot, signed physical acknowledgment slip..."
          />
        </div>
      </div>
    </Modal>
  );
};

export default HandoverModal;
