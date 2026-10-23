import { useEffect, useState } from 'react';
import { api } from '../api';

const KEYS = ['price', 'delivery', 'quality', 'compliance'];

export default function Engine() {
  const [meta, setMeta] = useState(null);
  const [cat, setCat] = useState('IT Equipment');
  const [w, setW] = useState(null);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api('/engine/meta').then(m => {
      setMeta(m);
      setW(m.defaultWeights);
    });
  }, []);

  const total = w ? KEYS.reduce((a, k) => a + Number(w[k] || 0), 0) : 0;

  const run = async () => {
    setErr('');
    if (KEYS.some(k => (w[k] ?? 0) < 0)) return setErr('Weights cannot be negative');
    if (Math.abs(total - 100) > 0.01) return setErr(`Weights must total 100% (currently ${total}%)`);
    setLoading(true);
    try {
      const data = await api('/engine/score', 'POST', {
        category: cat,
        weights: Object.fromEntries(KEYS.map(k => [k, Number(w[k])]))
      });
      setRes(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (w) run();
  }, [cat]);

  if (!meta || !w) {
    return <div className="text-center py-5 text-muted"><div className="spinner-border spinner-border-sm me-2" />Loading Fit &amp; Risk Engine…</div>;
  }

  const base = id => res?.baseline.find(b => b.supplierId === id);

  return (
    <div className="engine-container">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <div className="eyebrow mb-1">DECISION INTELLIGENCE</div>
          <h3 className="mb-0 text-uppercase" style={{ fontFamily: 'Space Grotesk' }}>Supplier Fit &amp; Risk Engine</h3>
        </div>
        <div className="formula-badge">
          S = 0.35P + 0.30D + 0.25Q + 0.10C
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="eyebrow mb-2">DYNAMIC MULTICRITERIA WEIGHTING</div>
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label text-muted small text-uppercase tracking-wider">Evaluation Category</label>
            <select className="form-select" value={cat} onChange={e => setCat(e.target.value)}>
              {meta.categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {KEYS.map(k => (
            <div className="col-md-2 col-6" key={k}>
              <label className="form-label text-muted small text-uppercase tracking-wider">{k} %</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-control"
                value={w[k]}
                onChange={e => setW({ ...w, [k]: e.target.value })}
              />
            </div>
          ))}

          <div className="col-md-1 col-12">
            <button className="btn btn-theme-white w-100 py-2 text-uppercase tracking-wide" onClick={run} disabled={loading}>
              {loading ? '…' : 'Run'}
            </button>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary-subtle" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className={'small fw-bold ' + (Math.abs(total - 100) > 0.01 ? 'text-danger' : 'text-success')}>
            Cumulative Weight: {total}% {Math.abs(total - 100) > 0.01 ? '(Must equal 100%)' : '✓ Balanced'}
          </div>
          <button
            className="btn btn-link text-muted p-0 small text-decoration-none"
            onClick={() => { setW({ ...meta.defaultWeights }); setErr(''); }}
          >
            Reset to Default Weights
          </button>
        </div>

        {err && <div className="alert alert-danger py-2 mt-3 small mb-0">{err}</div>}
      </div>

      {res && (
        <div className="card mb-3 overflow-hidden">
          <div className="card-header bg-transparent border-bottom border-secondary-subtle px-4 py-3 d-flex justify-content-between align-items-center">
            <h6 className="mb-0 text-uppercase tracking-wider" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              Ranked Supplier Comparison &middot; {cat}
            </h6>
            <span className="badge role-badge">LOWEST QUOTE: {res.lowestQuote ? '₹' + Number(res.lowestQuote).toLocaleString('en-IN') : 'N/A'}</span>
          </div>

          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Rank</th>
                  <th>Supplier</th>
                  <th>Price</th>
                  <th>Delivery</th>
                  <th>Quality</th>
                  <th>Compliance</th>
                  <th>Fit Score</th>
                  <th>vs Default</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {res.rows.map(r => {
                  const b = base(r.supplierId);
                  const d = b ? b.rank - r.rank : 0;
                  return (
                    <tr key={r.supplierId}>
                      <td className="fw-bold font-monospace" style={{ fontSize: '1rem' }}>#{r.rank}</td>
                      <td>
                        <div className="fw-bold text-white">{r.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.explain.join(' ')}</div>
                      </td>
                      {KEYS.map(k => (
                        <td key={k} className="font-monospace">
                          {r.components[k] != null ? r.components[k] : <span className="text-muted">N/A</span>}
                        </td>
                      ))}
                      <td>
                        <span className="fw-bold fs-6 font-monospace text-white">{r.total ?? 'N/A'}</span>
                        {r.incomplete && <div className="badge bg-warning p-1 ms-1" style={{ fontSize: '0.6rem' }}>Partial</div>}
                      </td>
                      <td>
                        {d > 0 ? (
                          <span className="text-success fw-bold font-monospace">&#9650; +{d}</span>
                        ) : d < 0 ? (
                          <span className="text-danger fw-bold font-monospace">&#9660; {d}</span>
                        ) : (
                          <span className="text-muted font-monospace">&mdash;</span>
                        )}
                      </td>
                      <td>
                        <span className={`risk-${r.risk.level} fw-bold`}>{r.risk.level}</span>
                        {r.risk.flags.length > 0 && (
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{r.risk.flags.join('; ')}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-muted small">
        * Risk flags are deterministic calculated indicators from recorded vendor attributes, not confirmed violations. N/A components are transparently re-scaled across available metrics without penalty.
      </div>
    </div>
  );
}
