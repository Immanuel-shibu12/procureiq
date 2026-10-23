import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fmt } from '../api';
import { Badge } from './Requests';

export function Suppliers({ user }) {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('name');
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');

  const load = () =>
    api(`/suppliers?q=${encodeURIComponent(q)}&status=${status}&sort=${sort}`).then(setList);

  useEffect(() => {
    load();
  }, [q, status, sort]);

  const canEdit = ['admin', 'officer'].includes(user.role);

  const save = async e => {
    e.preventDefault();
    setErr('');
    try {
      await api('/suppliers', 'POST', {
        name: f.name,
        email: f.email,
        categories: f.cat ? [f.cat] : [],
        quotes: f.cat && f.price ? [{ category: f.cat, price: +f.price }] : []
      });
      setF(null);
      load();
    } catch (x) {
      setErr(x.message);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between mb-4 align-items-center flex-wrap gap-2">
        <div>
          <div className="eyebrow mb-1">VENDOR INTELLIGENCE &amp; RISK RADAR</div>
          <h3 className="mb-0 text-uppercase" style={{ fontFamily: 'Space Grotesk' }}>
            Supplier Directory
          </h3>
        </div>
        {canEdit && (
          <button
            className="btn btn-theme-white px-3 py-2 text-uppercase tracking-wider"
            onClick={() => setF(f ? null : {})}
          >
            {f ? 'Cancel' : '+ Onboard Supplier'}
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Search supplier by name…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="under_review">Under Review</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="name">Sort by: Name (A-Z)</option>
              <option value="quality">Sort by: Quality Rating (High → Low)</option>
              <option value="ontime">Sort by: On-Time Delivery % (High → Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Onboard Supplier Form */}
      {f && (
        <form className="card p-4 mb-4" onSubmit={save}>
          <div className="eyebrow mb-3">ONBOARD NEW VENDOR // REGISTRATION</div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label text-muted small text-uppercase tracking-wider">
                Supplier Name
              </label>
              <input
                className="form-control"
                placeholder="e.g. Apex Hardware Ltd."
                value={f.name || ''}
                onChange={e => setF({ ...f, name: e.target.value })}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small text-uppercase tracking-wider">
                Contact Email
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="contact@apex.com"
                value={f.email || ''}
                onChange={e => setF({ ...f, email: e.target.value })}
                required
              />
            </div>
            <div className="col-md-2">
              <label className="form-label text-muted small text-uppercase tracking-wider">
                Primary Category
              </label>
              <input
                className="form-control"
                placeholder="e.g. Laptops"
                value={f.cat || ''}
                onChange={e => setF({ ...f, cat: e.target.value })}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label text-muted small text-uppercase tracking-wider">
                Base Quote (₹)
              </label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="₹ Amount"
                value={f.price || ''}
                onChange={e => setF({ ...f, price: e.target.value })}
              />
            </div>
          </div>
          {err && <div className="alert alert-danger py-2 mt-3 mb-0 small">{err}</div>}
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button
              type="button"
              className="btn btn-outline-light px-3"
              onClick={() => setF(null)}
            >
              Cancel
            </button>
            <button className="btn btn-theme-white px-4 text-uppercase tracking-wider">
              Save Vendor
            </button>
          </div>
        </form>
      )}

      {/* Directory Table */}
      <div className="card overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Supplier Details</th>
                <th>Categories</th>
                <th>Quality Score</th>
                <th>On-Time Rate</th>
                <th>Status</th>
                <th>Risk Level</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No suppliers found matching the criteria.
                  </td>
                </tr>
              ) : (
                list.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div className="fw-bold text-white">{s.name}</div>
                      <small className="text-muted">{s.email}</small>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {s.categories && s.categories.length > 0 ? (
                          s.categories.map((c, i) => (
                            <span key={i} className="badge bg-secondary">
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted small">None</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="fw-semibold text-white">
                        {s.quality != null ? `${s.quality} / 5.0` : 'No data'}
                      </span>
                    </td>
                    <td>
                      <span className="fw-semibold text-white">
                        {s.onTimePct != null ? `${s.onTimePct}%` : 'No data'}
                      </span>
                    </td>
                    <td>
                      <Badge s={s.status === 'under_review' ? 'under_review' : s.status} />
                    </td>
                    <td>
                      <span className={`risk-${s.risk.level} fw-bold text-uppercase small`}>
                        {s.risk.level}
                      </span>
                    </td>
                    <td className="text-end">
                      <Link
                        to={'/suppliers/' + s._id}
                        className="btn btn-sm btn-outline-light px-3 py-1 text-uppercase tracking-wider"
                        style={{ fontSize: '0.72rem' }}
                      >
                        Profile &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function SupplierProfile() {
  const { id } = useParams();
  const [s, setS] = useState(null);

  useEffect(() => {
    api('/suppliers/' + id).then(setS);
  }, [id]);

  if (!s) return <div className="text-muted py-5 text-center">Loading supplier dossier…</div>;

  return (
    <>
      <div className="mb-3">
        <Link to="/suppliers" className="text-muted small text-decoration-none">
          &larr; Back to Supplier Directory
        </Link>
      </div>

      <div className="card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <div className="eyebrow mb-1">VENDOR DOSSIER</div>
            <h2 className="text-uppercase mb-2" style={{ fontFamily: 'Space Grotesk' }}>
              {s.name}
            </h2>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Badge s={s.status} />
              {s.isSample && (
                <span className="badge bg-secondary border">Demonstration Record</span>
              )}
              <span className="text-muted small ms-2">
                {s.email} {s.phone ? `· ${s.phone}` : ''}
              </span>
            </div>
          </div>

          <div className="card p-3 text-end" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="eyebrow mb-1">RISK PROFILE</div>
            <div className={`risk-${s.risk.level} fs-4 fw-bold text-uppercase`}>
              {s.risk.level} RISK
            </div>
            <small className="text-muted">{s.risk.note || 'Continuous monitoring active'}</small>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Quotes & Documents */}
        <div className="col-lg-6">
          <div className="card p-4 mb-4 h-100">
            <div className="eyebrow mb-3">CATALOG &amp; CONTRACT PRICING</div>
            {s.quotes && s.quotes.length ? (
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-end">Base Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.quotes.map((q, i) => (
                      <tr key={i}>
                        <td className="text-white">{q.category}</td>
                        <td className="text-end fw-semibold text-white">{fmt(q.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted small mb-0">No active catalog quotations filed.</p>
            )}

            <div className="eyebrow mt-4 mb-3">COMPLIANCE &amp; CERTIFICATIONS</div>
            {s.documents && s.documents.length ? (
              <ul className="list-group list-group-flush bg-transparent">
                {s.documents.map((d, i) => (
                  <li
                    key={i}
                    className="list-group-item bg-transparent px-0 border-secondary-subtle d-flex justify-content-between align-items-center"
                  >
                    <span className="text-white">{d.name}</span>
                    <span className="badge bg-secondary text-uppercase">{d.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted small mb-0">No regulatory documents submitted.</p>
            )}
          </div>
        </div>

        {/* Right Column: Risk Indicators & Delivery History */}
        <div className="col-lg-6">
          <div className="card p-4 mb-4 h-100">
            <div className="eyebrow mb-3">RISK RADAR FLAGS</div>
            {s.risk.flags && s.risk.flags.length ? (
              <div className="mb-4">
                {s.risk.flags.map((x, i) => (
                  <div key={i} className="alert alert-warning py-2 mb-2 small d-flex align-items-center gap-2">
                    <span>&#9888;</span>
                    <span>{x}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-info py-2 mb-4 small">
                ✓ No adverse risk flags currently detected for this vendor.
              </div>
            )}

            <div className="eyebrow mb-3">FULFILLMENT &amp; DELIVERY TRACK RECORD</div>
            {s.orders && s.orders.length ? (
              <ul className="list-group list-group-flush bg-transparent">
                {s.orders.map((o, i) => (
                  <li
                    key={i}
                    className="list-group-item bg-transparent px-0 border-secondary-subtle d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div className="fw-semibold text-white">{o.po}</div>
                      {o.amount && <small className="text-muted">{fmt(o.amount)}</small>}
                    </div>
                    <span
                      className={`badge ${
                        o.onTime ? 'bg-success' : 'bg-danger'
                      } text-uppercase`}
                    >
                      {o.onTime ? 'On-Time' : 'Delayed'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted small mb-0">No historical delivery records on file.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
