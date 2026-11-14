import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import {
  Box,
  Laptop,
  Users,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardList,
  RefreshCw,
  AlertOctagon,
  Wrench,
  CheckCheck
} from 'lucide-react';
import './PortalDashboard.css';

const PortalDashboard = ({ title = 'Dashboard', role: propRole }) => {
  const { user } = useAuth();
  const currentRole = propRole || user?.role || 'Admin';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardAPI.getStats();
      if (res?.data?.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Dashboard stats fetch error:', err.message);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Helper: safely get a stat value — returns '0' if missing, never fake data
  const val = (key) => {
    if (!stats || stats[key] === undefined || stats[key] === null) return '0';
    return String(stats[key]);
  };

  // 5 KPIs configured per role — all values sourced from real API data only
  const getRoleKPIs = () => {
    switch (currentRole) {
      case 'Admin':
        return [
          { label: 'Total Assets',           value: val('totalAssets'),          Icon: Box },
          { label: 'Total Employees',        value: val('totalEmployees') !== '0' ? val('totalEmployees') : val('totalUsers'), Icon: Users },
          { label: 'Assigned Assets',        value: val('assignedAssets'),       Icon: UserCheck },
          { label: 'Available Assets',       value: val('availableAssets'),      Icon: CheckCircle2 },
          { label: 'Pending Asset Requests', value: val('pendingAssetRequests') !== '0' ? val('pendingAssetRequests') : val('pendingRequests'), Icon: Clock },
        ];

      case 'Asset Manager':
        return [
          { label: 'Total Assets',     value: val('totalAssets'),     Icon: Box },
          { label: 'Available Assets', value: val('availableAssets'), Icon: CheckCircle2 },
          { label: 'Assigned Assets',  value: val('assignedAssets'),  Icon: UserCheck },
          { label: 'Pending Requests', value: val('pendingRequests'), Icon: Clock },
          { label: 'Overdue Returns',  value: val('overdueReturns'), Icon: AlertTriangle },
        ];

      case 'Support Team':
        return [
          { label: 'Assigned Work Orders',  value: val('assignedWorkOrders') !== '0' ? val('assignedWorkOrders') : val('myWorkOrders'), Icon: ClipboardList },
          { label: 'Pending Work Orders',   value: val('pendingWorkOrders') !== '0' ? val('pendingWorkOrders') : val('pendingOrders'), Icon: Clock },
          { label: 'In Progress',           value: val('inProgressOrders'),    Icon: RefreshCw },
          { label: 'Completed Work Orders', value: val('completedWorkOrders') !== '0' ? val('completedWorkOrders') : val('completedRepairs'), Icon: CheckCircle2 },
          { label: 'Overdue Work Orders',   value: val('overdueWorkOrders'),   Icon: AlertOctagon },
        ];

      case 'Employee':
      default:
        return [
          { label: 'My Assigned Assets',       value: val('myAssetsCount'),            Icon: Laptop },
          { label: 'Pending Requests',         value: val('pendingRequestsCount'),     Icon: Clock },
          { label: 'Approved Requests',        value: val('approvedRequestsCount'),    Icon: CheckCircle2 },
          { label: 'Open Maintenance Requests', value: val('openMaintenanceRequests'), Icon: Wrench },
          { label: 'Completed Repairs',        value: val('completedRepairs'),         Icon: CheckCheck },
        ];
    }
  };

  const kpis = getRoleKPIs();
  const kpiChartData = kpis.map((kpi) => ({
    label: kpi.label,
    value: Number(kpi.value) || 0
  }));
  const maxKpiValue = Math.max(...kpiChartData.map((item) => item.value), 1);
  const totalAssets = Number(val('totalAssets')) || 0;
  const assignedAssets = Math.min(Number(val('assignedAssets')) || 0, totalAssets);
  const availableAssets = Math.min(Number(val('availableAssets')) || 0, totalAssets - assignedAssets);
  const otherAssets = Math.max(totalAssets - assignedAssets - availableAssets, 0);
  const chartSegments = currentRole === 'Support Team'
    ? [
        { label: 'Pending', value: Number(val('pendingWorkOrders') !== '0' ? val('pendingWorkOrders') : val('pendingOrders')) || 0, color: '#f59e0b' },
        { label: 'In Progress', value: Number(val('inProgressOrders')) || 0, color: '#4f46e5' },
        { label: 'Completed', value: Number(val('completedWorkOrders') !== '0' ? val('completedWorkOrders') : val('completedRepairs')) || 0, color: '#10b981' }
      ]
    : currentRole === 'Employee'
    ? [
        { label: 'Assigned Assets', value: Number(val('myAssetsCount')) || 0, color: '#4f46e5' },
        { label: 'Pending Requests', value: Number(val('pendingRequestsCount')) || 0, color: '#f59e0b' },
        { label: 'Approved Requests', value: Number(val('approvedRequestsCount')) || 0, color: '#0ea5e9' },
        { label: 'Open Repairs', value: Number(val('openMaintenanceRequests')) || 0, color: '#f97316' },
        { label: 'Completed Repairs', value: Number(val('completedRepairs')) || 0, color: '#10b981' }
      ]
    : [
        { label: 'Assigned', value: assignedAssets, color: '#4f46e5' },
        { label: 'Available', value: availableAssets, color: '#0ea5e9' },
        { label: 'Other', value: otherAssets, color: '#cbd5e1' }
      ];
  const chartSegmentTotal = chartSegments.reduce((total, segment) => total + segment.value, 0);
  const assetChartCircumference = 2 * Math.PI * 42;

  return (
    <div className="portal-dashboard-wrapper">
      {/* Page Header */}
      <div className="portal-header-row">
        <h1 className="portal-page-title">{title}</h1>
      </div>

      {/* Error banner */}
      {error && (
        <div className="portal-error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button type="button" className="portal-retry-btn" onClick={fetchStats}>
            Retry
          </button>
        </div>
      )}

      {/* Role-Specific 5 KPIs Component */}
      <section className="portal-section-card my-assigned-section">
        <div className="section-title-group">
          <h2 className="section-title">
            {currentRole === 'Employee'
              ? 'My Assigned Assets'
              : currentRole === 'Support Team'
              ? 'Work Orders Overview'
              : 'Asset Portfolio Overview'}
          </h2>
          <p className="section-subtitle">All your IT &amp; Non IT Assets, tracked in real time.</p>
        </div>

        <div className="metrics-kpi-grid">
          {kpis.map((kpi, idx) => {
            const IconComponent = kpi.Icon;
            return (
              <div key={idx} className={`kpi-card ${loading ? 'kpi-loading' : ''}`}>
                <div className="kpi-info">
                  <span className="kpi-label">{kpi.label}</span>
                  <span className="kpi-value">
                    {loading ? '—' : kpi.value}
                  </span>
                </div>
                <div className="kpi-icon-badge">
                  <IconComponent size={16} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="admin-kpi-charts" aria-label={`Charts showing ${currentRole} dashboard KPI values`}>
            <article className="admin-kpi-chart-card">
              <div className="admin-kpi-chart-heading">
                <h3>Key metrics</h3>
                <span>Current KPI totals</span>
              </div>
              {loading ? (
                <p className="admin-kpi-chart-empty">Loading KPI data…</p>
              ) : (
                <div className="admin-kpi-bar-list">
                  {kpiChartData.map((item) => (
                    <div className="admin-kpi-bar-row" key={item.label}>
                      <div className="admin-kpi-bar-label">
                        <span>{item.label}</span>
                        <strong>{item.value.toLocaleString()}</strong>
                      </div>
                      <div className="admin-kpi-bar-track" aria-label={`${item.label}: ${item.value}`}>
                        <span style={{ width: `${(item.value / maxKpiValue) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="admin-kpi-chart-card admin-asset-mix-card">
              <div className="admin-kpi-chart-heading">
                <h3>{currentRole === 'Support Team' ? 'Work order status' : currentRole === 'Employee' ? 'My activity' : 'Asset availability'}</h3>
                <span>{currentRole === 'Support Team' ? 'Pending, active, and completed work' : currentRole === 'Employee' ? 'Assigned assets, requests, and repairs' : 'Breakdown of total assets'}</span>
              </div>
              {loading ? (
                <p className="admin-kpi-chart-empty">Loading KPI data…</p>
              ) : (
                <div className="admin-asset-mix-content">
                  <div className="admin-asset-donut" role="img" aria-label={`${currentRole} KPI breakdown: ${chartSegments.map((segment) => `${segment.value} ${segment.label}`).join(', ')}`}>
                    <svg viewBox="0 0 100 100" aria-hidden="true">
                      <circle className="admin-asset-donut-track" cx="50" cy="50" r="42" />
                      {chartSegmentTotal > 0 && chartSegments.reduce((chart, segment) => {
                        if (!segment.value) return chart;
                        const segmentLength = (segment.value / chartSegmentTotal) * assetChartCircumference;
                        chart.elements.push(
                          <circle
                            key={segment.label}
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="11"
                            strokeDasharray={`${segmentLength} ${assetChartCircumference - segmentLength}`}
                            strokeDashoffset={-chart.offset}
                          />
                        );
                        chart.offset += segmentLength;
                        return chart;
                      }, { offset: 0, elements: [] }).elements}
                    </svg>
                    <div className="admin-asset-donut-total">
                      <strong>{chartSegmentTotal.toLocaleString()}</strong>
                      <span>Total</span>
                    </div>
                  </div>
                  <div className="admin-asset-legend">
                    {chartSegments.map((segment) => (
                      <div className="admin-asset-legend-item" key={segment.label}>
                        <span className="admin-asset-legend-dot" style={{ backgroundColor: segment.color }} />
                        <span>{segment.label}</span>
                        <strong>{segment.value.toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>
      </section>
    </div>
  );
};

export default PortalDashboard;
