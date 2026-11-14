import React, { useState, useEffect } from 'react';
import { repairAPI } from '../../../services/api';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import RepairUpdateModal from './RepairUpdateModal';
import { Wrench, RefreshCw, AlertCircle, CheckCircle2, Inbox } from 'lucide-react';
import './RepairManagement.css';

const RepairManagement = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchActiveRepairs = async () => {
    try {
      setLoading(true);
      const res = await repairAPI.getMyWorkOrders();
      if (res.data.success) {
        // Active repairs are Assigned or In Progress
        const active = res.data.workOrders.filter(
          (r) => r.repairStatus === 'Assigned' || r.repairStatus === 'In Progress'
        );
        setRepairs(active);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRepairs();
  }, []);

  return (
    <div className="repair-mgmt-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">Active Repair Operations</h1>
          <p className="dashboard-subtitle">
            Perform diagnostics, record replacement parts and finalize technical maintenance.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchActiveRepairs}>
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

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={24} className="spin-icon" style={{ color: '#2563eb', margin: '0 auto 0.5rem' }} />
          <div>Loading active repair tasks...</div>
        </div>
      ) : repairs.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
          <Inbox size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.35rem' }}>No Active Repairs Pending</h3>
          <p style={{ fontSize: '0.9rem' }}>All assigned work orders have been serviced or none are awaiting maintenance.</p>
        </div>
      ) : (
        <div className="repair-cards-grid">
          {repairs.map((repair) => (
            <div key={repair._id} className="repair-card-item">
              <div className="repair-card-header">
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{repair.asset?.assetName}</span>
                <Badge variant={repair.repairStatus === 'In Progress' ? 'info' : 'warning'}>
                  {repair.repairStatus}
                </Badge>
              </div>

              <div className="repair-card-body">
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Asset Tag</span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{repair.asset?.assetTag}</div>
                </div>

                <div>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Fault Reported</span>
                  <div style={{ color: '#334155' }}>{repair.repairDescription}</div>
                </div>

                {repair.inspectionDetails && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Inspection Diagnosis</span>
                    <div style={{ color: '#0f172a', fontStyle: 'italic' }}>{repair.inspectionDetails}</div>
                  </div>
                )}

                {repair.sparePartsUsed && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Spare Parts</span>
                    <div>{repair.sparePartsUsed}</div>
                  </div>
                )}
              </div>

              <div className="repair-card-footer">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Wrench}
                  onClick={() => {
                    setSelectedRepair(repair);
                    setIsModalOpen(true);
                  }}
                >
                  Update Service Record
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RepairUpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          showAlert('Repair service record updated.');
          fetchActiveRepairs();
        }}
        repair={selectedRepair}
      />
    </div>
  );
};

export default RepairManagement;
