import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { api } from './api';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import { Requests, RequestDetail } from './pages/Requests';
import { Suppliers, SupplierProfile } from './pages/Suppliers';
import Engine from './pages/Engine';
import Users from './pages/Users';

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api('/auth/me')
        .then(setUser)
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-dark text-light">
        <div className="spinner-border text-light me-3" role="status" />
        <span className="font-monospace small tracking-wider">INITIALIZING PROCUREIQ…</span>
      </div>
    );
  }

  // When not logged in, render the Welcome Landing Page & Login Portal
  if (!user) {
    return <Welcome onLogin={setUser} />;
  }

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    nav('/');
  };

  const navLinks = [
    ['/', 'Dashboard'],
    ['/requests', 'Requests'],
    ['/suppliers', 'Suppliers'],
    ['/engine', 'Fit & Risk Engine'],
    ...(user.role === 'admin' ? [['/users', 'Users']] : [])
  ];

  return (
    <div className="app-shell min-vh-100 d-flex flex-column">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand px-4 py-3 sticky-top">
        <div className="container-fluid px-0">
          <div className="d-flex align-items-center me-4">
            <span className="brand-stack">
              <span className="brand-logo-txt" style={{ fontSize: '1.05rem' }}>PROCURE</span>
              <span className="brand-sub-txt" style={{ fontSize: '0.65rem' }}>IQ</span>
            </span>
          </div>

          <div className="navbar-nav me-auto d-flex gap-1">
            {navLinks.map(([to, label]) => (
              <NavLink key={to} to={to} end className="nav-link">
                {label}
              </NavLink>
            ))}
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge role-badge py-2 px-3">
                {user.name} &middot; <span className="text-uppercase">{user.role}</span>
              </span>
            </div>
            <button className="btn btn-outline-light btn-sm px-3" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Body */}
      <main className="container py-4 flex-grow-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/requests" element={<Requests user={user} />} />
          <Route path="/requests/:id" element={<RequestDetail user={user} />} />
          <Route path="/suppliers" element={<Suppliers user={user} />} />
          <Route path="/suppliers/:id" element={<SupplierProfile />} />
          <Route path="/engine" element={<Engine />} />
          <Route path="/users" element={user.role === 'admin' ? <Users /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Minimalist Footer */}
      <footer className="py-3 px-4 border-top border-secondary-subtle text-muted small text-center" style={{ borderColor: 'var(--border-subtle)' }}>
        ProcureIQ &copy; 2026 &middot; Intelligent Procurement &amp; Supplier Risk Platform
      </footer>
    </div>
  );
}
