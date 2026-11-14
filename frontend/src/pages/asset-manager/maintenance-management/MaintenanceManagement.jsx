import React, { useState, useEffect, useCallback } from 'react';
import { repairAPI } from '../../../services/api';
import Table from '../../../components/common/Table';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import CreateWorkOrderModal from './CreateWorkOrderModal';
import { Wrench, PlusCircle, RefreshCw, FilterX, CheckCircle2, AlertCircle } from 'lucide-react';
import './MaintenanceManagement.css';

const REPAIR_STATUSES = ['All', 'Pending', 'Assigned', 'In Progress', 'Completed', 'Unrepairable'];

const MaintenanceManagement = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchRepairs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await repairAPI.getAllRepairs(params);
      if (res.data.success) {
        setRepairs(res.data.repairs);
      }
    } catch (err) {
      showAlert('Error loading repair records', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  const getStatusVariant = (st) => {
    switch (st) {
      case 'Pending':
        return 'warning';
      case 'Assigned':
      case 'In Progress':
        return 'info';
      case 'Completed':
        return 'success';
      case 'Unrepairable':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const columns = [
    {
      header: 'Asset Details',
      key: 'asset',
      render: (row) =>
        row.asset ? (
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.asset.assetName}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Tag: {row.asset.assetTag} • {row.asset.brand} {row.asset.model}
            </div>
          </div>
        ) : (
          <span style={{ color: '#94a3b8' }}>Asset Removed</span>
        )
    },
    {
      header: 'Issue / Fault Description',
      key: 'repairDescription',
      render: (row) => <span style={{ fontSize: '0.85rem' }}>{row.repairDescription}</span>
    },
    {
      header: 'Assigned Technician',
      key: 'technician',
      render: (row) =>
        row.assignedTechnician ? (
          <div>
            <div style={{ fontWeight: 600, color: '#1e3a8a' }}>
              {row.assignedTechnician.firstName} {row.assignedTechnician.lastName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {row.assignedTechnician.employeeId}
            </div>
          </div>
        ) : (
          <Badge variant="warning">Unassigned</Badge>
        )
    },
    {
      header: 'Repair Status',
      key: 'repairStatus',
      render: (row) => <Badge variant={getStatusVariant(row.repairStatus)}>{row.repairStatus}</Badge>
    },
    {
      header: 'Cost ($)',
      key: 'repairCost',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>
          {row.repairCost ? `$${row.repairCost.toFixed(2)}` : '$0.00'}
        </span>
      )
    },
    {
      header: 'Spare Parts Used',
      key: 'sparePartsUsed',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: '#475569' }}>
          {row.sparePartsUsed || 'None'}
        </span>
      )
    },
    {
      header: 'Created On',
      key: 'createdAt',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    }
  ];

  return (
    <div className="maintenance-page-container">
      <div className="maintenance-header">
        <div>
          <h1 className="dashboard-title">Maintenance &amp; Work Orders</h1>
          <p className="dashboard-subtitle">
            Create work orders, assign service technicians, monitor repairs and track organizational maintenance costs.
          </p>
        </div>
        <Button variant="primary" icon={PlusCircle} onClick={() => setIsCreateOpen(true)}>
          New Work Order
        </Button>
      </div>

      {alert && (
        <div className={`management-alert ${alert.type}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {alert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{alert.message}</span>
          </div>
        </div>
      )}

      <div className="asset-filter-bar">
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {REPAIR_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st === 'All' ? 'All Repair Statuses' : st}
            </option>
          ))}
        </select>

        {statusFilter !== 'All' && (
          <Button variant="secondary" size="sm" icon={FilterX} onClick={() => setStatusFilter('All')}>
            Reset
          </Button>
        )}

        <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchRepairs}>
          Refresh
        </Button>
      </div>

      <Table
        columns={columns}
        data={repairs}
        loading={loading}
        emptyMessage="No maintenance work orders found"
      />

      <CreateWorkOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          showAlert('Work order created successfully.');
          fetchRepairs();
        }}
      />
    </div>
  );
};

export default MaintenanceManagement;
