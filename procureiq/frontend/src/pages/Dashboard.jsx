import { useEffect, useState } from 'react'; import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api, fmt } from '../api';
const RISK_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
const darkTooltipStyle = {
  backgroundColor: '#161922',
  borderColor: 'rgba(255, 255, 255, 0.15)',
  color: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
};
export default function Dashboard() {
  const [d, setD] = useState(null), [cat, setCat] = useState('');
  useEffect(() => { api('/dashboard' + (cat ? '?category=' + encodeURIComponent(cat) : '')).then(setD); }, [cat]);
  if (!d) return <div className="text-center py-5 text-muted"><div className="spinner-border spinner-border-sm me-2" />Loading intelligence metrics…</div>;
  const cards = [
    ['Total requests', d.totals.requests],
    ['Pending approvals', d.totals.pending],
    ['Approved', d.totals.approved],
    ['Rejected', d.totals.rejected],
    ['PO value', fmt(d.totals.poValue)],
    ['Realized savings', fmt(d.totals.savings || 0)]
  ];
  return <>
    <div className="d-flex justify-content-between mb-4 align-items-center flex-wrap gap-2">
      <div>
        <div className="eyebrow mb-1">ANALYTICS &amp; GOVERNANCE</div>
        <h3 className="mb-0 text-uppercase" style={{ fontFamily: 'Space Grotesk' }}>Procurement Dashboard</h3>
      </div>
      <select className="form-select w-auto" value={cat} onChange={e => setCat(e.target.value)}>
        <option value="">All Categories</option>
        {d.categories.map(c => <option key={c}>{c}</option>)}
      </select>
    </div>

    {d.duplicates?.length > 0 && (
      <div className="alert alert-warning mb-4">
        <h6 className="alert-heading mb-1 fw-bold">⚠️ SPEND INTELLIGENCE // DUPLICATE REQUISITION DETECTED</h6>
        <ul className="mb-0 small ps-3">
          {d.duplicates.map((dup, idx) => (
            <li key={idx}>
              <b>{dup.item}</b> in <i>{dup.category}</i> has multiple active requisitions (raised by {dup.requester}). Review before approval to avoid redundant procurement.
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className="row g-3 mb-4">
      {cards.map(([l, v]) => (
        <div className="col-md-2 col-sm-4 col-6" key={l}>
          <div className="card p-3 h-100">
            <div className="text-muted small text-uppercase tracking-wider" style={{ fontSize: '0.68rem', fontWeight: 600 }}>{l}</div>
            <div className="stat">{v}</div>
          </div>
        </div>
      ))}
    </div>

    <div className="row g-4 mb-4">
      <div className="col-md-6">
        <div className="card p-4 h-100">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 text-uppercase tracking-wider" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Monthly Procurement Spend</h6>
            <span className="badge role-badge">INR</span>
          </div>
          <ResponsiveContainer height={240}>
            <BarChart data={d.monthly}>
              <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={darkTooltipStyle} />
              <Bar dataKey="spend" fill="#ffffff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card p-4 h-100">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 text-uppercase tracking-wider" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Supplier Risk Distribution</h6>
            <span className="badge role-badge">RADAR</span>
          </div>
          <ResponsiveContainer height={240}>
            <PieChart>
              <Pie data={d.risk} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} stroke="#151822" strokeWidth={3} label>
                {d.risk.map(r => <Cell key={r.name} fill={RISK_COLORS[r.name]} />)}
              </Pie>
              <Tooltip contentStyle={darkTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    <div className="row g-4 mb-4">
      <div className="col-md-7">
        <div className="card p-4 h-100">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 text-uppercase tracking-wider" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Supplier Performance Analysis</h6>
            <span className="badge role-badge">BENCHMARK</span>
          </div>
          <ResponsiveContainer height={240}>
            <BarChart data={d.performance}>
              <XAxis dataKey="name" tick={false} stroke="#64748b" />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={darkTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
              <Bar dataKey="onTime" name="On-time %" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="quality" name="Quality (/5)" fill="#38bdf8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="col-md-5">
        <div className="card p-4 h-100">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 text-uppercase tracking-wider" style={{ fontSize: '0.82rem', fontWeight: 700 }}>Recent Audit Activity</h6>
            <span className="badge role-badge">LOG</span>
          </div>
          <ul className="list-unstyled small mb-0">
            {d.recent.map((a, i) => (
              <li key={i} className="mb-2 pb-2 border-bottom border-secondary-subtle" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <b>{a.item}</b>
                  <span className="badge bg-secondary">{a.status}</span>
                </div>
                <span className="text-muted d-block small mt-1">by {a.by} &middot; {new Date(a.at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {d.budgetIndicators?.length > 0 && (
      <div className="card p-3 mb-3">
        <h6>Departmental Budget Utilization by Category</h6>
        <div className="row g-3 mt-1">
          {d.budgetIndicators.map(b => (
            <div className="col-md-3 col-sm-6" key={b.category}>
              <div className="d-flex justify-content-between small mb-1">
                <span className="fw-semibold">{b.category}</span>
                <span className={b.pct > 80 ? 'text-danger' : 'text-muted'}>{b.pct}%</span>
              </div>
              <div className="progress" style={{ height: 8 }}>
                <div
                  className={`progress-bar ${b.pct > 80 ? 'bg-danger' : b.pct > 50 ? 'bg-warning' : 'bg-success'}`}
                  style={{ width: `${Math.min(100, b.pct)}%` }}
                />
              </div>
              <div className="d-flex justify-content-between text-muted small mt-1">
                <span>Spent: {fmt(b.spent)}</span>
                <span>Budget: {fmt(b.allocated)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </>;
}

