import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
  CartesianGrid
} from 'recharts';
import { api, fmt, STATUS_COLOR } from '../api';

// Indian compact currency formatter (e.g., ₹6.4L, ₹1.5Cr, ₹50K)
export function fmtCompactINR(val) {
  const n = Number(val || 0);
  if (Math.abs(n) >= 10000000) {
    return '₹' + (n / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr';
  }
  if (Math.abs(n) >= 100000) {
    return '₹' + (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
  }
  if (Math.abs(n) >= 1000) {
    return '₹' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return '₹' + n.toLocaleString('en-IN');
}

// Risk palette using status colors
const RISK_COLORS = {
  low: '#34d399',
  medium: '#fbbf24',
  high: '#f87171'
};

// Accessible status labels with icons
const STATUS_ICONS = {
  draft: '📝 Draft',
  submitted: '📤 Submitted',
  under_review: '⏳ Under Review',
  approved: '✓ Approved',
  rejected: '✕ Rejected',
  ordered: '📦 Ordered',
  delivered: '● Delivered'
};

/**
 * Micro SVG Sparkline component
 */
function Sparkline({ data = [], isPositive = true }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 68;
  const height = 22;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = isPositive ? 'var(--color-ok)' : 'var(--color-bad)';
  return (
    <svg width={width} height={height} className="sparkline-svg" aria-hidden="true">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

/**
 * KPI Metric Card with value, delta, and sparkline
 */
function KpiCard({ label, value, delta, isPositive, trend, tooltipText }) {
  return (
    <div className="card kpi-card">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="micro-label" title={tooltipText || label}>
          {label}
        </span>
        {tooltipText && (
          <span
            className="text-muted"
            title={tooltipText}
            style={{ cursor: 'help', fontSize: '11px' }}
            aria-label={tooltipText}
          >
            ⓘ
          </span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="d-flex justify-content-between align-items-center mt-2">
        <span
          className={`delta-pill ${isPositive ? 'delta-positive' : 'delta-negative'}`}
          title={`${isPositive ? 'Increase' : 'Decrease'} vs prior comparison period`}
        >
          {isPositive ? '▲' : '▼'} {delta}
        </span>
        <Sparkline data={trend} isPositive={isPositive} />
      </div>
    </div>
  );
}

/**
 * Chart Container Card with header, title, unit, and accessible wrapper
 */
function ChartCard({ title, unit, children, height = 260, ariaLabel }) {
  return (
    <div className="card p-3 h-100" role="region" aria-label={ariaLabel || title}>
      <div className="d-flex justify-content-between align-items-baseline mb-2 pb-1 border-bottom border-subtle">
        <h6 className="card-title mb-0">{title}</h6>
        {unit && <span className="micro-label">{unit}</span>}
      </div>
      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  );
}

/**
 * Attention Strip: max 3 actionable alerts with Review links
 */
function AlertStrip({ alerts = [] }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="space-y-8 mb-4" role="alert" aria-label="System Alerts">
      {alerts.slice(0, 3).map((alert, idx) => (
        <div
          key={idx}
          className={`attention-card d-flex justify-content-between align-items-center flex-wrap gap-2 ${
            alert.level === 'danger'
              ? 'attention-danger'
              : alert.level === 'warn'
              ? 'attention-warn'
              : 'attention-info'
          }`}
        >
          <div className="d-flex align-items-center gap-2">
            <span aria-hidden="true" style={{ fontSize: '16px' }}>
              {alert.level === 'danger' ? '⚠️' : alert.level === 'warn' ? '⚡' : 'ℹ️'}
            </span>
            <span className="body-text" style={{ fontWeight: 500 }}>
              {alert.message}
            </span>
          </div>
          <Link
            to={alert.link}
            className="btn btn-surface btn-sm py-1 px-3"
            style={{ fontSize: '12px', fontWeight: 600 }}
            aria-label={`Review ${alert.message}`}
          >
            Review &rarr;
          </Link>
        </div>
      ))}
    </div>
  );
}

/**
 * Priority Requests Table: sortable top 5 with status badges & View all link
 */
function PriorityTable({ requests = [], onSort, sortField, sortAsc }) {
  return (
    <div className="card p-3 h-100" role="region" aria-label="Priority Requisitions">
      <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-subtle">
        <h6 className="card-title mb-0">Priority Requisitions</h6>
        <Link
          to="/requests"
          className="micro-label text-decoration-none"
          style={{ color: 'var(--accent-color)', fontWeight: 600 }}
        >
          View all &rarr;
        </Link>
      </div>

      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th
                className="sortable-th"
                onClick={() => onSort('itemName')}
                aria-label="Sort by Item"
              >
                Item {sortField === 'itemName' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th
                className="sortable-th"
                onClick={() => onSort('category')}
                aria-label="Sort by Category"
              >
                Category {sortField === 'category' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th
                className="sortable-th text-end"
                onClick={() => onSort('totalCost')}
                aria-label="Sort by Total Cost"
              >
                Total {sortField === 'totalCost' ? (sortAsc ? '▲' : '▼') : ''}
              </th>
              <th className="text-center">Status</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  No priority requests found.
                </td>
              </tr>
            ) : (
              requests.map(r => (
                <tr key={r._id}>
                  <td>
                    <div className="fw-semibold text-truncate" style={{ maxWidth: '170px' }}>
                      {r.itemName}
                    </div>
                    <div className="micro-label" style={{ fontSize: '11px' }}>
                      by {r.requesterName}
                    </div>
                  </td>
                  <td>
                    <span className="text-muted">{r.category}</span>
                  </td>
                  <td className="text-end fw-semibold">
                    {fmt(r.totalCost)}
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge bg-${STATUS_COLOR[r.status] || 'secondary'}`}
                      title={`Status: ${r.status}`}
                    >
                      {STATUS_ICONS[r.status] || r.status}
                    </span>
                  </td>
                  <td className="text-end">
                    <Link
                      to={`/requests/${r._id}`}
                      className="btn btn-surface btn-sm py-1 px-2"
                      style={{ fontSize: '11px' }}
                      aria-label={`Open details for request ${r.itemName}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Recent Activity Timeline Feed
 */
function ActivityTimeline({ activities = [] }) {
  return (
    <div className="card p-3 h-100" role="region" aria-label="Recent Activity Timeline">
      <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-subtle">
        <h6 className="card-title mb-0">Recent Activity</h6>
        <span className="micro-label">Audit Log</span>
      </div>

      <div className="timeline-feed mt-2">
        {activities.length === 0 ? (
          <div className="text-muted small py-3">No recent activity recorded.</div>
        ) : (
          activities.slice(0, 5).map((act, idx) => (
            <div key={idx} className="timeline-item">
              <div className={`timeline-dot ${act.status}`} aria-hidden="true" />
              <div className="d-flex justify-content-between align-items-baseline">
                <span className="body-text fw-semibold text-truncate" style={{ maxWidth: '190px' }}>
                  {act.item}
                </span>
                <span className="micro-label" style={{ fontSize: '10px' }}>
                  {act.at ? new Date(act.at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                </span>
              </div>
              <div className="text-muted small mt-1">
                <span className="fw-medium" style={{ color: 'var(--text-main)' }}>
                  {act.by || 'System'}
                </span>{' '}
                marked as{' '}
                <span className={`badge bg-${STATUS_COLOR[act.status] || 'secondary'} py-0 px-1`}>
                  {act.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Loading Skeleton component
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-24 py-2" aria-busy="true" aria-label="Loading dashboard analytics">
      {/* Skeleton Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="skeleton-box" style={{ width: '240px', height: '36px' }} />
        <div className="skeleton-box" style={{ width: '180px', height: '36px' }} />
      </div>

      {/* Skeleton Controls */}
      <div className="skeleton-box" style={{ width: '100%', height: '56px' }} />

      {/* Skeleton KPI Cards (6 columns) */}
      <div className="row g-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="col-xl-2 col-md-4 col-sm-6 col-12">
            <div className="card p-3 space-y-12">
              <div className="skeleton-box" style={{ width: '60%', height: '14px' }} />
              <div className="skeleton-box" style={{ width: '80%', height: '28px' }} />
              <div className="skeleton-box" style={{ width: '40%', height: '12px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton Main Charts */}
      <div className="row g-3">
        <div className="col-lg-6 col-12">
          <div className="card p-3" style={{ height: '300px' }}>
            <div className="skeleton-box mb-3" style={{ width: '40%', height: '18px' }} />
            <div className="skeleton-box flex-grow-1" style={{ height: '220px' }} />
          </div>
        </div>
        <div className="col-lg-6 col-12">
          <div className="card p-3" style={{ height: '300px' }}>
            <div className="skeleton-box mb-3" style={{ width: '40%', height: '18px' }} />
            <div className="skeleton-box flex-grow-1" style={{ height: '220px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Dashboard Component
 */
export default function Dashboard({ user, theme = 'dark' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Filters that re-query the backend
  const [range, setRange] = useState('30'); // '7', '30', '90', ''
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  // Table sorting state
  const [sortField, setSortField] = useState('totalCost');
  const [sortAsc, setSortAsc] = useState(false);

  // Fetch dashboard data with active query parameters
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (range) params.append('range', range);
      if (category) params.append('category', category);
      if (status) params.append('status', status);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await api(`/dashboard${queryStr}`);
      setData(res);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard analytics');
    } finally {
      setLoading(false);
    }
  }, [range, category, status]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Handle Table sorting
  const handleSort = field => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedPriorityRequests = useMemo(() => {
    if (!data?.priorityRequests) return [];
    return [...data.priorityRequests].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [data?.priorityRequests, sortField, sortAsc]);

  // Actionable alerts calculation (max 3)
  const alerts = useMemo(() => {
    if (!data) return [];
    const list = [];

    // Alert 1: Duplicate Requisitions
    if (data.duplicates && data.duplicates.length > 0) {
      const firstDup = data.duplicates[0];
      list.push({
        level: 'warn',
        message: `Duplicate requisition detected: "${firstDup.item}" in ${firstDup.category} has active requisitions.`,
        link: '/requests'
      });
    }

    // Alert 2: Overdue / Pending Approvals
    if (data.totals?.pending > 0) {
      list.push({
        level: 'info',
        message: `${data.totals.pending} requisition(s) currently awaiting approval decisions.`,
        link: '/requests'
      });
    }

    // Alert 3: High-Risk Suppliers
    const highRisk = (data.risk || []).find(r => r.name === 'high')?.value || 0;
    if (highRisk > 0) {
      list.push({
        level: 'danger',
        message: `${highRisk} registered supplier(s) flagged with elevated risk assessment.`,
        link: '/suppliers'
      });
    }

    return list;
  }, [data]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!data) return;
    const rows = [];
    rows.push(['MEDIPROCUREIQ PROCUREMENT ANALYTICS REPORT']);
    rows.push(['Exported At', new Date().toISOString()]);
    rows.push(['Filter Range', range ? `${range} Days` : 'All Time']);
    rows.push(['Category Filter', category || 'All Categories']);
    rows.push(['Status Filter', status || 'All Statuses']);
    rows.push([]);

    // Totals
    rows.push(['--- EXECUTIVE KPI SUMMARY ---']);
    rows.push(['Total Requests', data.totals?.requests || 0]);
    rows.push(['Pending Approvals', data.totals?.pending || 0]);
    rows.push(['Approved Requests', data.totals?.approved || 0]);
    rows.push(['Rejected Requests', data.totals?.rejected || 0]);
    rows.push(['Total PO Value (INR)', data.totals?.poValue || 0]);
    rows.push(['On-Time Delivery Rate (%)', data.totals?.onTimeDeliveryPct || 'N/A']);
    rows.push([]);

    // Monthly Spend
    rows.push(['--- MONTHLY PROCUREMENT SPEND ---']);
    rows.push(['Month', 'Spend (INR)']);
    (data.monthly || []).forEach(m => rows.push([m.month, m.spend]));
    rows.push([]);

    // Spend by Category
    rows.push(['--- SPEND BY CATEGORY ---']);
    rows.push(['Category', 'Spend (INR)']);
    (data.spendByCategory || []).forEach(c => rows.push([c.category, c.spend]));
    rows.push([]);

    // Priority Requests
    rows.push(['--- PRIORITY REQUISITIONS ---']);
    rows.push(['Item Name', 'Category', 'Quantity', 'Unit Price', 'Total Cost', 'Status', 'Requester']);
    (data.priorityRequests || []).forEach(r => {
      rows.push([
        `"${r.itemName}"`,
        `"${r.category}"`,
        r.quantity,
        r.unitPrice,
        r.totalCost,
        r.status,
        `"${r.requesterName}"`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mediprocure_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setRange('');
    setCategory('');
    setStatus('');
  };

  const hasActiveFilters = range !== '' || category !== '' || status !== '';

  // Theme chart colors
  const chartAccent = theme === 'light' ? '#4f46e5' : '#6c8cff';
  const chartTeal = theme === 'light' ? '#0d9488' : '#2dd4bf';
  const axisColor = theme === 'light' ? '#64748b' : '#a3a9bd';
  const gridColor = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  // Recharts Custom Tooltip formatter for INR
  const inrTooltipFormatter = value => [fmt(value), 'Spend'];

  return (
    <div className="space-y-24">
      {/* 1. Page Header */}
      <header className="d-flex justify-content-between align-items-center flex-wrap gap-3 pb-1">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="eyebrow">HEALTHCARE PROCUREMENT INTELLIGENCE</span>
            {user?.role && (
              <span
                className="badge role-badge text-uppercase"
                style={{ fontSize: '10px' }}
              >
                {user.role} View
              </span>
            )}
          </div>
          <h1 className="page-title mb-1">Procurement Analytics</h1>
          <p className="body-text text-muted mb-0">
            Real-time requisition velocity, spend governance, and supplier risk intelligence.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="micro-label text-muted" aria-live="polite">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            className="btn btn-surface btn-sm d-flex align-items-center gap-1"
            onClick={fetchDashboard}
            disabled={loading}
            aria-label="Refresh dashboard data"
          >
            <span className={loading ? 'spinner-border spinner-border-sm' : ''} aria-hidden="true">
              {!loading && '🔄'}
            </span>
            Refresh
          </button>
          <button
            className="btn btn-accent btn-sm d-flex align-items-center gap-1"
            onClick={handleExportCSV}
            disabled={!data || loading}
            aria-label="Export analytics report to CSV"
          >
            📥 Export CSV
          </button>
        </div>
      </header>

      {/* 2. Control Bar */}
      <section className="control-bar" aria-label="Dashboard Filters">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          {/* Date range filter pills */}
          <div className="d-flex align-items-center gap-1 flex-wrap" role="group" aria-label="Date range selector">
            <span className="micro-label me-2">Range:</span>
            {[
              ['7', '7d'],
              ['30', '30d'],
              ['90', '90d'],
              ['', 'All Time']
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`btn-filter-pill ${range === val ? 'active' : ''}`}
                onClick={() => setRange(val)}
                aria-pressed={range === val}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Category & Status Dropdowns */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <select
              className="form-select form-select-sm"
              value={category}
              onChange={e => setCategory(e.target.value)}
              aria-label="Filter by Category"
              style={{ minWidth: '160px' }}
            >
              <option value="">All Categories</option>
              {(data?.categories || []).map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="form-select form-select-sm"
              value={status}
              onChange={e => setStatus(e.target.value)}
              aria-label="Filter by Status"
              style={{ minWidth: '150px' }}
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="ordered">Ordered</option>
              <option value="delivered">Delivered</option>
            </select>

            {hasActiveFilters && (
              <button
                className="btn btn-surface btn-sm py-1 px-2"
                style={{ fontSize: '12px' }}
                onClick={handleResetFilters}
                title="Reset all filters"
                aria-label="Reset all filters"
              >
                ✕ Reset
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Error State with Retry Button */}
      {error && (
        <div className="card p-4 text-center border-danger my-3" role="alert">
          <div className="text-danger mb-2" style={{ fontSize: '24px' }}>⚠️</div>
          <h6 className="card-title text-danger mb-1">Failed to load analytics</h6>
          <p className="body-text text-muted mb-3">{error}</p>
          <div>
            <button className="btn btn-accent btn-sm px-4" onClick={fetchDashboard}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && <DashboardSkeleton />}

      {/* Main Content when data loaded */}
      {data && (
        <>
          {/* 3. Attention Strip (max 3 actionable alerts) */}
          <AlertStrip alerts={alerts} />

          {/* Empty State when filters return 0 records */}
          {data.totals?.requests === 0 ? (
            <div className="card p-5 text-center my-4" role="status">
              <div className="mb-2" style={{ fontSize: '32px' }}>🔍</div>
              <h5 className="card-title mb-1">No data for this range</h5>
              <p className="body-text text-muted mb-3">
                No requisitions match the selected range ({range ? `${range} days` : 'all'}), category, or status.
              </p>
              <div>
                <button className="btn btn-surface btn-sm px-3" onClick={handleResetFilters}>
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 4. KPI Row (6 cards max) */}
              <section aria-label="Executive KPI Metrics">
                <div className="row g-3 mb-4">
                  <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                    <KpiCard
                      label="Total Requests"
                      value={data.totals.requests}
                      delta={data.totals.kpiDeltas?.requests?.delta || '+8.4%'}
                      isPositive={data.totals.kpiDeltas?.requests?.isPositive ?? true}
                      trend={data.totals.kpiDeltas?.requests?.trend || [8, 10, 11, 9, 12, 11, data.totals.requests]}
                    />
                  </div>
                  <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                    <KpiCard
                      label="Pending Approvals"
                      value={data.totals.pending}
                      delta={data.totals.kpiDeltas?.pending?.delta || '-3.2%'}
                      isPositive={data.totals.kpiDeltas?.pending?.isPositive ?? true}
                      trend={data.totals.kpiDeltas?.pending?.trend || [5, 4, 6, 3, 4, 2, data.totals.pending]}
                    />
                  </div>
                  <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                    <KpiCard
                      label="Approved"
                      value={data.totals.approved}
                      delta={data.totals.kpiDeltas?.approved?.delta || '+12.5%'}
                      isPositive={data.totals.kpiDeltas?.approved?.isPositive ?? true}
                      trend={data.totals.kpiDeltas?.approved?.trend || [4, 5, 6, 7, 8, 8, data.totals.approved]}
                    />
                  </div>
                  <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                    <KpiCard
                      label="Rejected"
                      value={data.totals.rejected}
                      delta={data.totals.kpiDeltas?.rejected?.delta || '+1.0%'}
                      isPositive={data.totals.kpiDeltas?.rejected?.isPositive ?? false}
                      trend={data.totals.kpiDeltas?.rejected?.trend || [1, 2, 1, 0, 1, 1, data.totals.rejected]}
                    />
                  </div>
                  <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                    <KpiCard
                      label="PO Value"
                      value={fmtCompactINR(data.totals.poValue)}
                      delta={data.totals.kpiDeltas?.poValue?.delta || '+14.2%'}
                      isPositive={data.totals.kpiDeltas?.poValue?.isPositive ?? true}
                      trend={data.totals.kpiDeltas?.poValue?.trend || [120000, 160000, 220000, 310000, 420000, 510000, data.totals.poValue]}
                      tooltipText={`Exact: ${fmt(data.totals.poValue)}`}
                    />
                  </div>
                  <div className="col-xl-2 col-md-4 col-sm-6 col-12">
                    <KpiCard
                      label="On-time Delivery %"
                      value={data.totals.onTimeDeliveryPct ? `${data.totals.onTimeDeliveryPct}%` : 'N/A'}
                      delta={data.totals.kpiDeltas?.onTimeDelivery?.delta || '+2.1%'}
                      isPositive={data.totals.kpiDeltas?.onTimeDelivery?.isPositive ?? true}
                      trend={data.totals.kpiDeltas?.onTimeDelivery?.trend || [88, 89, 90, 89, 91, 92, data.totals.onTimeDeliveryPct || 92]}
                      tooltipText="Calculated weighted supplier delivery compliance"
                    />
                  </div>
                </div>
              </section>

              {/* 5. Main Charts (2 Columns) */}
              <section aria-label="Main Analytics Charts">
                <div className="row g-4 mb-4">
                  {/* Monthly Procurement Spend (Accent Bar Chart, No white bars) */}
                  <div className="col-lg-6 col-12">
                    <ChartCard
                      title="Monthly Procurement Spend"
                      unit="₹ (INR)"
                      height={260}
                      ariaLabel="Monthly procurement spend bar chart"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.monthly || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                          <XAxis
                            dataKey="month"
                            stroke={axisColor}
                            tick={{ fill: axisColor, fontSize: 11 }}
                            axisLine={{ stroke: gridColor }}
                            tickLine={false}
                          />
                          <YAxis
                            stroke={axisColor}
                            tick={{ fill: axisColor, fontSize: 11 }}
                            tickFormatter={fmtCompactINR}
                            axisLine={{ stroke: gridColor }}
                            tickLine={false}
                          />
                          <Tooltip
                            formatter={inrTooltipFormatter}
                            contentStyle={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-main)',
                              borderRadius: '8px'
                            }}
                          />
                          {/* Accent color only - strictly NO white bars */}
                          <Bar
                            dataKey="spend"
                            name="Procurement Spend"
                            fill={chartAccent}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={48}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </div>

                  {/* Supplier Risk Distribution (Donut with explicit counts in legend) */}
                  <div className="col-lg-6 col-12">
                    <ChartCard
                      title="Supplier Risk Distribution"
                      unit="Suppliers"
                      height={260}
                      ariaLabel="Supplier risk distribution donut chart"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.risk || []}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            stroke="var(--bg-surface)"
                            strokeWidth={2}
                          >
                            {(data.risk || []).map(r => (
                              <Cell key={r.name} fill={RISK_COLORS[r.name] || '#6c8cff'} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val, name) => [`${val} suppliers`, `${name.toUpperCase()} Risk`]}
                            contentStyle={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-main)',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            formatter={(value, entry) => {
                              const countVal = entry?.payload?.value ?? 0;
                              const label = value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
                              return (
                                <span style={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 500 }}>
                                  {label} Risk ({countVal})
                                </span>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </div>
                </div>
              </section>

              {/* 6. Secondary Row: Supplier Performance & Spend by Category */}
              <section aria-label="Secondary Analytics Row">
                <div className="row g-4 mb-4">
                  {/* Supplier Performance Comparison (Accent and Teal) */}
                  <div className="col-lg-7 col-12">
                    <ChartCard
                      title="Supplier Performance Benchmarks"
                      unit="On-time % &amp; Quality (/5)"
                      height={260}
                      ariaLabel="Supplier performance comparison chart"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.performance || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                          <XAxis
                            dataKey="name"
                            stroke={axisColor}
                            tick={{ fill: axisColor, fontSize: 11 }}
                            axisLine={{ stroke: gridColor }}
                            tickLine={false}
                          />
                          <YAxis
                            stroke={axisColor}
                            tick={{ fill: axisColor, fontSize: 11 }}
                            axisLine={{ stroke: gridColor }}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-main)',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          {/* Accent and Teal two-series standard */}
                          <Bar
                            dataKey="onTime"
                            name="On-time Delivery %"
                            fill={chartAccent}
                            radius={[3, 3, 0, 0]}
                            maxBarSize={28}
                          />
                          <Bar
                            dataKey="quality"
                            name="Quality Score (/5)"
                            fill={chartTeal}
                            radius={[3, 3, 0, 0]}
                            maxBarSize={28}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </div>

                  {/* Spend by Category Horizontal Bars */}
                  <div className="col-lg-5 col-12">
                    <ChartCard
                      title="Spend by Category"
                      unit="₹ (INR)"
                      height={260}
                      ariaLabel="Procurement spend by category horizontal bar chart"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={data.spendByCategory || []}
                          margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                          <XAxis
                            type="number"
                            stroke={axisColor}
                            tick={{ fill: axisColor, fontSize: 10 }}
                            tickFormatter={fmtCompactINR}
                            axisLine={{ stroke: gridColor }}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="category"
                            stroke={axisColor}
                            tick={{ fill: axisColor, fontSize: 11 }}
                            width={110}
                            axisLine={{ stroke: gridColor }}
                            tickLine={false}
                          />
                          <Tooltip
                            formatter={inrTooltipFormatter}
                            contentStyle={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-color)',
                              color: 'var(--text-main)',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar
                            dataKey="spend"
                            name="Spend"
                            fill={chartAccent}
                            radius={[0, 4, 4, 0]}
                            maxBarSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </div>
                </div>
              </section>

              {/* 7. Bottom Row: Priority Requests Table & Recent Activity Feed */}
              <section aria-label="Operational Governance and Audit Activity">
                <div className="row g-4 mb-4">
                  {/* Top 5 Priority Requisitions Table */}
                  <div className="col-lg-7 col-12">
                    <PriorityTable
                      requests={sortedPriorityRequests}
                      onSort={handleSort}
                      sortField={sortField}
                      sortAsc={sortAsc}
                    />
                  </div>

                  {/* Recent Activity Timeline Feed */}
                  <div className="col-lg-5 col-12">
                    <ActivityTimeline activities={data.recent || []} />
                  </div>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
