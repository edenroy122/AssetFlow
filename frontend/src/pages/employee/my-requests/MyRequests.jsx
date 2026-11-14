import React, { useState, useEffect } from 'react';
import { requestAPI } from '../../../services/api';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import WorkspaceDetail from '../../../components/common/WorkspaceDetail';
import {
  PlusCircle,
  Eye,
  CheckCircle2,
  Clock,
  UserCheck,
  PackageCheck,
  FileText,
  ShieldCheck,
  Laptop
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './MyRequests.css';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const res = await requestAPI.getMyRequests();
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const getStatusVariant = (st) => {
    switch (st) {
      case 'Pending':
        return 'warning';
      case 'Approved':
      case 'Processing':
        return 'info';
      case 'Completed':
        return 'success';
      case 'Rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const handleRowClick = (row) => {
    setSelectedRequest(row);
    setIsDetailOpen(true);
  };

  // Compact columns that fit 100% width with NO horizontal scroll
  const columns = [
    {
      header: 'Request Type',
      key: 'requestType',
      width: '130px',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '0.85rem' }}>
          {row.requestType}
        </span>
      )
    },
    {
      header: 'Requested Item / Asset',
      key: 'item',
      render: (row) => (
        <div style={{ wordBreak: 'break-word' }}>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>
            {row.requestType === 'New Asset' ? row.requestedAssetName : row.asset?.assetName || 'Assigned Equipment'}
          </div>
          {row.asset?.assetTag && (
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Tag: {row.asset.assetTag}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      width: '130px',
      render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>
    },
    {
      header: 'Assigned Support',
      key: 'assignedSupport',
      width: '160px',
      render: (row) =>
        row.assignedSupport ? (
          <span style={{ fontWeight: 500, color: '#0d9488', fontSize: '0.825rem' }}>
            {row.assignedSupport.firstName} {row.assignedSupport.lastName}
          </span>
        ) : row.status === 'Pending' ? (
          <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 500 }}>
            Awaiting Review
          </span>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>
        )
    },
    {
      header: 'Submitted',
      key: 'createdAt',
      width: '110px',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Action',
      key: 'action',
      width: '80px',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          icon={Eye}
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row);
          }}
          title="Click to view full details"
        >
          View
        </Button>
      )
    }
  ];

  return (
    <div className="my-requests-page">
      <div className="my-requests-header">
        <div>
          <h1 className="dashboard-title">My Asset Requests</h1>
          <p className="dashboard-subtitle">
            Click on any request to view its complete progress, review comments, and handover details.
          </p>
        </div>
        <Link to="/employee/asset-requests">
          <Button variant="secondary" className="ams-btn-light-grey" size="sm" icon={PlusCircle}>
            New Request
          </Button>
        </Link>
      </div>

      <Table
        columns={columns}
        data={requests}
        loading={loading}
        compact={true}
        noScroll={true}
        onRowClick={handleRowClick}
        emptyMessage="You have not submitted any asset requests yet."
      />

      {/* Information Modal on Click */}
      {selectedRequest && isDetailOpen && (
        <WorkspaceDetail
          title={`Request Details: ${selectedRequest.requestType}`}
          onBack={() => setIsDetailOpen(false)}
        >
          <div className="req-modal-stack">
            {/* Header Status Card */}
            <div className="req-detail-card">
              <div className="req-card-title">
                <FileText size={15} color="#2563eb" />
                <span>Request Overview</span>
              </div>
              <div className="req-detail-row">
                <span className="req-detail-label">Request Type:</span>
                <span className="req-detail-val" style={{ color: '#2563eb' }}>
                  {selectedRequest.requestType}
                </span>
              </div>
              <div className="req-detail-row">
                <span className="req-detail-label">Status:</span>
                <Badge variant={getStatusVariant(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
              </div>
              <div className="req-detail-row">
                <span className="req-detail-label">Submitted On:</span>
                <span className="req-detail-val">
                  {new Date(selectedRequest.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Requested Item & Reason */}
            <div className="req-detail-card">
              <div className="req-card-title">
                <Laptop size={15} color="#0d9488" />
                <span>Requested Item &amp; Justification</span>
              </div>
              {selectedRequest.requestedAssetName && (
                <div className="req-detail-row">
                  <span className="req-detail-label">Item Name:</span>
                  <span className="req-detail-val">{selectedRequest.requestedAssetName}</span>
                </div>
              )}
              {selectedRequest.asset && (
                <div className="req-detail-row">
                  <span className="req-detail-label">Target Asset:</span>
                  <span className="req-detail-val">
                    {selectedRequest.asset.assetName} [Tag: {selectedRequest.asset.assetTag}]
                  </span>
                </div>
              )}
              {selectedRequest.specifications && (
                <div style={{ marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid #e2e8f0' }}>
                  <span className="req-detail-label" style={{ display: 'block', marginBottom: '0.2rem' }}>
                    Desired Specifications:
                  </span>
                  <div style={{ color: '#334155', fontSize: '0.825rem' }}>
                    {selectedRequest.specifications}
                  </div>
                </div>
              )}
              <div style={{ marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px solid #e2e8f0' }}>
                <span className="req-detail-label" style={{ display: 'block', marginBottom: '0.2rem' }}>
                  Reason Stated:
                </span>
                <div style={{ color: '#0f172a', fontSize: '0.825rem', fontWeight: 500 }}>
                  {selectedRequest.reason}
                </div>
              </div>
            </div>

            {/* Manager Review Details */}
            <div className="req-detail-card">
              <div className="req-card-title">
                <ShieldCheck size={15} color="#4f46e5" />
                <span>Asset Manager Review</span>
              </div>
              <div className="req-detail-row">
                <span className="req-detail-label">Review Status:</span>
                <span className="req-detail-val">
                  {selectedRequest.reviewedBy ? 'Reviewed & Processed' : 'Pending Review'}
                </span>
              </div>
              {selectedRequest.reviewedBy && (
                <div className="req-detail-row">
                  <span className="req-detail-label">Reviewed By:</span>
                  <span className="req-detail-val">
                    {selectedRequest.reviewedBy.firstName} {selectedRequest.reviewedBy.lastName}
                  </span>
                </div>
              )}
              {selectedRequest.reviewedAt && (
                <div className="req-detail-row">
                  <span className="req-detail-label">Reviewed At:</span>
                  <span className="req-detail-val">
                    {new Date(selectedRequest.reviewedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {selectedRequest.reviewComment && (
                <div className="req-note-box" style={{ marginTop: '0.35rem' }}>
                  <strong>Manager Feedback:</strong> {selectedRequest.reviewComment}
                </div>
              )}
            </div>

            {/* Support Team Handover Details */}
            <div className="req-detail-card">
              <div className="req-card-title">
                <PackageCheck size={15} color="#059669" />
                <span>Support Team Fulfillment &amp; Handover</span>
              </div>
              <div className="req-detail-row">
                <span className="req-detail-label">Assigned Support:</span>
                <span className="req-detail-val" style={{ color: '#0d9488' }}>
                  {selectedRequest.assignedSupport
                    ? `${selectedRequest.assignedSupport.firstName} ${selectedRequest.assignedSupport.lastName} (${selectedRequest.assignedSupport.employeeId})`
                    : 'Awaiting Support Assignment'}
                </span>
              </div>
              {selectedRequest.handoverDate && (
                <div className="req-detail-row">
                  <span className="req-detail-label">Handover Date:</span>
                  <span className="req-detail-val">
                    {new Date(selectedRequest.handoverDate).toLocaleString()}
                  </span>
                </div>
              )}
              {selectedRequest.handoverCondition && (
                <div className="req-detail-row">
                  <span className="req-detail-label">Condition at Handover:</span>
                  <span className="req-detail-val">{selectedRequest.handoverCondition}</span>
                </div>
              )}
              {selectedRequest.fulfilledBy && (
                <div className="req-detail-row">
                  <span className="req-detail-label">Fulfilled By:</span>
                  <span className="req-detail-val">
                    {selectedRequest.fulfilledBy.firstName} {selectedRequest.fulfilledBy.lastName}
                  </span>
                </div>
              )}
              {selectedRequest.handoverRemarks && (
                <div className="req-note-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', marginTop: '0.35rem' }}>
                  <strong>Support Verification Notes:</strong> {selectedRequest.handoverRemarks}
                </div>
              )}
            </div>

            {selectedRequest.supportMessages?.length > 0 && (
              <div className="req-detail-card">
                <div className="req-card-title">
                  <FileText size={15} color="#7c3aed" />
                  <span>Messages from Support</span>
                </div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {selectedRequest.supportMessages.map((entry, index) => (
                    <div key={entry._id || `${entry.sentAt}-${index}`} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: '#64748b', fontSize: '0.75rem', marginBottom: 6 }}>
                        <span>{entry.sender ? `${entry.sender.firstName} ${entry.sender.lastName}` : 'Support Team'}</span>
                        <span>{entry.sentAt ? new Date(entry.sentAt).toLocaleString() : ''}</span>
                      </div>
                      <div style={{ color: '#0f172a', whiteSpace: 'pre-wrap' }}>{entry.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allocated Asset Box (if completed) */}
            {selectedRequest.allocatedAsset && (
              <div className="req-allocated-box">
                <div className="req-card-title" style={{ color: '#166534' }}>
                  <CheckCircle2 size={16} />
                  <span>Allocated &amp; Handed Over Asset</span>
                </div>
                <div className="req-detail-row">
                  <span className="req-detail-label">Asset Name:</span>
                  <span className="req-detail-val" style={{ color: '#166534' }}>
                    {selectedRequest.allocatedAsset.assetName}
                  </span>
                </div>
                <div className="req-detail-row">
                  <span className="req-detail-label">Asset Tag:</span>
                  <span className="req-detail-val" style={{ fontFamily: 'monospace' }}>
                    {selectedRequest.allocatedAsset.assetTag}
                  </span>
                </div>
                {selectedRequest.allocatedAsset.model && (
                  <div className="req-detail-row">
                    <span className="req-detail-label">Model:</span>
                    <span className="req-detail-val">
                      {selectedRequest.allocatedAsset.brand} {selectedRequest.allocatedAsset.model}
                    </span>
                  </div>
                )}
                {selectedRequest.allocatedAsset.serialNumber && (
                  <div className="req-detail-row">
                    <span className="req-detail-label">Serial Number:</span>
                    <span className="req-detail-val" style={{ fontFamily: 'monospace' }}>
                      {selectedRequest.allocatedAsset.serialNumber}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </WorkspaceDetail>
      )}
    </div>
  );
};

export default MyRequests;
