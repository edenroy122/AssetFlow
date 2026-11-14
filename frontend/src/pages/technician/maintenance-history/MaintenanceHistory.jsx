import React, { useState, useEffect } from 'react';
import { repairAPI } from '../../../services/api';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import { RefreshCw, History } from 'lucide-react';
import './MaintenanceHistory.css';

const MaintenanceHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await repairAPI.getMyWorkOrders();
      if (res.data.success) {
        // Filter resolved items (Completed or Unrepairable)
        const resolved = res.data.workOrders.filter(
          (r) => r.repairStatus === 'Completed' || r.repairStatus === 'Unrepairable'
        );
        setHistory(resolved);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const columns = [
    {
      header: 'Serviced Asset',
      key: 'asset',
      render: (row) =>
        row.asset ? (
          <div>
            <div style={{ fontWeight: 600 }}>{row.asset.assetName}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Tag: {row.asset.assetTag} • {row.asset.brand} {row.asset.model}
            </div>
          </div>
        ) : (
          <span style={{ color: '#94a3b8' }}>N/A</span>
        )
    },
    {
      header: 'Fault / Issue',
      key: 'repairDescription',
      render: (row) => <span style={{ fontSize: '0.85rem' }}>{row.repairDescription}</span>
    },
    {
      header: 'Diagnosis & Work Performed',
      key: 'inspectionDetails',
      render: (row) => (
        <span style={{ fontSize: '0.85rem', color: '#334155' }}>
          {row.inspectionDetails || 'Standard maintenance performed'}
        </span>
      )
    },
    {
      header: 'Outcome Status',
      key: 'repairStatus',
      render: (row) => (
        <Badge variant={row.repairStatus === 'Completed' ? 'success' : 'danger'}>
          {row.repairStatus}
        </Badge>
      )
    },
    {
      header: 'Spare Parts Used',
      key: 'sparePartsUsed',
      render: (row) => <span>{row.sparePartsUsed || 'None'}</span>
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
      header: 'Completion Date',
      key: 'repairEndDate',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {row.repairEndDate ? new Date(row.repairEndDate).toLocaleDateString() : 'N/A'}
        </span>
      )
    }
  ];

  return (
    <div className="maint-history-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">Maintenance &amp; Repair History</h1>
          <p className="dashboard-subtitle">
            Archive of completed service orders, repairs finalized, and parts replacement records.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchHistory}>
          Refresh
        </Button>
      </div>

      <Table
        columns={columns}
        data={history}
        loading={loading}
        emptyMessage="No historical maintenance records found"
      />
    </div>
  );
};

export default MaintenanceHistory;
