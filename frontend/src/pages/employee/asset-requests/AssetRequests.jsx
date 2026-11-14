import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestAPI, assignmentAPI } from '../../../services/api';
import Button from '../../../components/common/Button';
import RequestNavbar from './RequestNavbar';
import {
  Send,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import './AssetRequests.css';

const AssetRequests = () => {
  const navigate = useNavigate();
  const [requestType, setRequestType] = useState('New Asset');
  const [myAssets, setMyAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Form states
  const [requestedAssetName, setRequestedAssetName] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [reason, setReason] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load employee's assigned assets for Replacement, Repair, Return
  useEffect(() => {
    const fetchMyAssets = async () => {
      try {
        setLoadingAssets(true);
        const res = await assignmentAPI.getMyAssignedAssets();
        if (res.data.success) {
          setMyAssets(res.data.assignments.map((a) => a.asset).filter(Boolean));
        }
      } catch (err) {
        console.error('Error fetching employee assets:', err);
      } finally {
        setLoadingAssets(false);
      }
    };
    fetchMyAssets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!reason.trim()) {
      setError('Please provide a business justification / reason.');
      return;
    }

    if (requestType === 'New Asset' && !requestedAssetName.trim()) {
      setError('Please specify the asset name you are requesting (e.g. Laptop, Ergonomic Chair).');
      return;
    }

    if (requestType !== 'New Asset' && !selectedAssetId) {
      setError(`Please select an assigned asset for your ${requestType} request.`);
      return;
    }

    try {
      setSubmitting(true);
      await requestAPI.createRequest({
        requestType,
        requestedAssetName: requestType === 'New Asset' ? requestedAssetName : undefined,
        specifications: requestType === 'New Asset' ? specifications : undefined,
        reason,
        assetId: requestType !== 'New Asset' ? selectedAssetId : undefined
      });

      setSuccess(true);
      setRequestedAssetName('');
      setSpecifications('');
      setReason('');

      setTimeout(() => {
        navigate('/employee/my-requests');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="asset-request-page">
      {/* 1. Header Section */}
      <div className="request-page-header">
        <h1 className="request-page-title">Submit Asset Request</h1>
        <p className="request-page-subtitle">
          Enterprise hardware requisition and equipment service desk
        </p>
      </div>

      {/* Leave a space before the navbar */}
      <div className="request-spacer" />

      {/* 2. Standalone Navbar Component */}
      <RequestNavbar
        activeType={requestType}
        onSelectType={(type) => {
          setRequestType(type);
          setError('');
        }}
      />

      {/* Leave a space before the form */}
      <div className="request-spacer" />

      {/* 3. Requisition Form Card */}
      <div className="request-form-card">
        {error && (
          <div className="request-alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="request-alert alert-success">
            <CheckCircle2 size={18} />
            <span>Your request has been submitted successfully! Redirecting to tracker...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="request-form-stack">
          {/* For New Asset */}
          {requestType === 'New Asset' && (
            <>
              <div className="form-group">
                <label className="form-label">
                  Requested Asset Name <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Workstation Laptop, 4K External Monitor, Keyboard"
                  value={requestedAssetName}
                  onChange={(e) => setRequestedAssetName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Desired Hardware Specifications</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Intel i7, 16GB RAM, 1TB SSD or 27-inch USB-C monitor"
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                />
              </div>
            </>
          )}

          {/* For Replacement, Repair, Return: Select Assigned Asset */}
          {requestType !== 'New Asset' && (
            <div className="assigned-asset-select-card">
              <label className="form-label" htmlFor="request-asset-id">
                Asset ID <span className="req-star">*</span>
              </label>

              {loadingAssets ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading your assigned assets...</p>
              ) : myAssets.length === 0 ? (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                  You currently have no physical assets assigned to your profile. You cannot submit a {requestType.toLowerCase()} request.
                </div>
              ) : (
                <>
                <select
                  id="request-asset-id"
                  className="form-select"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                >
                  <option value="">Choose an asset ID</option>
                  {myAssets.map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      {asset.assetTag || asset._id}
                    </option>
                  ))}
                </select>
                {selectedAssetId && (
                  <div className="selected-asset-name" aria-live="polite">
                    <span className="selected-asset-label">Asset name</span>
                    <span className="selected-asset-value">
                      {myAssets.find((asset) => asset._id === selectedAssetId)?.assetName || ""}
                    </span>
                  </div>
                )}
                </>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="form-group">
            <label className="form-label">
              Business Justification / Reason <span className="req-star">*</span>
            </label>
            <textarea
              rows="4"
              className="form-textarea"
              placeholder={
                requestType === 'New Asset'
                  ? 'Explain why this asset is required for your official role...'
                  : requestType === 'Repair'
                  ? 'Describe the physical or operational issue with the asset in detail...'
                  : requestType === 'Replacement'
                  ? 'Describe why the current asset needs replacement...'
                  : 'Specify reason for returning the asset (e.g. project completion, upgraded)...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="form-submit-row">
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              disabled={submitting || (requestType !== 'New Asset' && myAssets.length === 0)}
            >
              {submitting ? 'Submitting Request...' : `Submit ${requestType} Request`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetRequests;
