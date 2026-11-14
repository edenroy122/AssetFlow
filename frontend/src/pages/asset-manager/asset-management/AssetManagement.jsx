import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { assetAPI } from '../../../services/api';
import Button from '../../../components/common/Button';
import AssetFormModal from './AssetFormModal';
import AssetDetailModal from './AssetDetailModal';
import AssignAssetModal from './AssignAssetModal';
import TransferAssetModal from './TransferAssetModal';
import ReturnAssetModal from './ReturnAssetModal';
import {
  PackagePlus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FilterX,
} from 'lucide-react';
import './AssetManagement.css';

const STATUSES = [
  'All',
  'Available',
  'Assigned',
  'Under Maintenance',
  'Damaged',
  'Retired',
  'Lost',
];

const AssetManagement = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Detail popup
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailAssetData, setDetailAssetData] = useState(null);

  // Add / Edit form
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editAssetData, setEditAssetData] = useState(null);

  // Assign / Transfer / Return
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignAssetData, setAssignAssetData] = useState(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferAssetData, setTransferAssetData] = useState(null);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnAssetData, setReturnAssetData] = useState(null);

  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'All') params.status = statusFilter;

      const response = await assetAPI.getAssets(params);
      if (response.data.success) {
        setAssets(response.data.assets);
      }
    } catch (err) {
      showAlert(
        err.response?.data?.message || err.message || 'Error fetching assets',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  /* ---- Actions (called from detail modal) ---- */
  const handleEdit = (asset) => {
    setIsDetailModalOpen(false);
    setEditAssetData(asset);
    setIsFormModalOpen(true);
  };

  const handleAssign = (asset) => {
    setIsDetailModalOpen(false);
    setAssignAssetData(asset);
    setIsAssignModalOpen(true);
  };

  const handleTransfer = (asset) => {
    setIsDetailModalOpen(false);
    setTransferAssetData(asset);
    setIsTransferModalOpen(true);
  };

  const handleReturn = (asset) => {
    setIsDetailModalOpen(false);
    setReturnAssetData(asset);
    setIsReturnModalOpen(true);
  };

  const handleRetire = async (asset) => {
    setIsDetailModalOpen(false);
    if (asset.status === 'Assigned') {
      showAlert('Cannot retire an asset that is currently assigned. Process a return first.', 'error');
      return;
    }
    const reason = window.prompt(
      `Retire reason for ${asset.assetName} [${asset.assetTag}]:`,
      'End of lifecycle replacement'
    );
    if (!reason) return;

    try {
      await assetAPI.retireAsset(asset._id, reason);
      showAlert(`Asset '${asset.assetName}' marked as Retired.`);
      fetchAssets();
    } catch (err) {
      showAlert(err.response?.data?.message || err.message || 'Retire failed', 'error');
    }
  };

  const handleDelete = async (asset) => {
    setIsDetailModalOpen(false);
    if (asset.status === 'Assigned') {
      showAlert('Cannot delete an asset that is currently assigned.', 'error');
      return;
    }
    if (asset.status === 'Under Maintenance') {
      showAlert('Cannot delete an asset currently under maintenance.', 'error');
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to permanently delete '${asset.assetName}' (${asset.assetTag})?`
      )
    ) {
      return;
    }

    try {
      await assetAPI.deleteAsset(asset._id);
      showAlert(`Asset '${asset.assetName}' was deleted.`);
      fetchAssets();
    } catch (err) {
      showAlert(err.response?.data?.message || err.message || 'Delete failed', 'error');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
  };

  /* ---- Row click → open detail popup ---- */
  const handleRowClick = (asset) => {
    setDetailAssetData(asset);
    setIsDetailModalOpen(true);
  };

  const getConditionVariant = (cond) => {
    if (cond === 'New' || cond === 'Good') return 'success';
    if (cond === 'Fair') return 'warning';
    return 'danger';
  };

  return (
    <div className="asset-management-container">
      {/* Header */}
      <div className="asset-management-header">
        <div className="asset-management-header-left">
          <h1>Asset Management</h1>
          <p>
            Register, track, assign, transfer, inspect, and retire organization
            hardware assets.
          </p>
        </div>
        <Button
          variant="secondary"
          className="ams-btn-light-grey"
          icon={PackagePlus}
          onClick={() => {
            setEditAssetData(null);
            setIsFormModalOpen(true);
          }}
        >
          Register New Asset
        </Button>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`management-alert ${alert.type}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {alert.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="asset-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by asset name, tag, serial, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-controls">
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

          {(search || statusFilter !== 'All') && (
            <Button variant="secondary" size="sm" icon={FilterX} onClick={resetFilters}>
              Reset
            </Button>
          )}

          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAssets}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Asset list */}
      <div className="asset-list-view">
        <div className="asset-list-header">
          <span>Asset Tag</span>
          <span>Asset Name</span>
          <span>Condition</span>
        </div>

        {loading ? (
          <div className="asset-list-empty">
            <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 0.5rem' }} />
            <p>Loading assets...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="asset-list-empty">
            <p>No assets found matching the selected criteria</p>
          </div>
        ) : (
          assets.map((item) => (
            <button
              key={item._id}
              type="button"
              className="asset-list-row"
              onClick={() => handleRowClick(item)}
              title="Click to view asset details"
            >
              <div className="asset-col-tag">
                <span className="asset-tag-code">{item.assetTag}</span>
              </div>
              <div className="asset-col-name">{item.assetName}</div>
              <div className="asset-col-condition">{item.condition}</div>
            </button>
          ))
        )}
      </div>

      {/* Detail Popup Modal */}
      <AssetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        asset={detailAssetData}
        onEdit={handleEdit}
        onAssign={user?.role === 'Admin' ? undefined : handleAssign}
        onTransfer={handleTransfer}
        onReturn={handleReturn}
        onRetire={handleRetire}
        onDelete={handleDelete}
      />

      {/* Add / Edit Form Modal */}
      <AssetFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          showAlert(editAssetData ? 'Asset updated.' : 'Asset registered.');
          fetchAssets();
        }}
        editAsset={editAssetData}
      />

      {/* Assign Modal */}
      <AssignAssetModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => {
          showAlert('Asset successfully assigned.');
          fetchAssets();
        }}
        asset={assignAssetData}
      />

      {/* Transfer Modal */}
      <TransferAssetModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => {
          showAlert('Asset transfer completed.');
          fetchAssets();
        }}
        asset={transferAssetData}
      />

      {/* Return Modal */}
      <ReturnAssetModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSuccess={() => {
          showAlert('Asset return processed.');
          fetchAssets();
        }}
        asset={returnAssetData}
      />
    </div>
  );
};

export default AssetManagement;
