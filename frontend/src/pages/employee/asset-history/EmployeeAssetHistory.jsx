import React, { useState, useEffect } from 'react';
import { assignmentAPI } from '../../../services/api';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import { History, RefreshCw } from 'lucide-react';
import './EmployeeAssetHistory.css';

const EmployeeAssetHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyHistory = async () => {
    try {
      setLoading(true);
      const res = await assignmentAPI.getMyAssetHistory();
      if (res.data.success) {
        setHistory(res.data.assignments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyHistory();
  }, []);

  const columns = [
    {
      header: 'Equipment',
      key: 'asset',
      render: (row) =>
        row.asset ? (
          <div>
            <div style={{ fontWeight: 600 }}>{row.asset.assetName}</div>
            <div style={{ fontSize: '0.75rem', color: '#0f172a' }}>
              {row.asset.assetTag}
            </div>
          </div>
        ) : (
          <span style={{ color: '#94a3b8' }}>N/A</span>
        )
    },
    {
      header: 'Custody Status',
      key: 'status',
      render: (row) => (
        <Badge
          variant="secondary"
        >
          {row.status === 'Active' ? 'Currently Assigned' : row.status}
        </Badge>
      )
    },
    {
      header: 'Assigned On',
      key: 'assignmentDate',
      render: (row) => (
        <span style={{ fontSize: '0.85rem' }}>
          {new Date(row.assignmentDate).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Returned / Transferred On',
      key: 'actualReturnDate',
      render: (row) => (
        <span style={{ fontSize: '0.85rem' }}>
          {row.actualReturnDate ? new Date(row.actualReturnDate).toLocaleDateString() : 'Active in Custody'}
        </span>
      )
    },
    {
      header: 'Condition at Handover',
      key: 'condition',
      render: (row) => (
        <span style={{ fontSize: '0.85rem' }}>
          {row.conditionAtAssignment}
          {row.conditionAtReturn ? ` → Returned as ${row.conditionAtReturn}` : ''}
        </span>
      )
    },
    {
      header: 'Notes / Remarks',
      key: 'remarks',
      render: (row) => <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.remarks || '—'}</span>
    }
  ];

  return (
    <div className="emp-history-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">Personal Asset History</h1>
          <p className="dashboard-subtitle">
            Archive of all organization hardware previously or currently assigned to your custody.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchMyHistory}>
          Refresh
        </Button>
      </div>

      <Table
        compact
        className="emp-history-table"
        columns={columns}
        data={history}
        loading={loading}
        emptyMessage="You have no previous asset custody records."
      />
    </div>
  );
};

export default EmployeeAssetHistory;
