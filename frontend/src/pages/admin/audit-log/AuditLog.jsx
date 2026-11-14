import React, { useState, useEffect, useCallback } from 'react';
import { auditLogAPI } from '../../../services/api';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import { ShieldCheck, RefreshCw, FilterX } from 'lucide-react';
import './AuditLog.css';

const COLLECTIONS = ['All', 'User', 'Asset', 'AssetAssignment', 'AssetRepair', 'AssetRequest', 'System'];

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState('All');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (collectionFilter !== 'All') params.collectionName = collectionFilter;

      const res = await auditLogAPI.getLogs(params);
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [collectionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    {
      header: 'System Action',
      key: 'action',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.action}</span>
      )
    },
    {
      header: 'Module Target',
      key: 'collectionName',
      render: (row) => <Badge variant="secondary">{row.collectionName}</Badge>
    },
    {
      header: 'Event Details',
      key: 'details',
      render: (row) => (
        <span style={{ fontSize: '0.85rem', color: '#334155' }}>{row.details}</span>
      )
    },
    {
      header: 'Performed By',
      key: 'performedBy',
      render: (row) =>
        row.performedBy ? (
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {row.performedBy.firstName} {row.performedBy.lastName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {row.performedBy.role} ({row.performedBy.employeeId})
            </div>
          </div>
        ) : (
          <span style={{ color: '#94a3b8' }}>System Automated</span>
        )
    },
    {
      header: 'Timestamp',
      key: 'createdAt',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {new Date(row.createdAt).toLocaleString()}
        </span>
      )
    }
  ];

  return (
    <div className="audit-log-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">System Audit &amp; Activity Log</h1>
          <p className="dashboard-subtitle">
            Immutable security trail recording user modifications, asset workflows, and critical authorization events.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchLogs}>
          Refresh
        </Button>
      </div>

      <div className="asset-filter-bar">
        <select
          className="filter-select"
          value={collectionFilter}
          onChange={(e) => setCollectionFilter(e.target.value)}
        >
          {COLLECTIONS.map((col) => (
            <option key={col} value={col}>
              {col === 'All' ? 'All System Modules' : col}
            </option>
          ))}
        </select>

        {collectionFilter !== 'All' && (
          <Button variant="secondary" size="sm" icon={FilterX} onClick={() => setCollectionFilter('All')}>
            Reset
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="No system audit records found"
      />
    </div>
  );
};

export default AuditLog;
