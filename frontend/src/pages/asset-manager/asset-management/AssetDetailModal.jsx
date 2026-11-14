import React, { useState, useEffect } from 'react';
import WorkspaceDetail from '../../../components/common/WorkspaceDetail';
import Badge from '../../../components/common/Badge';
import { lifecycleAPI } from '../../../services/api';
import {
  History,
  UserCheck,
  Edit2,
  Trash2,
  Archive,
  ArrowRightLeft,
  RotateCcw,
} from 'lucide-react';
import './AssetDetailModal.css';

const AssetDetailModal = ({
  isOpen,
  onClose,
  asset,
  onEdit,
  onAssign,
  onTransfer,
  onReturn,
  onRetire,
  onDelete,
}) => {
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    if (asset?._id && isOpen) {
      const fetchTimeline = async () => {
        try {
          setLoadingTimeline(true);
          const response = await lifecycleAPI.getAssetTimeline(asset._id);
          if (response.data.success) {
            setTimeline(response.data.timeline || []);
          }
        } catch (err) {
          console.error('Error fetching asset timeline:', err);
        } finally {
          setLoadingTimeline(false);
        }
      };
      fetchTimeline();
    }
  }, [asset, isOpen]);

  if (!isOpen || !asset) return null;

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Assigned': return 'info';
      case 'Under Maintenance': return 'warning';
      case 'Damaged':
      case 'Lost':
      case 'Retired': return 'danger';
      default: return 'secondary';
    }
  };

  const getConditionVariant = (condition) => {
    if (condition === 'New' || condition === 'Good') return 'success';
    if (condition === 'Fair') return 'warning';
    return 'danger';
  };

  const isAssigned = asset.status === 'Assigned';
  const isUnderMaint = asset.status === 'Under Maintenance';
  const isRetired = asset.status === 'Retired';
  const assignedUser = asset.assignedTo;

  const actions = (
    <div className="adm-action-box">
      <div className="adm-action-caption">
        <strong>Manage asset</strong>
        <span>Update this inventory record</span>
      </div>
      <div className="adm-actions">
        <button type="button" className="adm-btn adm-btn-edit" onClick={() => onEdit(asset)}>
          <Edit2 size={15} />
          <span>Edit Asset</span>
        </button>

        {onAssign && asset.status === 'Available' && (
          <button type="button" className="adm-btn adm-btn-assign" onClick={() => onAssign(asset)}>
            <UserCheck size={15} />
            <span>Assign</span>
          </button>
        )}

        {isAssigned && (
          <>
            <button type="button" className="adm-btn adm-btn-transfer" onClick={() => onTransfer(asset)}>
              <ArrowRightLeft size={15} />
              <span>Transfer</span>
            </button>
            <button type="button" className="adm-btn adm-btn-return" onClick={() => onReturn(asset)}>
              <RotateCcw size={15} />
              <span>Return</span>
            </button>
          </>
        )}

        {!isAssigned && !isRetired && (
          <button type="button" className="adm-btn adm-btn-retire" onClick={() => onRetire(asset)}>
            <Archive size={15} />
            <span>Retire</span>
          </button>
        )}

        <button
          type="button"
          className="adm-btn adm-btn-delete"
          disabled={isAssigned || isUnderMaint}
          title={isAssigned ? 'Cannot delete assigned asset' : isUnderMaint ? 'Cannot delete asset under maintenance' : ''}
          onClick={() => onDelete(asset)}
        >
          <Trash2 size={15} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );

  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'Not specified';
  const formatCost = (cost) => `₹${Number(cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <WorkspaceDetail title="Asset Information" onBack={onClose}>
      {actions}

      <div className="adm-section-heading">
        <div>
          <h2>Asset details</h2>
          <p>Inventory information and lifecycle status</p>
        </div>
        <div className="adm-status-badges">
          <Badge variant={getStatusVariant(asset.status)}>{asset.status}</Badge>
          <Badge variant={getConditionVariant(asset.condition)}>{asset.condition}</Badge>
        </div>
      </div>

      <div className="adm-info-list">
        <div className="adm-info-row">
          <span className="adm-label">Asset Name</span>
          <span className="adm-value">{asset.assetName || 'Not provided'}</span>
        </div>
        <div className="adm-info-row">
          <span className="adm-label">Asset Tag</span>
          <span className="adm-value mono">{asset.assetTag || 'Not provided'}</span>
        </div>
        <div className="adm-info-row">
          <span className="adm-label">Serial Number</span>
          <span className="adm-value mono">{asset.serialNumber || 'Not provided'}</span>
        </div>
        <div className="adm-info-row">
          <span className="adm-label">Brand</span>
          <span className="adm-value">{asset.brand || 'Not provided'}</span>
        </div>
        <div className="adm-info-row">
          <span className="adm-label">Model</span>
          <span className="adm-value">{asset.model || 'Not provided'}</span>
        </div>
        <div className="adm-info-row">
          <span className="adm-label">Assigned To</span>
          <span className="adm-value">
            {assignedUser
              ? `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim() || assignedUser.email
              : 'Unassigned'}
          </span>
        </div>
        <div className="adm-info-row">
          <span className="adm-label">Location</span>
          <span className="adm-value">{asset.location || 'Not specified'}</span>
        </div>
        <div className="adm-info-row">
          <span className="adm-label">Purchase Cost</span>
          <span className="adm-value">{formatCost(asset.purchaseCost)}</span>
        </div>
        <div className="adm-info-row">
          <span className="adm-label">Purchase Date</span>
          <span className="adm-value">{formatDate(asset.purchaseDate)}</span>
        </div>
        <div className="adm-info-row">
          <span className="adm-label">Vendor / Supplier</span>
          <span className="adm-value">{asset.vendor || 'Not specified'}</span>
        </div>
        <div className="adm-info-row">
          <span className="adm-label">Warranty Start</span>
          <span className="adm-value">{formatDate(asset.warrantyStartDate)}</span>
        </div>
        <div className="adm-info-row">
          <span className="adm-label">Warranty Expiry</span>
          <span className="adm-value">{formatDate(asset.warrantyEndDate)}</span>
        </div>
        <div className="adm-info-row">
          <span className="adm-label">Registered By</span>
          <span className="adm-value">
            {asset.createdBy
              ? `${asset.createdBy.firstName || ''} ${asset.createdBy.lastName || ''}`.trim() || asset.createdBy.email
              : 'System'}
          </span>
        </div>
        {asset.specifications && (
          <div className="adm-info-row adm-info-row-stacked">
            <span className="adm-label">Hardware Specifications</span>
            <span className="adm-value pre">{asset.specifications}</span>
          </div>
        )}
        {asset.description && (
          <div className="adm-info-row adm-info-row-stacked">
            <span className="adm-label">Description / Remarks</span>
            <span className="adm-value pre">{asset.description}</span>
          </div>
        )}
      </div>

      <div className="adm-timeline-section">
        <div className="adm-timeline-title">
          <History size={18} />
          <span>Lifecycle History</span>
        </div>

        {loadingTimeline ? (
          <p className="adm-timeline-empty">Loading lifecycle records...</p>
        ) : timeline.length === 0 ? (
          <p className="adm-timeline-empty">No lifecycle transitions recorded yet.</p>
        ) : (
          <div className="adm-timeline-list">
            {timeline.map((event) => (
              <div key={event._id} className="adm-tl-item">
                <div className="adm-tl-dot" />
                <div className="adm-tl-content">
                  <div className="adm-tl-header">
                    <span>{event.action}</span>
                    <span className="adm-tl-date">{new Date(event.date).toLocaleString()}</span>
                  </div>
                  <div className="adm-tl-status">
                    Status: <strong>{event.previousStatus}</strong> → <strong>{event.newStatus}</strong>
                  </div>
                  {event.remarks && <div className="adm-tl-remarks">{event.remarks}</div>}
                  {event.performedBy && (
                    <div className="adm-tl-by">
                      By {event.performedBy.firstName} {event.performedBy.lastName} ({event.performedBy.role})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkspaceDetail>
  );
};

export default AssetDetailModal;
