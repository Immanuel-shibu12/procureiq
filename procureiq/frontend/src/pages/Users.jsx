import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Users() {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'requester' });
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = () => api('/users').then(setList);

  useEffect(() => {
    load();
  }, []);

  const add = async e => {
    e.preventDefault();
    setErr('');
    setSuccess('');
    try {
      await api('/users', 'POST', f);
      setSuccess(`User ${f.name} successfully created.`);
      setF({ name: '', email: '', password: '', role: 'requester' });
      setShowAdd(false);
      load();
    } catch (x) {
      setErr(x.message);
    }
  };

  const updateRole = async (userId, role) => {
    setErr('');
    try {
      await api('/users/' + userId, 'PUT', { role });
      load();
    } catch (x) {
      setErr(x.message);
    }
  };

  const removeUser = async userId => {
    if (!window.confirm('Are you sure you want to remove this user?')) return;
    setErr('');
    try {
      await api('/users/' + userId, 'DELETE');
      load();
    } catch (x) {
      setErr(x.message);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between mb-4 align-items-center flex-wrap gap-2">
        <div>
          <div className="eyebrow mb-1">GOVERNANCE &amp; ACCESS CONTROL</div>
          <h3 className="mb-0 text-uppercase" style={{ fontFamily: 'Space Grotesk' }}>
            User Management
          </h3>
        </div>
        <button
          className="btn btn-theme-white px-3 py-2 text-uppercase tracking-wider"
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? 'Cancel' : '+ Provision User'}
        </button>
      </div>

      {success && <div className="alert alert-info py-2 mb-3 small">{success}</div>}
      {err && <div className="alert alert-danger py-2 mb-3 small">{err}</div>}

      {/* Add User Form */}
      {showAdd && (
        <form className="card p-4 mb-4" onSubmit={add}>
          <div className="eyebrow mb-3">PROVISION USER // CREDENTIALS</div>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label text-muted small text-uppercase tracking-wider">
                Full Name
              </label>
              <input
                className="form-control"
                placeholder="e.g. Samuel Green"
                value={f.name}
                onChange={e => setF({ ...f, name: e.target.value })}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small text-uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="s.green@procureiq.com"
                value={f.email}
                onChange={e => setF({ ...f, email: e.target.value })}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small text-uppercase tracking-wider">
                Temporary Password
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Min 8 characters"
                value={f.password}
                onChange={e => setF({ ...f, password: e.target.value })}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small text-uppercase tracking-wider">
                System Role
              </label>
              <select
                className="form-select"
                value={f.role}
                onChange={e => setF({ ...f, role: e.target.value })}
              >
                <option value="requester">Requester (Employee)</option>
                <option value="officer">Procurement Officer</option>
                <option value="approver">Approver / Manager</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-light px-3"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </button>
            <button className="btn btn-theme-white px-4 text-uppercase tracking-wider">
              Save User
            </button>
          </div>
        </form>
      )}

      {/* User Directory Table */}
      <div className="card overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="fw-bold text-white">{u.name}</div>
                    <small className="text-muted">UID: {u._id.slice(-6)}</small>
                  </td>
                  <td>
                    <span className="text-secondary">{u.email}</span>
                  </td>
                  <td style={{ minWidth: 180 }}>
                    <select
                      className="form-select form-select-sm"
                      value={u.role}
                      onChange={e => updateRole(u._id, e.target.value)}
                    >
                      <option value="requester">Requester</option>
                      <option value="officer">Procurement Officer</option>
                      <option value="approver">Approver</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-danger px-3 py-1 text-uppercase tracking-wider"
                      style={{ fontSize: '0.72rem' }}
                      onClick={() => removeUser(u._id)}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
