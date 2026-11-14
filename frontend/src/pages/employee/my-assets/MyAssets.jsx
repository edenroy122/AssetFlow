import React, { useState, useEffect } from 'react';
import { assignmentAPI } from '../../../services/api';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import WorkspaceDetail from '../../../components/common/WorkspaceDetail';
import {
  Laptop,
  PlusCircle,
  Eye,
  Tag,
  Cpu,
  Calendar,
  MapPin,
  Building,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './MyAssets.css';

const MyAssets = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchAssignedAssets = async () => {
    try {
      setLoading(true);
      const res = await assignmentAPI.getMyAssignedAssets();
      if (res.data.success) {
        setAssignments(res.data.assignments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedAssets();
  }, []);

  const handleRowClick = (row) => {
    setSelectedAssignment(row);
    setIsDetailOpen(true);
  };

  const columns = [
    {
      header: 'Asset Tag & Name',
      key: 'assetName',
      render: (row) => (
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <strong style={{ color: '#0f172a' }}>{row.asset?.assetTag}</strong>
          </div>
          <div style={{ marginTop: '0.15rem', fontWeight: 600, color: '#0f172a' }}>{row.asset?.assetName}</div>
        </div>
      )
    },
    {
      header: 'Serial Number',
      key: 'serialNumber',
      width: '140px',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#334155' }}>
          {row.asset?.serialNumber || '—'}
        </span>
      )
    },
    {
      header: 'Location',
      key: 'location',
      width: '130px',
      render: (row) => (
        <span style={{ fontSize: '0.825rem', color: '#475569' }}>
          {row.asset?.location || 'Headquarters'}
        </span>
      )
    },
    {
      header: 'Condition',
      key: 'condition',
      width: '110px',
      render: (row) => (
        <Badge variant={row.asset?.condition === 'Good' || row.asset?.condition === 'New' ? 'success' : 'warning'}>
          {row.asset?.condition || 'Good'}
        </Badge>
      )
    },
    {
      header: 'Assigned Date',
      key: 'assignmentDate',
      width: '120px',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {row.assignmentDate ? new Date(row.assignmentDate).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Action',
      key: 'actions',
      align: 'right',
      width: '100px',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          icon={Eye}
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row);
          }}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <div className="my-assets-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="dashboard-title">My Assigned Assets</h1>
          <p className="dashboard-subtitle">
            Physical equipment assigned to you. Click on any asset to view its complete specifications and details.
          </p>
        </div>
        <Button variant="secondary" className="ams-btn-light-grey" size="sm" icon={PlusCircle} onClick={() => navigate('/employee/asset-requests')}>
          Request New Asset
        </Button>
      </div>

      <Table
        columns={columns}
        data={assignments}
        loading={loading}
        compact={true}
        noScroll={true}
        onRowClick={handleRowClick}
        emptyMessage="You do not have any physical assets assigned to you yet."
      />

      {/* Asset Information Modal */}
      {selectedAssignment && isDetailOpen && (
        <WorkspaceDetail title="Assigned Asset Details" onBack={() => setIsDetailOpen(false)}>
          <div className="asset-modal-content">
            {/* Top Banner */}
            <div className="asset-header-card">
              <div className="asset-icon-circle">
                <Laptop size={24} color="#2563eb" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                    {selectedAssignment.asset?.assetName}
                  </h3>
                  <span className="asset-tag-badge">
                    {selectedAssignment.asset?.assetTag}
                  </span>
                </div>
                <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {selectedAssignment.asset?.brand} {selectedAssignment.asset?.model}
                </div>
              </div>
              <Badge variant={selectedAssignment.asset?.condition === 'Good' || selectedAssignment.asset?.condition === 'New' ? 'success' : 'warning'}>
                {selectedAssignment.asset?.condition || 'Good'}
              </Badge>
            </div>

            {/* Hardware & Specifications Card */}
            <div className="asset-detail-card">
              <div className="asset-card-title">
                <Cpu size={15} color="#2563eb" />
                <span>Hardware &amp; Specifications</span>
              </div>
              <div className="asset-detail-row">
                <span className="asset-detail-label">Asset Name:</span>
                <span className="asset-detail-val">{selectedAssignment.asset?.assetName}</span>
              </div>
              <div className="asset-detail-row">
                <span className="asset-detail-label">Brand &amp; Model:</span>
                <span className="asset-detail-val">
                  {selectedAssignment.asset?.brand} {selectedAssignment.asset?.model}
                </span>
              </div>
              <div className="asset-detail-row">
                <span className="asset-detail-label">Serial Number:</span>
                <span className="asset-detail-val" style={{ fontFamily: 'monospace' }}>
                  {selectedAssignment.asset?.serialNumber || '—'}
                </span>
              </div>
              <div className="asset-detail-row">
                <span className="asset-detail-label">Assigned Location:</span>
                <span className="asset-detail-val">
                  {selectedAssignment.asset?.location || 'Headquarters'}
                </span>
              </div>
              {selectedAssignment.asset?.specifications && (
                <div className="asset-spec-box">
                  <span className="asset-detail-label" style={{ display: 'block', marginBottom: '0.25rem' }}>
                    Specifications:
                  </span>
                  <div style={{ color: '#334155', fontSize: '0.825rem', lineHeight: 1.45 }}>
                    {selectedAssignment.asset.specifications}
                  </div>
                </div>
              )}
            </div>

            {/* Custody & Assignment Details Card */}
            <div className="asset-detail-card">
              <div className="asset-card-title">
                <Calendar size={15} color="#059669" />
                <span>Custody &amp; Assignment Status</span>
              </div>
              <div className="asset-detail-row">
                <span className="asset-detail-label">Assignment Date:</span>
                <span className="asset-detail-val">
                  {selectedAssignment.assignmentDate
                    ? new Date(selectedAssignment.assignmentDate).toLocaleDateString()
                    : '—'}
                </span>
              </div>
              <div className="asset-detail-row">
                <span className="asset-detail-label">Custody Status:</span>
                <span className="asset-detail-val" style={{ color: '#059669', fontWeight: 600 }}>
                  {selectedAssignment.status === 'Active' ? 'Active In-Custody' : selectedAssignment.status}
                </span>
              </div>
              <div className="asset-detail-row">
                <span className="asset-detail-label">Condition at Handover:</span>
                <span className="asset-detail-val">
                  {selectedAssignment.conditionAtAssignment || selectedAssignment.asset?.condition || 'Good'}
                </span>
              </div>
              {selectedAssignment.expectedReturnDate && (
                <div className="asset-detail-row">
                  <span className="asset-detail-label">Expected Return:</span>
                  <span className="asset-detail-val">
                    {new Date(selectedAssignment.expectedReturnDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {selectedAssignment.remarks && (
                <div className="asset-note-box">
                  <strong>Assignment Remarks:</strong> {selectedAssignment.remarks}
                </div>
              )}
            </div>

            {/* Procurement & Warranty Card */}
            {(selectedAssignment.asset?.vendor || selectedAssignment.asset?.warrantyEndDate) && (
              <div className="asset-detail-card">
                <div className="asset-card-title">
                  <Building size={15} color="#d97706" />
                  <span>Procurement &amp; Warranty</span>
                </div>
                {selectedAssignment.asset?.vendor && (
                  <div className="asset-detail-row">
                    <span className="asset-detail-label">Vendor / Supplier:</span>
                    <span className="asset-detail-val">{selectedAssignment.asset.vendor}</span>
                  </div>
                )}
                {selectedAssignment.asset?.warrantyEndDate && (
                  <div className="asset-detail-row">
                    <span className="asset-detail-label">Warranty Expiration:</span>
                    <span className="asset-detail-val">
                      {new Date(selectedAssignment.asset.warrantyEndDate).toLocaleDateString()}
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

export default MyAssets;
