import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fmt, STATUS_COLOR } from '../api';

export const Badge = ({ s }) => (
  <span className={`badge bg-${STATUS_COLOR[s] || 'secondary'}`}>
    {s ? s.replace('_', ' ') : 'unknown'}
  </span>
);

export function Requests({ user }) {
  const [list, setList] = useState([]);
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [cats, setCats] = useState([]);
  const [f, setF] = useState({ itemName: '', category: '', quantity: 1, unitPrice: '', requiredDate: '', justification: '' });

  const load = () => api('/requests').then(setList);

  useEffect(() => {
    load();
    api('/engine/meta').then(m => setCats(m.categories));
  }, []);

  const save = async e => {
    e.preventDefault();
    setErr('');
    if (f.quantity < 1 || !Number.isInteger(+f.quantity)) return setErr('Quantity must be a whole number ≥ 1');
    if (!(f.unitPrice > 0)) return setErr('Unit price must be greater than 0');
    if (f.justification.length < 10) return setErr('Justification needs at least 10 characters');
    try {
      await api('/requests', 'POST', f);
      setShow(false);
      setF({ itemName: '', category: '', quantity: 1, unitPrice: '', requiredDate: '', justification: '' });
      load();
    } catch (x) {
      setErr(x.message);
    }
  };

  const set = k => e => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <div className="d-flex justify-content-between mb-4 align-items-center flex-wrap gap-2">
        <div>
          <div className="eyebrow mb-1">REQUISITION MANAGEMENT</div>
          <h3 className="mb-0 text-uppercase" style={{ fontFamily: 'Space Grotesk' }}>Purchase Requests</h3>
        </div>
        {['requester', 'admin', 'officer', 'approver'].includes(user.role) && (
          <button className="btn btn-theme-white px-3 py-2 text-uppercase tracking-wider" onClick={() => setShow(!show)}>
            {show ? 'Cancel' : '+ New Request'}
          </button>
        )}
      </div>

      {show && (
        <form className="card p-4 mb-4" onSubmit={save}>
          <div className="eyebrow mb-3">CREATE REQUISITION // DRAFT</div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label text-muted small text-uppercase tracking-wider">Item Name</label>
              <input className="form-control" placeholder="e.g. Ergonomic Office Chairs" value={f.itemName} onChange={set('itemName')} required />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small text-uppercase tracking-wider">Category</label>
              <select className="form-select" value={f.category} onChange={set('category')} required>
                <option value="">Select Category</option>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-2 col-6">
              <label className="form-label text-muted small text-uppercase tracking-wider">Quantity</label>
              <input type="number" min="1" className="form-control" value={f.quantity} onChange={set('quantity')} required />
            </div>
            <div className="col-md-2 col-6">
              <label className="form-label text-muted small text-uppercase tracking-wider">Unit Price (INR)</label>
              <input type="number" min="0.01" step="0.01" className="form-control" placeholder="0.00" value={f.unitPrice} onChange={set('unitPrice')} required />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted small text-uppercase tracking-wider">Required By Date</label>
              <input type="date" className="form-control" value={f.requiredDate} onChange={set('requiredDate')} required />
            </div>
            <div className="col-md-8">
              <label className="form-label text-muted small text-uppercase tracking-wider">Business Justification</label>
              <input className="form-control" placeholder="Explain the business requirement..." value={f.justification} onChange={set('justification')} required />
            </div>
            <div className="col-12 pt-2 d-flex justify-content-between align-items-center">
              <span className="text-muted">Estimated Total: <b className="text-white font-monospace fs-6">{fmt(f.quantity * f.unitPrice)}</b></span>
              <button className="btn btn-theme-white px-4 py-2 text-uppercase tracking-wider">Save as Draft</button>
            </div>
          </div>
          {err && <div className="alert alert-danger mt-3 py-2 small mb-0">{err}</div>}
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Total Cost</th>
                <th>Requester</th>
                <th>Status</th>
                <th style={{ width: 80 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">No purchase requests found.</td>
                </tr>
              ) : (
                list.map(r => (
                  <tr key={r._id}>
                    <td><b className="text-white">{r.itemName}</b></td>
                    <td>{r.category}</td>
                    <td className="font-monospace text-white">{fmt(r.totalCost)}</td>
                    <td>{r.requester?.name || 'Requester'}</td>
                    <td><Badge s={r.status} /></td>
                    <td>
                      <Link to={'/requests/' + r._id} className="btn btn-outline-light btn-sm py-1 px-2" style={{ fontSize: '0.75rem' }}>
                        View
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

export function RequestDetail({ user }) {
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [cmp, setCmp] = useState(null);
  const [msg, setMsg] = useState('');
  const [reason, setReason] = useState('');
  const [sup, setSup] = useState('');

  const load = () => {
    api('/requests/' + id).then(x => {
      setR(x);
      api('/engine/score', 'POST', { category: x.category }).then(setCmp);
    });
  };

  useEffect(() => { load(); }, [id]);

  const act = async (path, body) => {
    setMsg('');
    try {
      await api(`/requests/${id}/${path}`, 'POST', body);
      load();
    } catch (e) {
      setMsg(e.message);
    }
  };

  if (!r) return <div className="text-center py-5 text-muted"><div className="spinner-border spinner-border-sm me-2" />Loading request details…</div>;

  const mine = String(r.requester?._id || r.requester || '') === String(user?.id || user?._id || '');

  return (
    <div className="row g-4">
      <div className="col-lg-5 col-md-6">
        <div className="card p-4 h-100">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div className="eyebrow mb-1">REQUISITION RECORD</div>
              <h4 className="mb-0 text-white">{r.itemName}</h4>
            </div>
            <Badge s={r.status} />
          </div>

          <div className="p-3 rounded mb-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
            <div className="d-flex justify-content-between small text-muted mb-1">
              <span>Category</span><b className="text-white">{r.category}</b>
            </div>
            <div className="d-flex justify-content-between small text-muted mb-1">
              <span>Calculated Total</span><b className="text-white font-monospace">{r.quantity} &times; {fmt(r.unitPrice)} = {fmt(r.totalCost)}</b>
            </div>
            <div className="d-flex justify-content-between small text-muted mb-1">
              <span>Required Date</span><b className="text-white">{new Date(r.requiredDate).toLocaleDateString()}</b>
            </div>
            <div className="d-flex justify-content-between small text-muted">
              <span>Raised By</span><b className="text-white">{r.requester?.name}</b>
            </div>
          </div>

          <div className="mb-3">
            <div className="eyebrow mb-1">JUSTIFICATION</div>
            <p className="small text-light bg-dark p-2 rounded border border-secondary-subtle" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {r.justification}
            </p>
          </div>

          {r.rejectionReason && (
            <div className="alert alert-danger py-2 small mb-3">
              <b>Rejection Notice:</b> {r.rejectionReason}
            </div>
          )}

          {r.order?.poNumber && (
            <div className="alert alert-info py-2 small mb-3">
              <div className="fw-bold">{r.order.poNumber}</div>
              <div>Vendor: {r.order.supplier?.name || 'Assigned Vendor'} &middot; Total: {fmt(r.order.value)}</div>
            </div>
          )}

          {msg && <div className="alert alert-warning py-2 small mb-3">{msg}</div>}

          {/* Lifecycle Action Buttons */}
          <div className="mb-4">
            {r.status === 'draft' && mine && (
              <button className="btn btn-theme-white w-100 py-2 text-uppercase tracking-wider" onClick={() => act('submit')}>
                Submit for Approval
              </button>
            )}

            {r.status === 'submitted' && user.role === 'officer' && (
              <button className="btn btn-warning w-100 py-2 text-uppercase tracking-wider fw-bold text-dark" onClick={() => act('review')}>
                Start Officer Review
              </button>
            )}

            {r.status === 'under_review' && user.role === 'approver' && (
              <div className="p-3 rounded border border-secondary-subtle" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <label className="form-label text-muted small text-uppercase tracking-wider">Approval Notes / Rejection Reason</label>
                <textarea
                  className="form-control mb-3"
                  rows={2}
                  placeholder="Enter comments (mandatory if rejecting)..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
                <div className="d-flex gap-2">
                  <button className="btn btn-success flex-grow-1" onClick={() => act('decision', { decision: 'approved', reason })}>
                    Approve
                  </button>
                  <button className="btn btn-danger flex-grow-1" onClick={() => act('decision', { decision: 'rejected', reason })}>
                    Reject
                  </button>
                </div>
              </div>
            )}

            {r.status === 'approved' && user.role === 'officer' && (
              <div className="p-3 rounded border border-secondary-subtle" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <label className="form-label text-muted small text-uppercase tracking-wider">Select Awarded Vendor</label>
                <select className="form-select mb-2" value={sup} onChange={e => setSup(e.target.value)}>
                  <option value="">Choose Active Vendor...</option>
                  {cmp?.rows.filter(x => x.status === 'active').map(x => (
                    <option key={x.supplierId} value={x.supplierId}>
                      {x.name} (Fit Score: {x.total})
                    </option>
                  ))}
                </select>
                <button className="btn btn-theme-white w-100 py-2 text-uppercase tracking-wider" disabled={!sup} onClick={() => act('order', { supplierId: sup })}>
                  Create Purchase Order
                </button>
              </div>
            )}

            {r.status === 'ordered' && user.role === 'officer' && (
              <div className="d-flex gap-2">
                <button className="btn btn-theme-white flex-grow-1 py-2 text-uppercase tracking-wider" onClick={() => act('deliver')}>
                  Mark Full Delivery
                </button>
                <button
                  className="btn btn-theme-ghost flex-grow-1 py-2 text-uppercase tracking-wider"
                  onClick={() => {
                    const note = prompt('Enter partial receipt note (e.g. Received 5 of 10 units):');
                    if (note) act('deliver', { partial: true, note });
                  }}
                >
                  Partial Receipt
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="eyebrow mb-2">AUDIT HISTORY TIMELINE</div>
            <ul className="list-unstyled small mb-0 ps-1">
              {r.history.map((h, i) => (
                <li key={i} className="mb-2 pb-2 border-bottom border-secondary-subtle" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge role-badge">{h.status}</span>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>{new Date(h.at).toLocaleString()}</span>
                  </div>
                  <div className="text-light mt-1">{h.byName}: {h.note}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="col-lg-7 col-md-6">
        <div className="card p-4 h-100">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <div className="eyebrow mb-1">DECISION SUPPORT</div>
              <h5 className="mb-0 text-white">Vendor Comparison &middot; {r.category}</h5>
            </div>
            <span className="badge role-badge">WHAT-IF ENGINE</span>
          </div>

          {cmp?.rows.length ? (
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Supplier</th>
                    <th>Quote</th>
                    <th>Fit Score</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {cmp.rows.map(x => (
                    <tr key={x.supplierId}>
                      <td className="font-monospace fw-bold">#{x.rank}</td>
                      <td>
                        <div className="fw-bold text-white">{x.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>Status: {x.status}</div>
                      </td>
                      <td className="font-monospace">{x.quote ? fmt(x.quote) : <span className="text-muted">No quote</span>}</td>
                      <td>
                        <span className="font-monospace fw-bold text-white">{x.total ?? 'N/A'}</span>
                        {x.incomplete && <span className="badge bg-warning ms-1 p-1" style={{ fontSize: '0.6rem' }}>Partial</span>}
                      </td>
                      <td className={`risk-${x.risk.level} font-monospace fw-bold`}>{x.risk.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">No suppliers registered for this category.</p>
          )}
          <small className="text-muted mt-3 d-block">
            * Ratings are calculated dynamically using multicriteria decision weights. Missing data is transparently re-scaled across verified components.
          </small>
        </div>
      </div>
    </div>
  );
}
