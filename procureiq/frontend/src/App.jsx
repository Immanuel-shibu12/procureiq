import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { api } from './api';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import { Requests, RequestDetail } from './pages/Requests';
import { Suppliers, SupplierProfile } from './pages/Suppliers';
import Engine from './pages/Engine';
import Users from './pages/Users';
import CloudAnalytics from './pages/CloudAnalytics';
import Chatbot from './components/Chatbot';

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('mediprocure_theme') || 'dark');
  const [chatOpen, setChatOpen] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mediprocure_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

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
    ['/cloud-analytics', 'Cloud ML & Analytics'],
    ...(user.role === 'admin' ? [['/users', 'Users']] : [])
  ];

  return (
    <div className="app-shell min-vh-100 d-flex flex-column" data-theme={theme}>
      {/* Top Navbar */}
      <nav className="navbar navbar-expand px-4 py-3 sticky-top">
        <div className="container-fluid px-0">
          <div className="d-flex align-items-center me-4">
            <span className="brand-stack">
              <span className="brand-logo-txt" style={{ fontSize: '1.05rem' }}>MEDIPROCURE</span>
              <span className="brand-sub-txt" style={{ fontSize: '0.65rem' }}>IQ &middot; GCP CLOUD</span>
            </span>
          </div>

          <div className="navbar-nav me-auto d-flex gap-1 flex-wrap">
            {navLinks.map(([to, label]) => (
              <NavLink key={to} to={to} end className="nav-link">
                {label}
              </NavLink>
            ))}
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* AI Assistant Sidebar Toggle Button */}
            <button
              className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-1 rounded-pill ${chatOpen ? 'btn-warning text-dark fw-bold' : 'btn-outline-warning'}`}
              onClick={() => setChatOpen(!chatOpen)}
              title="Toggle MediProcure AI Assistant Sidebar"
              style={{ fontSize: '0.82rem' }}
            >
              <span>🤖</span>
              <span className="d-none d-md-inline">MediProcure AI</span>
              <span className="badge bg-warning-subtle text-warning border border-warning-subtle py-0 px-1" style={{ fontSize: '0.62rem' }}>
                GCP
              </span>
            </button>

            <button
              className="btn btn-outline-light btn-sm px-2 py-1"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <span className="badge role-badge py-2 px-3">
              {user.name} &middot; <span className="text-uppercase">{user.role}</span>
            </span>
            <button className="btn btn-outline-light btn-sm px-3" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Body */}
      <main className={`container py-4 flex-grow-1 ${chatOpen ? 'main-with-sidebar' : ''}`}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} theme={theme} />} />
          <Route path="/requests" element={<Requests user={user} />} />
          <Route path="/requests/:id" element={<RequestDetail user={user} />} />
          <Route path="/suppliers" element={<Suppliers user={user} />} />
          <Route path="/suppliers/:id" element={<SupplierProfile />} />
          <Route path="/engine" element={<Engine />} />
          <Route path="/cloud-analytics" element={<CloudAnalytics />} />
          <Route path="/users" element={user.role === 'admin' ? <Users /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* MediProcure AI Side Panel */}
      <Chatbot user={user} isOpen={chatOpen} setIsOpen={setChatOpen} />

      {/* Minimalist Footer */}
      <footer className="py-3 px-4 border-top border-secondary-subtle text-muted small text-center" style={{ borderColor: 'var(--border-subtle)' }}>
        ProcureIQ &copy; 2026 &middot; Intelligent Procurement &amp; Supplier Risk Platform
      </footer>
    </div>
  );
}
