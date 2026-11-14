import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import { requestAPI, userAPI } from '../../../services/api';
import { AlertCircle, CheckCircle, XCircle, UserCheck, Shield } from 'lucide-react';
import './ReviewRequestModal.css';

const ReviewRequestModal = ({
  isOpen,
  onClose,
  onSuccess,
  request
}) => {
  const [reviewComment, setReviewComment] = useState('');
  const [supportMembers, setSupportMembers] = useState([]);
  const [selectedSupportId, setSelectedSupportId] = useState('');
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReviewComment('');
      setError('');
      setSelectedSupportId(request?.assignedSupport?._id || '');

      const fetchSupportStaff = async () => {
        try {
          setLoadingSupport(true);
          const supportRes = await userAPI.getUsers({ role: 'Support Team', status: 'Active', limit: 100 });
          const supportList = supportRes.data?.users || [];
          setSupportMembers(supportList);
          if (supportList.length > 0 && !request?.assignedSupport) {
            setSelectedSupportId(supportList[0]._id);
          }
        } catch (err) {
          console.error('Error fetching support team members:', err);
        } finally {
          setLoadingSupport(false);
        }
      };

      fetchSupportStaff();
    }
  }, [isOpen, request]);

  if (!request) return null;

  const handleSubmit = async (actionStatus) => {
    setError('');
    if (actionStatus === 'Rejected' && !reviewComment.trim()) {
      setError('Please provide a reason when rejecting an employee request.');
      return;
    }

    if (actionStatus === 'Approved' && !selectedSupportId) {
      setError('Please select an individual Support Team member to assign for asset fulfillment and handover.');
      return;
    }

    try {
      setLoading(true);
      await requestAPI.reviewRequest(request._id, {
        status: actionStatus,
        reviewComment,
        assignedSupportId: actionStatus === 'Approved' ? selectedSupportId : undefined
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Review failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review & Delegate ${request.requestType} Request`}
      size="md"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'space-between' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="danger"
              icon={XCircle}
              disabled={loading}
              onClick={() => handleSubmit('Rejected')}
            >
              Reject Request
            </Button>
            <Button
              variant="success"
              icon={CheckCircle}
              disabled={loading || (loadingSupport && supportMembers.length === 0)}
              onClick={() => handleSubmit('Approved')}
            >
              Approve & Assign Support
            </Button>
          </div>
        </div>
      }
    >
      {error && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="review-form-stack">
        <div className="review-info-card">
          <div className="review-info-row">
            <span className="review-info-label">Requesting Employee:</span>
            <span className="review-info-val">
              {request.requestedBy?.firstName} {request.requestedBy?.lastName} ({request.requestedBy?.employeeId})
            </span>
          </div>
          <div className="review-info-row">
            <span className="review-info-label">Designation:</span>
            <span className="review-info-val">{request.requestedBy?.designation || 'Staff'}</span>
          </div>
          <div className="review-info-row">
            <span className="review-info-label">Request Type:</span>
            <span className="review-info-val" style={{ color: '#2563eb' }}>
              {request.requestType}
            </span>
          </div>
          {request.requestedAssetName && (
            <div className="review-info-row">
              <span className="review-info-label">Requested Asset:</span>
              <span className="review-info-val">{request.requestedAssetName}</span>
            </div>
          )}
          {request.asset && (
            <div className="review-info-row">
              <span className="review-info-label">Target Asset:</span>
              <span className="review-info-val">
                {request.asset.assetName} [Tag: {request.asset.assetTag}]
              </span>
            </div>
          )}
          {request.specifications && (
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
              <span className="review-info-label">Specifications Desired:</span>
              <div style={{ fontWeight: 500, color: '#334155', marginTop: '0.2rem' }}>
                {request.specifications}
              </div>
            </div>
          )}
          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
            <span className="review-info-label">Reason Stated:</span>
            <div style={{ fontWeight: 500, color: '#0f172a', marginTop: '0.2rem' }}>
              {request.reason}
            </div>
          </div>
        </div>

        {/* Support Team Individual Assignment */}
        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <UserCheck size={18} style={{ color: '#2563eb' }} />
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Assign to Support Team Member (Required for Approval)
            </label>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.65rem' }}>
            The assigned support team member will pick the matching asset from available inventory and perform physical handover to the employee.
          </p>

          {loadingSupport ? (
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Loading Support Team members...</div>
          ) : supportMembers.length > 0 ? (
            <select
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff'
              }}
              value={selectedSupportId}
              onChange={(e) => setSelectedSupportId(e.target.value)}
            >
              {supportMembers.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.firstName} {member.lastName} ({member.employeeId}) — {member.role} ({member.location || 'HQ'})
                </option>
              ))}
            </select>
          ) : (
            <div style={{ color: '#b91c1c', fontSize: '0.8rem' }}>
              No active Support Team members found. Please ensure users with role 'Support Team' are registered.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Review Notes / Justification (Required if Rejecting)</label>
          <textarea
            style={{ padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
            rows="3"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Add comments or instructions for the Support Team..."
          />
        </div>
      </div>
    </Modal>
  );
};

export default ReviewRequestModal;
