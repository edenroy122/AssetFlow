import React from 'react';
import WorkspaceDetail from '../../../components/common/WorkspaceDetail';
import Badge from '../../../components/common/Badge';

const statusVariant = (status) => {
  if (status === 'Completed') return 'success';
  if (status === 'Rejected') return 'danger';
  if (status === 'Pending') return 'warning';
  if (status === 'Approved' || status === 'Processing') return 'info';
  return 'secondary';
};

const formatDate = (value) => value ? new Date(value).toLocaleString() : '—';

const Detail = ({ label, children }) => (
  <div>
    <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{label}</div>
    <div style={{ color: '#0f172a', fontWeight: 500, overflowWrap: 'anywhere' }}>{children || '—'}</div>
  </div>
);

const RequestDetailsModal = ({ isOpen, onClose, request }) => {
  if (!isOpen || !request) return null;

  const employee = request.requestedBy;
  const support = request.assignedSupport;
  const requestedAsset = request.requestType === 'New Asset'
    ? request.requestedAssetName
    : request.asset
      ? `${request.asset.assetName} (${request.asset.assetTag})`
      : '—';

  return (
    <WorkspaceDetail title="Request Details" onBack={onClose}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Detail label="Requested By">{employee ? `${employee.firstName} ${employee.lastName}` : '—'}</Detail>
        <Detail label="Employee ID">{employee?.employeeId}</Detail>
        <Detail label="Email">{employee?.email}</Detail>
        <Detail label="Phone Number">{employee?.phoneNumber}</Detail>
        <Detail label="Designation">{employee?.designation || 'Employee'}</Detail>
        <Detail label="Request Type">{request.requestType}</Detail>
        <Detail label="Asset">{requestedAsset}</Detail>
        <Detail label="Status"><Badge variant={statusVariant(request.status)}>{request.status}</Badge></Detail>
        <Detail label="Request Made On">{formatDate(request.createdAt)}</Detail>
        <Detail label="Specifications">{request.specifications}</Detail>
        <Detail label="Assigned Support">
          {support ? `${support.firstName} ${support.lastName} (${support.employeeId})${support.email ? ` · ${support.email}` : ''}` : 'Unassigned'}
        </Detail>
        <Detail label="Reviewed By">
          {request.reviewedBy ? `${request.reviewedBy.firstName} ${request.reviewedBy.lastName}` : '—'}
        </Detail>
        <Detail label="Reviewed On">{formatDate(request.reviewedAt)}</Detail>
        <Detail label="Allocated Asset">
          {request.allocatedAsset ? `${request.allocatedAsset.assetName} (${request.allocatedAsset.assetTag})` : '—'}
        </Detail>
        <Detail label="Fulfilled By">
          {request.fulfilledBy ? `${request.fulfilledBy.firstName} ${request.fulfilledBy.lastName} (${request.fulfilledBy.employeeId})` : '—'}
        </Detail>
        <Detail label="Handover Date">{formatDate(request.handoverDate)}</Detail>
        <Detail label="Handover Condition">{request.handoverCondition}</Detail>
        <Detail label="Review Comment">{request.reviewComment}</Detail>
        <Detail label="Handover Remarks">{request.handoverRemarks}</Detail>
        <div style={{ gridColumn: '1 / -1' }}>
          <Detail label="Reason">{request.reason}</Detail>
        </div>
      </div>
    </WorkspaceDetail>
  );
};

export default RequestDetailsModal;
