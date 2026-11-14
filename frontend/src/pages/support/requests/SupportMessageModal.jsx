import React, { useEffect, useState } from 'react';
import { requestAPI } from '../../../services/api';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';

const SupportMessageModal = ({ isOpen, onClose, onSuccess, request }) => {
  const [stage, setStage] = useState('bring_asset');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !request) return;
    const stageForRequest = request.requestType === 'New Asset' || request.requestType === 'Replacement'
      ? 'ready_for_collection'
      : request.requestType === 'Repair' && request.status === 'Processing'
        ? 'ready_for_collection'
        : 'bring_asset';
    const isReady = stageForRequest === 'ready_for_collection';
    const itemName = request.asset?.assetName || request.requestedAssetName || 'the requested asset';
    const template = request.requestType === 'Repair' && !isReady
      ? `Please bring your ${itemName} (${request.asset?.assetTag || 'asset tag unavailable'}) to the Support Team so we can begin the repair. Please contact us to arrange a time.`
      : request.requestType === 'Return'
        ? `Please bring your ${itemName} (${request.asset?.assetTag || 'asset tag unavailable'}) to the Support Team to complete your asset return.`
        : isReady
          ? `Your ${itemName} is ready for collection. Please bring your employee ID and collect it from the Support Team.`
          : `Your requested ${itemName} is ready for collection. Please bring your employee ID and collect it from the Support Team.`;
    setStage(stageForRequest);
    setMessage(template);
    setError('');
  }, [isOpen, request]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!request || !message.trim()) return;
    try {
      setSending(true);
      setError('');
      await requestAPI.sendSupportMessage(request._id, { stage, message: message.trim() });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!request) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Message Employee" size="md">
      <form onSubmit={handleSubmit}>
        <p style={{ marginTop: 0, color: '#64748b' }}>
          Send a direct message to {request.requestedBy?.firstName} {request.requestedBy?.lastName}.
          The employee will also receive it as a notification.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', marginBottom: 16, padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <span><strong>Employee ID:</strong> {request.requestedBy?.employeeId || '—'}</span>
          <span><strong>Email:</strong> {request.requestedBy?.email || '—'}</span>
          <span><strong>Phone:</strong> {request.requestedBy?.phoneNumber || '—'}</span>
          <span><strong>Location:</strong> {request.requestedBy?.location || '—'}</span>
          {request.requestedBy?.designation && <span><strong>Designation:</strong> {request.requestedBy.designation}</span>}
        </div>
        <div style={{ marginBottom: 8, color: '#475569', fontSize: '0.85rem' }}>
          {stage === 'bring_asset' ? 'Message purpose: employee handover to Support' : 'Message purpose: employee collection'}
        </div>
        <label htmlFor="support-message-body" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
          Message
        </label>
        <textarea
          id="support-message-body"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          maxLength={2000}
          required
          style={{ width: '100%', resize: 'vertical', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }}
        />
        {error && <p role="alert" style={{ color: '#dc2626', marginBottom: 0 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={sending || !message.trim()}>
            {sending ? 'Sending…' : 'Send Message'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SupportMessageModal;
