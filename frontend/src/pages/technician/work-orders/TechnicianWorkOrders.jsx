import React, { useState, useEffect, useCallback } from 'react';
import { repairAPI } from '../../../services/api';
import Table from '../../../components/common/Table';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import RepairUpdateModal from '../repair-management/RepairUpdateModal';
import SupportRequests from '../../support/requests/SupportRequests';
import { Wrench, PackageCheck, RefreshCw, FilterX, CheckCircle2, AlertCircle } from 'lucide-react';
import './TechnicianWorkOrders.css';

const TechnicianWorkOrders = () => {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' (Asset Requests & Handover) vs 'repairs' (Hardware Work Orders)
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await repairAPI.getMyWorkOrders(params);
      if (res.data.success) {
        setWorkOrders(res.data.workOrders);
      }
    } catch (err) {
      showAlert('Error loading assigned work orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (activeTab === 'repairs') {
      fetchWorkOrders();
    }
  }, [activeTab, fetchWorkOrders]);

  const getStatusVariant = (st) => {
    switch (st) {
      case 'Pending':
      case 'Assigned':
        return 'warning';
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
      header: 'Assigned Asset',
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
      header: 'Fault / Issue',
      key: 'repairDescription',
      render: (row) => <span style={{ fontSize: '0.85rem' }}>{row.repairDescription}</span>
    },
    {
      header: 'Status',
      key: 'repairStatus',
      render: (row) => <Badge variant={getStatusVariant(row.repairStatus)}>{row.repairStatus}</Badge>
    },
    {
      header: 'Inspection Notes',
      key: 'inspectionDetails',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: '#475569' }}>
          {row.inspectionDetails || 'Awaiting diagnostic inspection'}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button
            size="sm"
            variant="outline"
            icon={Wrench}
            onClick={() => {
              setSelectedRepair(row);
              setIsUpdateOpen(true);
            }}
          >
            Update Progress
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="work-orders-container">
      {/* Tab Switcher between Asset Requests & Hardware Repair Orders */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1.15rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'requests' ? '#0d9488' : '#f1f5f9',
            color: activeTab === 'requests' ? '#ffffff' : '#334155',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'requests' ? '0 2px 8px rgba(13, 148, 136, 0.25)' : 'none'
          }}
        >
          <PackageCheck size={18} />
          <span>Asset Requests &amp; Handover</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('repairs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1.15rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'repairs' ? '#d97706' : '#f1f5f9',
            color: activeTab === 'repairs' ? '#ffffff' : '#334155',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'repairs' ? '0 2px 8px rgba(217, 119, 6, 0.25)' : 'none'
          }}
        >
          <Wrench size={18} />
          <span>Hardware Repair Orders</span>
        </button>
      </div>

      {activeTab === 'requests' ? (
        <SupportRequests />
      ) : (
        <>
          <div className="work-orders-header">
            <div>
              <h1 className="dashboard-title">My Assigned Repair Orders</h1>
              <p className="dashboard-subtitle">
                Physical equipment dispatched to you for diagnostics, maintenance and hardware repairs.
              </p>
            </div>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchWorkOrders}>
              Refresh
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
              <option value="All">All Statuses</option>
              <option value="Assigned">Assigned (New)</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Unrepairable">Unrepairable</option>
            </select>

            {statusFilter !== 'All' && (
              <Button variant="secondary" size="sm" icon={FilterX} onClick={() => setStatusFilter('All')}>
                Reset
              </Button>
            )}
          </div>

          <Table
            columns={columns}
            data={workOrders}
            loading={loading}
            emptyMessage="You have no assigned work orders matching this filter"
          />

          <RepairUpdateModal
            isOpen={isUpdateOpen}
            onClose={() => setIsUpdateOpen(false)}
            onSuccess={() => {
              showAlert('Work order progress saved.');
              fetchWorkOrders();
            }}
            repair={selectedRepair}
          />
        </>
      )}
    </div>
  );
};

export default TechnicianWorkOrders;
