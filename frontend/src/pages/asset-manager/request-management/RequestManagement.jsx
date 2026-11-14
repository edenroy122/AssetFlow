import React, { useState, useEffect, useCallback } from 'react';
import { requestAPI } from '../../../services/api';
import Table from '../../../components/common/Table';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import ReviewRequestModal from './ReviewRequestModal';
import RequestDetailsModal from './RequestDetailsModal';
import {
  FilterX,
  RefreshCw,
  UserCheck,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import './RequestManagement.css';

const REQUEST_TYPES = ['All', 'New Asset', 'Replacement', 'Repair', 'Return'];
const STATUSES = ['All', 'Pending', 'Approved', 'Processing', 'Completed', 'Rejected'];

const RequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [reviewModalData, setReviewModalData] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [detailsRequest, setDetailsRequest] = useState(null);

  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (typeFilter !== 'All') params.requestType = typeFilter;

      const response = await requestAPI.getAllRequests(params);
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (err) {
      showAlert(err.response?.data?.message || err.message || 'Error fetching requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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

  const columns = [
    {
      header: 'Requested By',
      key: 'requestedBy',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>
            {row.requestedBy?.firstName} {row.requestedBy?.lastName}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.15rem' }}>
            Employee ID: {row.requestedBy?.employeeId || 'Not available'}
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      key: 'requestType',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '0.85rem' }}>
          {row.requestType}
        </span>
      )
    },
    {
      header: 'Asset',
      key: 'assetNeeds',
      render: (row) =>
        row.requestType === 'New Asset' ? (
          <div>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.requestedAssetName}</div>
            {row.specifications && (
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.specifications}</div>
            )}
          </div>
        ) : row.asset ? (
          <div>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.asset.assetName}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tag: {row.asset.assetTag}</div>
          </div>
        ) : (
          <span style={{ color: '#94a3b8' }}>â€”</span>
        )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <div>
          <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>
          {row.status === 'Approved' && (
            <div style={{ fontSize: '0.7rem', color: '#0369a1', marginTop: '0.2rem', fontWeight: 500 }}>
              With Support for Handover
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Request Made On',
      key: 'createdAt',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Action',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="table-action-group" style={{ justifyContent: 'flex-end' }}>
          {row.status === 'Pending' && (
            <Button
              size="sm"
              variant="primary"
              icon={UserCheck}
              onClick={() => {
                setReviewModalData(row);
                setIsReviewOpen(true);
              }}
            >
              Review &amp; Assign
            </Button>
          )}

          {(row.status === 'Approved' || row.status === 'Processing') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReviewModalData(row);
                  setIsReviewOpen(true);
                }}
              >
                Re-assign Support
              </Button>
            </div>
          )}

          {row.status === 'Completed' && (
            <Button
              size="sm"
              variant="outline"
              icon={Eye}
              onClick={(event) => {
                event.stopPropagation();
                setDetailsRequest(row);
              }}
            >
              View
            </Button>
          )}

          {row.status !== 'Pending' && row.status !== 'Approved' && row.status !== 'Processing' && row.status !== 'Completed' && (
            <span style={{ color: '#94a3b8' }}>â€”</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="request-management-container">
      <div className="request-management-header">
        <div className="request-management-header-left">
          <h1>Request Management</h1>
          <p>
            Review and approve employee requests, then assign to individual Support Team members for asset selection &amp; handover.
          </p>
        </div>
      </div>

      {alert && (
        <div className={`management-alert ${alert.type}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {alert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      <div className="request-filter-bar">
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {REQUEST_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All Request Types' : t}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {st === 'All' ? 'All Statuses' : st}
            </option>
          ))}
        </select>

        {(statusFilter !== 'All' || typeFilter !== 'All') && (
          <Button
            variant="secondary"
            size="sm"
            icon={FilterX}
            onClick={() => {
              setStatusFilter('All');
              setTypeFilter('All');
            }}
          >
            Reset
          </Button>
        )}

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchRequests}>
          Refresh
        </Button>
      </div>

      <Table
        columns={columns}
        data={requests}
        loading={loading}
        emptyMessage="No employee requests found matching filter criteria"
        onRowClick={(request) => setDetailsRequest(request)}
      />

      <RequestDetailsModal
        isOpen={Boolean(detailsRequest)}
        onClose={() => setDetailsRequest(null)}
        request={detailsRequest}
      />

      <ReviewRequestModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSuccess={() => {
          showAlert('Request review saved and assigned to Support Team member.');
          fetchRequests();
        }}
        request={reviewModalData}
      />
    </div>
  );
};

export default RequestManagement;

