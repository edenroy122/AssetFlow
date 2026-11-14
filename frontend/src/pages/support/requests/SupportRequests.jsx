import React, { useState, useEffect, useCallback } from 'react';
import { requestAPI } from '../../../services/api';
import Table from '../../../components/common/Table';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import HandoverModal from './HandoverModal';
import SupportMessageModal from './SupportMessageModal';
import {
  PackageCheck,
  RefreshCw,
  FilterX,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import './SupportRequests.css';

const REQUEST_TYPES = ['All', 'New Asset', 'Replacement', 'Return', 'Repair'];
const STATUSES = ['All', 'Approved', 'Processing', 'Completed'];

const hasMessageStage = (request, stage) =>
  request.supportMessages?.some((message) => message.stage === stage);

const getRequiredMessageStage = (request) => {
  if (request.requestType === 'New Asset' || request.requestType === 'Replacement') return 'ready_for_collection';
  if (request.requestType === 'Return') return 'bring_asset';
  if (request.requestType === 'Repair') return request.status === 'Approved' ? 'bring_asset' : 'ready_for_collection';
  return null;
};

const getSupportMessageAction = (request) => {
  if (request.status === 'Completed') return null;
  const stage = getRequiredMessageStage(request);
  if (!stage || hasMessageStage(request, stage)) return null;
  if (stage === 'ready_for_collection') return request.requestType === 'Repair' ? 'Notify Repair Complete' : 'Notify Employee to Collect';
  if (request.requestType === 'Return') return 'Ask Employee to Hand Over';
  return 'Ask Employee to Bring Asset';
};

const canHandover = (request) => {
  if (!['Approved', 'Processing'].includes(request.status)) return false;
  if (request.requestType === 'Repair') {
    return request.status === 'Approved'
      ? hasMessageStage(request, 'bring_asset')
      : hasMessageStage(request, 'ready_for_collection');
  }
  if (request.requestType === 'Return') return hasMessageStage(request, 'bring_asset');
  return hasMessageStage(request, 'ready_for_collection');
};

const SupportRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [selectedRequestForHandover, setSelectedRequestForHandover] = useState(null);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [selectedRequestForMessage, setSelectedRequestForMessage] = useState(null);
  const [isMessageOpen, setIsMessageOpen] = useState(false);

  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const params = { filterMode: 'my' };
      if (statusFilter !== 'All') params.status = statusFilter;
      if (typeFilter !== 'All') params.requestType = typeFilter;

      const res = await requestAPI.getSupportQueue(params);
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      showAlert(err.response?.data?.message || err.message || 'Error fetching support queue', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const getStatusVariant = (st) => {
    switch (st) {
      case 'Approved':
      case 'Processing':
        return 'warning';
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
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {row.requestedBy?.employeeId} • {row.requestedBy?.location || 'HQ'}
          </div>
        </div>
      )
    },
    {
      header: 'Request Type',
      key: 'requestType',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#0d9488', fontSize: '0.85rem' }}>
          {row.requestType}
        </span>
      )
    },
    {
      header: 'Asset / Specifications',
      key: 'assetSpecs',
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
          <span style={{ color: '#94a3b8' }}>—</span>
        )
    },
    {
      header: 'Assigned Support',
      key: 'assignedSupport',
      render: (row) =>
        row.assignedSupport ? (
          <div>
            <div style={{ fontWeight: 600, color: '#0d9488', fontSize: '0.85rem' }}>
              {row.assignedSupport.firstName} {row.assignedSupport.lastName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {row.assignedSupport.employeeId}
            </div>
          </div>
        ) : (
          <span style={{ color: '#94a3b8' }}>Unassigned</span>
        )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <div>
          <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>
          {canHandover(row) && (
            <div style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '0.2rem', fontWeight: 600 }}>
              Awaiting Handover
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          {canHandover(row) && (
            <Button
              size="sm"
              variant="primary"
              icon={PackageCheck}
              onClick={() => {
                setSelectedRequestForHandover(row);
                setIsHandoverOpen(true);
              }}
            >
              {row.requestType === 'Return'
                ? 'Accept Return'
                : row.requestType === 'Repair'
                ? row.status === 'Approved' ? 'Confirm Asset Received' : 'Return Repaired Asset'
                : 'Complete Handover'}
            </Button>
          )}
          {getSupportMessageAction(row) && (
            <Button size="sm" variant="outline" onClick={() => {
              setSelectedRequestForMessage(row);
              setIsMessageOpen(true);
            }}>
              {getSupportMessageAction(row)}
            </Button>
          )}
          {row.status === 'Completed' && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                {row.allocatedAsset ? `Allocated: ${row.allocatedAsset.assetTag}` : 'Fulfilled'}
              </span>
              {row.handoverDate && (
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {new Date(row.handoverDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="support-requests-container">
      <div className="support-requests-header">
        <div>
          <h1>Request Management</h1>
          <p>
            Choose assets from available inventory and perform physical handover to employees for approved requests.
          </p>
        </div>
      </div>

      {alert && (
        <div className={`support-alert ${alert.type}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {alert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      <div className="support-filter-bar">
        <span className="support-assigned-filter">Assigned to Me</span>

        <select
          className="support-filter-select"
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
          className="support-filter-select"
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

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchQueue}>
          Refresh
        </Button>
      </div>

      <Table
        columns={columns}
        data={requests}
        loading={loading}
        emptyMessage="No requests found in support queue matching filter criteria"
      />

      <HandoverModal
        isOpen={isHandoverOpen}
        onClose={() => setIsHandoverOpen(false)}
        onSuccess={() => {
          const isRepairReceived = selectedRequestForHandover?.requestType === 'Repair' && selectedRequestForHandover?.status === 'Approved';
          showAlert(isRepairReceived ? 'Asset received. Repair is now processing.' : 'Handover completed successfully.');
          fetchQueue();
        }}
        request={selectedRequestForHandover}
      />
      <SupportMessageModal
        isOpen={isMessageOpen}
        onClose={() => setIsMessageOpen(false)}
        onSuccess={() => {
          showAlert('Message sent to the employee.');
          fetchQueue();
        }}
        request={selectedRequestForMessage}
      />
    </div>
  );
};

export default SupportRequests;
